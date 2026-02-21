// FPL Team Importer - Converts FPL squad data to MyTeam format
import type { LivePlayer, Pos, TeamSquad } from '@/lib/api';

export interface FPLSquadData {
  GKP: any[];
  DEF: any[];
  MID: any[];
  FWD: any[];
}

export interface TeamSlot {
  id: string;
  position: "GKP" | "DEF" | "MID" | "FWD" | "OUTFIELD";
  player?: LivePlayer & { 
    opponent?: string; 
    liveMatch?: any;
    fixtures?: any[];
    played_minutes?: number;
    is_captain?: boolean;
    is_vice_captain?: boolean;
  };
}

/**
 * Converts API TeamSquad data to MyTeam starting XI and bench format
 */
export function convertAPITeamToMyTeam(squad: TeamSquad): {
  startingXI: TeamSlot[];
  bench: TeamSlot[];
  captainId: number | null;
  viceCaptainId: number | null;
} {
  if (!squad) {
    throw new Error('No squad data provided');
  }

  console.log('🔄 Converting API squad to MyTeam format:', squad);

  // Get all players from the API squad structure
  const allPlayers = [
    ...squad.GKP || [],
    ...squad.DEF || [],
    ...squad.MID || [],
    ...squad.FWD || []
  ];

  console.log('📋 Total players from API squad:', allPlayers.length);
  console.log('📋 Players by position:', {
    GKP: squad.GKP?.length || 0,
    DEF: squad.DEF?.length || 0,
    MID: squad.MID?.length || 0,
    FWD: squad.FWD?.length || 0
  });

  // Separate starting XI (position 1-11) and bench (position 12-15) based on position field
  const startingPlayers = allPlayers
    .filter(player => player.position >= 1 && player.position <= 11)
    .sort((a, b) => a.position - b.position);

  const benchPlayers = allPlayers
    .filter(player => player.position >= 12 && player.position <= 15)
    .sort((a, b) => a.position - b.position);

  console.log('📊 Starting XI players:', startingPlayers.length);
  console.log('📊 Starting XI positions:', startingPlayers.map(p => `${p.name} (pos: ${p.position})`));
  console.log('📊 Bench players:', benchPlayers.length);
  console.log('📊 Bench positions:', benchPlayers.map(p => `${p.name} (pos: ${p.position})`));

  // Validate that we have exactly 11 starting players
  if (startingPlayers.length !== 11) {
    console.error('🚨 CRITICAL ERROR: Starting XI should have 11 players, got:', startingPlayers.length);
    console.error('🚨 All player positions:', allPlayers.map(p => ({ name: p.name, position: p.position })));
    throw new Error(`Invalid starting XI: Expected 11 players, got ${startingPlayers.length}`);
  }

  // Find captain and vice-captain
  const captain = allPlayers.find(p => p.is_captain);
  const viceCaptain = allPlayers.find(p => p.is_vice_captain);

  console.log('👑 Captain:', captain?.name, captain?.id);
  console.log('🫅 Vice-Captain:', viceCaptain?.name, viceCaptain?.id);

  // Convert API team players to LivePlayer format with enhanced data
  const convertAPIPlayer = (apiPlayer: any): LivePlayer & { 
    opponent?: string; 
    is_captain?: boolean;
    is_vice_captain?: boolean;
    kitCandidates?: string[];
  } => ({
    id: apiPlayer.id,
    name: apiPlayer.name,
    pos: apiPlayer.pos,
    team: apiPlayer.team,
    nextFixture: apiPlayer.nextFixture,
    status: apiPlayer.status || 'available',
    opponent: apiPlayer.nextFixture,
    is_captain: apiPlayer.is_captain || false,
    is_vice_captain: apiPlayer.is_vice_captain || false,
    event_points: apiPlayer.gameweekPoints !== undefined ? apiPlayer.gameweekPoints : 0,
    total_points: apiPlayer.total_points || 0,
    kitCandidates: apiPlayer.kitCandidates,
    now_cost: apiPlayer.now_cost,
    // Keep both for compatibility
    gameweekPoints: apiPlayer.gameweekPoints !== undefined ? apiPlayer.gameweekPoints : 0
  });

  // Create starting XI slots with proper MyTeam-compatible slot IDs
  const startingXI: TeamSlot[] = [];
  
  // Track position counters for proper slot ID generation
  const positionCounters = { GKP: 0, DEF: 0, MID: 0, FWD: 0 };
  
  startingPlayers.forEach((player) => {
    const pos = player.pos as Pos;
    positionCounters[pos]++;
    const slotId = `XI-${pos}-${positionCounters[pos]}`;
    
    startingXI.push({
      id: slotId,
      position: pos,
      player: convertAPIPlayer(player)
    });
  });

  // Create bench slots (fixed structure: 1 GKP + 3 outfield)
  const bench: TeamSlot[] = [
    // Bench GKP (position 12)
    {
      id: "BENCH-GKP",
      position: "GKP",
      player: benchPlayers.find(p => p.pos === "GKP") ? convertAPIPlayer(benchPlayers.find(p => p.pos === "GKP")!) : undefined
    },
    // Bench outfield players (positions 13-15) - fill with remaining bench players
    {
      id: "BENCH-1",
      position: "OUTFIELD",
      player: benchPlayers.find(p => p.pos !== "GKP" && p.position === 13) ? convertAPIPlayer(benchPlayers.find(p => p.pos !== "GKP" && p.position === 13)!) : undefined
    },
    {
      id: "BENCH-2", 
      position: "OUTFIELD",
      player: benchPlayers.find(p => p.pos !== "GKP" && p.position === 14) ? convertAPIPlayer(benchPlayers.find(p => p.pos !== "GKP" && p.position === 14)!) : undefined
    },
    {
      id: "BENCH-3",
      position: "OUTFIELD", 
      player: benchPlayers.find(p => p.pos !== "GKP" && p.position === 15) ? convertAPIPlayer(benchPlayers.find(p => p.pos !== "GKP" && p.position === 15)!) : undefined
    }
  ];

  return {
    startingXI,
    bench,
    captainId: captain?.id || null,
    viceCaptainId: viceCaptain?.id || null
  };
}

/**
 * Converts FPL squad data to MyTeam starting XI and bench format
 * LEGACY FUNCTION - kept for backward compatibility
 */
export function convertFPLTeamToMyTeam(fplSquad: FPLSquadData): {
  startingXI: TeamSlot[];
  bench: TeamSlot[];
  captainId: number | null;
  viceCaptainId: number | null;
} {
  if (!fplSquad) {
    throw new Error('No FPL squad data provided');
  }

  console.log('🔄 Converting FPL squad to MyTeam format:', fplSquad);

  // Get all players and sort by position (lineup order)
  const allPlayers = [
    ...fplSquad.GKP || [],
    ...fplSquad.DEF || [],
    ...fplSquad.MID || [],
    ...fplSquad.FWD || []
  ];

  console.log('📋 Total players from FPL squad:', allPlayers.length);
  console.log('📋 Players by position:', {
    GKP: fplSquad.GKP?.length || 0,
    DEF: fplSquad.DEF?.length || 0,
    MID: fplSquad.MID?.length || 0,
    FWD: fplSquad.FWD?.length || 0
  });
  console.log('📋 All players positions:', allPlayers.map(p => `${p.name} (pos: ${p.position})`));

  // Separate starting XI (position 1-11) and bench (position 12-15)
  const startingPlayers = allPlayers
    .filter(player => player.position >= 1 && player.position <= 11)
    .sort((a, b) => a.position - b.position);

  const benchPlayers = allPlayers
    .filter(player => player.position >= 12 && player.position <= 15)
    .sort((a, b) => a.position - b.position);
  
  // 🚨 FALLBACK: If position filtering didn't work (missing position field), 
  // use captain/vice-captain info and assume first 11 are starting XI
  if (startingPlayers.length === 0 && allPlayers.length >= 11) {
    console.warn('⚠️ Position fields missing, using fallback assignment...');
    startingPlayers.push(...allPlayers.slice(0, 11));
    benchPlayers.push(...allPlayers.slice(11, 15));
    console.log('📊 Fallback assignment - Starting XI:', startingPlayers.length, 'Bench:', benchPlayers.length);
  }

  console.log('📊 Starting XI players:', startingPlayers.length);
  console.log('📊 Starting XI positions:', startingPlayers.map(p => `${p.name} (pos: ${p.position})`));
  console.log('📊 Bench players:', benchPlayers.length);
  console.log('📊 Bench positions:', benchPlayers.map(p => `${p.name} (pos: ${p.position})`));
  
  // Validate that we have exactly 11 starting players
  if (startingPlayers.length !== 11) {
    console.error('🚨 CRITICAL ERROR: Starting XI should have 11 players, got:', startingPlayers.length);
    console.error('🚨 Missing positions:', allPlayers.filter(p => p.position >= 1 && p.position <= 11 && !startingPlayers.includes(p)));
    throw new Error(`Invalid starting XI: Expected 11 players, got ${startingPlayers.length}`);
  }

  // Find captain and vice-captain
  const captain = allPlayers.find(p => p.is_captain);
  const viceCaptain = allPlayers.find(p => p.is_vice_captain);

  console.log('👑 Captain:', captain?.name, captain?.id);
  console.log('🫅 Vice-Captain:', viceCaptain?.name, viceCaptain?.id);

  // Convert players to LivePlayer format with enhanced data
  const convertPlayer = (fplPlayer: any): LivePlayer & { 
    opponent?: string; 
    is_captain?: boolean;
    is_vice_captain?: boolean;
  } => ({
    id: fplPlayer.id,
    name: fplPlayer.name,
    pos: fplPlayer.pos,
    team: fplPlayer.team,
    nextFixture: fplPlayer.nextFixture,
    status: fplPlayer.status || 'available',
    opponent: fplPlayer.nextFixture,
    is_captain: fplPlayer.is_captain || false,
    is_vice_captain: fplPlayer.is_vice_captain || false,
    event_points: fplPlayer.gameweekPoints,
    total_points: fplPlayer.total_points
  });

  // Create starting XI slots with proper MyTeam-compatible slot IDs
  const startingXI: TeamSlot[] = [];
  
  // Track position counters for proper slot ID generation
  const positionCounters = { GKP: 0, DEF: 0, MID: 0, FWD: 0 };
  
  startingPlayers.forEach((player) => {
    const pos = player.pos as Pos;
    positionCounters[pos]++;
    const slotId = `XI-${pos}-${positionCounters[pos]}`;
    
    startingXI.push({
      id: slotId,
      position: pos,
      player: convertPlayer(player)
    });
  });

  // Create bench slots (fixed structure: 1 GKP + 3 outfield)
  const bench: TeamSlot[] = [
    // Bench GKP (position 12)
    {
      id: "BENCH-GKP",
      position: "GKP",
      player: benchPlayers[0] ? convertPlayer(benchPlayers[0]) : undefined
    },
    // Bench outfield players (positions 13-15)
    {
      id: "BENCH-1",
      position: "OUTFIELD",
      player: benchPlayers[1] ? convertPlayer(benchPlayers[1]) : undefined
    },
    {
      id: "BENCH-2", 
      position: "OUTFIELD",
      player: benchPlayers[2] ? convertPlayer(benchPlayers[2]) : undefined
    },
    {
      id: "BENCH-3",
      position: "OUTFIELD", 
      player: benchPlayers[3] ? convertPlayer(benchPlayers[3]) : undefined
    }
  ];

  return {
    startingXI,
    bench,
    captainId: captain?.id || null,
    viceCaptainId: viceCaptain?.id || null
  };
}

/**
 * Analyzes FPL formation from starting XI
 */
export function analyzeFPLFormation(startingXI: TeamSlot[]): {
  formation: string;
  gkp: number;
  def: number;
  mid: number;
  fwd: number;
} {
  const positions = startingXI.reduce((acc, slot) => {
    if (slot.player) {
      acc[slot.player.pos] = (acc[slot.player.pos] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const gkp = positions.GKP || 0;
  const def = positions.DEF || 0;
  const mid = positions.MID || 0; 
  const fwd = positions.FWD || 0;

  return {
    formation: `${def}-${mid}-${fwd}`,
    gkp,
    def,
    mid,
    fwd
  };
}