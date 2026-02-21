import express from "express";

// If you're on Node < 18, install node-fetch and uncomment:
// import fetch from "node-fetch";

const router = express.Router();
const FPL = "https://fantasy.premierleague.com/api";

/** Small JSON fetch helper */
async function j(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} for ${url}`);
  return r.json();
}

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
      const fixtures = await fetch(`${FPL}/fixtures/?event=${gameweek}`).then(r => r.json());
      
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
        const nextFixtures = await fetch(`${FPL}/fixtures/?event=${nextEvent.id}`).then(r => r.json());
        
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

/** Map element_type → short position */
function posShort(n: number) {
  return n === 1 ? "GKP" : n === 2 ? "DEF" : n === 3 ? "MID" : "FWD";
}

/**
 * GET /api/players
 * Optional query: ?pos=GKP|DEF|MID|FWD
 * Returns a lean, normalized list from FPL bootstrap-static (LIVE).
 */
router.get("/players", async (req, res) => {
  try {
    const posFilter = String(req.query.pos || "").toUpperCase(); // "", "GKP", "DEF", "MID", "FWD"

    const boot = await j(`${FPL}/bootstrap-static/`);
    const teamsById = new Map<number, any>();
    for (const t of boot.teams || []) teamsById.set(t.id, t);

    // Get all fixtures for consistent gameweek resolution
    const allFixtures = await fetch(`${FPL}/fixtures/`).then(r => r.json()).catch(() => []);
    
    // Use same gameweek determination logic as comprehensive endpoint
    const currentGW = resolveCurrentGameweekFixturesFirst(boot.events || [], allFixtures);
    const currentEvent = (boot.events || []).find((e: any) => e.id === currentGW);

    // Get fixtures for current gameweek for opponent mapping
    const fixtures = allFixtures.filter((f: any) => f.event === currentGW);

    // Create opponent mapping
    const opponentMap: Record<string, string> = {};
    for (const f of fixtures || []) {
      const homeTeam = teamsById.get(f.team_h);
      const awayTeam = teamsById.get(f.team_a);
      if (homeTeam && awayTeam) {
        opponentMap[homeTeam.short_name] = `${awayTeam.short_name} (H)`;
        opponentMap[awayTeam.short_name] = `${homeTeam.short_name} (A)`;
      }
    }

    let players = (boot.elements || []).map((e: any) => {
      const team = teamsById.get(e.team);
      const teamShort = team?.short_name || "";
      return {
        id: e.id,
        name: e.web_name,
        full_name: e.first_name + ' ' + e.second_name,
        pos: posShort(e.element_type) as "GKP" | "DEF" | "MID" | "FWD",
        team: teamShort.toUpperCase(),
        nextFixture: opponentMap[teamShort] || "—",
        status: e.status === "d" ? "yellow" : e.status === "i" ? "red" : "available",
        now_cost: e.now_cost,
        form: e.form,
        points_per_game: e.points_per_game,
        selected_by_percent: e.selected_by_percent,
        minutes: e.minutes,
        total_points: e.total_points,
        event_points: e.event_points || 0, // Current gameweek points
      };
    });

    if (posFilter && ["GKP", "DEF", "MID", "FWD"].includes(posFilter)) {
      players = players.filter((p: { pos: string }) => p.pos === posFilter);
    }

    res.json({ players, events: boot.events ?? [] });
  } catch (err) {
    console.error("GET /api/players failed:", err);
    res.status(500).json({ error: "Failed to fetch players" });
  }
});

/**
 * GET /api/players/:id/meta
 * Returns price/form/ppm/tsb (LIVE).
 */
router.get("/players/:id/meta", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid player id" });

    const boot = await j(`${FPL}/bootstrap-static/`);
    const e = (boot.elements || []).find((x: any) => x.id === id);
    if (!e) return res.status(404).json({ error: "Player not found" });

    res.json({
      // Basic meta data
      price: e.now_cost,              // tenths of a million
      form: e.form,                   // "2.0"
      ppm: e.points_per_game,         // "5.1"
      tsb: e.selected_by_percent,     // "21.1"
      
      // Extended stats for player sheet
      total_points: e.total_points,
      minutes: e.minutes,
      goals_scored: e.goals_scored,
      assists: e.assists,
      clean_sheets: e.clean_sheets,
      goals_conceded: e.goals_conceded,
      own_goals: e.own_goals,
      penalties_saved: e.penalties_saved,
      penalties_missed: e.penalties_missed,
      yellow_cards: e.yellow_cards,
      red_cards: e.red_cards,
      saves: e.saves,
      bonus: e.bonus,
      bps: e.bps,
      starts: e.starts,
      influence: parseFloat(e.influence || "0"),
      creativity: parseFloat(e.creativity || "0"),
      threat: parseFloat(e.threat || "0"),
      ict_index: parseFloat(e.ict_index || "0"),
      expected_goals: parseFloat(e.expected_goals || "0"),
      expected_assists: parseFloat(e.expected_assists || "0"),
      transfers_in: e.transfers_in,
      transfers_out: e.transfers_out,
      transfers_in_event: e.transfers_in_event,
      transfers_out_event: e.transfers_out_event,
      cost_change_start: e.cost_change_start,
      cost_change_event: e.cost_change_event,
      dreamteam_count: e.dreamteam_count,
      selected_by_percent: parseFloat(e.selected_by_percent || "0")
    });
  } catch (err) {
    console.error("GET /api/players/:id/meta failed:", err);
    res.status(500).json({ error: "Failed to fetch player meta" });
  }
});

/**
 * GET /api/players/:id/stats
 * Returns comprehensive player statistics (LIVE).
 */
router.get("/players/:id/stats", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid player id" });

    const boot = await j(`${FPL}/bootstrap-static/`);
    const e = (boot.elements || []).find((x: any) => x.id === id);
    if (!e) {
      console.log(`Player ${id} not found. Available player IDs range: ${Math.min(...(boot.elements || []).map((p: any) => p.id))} - ${Math.max(...(boot.elements || []).map((p: any) => p.id))}`);
      return res.status(404).json({ 
        error: "Player not found", 
        message: "Player ID may be from a previous season or invalid",
        availableRange: {
          min: Math.min(...(boot.elements || []).map((p: any) => p.id)),
          max: Math.max(...(boot.elements || []).map((p: any) => p.id))
        }
      });
    }

    // Return comprehensive player stats from FPL API
    res.json({
      // Basic info
      id: e.id,
      name: e.web_name,
      full_name: e.first_name + ' ' + e.second_name,
      position: posShort(e.element_type),
      team_code: e.team_code,
      
      // Performance stats
      total_points: e.total_points,
      minutes: e.minutes,
      goals_scored: e.goals_scored,
      assists: e.assists,
      clean_sheets: e.clean_sheets,
      goals_conceded: e.goals_conceded,
      own_goals: e.own_goals,
      penalties_saved: e.penalties_saved,
      penalties_missed: e.penalties_missed,
      yellow_cards: e.yellow_cards,
      red_cards: e.red_cards,
      saves: e.saves,
      bonus: e.bonus,
      bps: e.bps,
      starts: e.starts,
      
      // Advanced stats
      influence: parseFloat(e.influence || "0"),
      creativity: parseFloat(e.creativity || "0"),
      threat: parseFloat(e.threat || "0"),
      ict_index: parseFloat(e.ict_index || "0"),
      expected_goals: parseFloat(e.expected_goals || "0"),
      expected_assists: parseFloat(e.expected_assists || "0"),
      expected_goal_involvements: parseFloat(e.expected_goal_involvements || "0"),
      expected_goals_conceded: parseFloat(e.expected_goals_conceded || "0"),
      
      // Form and selection
      form: parseFloat(e.form || "0"),
      points_per_game: parseFloat(e.points_per_game || "0"),
      selected_by_percent: parseFloat(e.selected_by_percent || "0"),
      
      // Transfers
      transfers_in: e.transfers_in,
      transfers_out: e.transfers_out,
      transfers_in_event: e.transfers_in_event,
      transfers_out_event: e.transfers_out_event,
      
      // Price
      now_cost: e.now_cost,
      cost_change_start: e.cost_change_start,
      cost_change_event: e.cost_change_event,
      cost_change_start_fall: e.cost_change_start_fall,
      cost_change_event_fall: e.cost_change_event_fall,
      
      // Other
      dreamteam_count: e.dreamteam_count,
      value_form: parseFloat(e.value_form || "0"),
      value_season: parseFloat(e.value_season || "0"),
      in_dreamteam: e.in_dreamteam,
      news: e.news,
      news_added: e.news_added,
      photo: e.photo,
      
      // Status
      status: e.status,
      chance_of_playing_next_round: e.chance_of_playing_next_round,
      chance_of_playing_this_round: e.chance_of_playing_this_round
    });
  } catch (err) {
    console.error("GET /api/players/:id/stats failed:", err);
    res.status(500).json({ error: "Failed to fetch player stats" });
  }
});

/**
 * GET /api/players/:id/history
 * Player's gameweek history with points (LIVE).
 */
router.get("/players/:id/history", async (req, res) => {
  try {
    const id = Number(req.params.id);
    console.log(`🔥 BACKEND: Fetching history for player ID ${id}`);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid player id" });

    const playerHistory = await j(`${FPL}/element-summary/${id}/`);
    console.log(`🔥 BACKEND: Raw FPL API response structure:`, {
      hasHistory: !!playerHistory.history,
      historyType: Array.isArray(playerHistory.history),
      historyLength: playerHistory.history?.length,
      hasFixtures: !!playerHistory.fixtures,
      fixturesLength: playerHistory.fixtures?.length
    });
    
    // Get current gameweek info from bootstrap with consistent logic
    const boot = await j(`${FPL}/bootstrap-static/`);
    const allFixtures = await fetch(`${FPL}/fixtures/`).then(r => r.json()).catch(() => []);
    
    // Use same gameweek determination logic as other endpoints
    const currentGW = resolveCurrentGameweekFixturesFirst(boot.events || [], allFixtures);
    const previousGW = currentGW > 1 ? currentGW - 1 : 1;
    
    // Create team mapping
    const teamsById = new Map<number, any>();
    for (const t of boot.teams || []) teamsById.set(t.id, t);

    // Process history to add proper team names
    const processedHistory = (playerHistory.history || []).map((match: any) => {
      const opponent = teamsById.get(match.opponent_team);
      return {
        ...match,
        opponent_team_name: opponent?.name || opponent?.short_name || `Team ${match.opponent_team}`,
        opponent_team_short: opponent?.short_name || `T${match.opponent_team}`
      };
    });
    
    // Debug logging
    console.log(`📊 Player ${id} history debug:`, {
      historyLength: processedHistory.length,
      fixturesLength: playerHistory.fixtures?.length || 0,
      currentGW,
      previousGW,
      sampleProcessedHistory: processedHistory.slice(0, 5).map((h: any) => ({
        round: h.round,
        opponent_team: h.opponent_team,
        opponent_team_name: h.opponent_team_name,
        opponent_team_short: h.opponent_team_short,
        total_points: h.total_points,
        was_home: h.was_home
      }))
    });
    
    // Return recent gameweek history and upcoming fixtures with intelligent display
    res.json({
      gameweekHistory: processedHistory,
      upcomingFixtures: (playerHistory.fixtures || []).slice(0, 5),
      currentGW: currentGW,
      previousGW: previousGW
    });
  } catch (err) {
    console.error("GET /api/players/:id/history failed:", err);
    res.status(500).json({ error: "Failed to fetch player history" });
  }
});

/**
 * GET /api/gameweek/comprehensive
 * Comprehensive gameweek data with fixtures-first logic
 */
router.get("/gameweek/comprehensive", async (req, res) => {
  try {
    const [boot, allFixtures] = await Promise.all([
      j(`${FPL}/bootstrap-static/`),
      fetch(`${FPL}/fixtures/`).then(r => r.json())
    ]);
    
    const events = boot.events || [];
    if (!events.length) {
      return res.status(500).json({ error: "No events data available" });
    }
    
    // Implement fixtures-first current gameweek resolution
    const currentGW = resolveCurrentGameweekFixturesFirst(events, allFixtures);
    const currentEvent = events.find((e: any) => e.id === currentGW);
    
    if (!currentEvent) {
      return res.status(500).json({ error: "Could not find current gameweek event" });
    }
    
    // Get fixtures for current gameweek
    const currentFixtures = allFixtures.filter((f: any) => f.event === currentGW);
    
    // Create team mapping for frontend
    const teamsById = new Map<number, any>();
    for (const t of boot.teams || []) teamsById.set(t.id, t);
    
    // Enhance fixtures with proper completion status before analyzing
    const enhancedFixtures = currentFixtures.map((f: any) => enhanceFixtureWithCompletion(f, currentEvent.finished));
    
    // Analyze completion status using enhanced fixtures
    const completionStatus = analyzeGameweekCompletionBackend(enhancedFixtures, currentEvent.finished);
    
    // Calculate date range from fixtures
    let dateRange = null;
    if (currentFixtures.length > 0) {
      const kickoffTimes = currentFixtures
        .map((f: any) => new Date(f.kickoff_time))
        .filter((date: Date) => !isNaN(date.getTime()));
      
      if (kickoffTimes.length > 0) {
        const start = new Date(Math.min(...kickoffTimes.map((d: Date) => d.getTime())));
        const end = new Date(Math.max(...kickoffTimes.map((d: Date) => d.getTime())));
        dateRange = { start: start.toISOString(), end: end.toISOString() };
      }
    }
    
    res.json({
      currentGameweek: {
        id: currentGW,
        name: `Gameweek ${currentGW}`,
        deadline_time: currentEvent.deadline_time,
        deadline_time_epoch: currentEvent.deadline_time_epoch,
        finished: currentEvent.finished,
        is_current: true
      },
      fixtures: enhancedFixtures.map((f: any) => ({
        id: f.id,
        event: f.event,
        kickoff_time: f.kickoff_time,
        team_h: f.team_h,
        team_a: f.team_a,
        team_h_score: f.team_h_score,
        team_a_score: f.team_a_score,
        finished: f.finished,
        started: f.started,
        status: f.status || 'UNKNOWN',
        minutes: f.minutes || 0
      })),
      completion: {
        isComplete: completionStatus.isComplete,
        completedCount: completionStatus.completedCount,
        totalCount: completionStatus.totalCount
      },
      dateRange,
      teams: Object.fromEntries(
        Array.from(teamsById.entries()).map(([id, team]) => [
          id,
          {
            id: team.id,
            name: team.name,
            short_name: team.short_name
          }
        ])
      ),
      events: events.map((e: any) => ({
        id: e.id,
        name: e.name,
        deadline_time: e.deadline_time,
        deadline_time_epoch: e.deadline_time_epoch,
        finished: e.finished,
        is_current: e.is_current,
        is_next: e.is_next
      }))
    });
  } catch (err) {
    console.error("GET /api/gameweek/comprehensive failed:", err);
    res.status(500).json({ error: "Failed to fetch comprehensive gameweek data" });
  }
});

/**
 * Fixtures-first gameweek resolution logic
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
 * Enhance fixture with proper completion status based on time
 */
function enhanceFixtureWithCompletion(fixture: any, eventFinished: boolean) {
  const now = new Date();
  let isFinished = fixture.finished;
  
  console.log(`🔍 Checking fixture ${fixture.id}: kickoff=${fixture.kickoff_time}, finished=${fixture.finished}, started=${fixture.started}`);
  
  // Apply the same time-based logic as in analyzeGameweekCompletionBackend
  if (!isFinished) {
    // Check specific status codes
    const completeStatuses = ['FT', 'AET', 'PEN', 'AWARDED'];
    if (fixture.status && completeStatuses.includes(fixture.status)) {
      isFinished = true;
    }
    
    // POSTPONED is only complete if event is officially finished
    if (fixture.status === 'POSTPONED' && eventFinished) {
      isFinished = true;
    }
    
    // TIME-BASED FALLBACK: If FPL API hasn't updated finished flag properly
    // Check if match should be finished based on kickoff time (regardless of started flag)
    if (fixture.kickoff_time) {
      const kickoffTime = new Date(fixture.kickoff_time);
      const timeSinceKickoff = now.getTime() - kickoffTime.getTime();
      const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours
      
      // If match was supposed to start more than 2 hours ago, consider it finished
      if (timeSinceKickoff > twoHoursInMs) {
        isFinished = true;
        console.log(`⚽ Time-based completion applied to fixture ${fixture.id}: team_h=${fixture.team_h} vs team_a=${fixture.team_a}, kickoff: ${fixture.kickoff_time}, ${Math.round(timeSinceKickoff / (60 * 1000))} minutes ago`);
      }
    }
  }
  
  return {
    ...fixture,
    finished: isFinished
  };
}

/**
 * Analyze gameweek completion status (backend version)
 * Enhanced with time-based fallback for when FPL API doesn't update finished flags properly
 */
function analyzeGameweekCompletionBackend(fixtures: any[], eventFinished: boolean) {
  if (fixtures.length === 0) {
    return {
      isComplete: eventFinished,
      completedCount: 0,
      totalCount: 0
    };
  }
  
  const now = new Date();
  
  const completedFixtures = fixtures.filter((f: any) => {
    // Primary check: fixture finished flag
    if (f.finished === true) return true;
    
    // Secondary check: specific status codes
    const completeStatuses = ['FT', 'AET', 'PEN', 'AWARDED'];
    if (f.status && completeStatuses.includes(f.status)) return true;
    
    // POSTPONED is only complete if event is officially finished
    if (f.status === 'POSTPONED' && eventFinished) return true;
    
    // TIME-BASED FALLBACK: If FPL API hasn't updated finished flag properly
    // Consider a match finished if it was supposed to start more than 2 hours ago
    if (f.kickoff_time) {
      const kickoffTime = new Date(f.kickoff_time);
      const timeSinceKickoff = now.getTime() - kickoffTime.getTime();
      const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours
      
      // If match was supposed to start more than 2 hours ago, consider it finished
      if (timeSinceKickoff > twoHoursInMs) {
        console.log(`⚽ Time-based completion detected for fixture ${f.id}: team_h=${f.team_h} vs team_a=${f.team_a}, kickoff: ${f.kickoff_time}, ${Math.round(timeSinceKickoff / (60 * 1000))} minutes ago`);
        return true;
      }
    }
    
    return false;
  });
  
  const completedCount = completedFixtures.length;
  const totalCount = fixtures.length;
  const isComplete = (completedCount === totalCount) || eventFinished;
  
  return { isComplete, completedCount, totalCount };
}

/**
 * GET /api/gameweek/current
 * Legacy endpoint - kept for backward compatibility
 */
router.get("/gameweek/current", async (req, res) => {
  try {
    // Redirect to comprehensive endpoint and format for legacy response
    const comprehensiveData = await fetch(`http://localhost:${process.env.PORT || 3007}/api/gameweek/comprehensive`)
      .then(r => r.json())
      .catch(() => null);
    
    if (comprehensiveData && comprehensiveData.currentGameweek) {
      const gw = comprehensiveData.currentGameweek;
      const completion = comprehensiveData.completion;
      
      res.json({
        id: gw.id,
        name: gw.name,
        deadline_time: gw.deadline_time,
        deadline_time_epoch: gw.deadline_time_epoch,
        finished: completion.isComplete,
        is_current: !completion.isComplete,
        is_next: completion.isComplete
      });
    } else {
      // Fallback to old logic
      const boot = await j(`${FPL}/bootstrap-static/`);
      const currentGameweekId = await determineCurrentGameweek(boot);
      const targetGW = (boot.events || []).find((e: any) => e.id === currentGameweekId);
      
      if (!targetGW) {
        return res.status(500).json({ error: "Could not find current gameweek data" });
      }
      
      res.json({
        id: targetGW.id,
        name: targetGW.name,
        deadline_time: targetGW.deadline_time,
        deadline_time_epoch: targetGW.deadline_time_epoch,
        finished: targetGW.finished,
        is_current: targetGW.is_current,
        is_next: targetGW.is_next
      });
    }
  } catch (err) {
    console.error("GET /api/gameweek/current failed:", err);
    res.status(500).json({ error: "Failed to fetch gameweek data" });
  }
});

/**
 * GET /api/players/:id/fixtures
 * Next 4 fixtures for the player's TEAM (LIVE).
 */
router.get("/players/:id/fixtures", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid player id" });

    const boot = await j(`${FPL}/bootstrap-static/`);
    const teamsById = new Map<number, any>();
    for (const t of boot.teams || []) teamsById.set(t.id, t);

    const player = (boot.elements || []).find((x: any) => x.id === id);
    if (!player) return res.status(404).json({ error: "Player not found" });

    const teamId = player.team;
    const current = (boot.events || []).find((e: any) => e.is_current) ??
                    (boot.events || []).find((e: any) => e.is_next);
    const gw = current?.id;
    if (!gw) return res.status(500).json({ error: "Could not determine current GW" });

    const allFx = await j(`${FPL}/fixtures/?future=1`);
    const nextFx = (allFx as any[])
      .filter((f) => f.event && f.event >= gw && (f.team_h === teamId || f.team_a === teamId))
      .slice(0, 4)
      .map((f) => {
        const isHome = f.team_h === teamId;
        const oppId = isHome ? f.team_a : f.team_h;
        const opp = teamsById.get(oppId);
        return {
          gw: f.event,
          opponentShort: (opp?.short_name || "").toUpperCase(),
          home: isHome,
          difficulty: isHome ? f.team_h_difficulty : f.team_a_difficulty,
        };
      });

    res.json({ fixtures: nextFx });
  } catch (err) {
    console.error("GET /api/players/:id/fixtures failed:", err);
    res.status(500).json({ error: "Failed to fetch player fixtures" });
  }
});

export default router;
