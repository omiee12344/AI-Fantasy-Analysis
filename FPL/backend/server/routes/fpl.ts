import express from "express";
// If Node < 18, uncomment next line and `npm i node-fetch`
// import fetch from "node-fetch";

const router = express.Router();
const FPL_BASE = "https://fantasy.premierleague.com/api";

router.get("/fpl/opponents", async (_req, res) => {
  try {
    const boot = await fetch(`${FPL_BASE}/bootstrap-static/`).then(r => r.json());
    const teamsById = new Map<number, string>();
    for (const t of boot.teams) teamsById.set(t.id, (t.short_name || "").toUpperCase());

    let eventId = boot.events.find((e: any) => e.is_current)?.id ?? boot.events[0]?.id;
    let fixtures = await fetch(`${FPL_BASE}/fixtures/?event=${eventId}`).then(r => r.json());
    if (!fixtures?.length) {
      for (const e of boot.events) {
        const fx = await fetch(`${FPL_BASE}/fixtures/?event=${e.id}`).then(r => r.json());
        if (fx?.length) { fixtures = fx; break; }
      }
    }

    const map: Record<string, string> = {};
    for (const f of fixtures) {
      const h = teamsById.get(f.team_h), a = teamsById.get(f.team_a);
      if (h && a) { map[h] = `${a} (H)`; map[a] = `${h} (A)`; }
    }

    res.json(map);
  } catch (err) {
    console.error("[/api/fpl/opponents] error:", err);
    res.status(500).json({ error: "Failed to fetch FPL opponents" });
  }
});

router.get("/fpl/table", async (_req, res) => {
  try {
    const boot = await fetch(`${FPL_BASE}/bootstrap-static/`).then(r => r.json());
    const allFixtures = await fetch(`${FPL_BASE}/fixtures/`).then(r => r.json());
    
    // Create team standings from the teams data
    const standings = boot.teams.map((team: any) => {
      // Calculate stats from finished fixtures
      let played = 0;
      let wins = 0;
      let draws = 0;
      let losses = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;
      
      const finishedFixtures = allFixtures.filter((f: any) => 
        f.finished && (f.team_h === team.id || f.team_a === team.id)
      );
      
      for (const fixture of finishedFixtures) {
        played++;
        const isHome = fixture.team_h === team.id;
        const ownScore = isHome ? fixture.team_h_score : fixture.team_a_score;
        const oppScore = isHome ? fixture.team_a_score : fixture.team_h_score;
        
        goalsFor += ownScore;
        goalsAgainst += oppScore;
        
        if (ownScore > oppScore) wins++;
        else if (ownScore === oppScore) draws++;
        else losses++;
      }
      
      const points = (wins * 3) + draws;
      const goalDifference = goalsFor - goalsAgainst;
      
      return {
        position: team.position,
        shortName: team.short_name.toUpperCase(),
        name: team.name,
        played,
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        goalDifference,
        points
      };
    });
    
    // Sort by points (desc), then goal difference (desc), then goals for (desc)
    standings.sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
    
    // Update positions based on sorting
    standings.forEach((team: any, index: number) => {
      team.position = index + 1;
    });
    
    res.json({
      standings,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    console.error("[/api/fpl/table] error:", err);
    res.status(500).json({ error: "Failed to fetch Premier League table" });
  }
});

export default router;
