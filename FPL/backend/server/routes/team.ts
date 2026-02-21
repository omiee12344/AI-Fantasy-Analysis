import express from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { userStore } from "../store/userStore";
import { SavedTeam } from "../types/user";

const router = express.Router();
const FPL_BASE = "https://fantasy.premierleague.com/api";

/** Small JSON fetch helper */
async function j(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} for ${url}`);
  return r.json();
}

/** Map element_type → short position */
function posShort(n: number) {
  return n === 1 ? "GKP" : n === 2 ? "DEF" : n === 3 ? "MID" : "FWD";
}

/**
 * POST /api/team/save
 * Save user's custom team data
 */
router.post("/save", authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { startingXI, bench, captainId, viceCaptainId, formation } = req.body;

    // Validate required fields
    if (!startingXI || !bench || !formation) {
      return res.status(400).json({ error: "Missing required team data" });
    }

    // Create saved team object
    const savedTeam: SavedTeam = {
      startingXI: startingXI.filter((player: any) => player.id).map((player: any) => ({
        id: player.id,
        name: player.name,
        pos: player.pos,
        team: player.team,
        slotId: player.slotId
      })),
      bench: bench.filter((player: any) => player.id).map((player: any) => ({
        id: player.id,
        name: player.name,
        pos: player.pos,
        team: player.team,
        slotId: player.slotId
      })),
      captainId,
      viceCaptainId,
      formation,
      savedAt: new Date()
    };

    // Get current user and update with saved team
    const currentUser = userStore.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const updatedUser = userStore.update(userId, {
      profile: {
        ...currentUser.profile,
        savedTeam
      }
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: "Team saved successfully",
      savedAt: savedTeam.savedAt
    });

  } catch (err) {
    console.error("POST /api/team/save failed:", err);
    res.status(500).json({ error: "Failed to save team" });
  }
});

/**
 * GET /api/team/saved
 * Get user's saved team data
 */
router.get("/saved", authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = userStore.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.profile.savedTeam) {
      return res.json({ savedTeam: null });
    }

    res.json({
      savedTeam: user.profile.savedTeam
    });

  } catch (err) {
    console.error("GET /api/team/saved failed:", err);
    res.status(500).json({ error: "Failed to fetch saved team" });
  }
});

/**
 * GET /api/team/:userId
 * Returns a user's team data including squad, gameweek info, and more (LIVE).
 */
router.get("/:userId", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Fetch bootstrap data for teams and players
    const boot = await j(`${FPL_BASE}/bootstrap-static/`);
    const teamsById = new Map<number, any>();
    for (const t of boot.teams || []) {
      teamsById.set(t.id, t);
    }

    const playersById = new Map<number, any>();
    for (const p of boot.elements || []) {
      playersById.set(p.id, p);
    }

    // Get current gameweek info
    const currentEvent = (boot.events || []).find((e: any) => e.is_current) ?? 
                        (boot.events || []).find((e: any) => e.is_next) ??
                        boot.events?.[0];

    if (!currentEvent) {
      return res.status(500).json({ error: "Could not determine current gameweek" });
    }

    // Fetch user's team data
    const teamData = await j(`${FPL_BASE}/entry/${userId}/event/${currentEvent.id}/picks/`);
    
    // Fetch current gameweek fixtures for opponent mapping
    let fixtures = await j(`${FPL_BASE}/fixtures/?event=${currentEvent.id}`);
    if (!fixtures?.length) {
      // Try next available gameweek
      for (const e of boot.events || []) {
        if (e.id > currentEvent.id) {
          const fx = await j(`${FPL_BASE}/fixtures/?event=${e.id}`);
          if (fx?.length) { 
            fixtures = fx; 
            break; 
          }
        }
      }
    }

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

    // Build squad data
    const squad = {
      GKP: [] as any[],
      DEF: [] as any[],
      MID: [] as any[],
      FWD: [] as any[]
    };

    for (const pick of teamData.picks || []) {
      const player = playersById.get(pick.element);
      if (!player) continue;

      const team = teamsById.get(player.team);
      const teamShort = team?.short_name || "";
      const pos = posShort(player.element_type) as keyof typeof squad;

      const teamPlayer = {
        id: player.id,
        name: player.web_name,
        pos,
        team: teamShort,
        nextFixture: opponentMap[teamShort] || "—",
        status: player.status === "d" ? "yellow" : player.status === "i" ? "red" : "available",
        kitCandidates: player.element_type === 1 
          ? [`/Kits/GK/${teamShort}_GK.webp`, `/Kits/PLAYER/${teamShort}.webp`]  // Goalkeepers: GK jersey first, then player jersey fallback
          : [`/Kits/PLAYER/${teamShort}.webp`],  // Outfield players: Only player jersey
        is_captain: pick.is_captain,
        is_vice_captain: pick.is_vice_captain,
        multiplier: pick.multiplier,
        position: pick.position,
        gameweekPoints: player.event_points || 0, // Current gameweek points
        liveMatch: null // Could be populated with live match data if available
      };

      squad[pos].push(teamPlayer);
    }

    // Gameweek info
    const gameweekInfo = {
      id: currentEvent.id,
      name: currentEvent.name,
      deadlineTime: currentEvent.deadline_time,
      deadlineEpoch: new Date(currentEvent.deadline_time).getTime(),
      finished: currentEvent.finished,
      isCurrent: currentEvent.is_current,
      isNext: currentEvent.is_next
    };

    res.json({
      squad,
      gameweek: currentEvent.id,
      actualGameweek: currentEvent.id,
      currentGameweekStatus: currentEvent.finished ? "finished" : "active",
      gameweekInfo,
      entry_history: teamData.entry_history,
      automatic_subs: teamData.automatic_subs || [],
      lastUpdated: new Date().toISOString()
    });

  } catch (err) {
    console.error(`GET /api/team/${req.params.userId} failed:`, err);
    
    // Check if it's a 404 error (team not found)
    if (err instanceof Error && err.message.includes('404')) {
      return res.status(404).json({ error: "Team not found" });
    }
    
    res.status(500).json({ error: "Failed to fetch team data" });
  }
});



export default router;