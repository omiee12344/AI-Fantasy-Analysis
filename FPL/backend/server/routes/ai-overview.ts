import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { generateAIOverview } from '../services/ai-overview';

const router = express.Router();
const FPL_BASE = "https://fantasy.premierleague.com/api";

/** Small JSON fetch helper */
async function j(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} for ${url}`);
  return r.json();
}

/**
 * GET /api/ai-overview/:userId
 * Generate AI-powered team analysis and insights
 */
router.get('/:userId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!Number.isFinite(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Fetch bootstrap data for current gameweek
    const boot = await j(`${FPL_BASE}/bootstrap-static/`);
    const currentEvent = (boot.events || []).find((e: any) => e.is_current) ?? 
                        (boot.events || []).find((e: any) => e.is_next) ??
                        boot.events?.[0];

    if (!currentEvent) {
      return res.status(500).json({ error: 'Could not determine current gameweek' });
    }

    // Fetch user's team data
    const teamData = await j(`${FPL_BASE}/entry/${userId}/event/${currentEvent.id}/picks/`);
    
    // Get team and player data
    const teamsById = new Map<number, any>();
    for (const t of boot.teams || []) {
      teamsById.set(t.id, t);
    }

    const playersById = new Map<number, any>();
    for (const p of boot.elements || []) {
      playersById.set(p.id, p);
    }

    // Convert team data to our format
    const teamPlayers = [];
    const benchPlayers = [];

    for (const pick of teamData.picks || []) {
      const player = playersById.get(pick.element);
      if (!player) continue;

      const team = teamsById.get(player.team);
      const teamPlayer = {
        id: player.id,
        name: player.web_name,
        pos: player.element_type === 1 ? 'GKP' : 
             player.element_type === 2 ? 'DEF' : 
             player.element_type === 3 ? 'MID' : 'FWD',
        team: team?.short_name || '',
        gameweekPoints: player.event_points || 0,
        total_points: player.total_points || 0,
        now_cost: player.now_cost || 0,
        status: player.status === 'd' ? 'd' : player.status === 'i' ? 'i' : 'available',
        is_captain: pick.is_captain || false,
        is_vice_captain: pick.is_vice_captain || false,
        nextFixture: '—', // Would be populated with fixture data
        position: pick.position
      };

      if (pick.position <= 11) {
        teamPlayers.push(teamPlayer);
      } else {
        benchPlayers.push(teamPlayer);
      }
    }

    // Sort by position for consistency
    teamPlayers.sort((a, b) => a.position - b.position);
    benchPlayers.sort((a, b) => a.position - b.position);

    // Get user profile (would come from your user store)
    const userProfile = {
      overallRank: teamData.entry_history?.rank || 1000000,
      gameweekRank: teamData.entry_history?.rank || 1000000,
      totalPoints: teamData.entry_history?.total_points || 0,
      freeTransfers: 1, // Would come from your user data
      wildcardsUsed: 0, // Would come from your user data
      benchBoostsUsed: 0,
      tripleCaptainsUsed: 0,
      freeHitUsed: 0
    };

    // Generate AI overview
    const analysis = await generateAIOverview(
      teamPlayers,
      benchPlayers,
      userProfile,
      currentEvent.id
    );

    res.json({
      success: true,
      gameweek: currentEvent.id,
      analysis,
      generatedAt: new Date().toISOString()
    });

  } catch (err) {
    console.error(`GET /api/ai-overview/${req.params.userId} failed:`, err);
    
    // Check if it's a 404 error (team not found)
    if (err instanceof Error && err.message.includes('404')) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.status(500).json({ error: 'Failed to generate AI overview' });
  }
});

export default router;