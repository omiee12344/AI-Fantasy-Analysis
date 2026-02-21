import express from "express";

const router = express.Router();
const FPL_BASE = "https://fantasy.premierleague.com/api";

/**
 * Determines the current gameweek based on match timing
 * A gameweek is current from when its first match starts until the first match of the next gameweek starts
 */
async function determineCurrentGameweek(bootData: any): Promise<number> {
  try {
    const events = bootData.events || [];
    const now = new Date();
    
    // Check each gameweek to find which one we're currently in
    for (let i = 0; i < events.length; i++) {
      const currentEvent = events[i];
      const nextEvent = events[i + 1];
      const gameweek = currentEvent.id;
      
      // Get fixtures for this gameweek
      const fixtures = await fetch(`${FPL_BASE}/fixtures/?event=${gameweek}`).then(r => r.json());
      
      if (!fixtures || fixtures.length === 0) {
        continue; // Skip if no fixtures
      }
      
      // Sort fixtures by kickoff time to get first and last matches
      const sortedFixtures = fixtures.sort((a: any, b: any) => 
        new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime()
      );
      
      const firstMatchTime = new Date(sortedFixtures[0].kickoff_time);
      
      // If we're before the first match of this gameweek, continue to previous gameweek logic
      if (now < firstMatchTime) {
        continue;
      }
      
      // Check if there's a next gameweek
      if (nextEvent) {
        // Get first match of next gameweek
        const nextFixtures = await fetch(`${FPL_BASE}/fixtures/?event=${nextEvent.id}`).then(r => r.json());
        
        if (nextFixtures && nextFixtures.length > 0) {
          const nextSortedFixtures = nextFixtures.sort((a: any, b: any) => 
            new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime()
          );
          
          const nextGameweekFirstMatch = new Date(nextSortedFixtures[0].kickoff_time);
          
          // If we're before the first match of next gameweek, we're in current gameweek
          if (now < nextGameweekFirstMatch) {
            return gameweek;
          }
        } else {
          // Next gameweek has no fixtures yet, so we're still in current
          return gameweek;
        }
      } else {
        // This is the last gameweek, so we're in it
        return gameweek;
      }
    }
    
    // Fallback: return first gameweek if nothing matches
    return events[0]?.id || 1;
    
  } catch (error) {
    console.error('Error determining current gameweek:', error);
    // Fallback to FPL's is_current flag
    const currentEvent = (bootData.events || []).find((e: any) => e.is_current);
    return currentEvent ? currentEvent.id : 1;
  }
}

/**
 * GET /api/fpl/opponents/current
 * Returns a map of team short names to their current opponent with venue (LIVE).
 * Uses the same fixtures-first gameweek logic as /api/gameweek/comprehensive
 */
router.get("/fpl/opponents/current", async (req, res) => {
  try {
    const [boot, allFixtures] = await Promise.all([
      fetch(`${FPL_BASE}/bootstrap-static/`).then(r => r.json()),
      fetch(`${FPL_BASE}/fixtures/`).then(r => r.json())
    ]);
    
    const teamsById = new Map<number, string>();
    for (const t of boot.teams || []) {
      teamsById.set(t.id, (t.short_name || "").toUpperCase());
    }

    const events = boot.events || [];
    if (!events.length) {
      return res.status(500).json({ error: "No events data available" });
    }

    // Use fixtures-first gameweek resolution (same as comprehensive endpoint)
    const currentGameweekId = resolveCurrentGameweekFixturesFirst(events, allFixtures);
    
    // Get fixtures for the resolved current gameweek
    let fixtures = allFixtures.filter((f: any) => f.event === currentGameweekId);

    // If no fixtures for resolved gameweek, find next available fixtures
    if (!fixtures?.length) {
      for (const e of events) {
        if (e.id >= currentGameweekId) {
          const fx = allFixtures.filter((f: any) => f.event === e.id);
          if (fx?.length) { 
            fixtures = fx; 
            break; 
          }
        }
      }
    }

    const map: Record<string, string> = {};
    for (const f of fixtures || []) {
      const homeTeam = teamsById.get(f.team_h);
      const awayTeam = teamsById.get(f.team_a);
      if (homeTeam && awayTeam) {
        map[homeTeam] = `${awayTeam} (H)`;
        map[awayTeam] = `${homeTeam} (A)`;
      }
    }

    res.json({ 
      map, 
      gw: currentGameweekId,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("GET /api/fpl/opponents/current failed:", err);
    res.status(500).json({ error: "Failed to fetch opponents data" });
  }
});

/**
 * Fixtures-first gameweek resolution logic (same as players.ts)
 */
function resolveCurrentGameweekFixturesFirst(events: any[], fixtures: any[]): number {
  if (!events.length) return 1;
  
  const sortedEvents = [...events].sort((a, b) => a.id - b.id);
  
  // Find the first gameweek that is not complete
  for (const event of sortedEvents) {
    const gwFixtures = fixtures.filter((f: any) => f.event === event.id);
    const completion = analyzeGameweekCompletionBackend(gwFixtures, event.finished);
    
    if (!completion.isComplete) {
      return event.id;
    }
  }
  
  // If all gameweeks are complete, return the last one
  return sortedEvents[sortedEvents.length - 1].id;
}

/**
 * Analyze gameweek completion status (same as players.ts)
 */
function analyzeGameweekCompletionBackend(fixtures: any[], eventFinished: boolean) {
  if (fixtures.length === 0) {
    return {
      isComplete: eventFinished,
      completedCount: 0,
      totalCount: 0
    };
  }
  
  const completedFixtures = fixtures.filter((f: any) => {
    // Primary check: fixture finished flag
    if (f.finished === true) return true;
    
    // Secondary check: specific status codes
    const completeStatuses = ['FT', 'AET', 'PEN', 'AWARDED'];
    if (f.status && completeStatuses.includes(f.status)) return true;
    
    // POSTPONED is only complete if event is officially finished
    if (f.status === 'POSTPONED' && eventFinished) return true;
    
    return false;
  });
  
  const completedCount = completedFixtures.length;
  const totalCount = fixtures.length;
  const isComplete = (completedCount === totalCount) || eventFinished;
  
  return { isComplete, completedCount, totalCount };
}

/**
 * GET /api/fixtures/:gameweek
 * Returns fixtures for a specific gameweek with scores and status
 */
router.get("/fixtures/:gameweek", async (req, res) => {
  try {
    const gameweek = parseInt(req.params.gameweek);
    if (isNaN(gameweek) || gameweek < 1 || gameweek > 38) {
      return res.status(400).json({ error: "Invalid gameweek. Must be between 1 and 38." });
    }

    const boot = await fetch(`${FPL_BASE}/bootstrap-static/`).then(r => r.json());
    const teamsById = new Map<number, { id: number, name: string, short_name: string }>();
    for (const t of boot.teams || []) {
      teamsById.set(t.id, { 
        id: t.id, 
        name: t.name, 
        short_name: (t.short_name || "").toUpperCase() 
      });
    }

    // Get current gameweek based on match completion logic
    const currentGameweek = await determineCurrentGameweek(boot);

    // Fetch fixtures for the specific gameweek
    const fixtures = await fetch(`${FPL_BASE}/fixtures/?event=${gameweek}`).then(r => r.json());

    const fixtureList = [];
    for (const f of fixtures || []) {
      const homeTeam = teamsById.get(f.team_h);
      const awayTeam = teamsById.get(f.team_a);
      
      if (homeTeam && awayTeam) {
        // Determine match status
        let status = 'upcoming';
        if (f.finished) {
          status = 'FT';
        } else if (f.started && !f.finished) {
          status = 'live';
        }

        fixtureList.push({
          id: f.id,
          gameweek: gameweek,
          homeTeam: {
            id: homeTeam.id,
            name: homeTeam.name,
            shortName: homeTeam.short_name
          },
          awayTeam: {
            id: awayTeam.id,
            name: awayTeam.name,
            shortName: awayTeam.short_name
          },
          homeScore: f.team_h_score,
          awayScore: f.team_a_score,
          status: status,
          kickoffTime: f.kickoff_time,
          finished: f.finished,
          started: f.started
        });
      }
    }

    res.json({ 
      fixtures: fixtureList,
      gameweek: gameweek,
      currentGameweek: currentGameweek,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error(`GET /api/fixtures/${req.params.gameweek} failed:`, err);
    res.status(500).json({ error: "Failed to fetch fixtures data" });
  }
});

export default router;