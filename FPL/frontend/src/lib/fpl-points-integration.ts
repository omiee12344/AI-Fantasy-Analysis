/**
 * Integration utilities for FPL Points Engine
 * 
 * Provides helper functions to convert existing data structures 
 * to FPL Points Engine format and vice versa
 */

import { 
  computeSeasonPoints,
  type FPLPointsEngineInputs,
  type TeamState,
  type SquadPlayer,
  type PlayerScore,
  type GW,
  type JoinConfig,
  createDefaultJoinConfig,
  createEmptyChips,
  createEmptyTransfers
} from './fpl-points-engine';

// ============================================================================
// INTEGRATION TYPES
// ============================================================================

// Existing codebase types (simplified for integration)
export interface LivePlayer {
  id: number;
  name: string;
  pos: "GKP" | "DEF" | "MID" | "FWD";
  team: string;
  total_points: number;
  event_points?: number;
  minutes?: number;
}

export interface GameweekData {
  id: number;
  name: string;
  deadline_time: string;
  finished: boolean;
  is_current?: boolean;
}

export interface UserTeam {
  startingXI: LivePlayer[];
  bench: LivePlayer[];
  captainId?: number;
  viceCaptainId?: number;
  formation?: string; // e.g., "3-5-2"
}

// ============================================================================
// CONVERSION UTILITIES
// ============================================================================

/**
 * Convert existing player data to FPL Points Engine format
 */
export function convertPlayersToPointsFormat(
  players: LivePlayer[], 
  gameweek: number
): Record<number, PlayerScore> {
  const result: Record<number, PlayerScore> = {};
  
  players.forEach(player => {
    result[player.id] = {
      minutes: player.minutes || (player.event_points !== undefined && player.event_points > 0 ? 90 : 0),
      total_fpl_points: player.event_points || 0
    };
  });
  
  return result;
}

/**
 * Convert existing gameweek data to FPL Points Engine format
 */
export function convertGameweekData(gameweeks: GameweekData[]): GW[] {
  return gameweeks.map(gw => ({
    gw: gw.id,
    deadline_utc: gw.deadline_time,
    fixtures_complete: gw.finished,
    is_blank: false, // Could be enhanced to detect blank gameweeks
    is_double: false // Could be enhanced to detect double gameweeks
  }));
}

/**
 * Convert user team to FPL Points Engine team state
 */
export function convertUserTeamToTeamState(
  userTeam: UserTeam,
  allPlayers: LivePlayer[]
): TeamState {
  // Create squad array (15 players total)
  const startingXIIds = userTeam.startingXI.map(p => p.id);
  const benchIds = userTeam.bench.map(p => p.id);
  
  const squad: SquadPlayer[] = [
    ...userTeam.startingXI.map(p => ({ playerId: p.id, position: p.pos })),
    ...userTeam.bench.map(p => ({ playerId: p.id, position: p.pos }))
  ];

  // Determine formation from starting XI
  const positionCounts = { GKP: 0, DEF: 0, MID: 0, FWD: 0 };
  userTeam.startingXI.forEach(player => {
    positionCounts[player.pos]++;
  });

  // Find bench goalkeeper and outfield players
  const benchGKP = userTeam.bench.find(p => p.pos === "GKP");
  const benchOutfield = userTeam.bench.filter(p => p.pos !== "GKP");

  return {
    startingXI: startingXIIds,
    bench: {
      gkpBench: benchGKP ? benchGKP.id : null,
      outfield1: benchOutfield[0] ? benchOutfield[0].id : null,
      outfield2: benchOutfield[1] ? benchOutfield[1].id : null,
      outfield3: benchOutfield[2] ? benchOutfield[2].id : null
    },
    squad,
    captaincy: {
      captainId: userTeam.captainId || null,
      viceCaptainId: userTeam.viceCaptainId || null
    },
    formation: {
      def: positionCounts.DEF,
      mid: positionCounts.MID,
      fwd: positionCounts.FWD
    },
    transfers: createEmptyTransfers(),
    chips: createEmptyChips()
  };
}

/**
 * Enhanced conversion with transfer and chip data
 */
export function convertUserTeamWithExtras(
  userTeam: UserTeam,
  allPlayers: LivePlayer[],
  transfersMade: number = 0,
  freeTransfers: number = 1,
  chipsActive: {
    benchBoost?: boolean;
    tripleCaptain?: boolean;
    freeHit?: boolean;
    wildcard?: boolean;
  } = {}
): TeamState {
  const baseTeamState = convertUserTeamToTeamState(userTeam, allPlayers);
  
  return {
    ...baseTeamState,
    transfers: {
      made: Array.from({ length: transfersMade }, (_, i) => ({ 
        inId: 1000 + i, 
        outId: 2000 + i 
      })),
      freeTransfersAvailable: freeTransfers,
      hitsPerExtraTransfer: 4
    },
    chips: {
      benchBoost: chipsActive.benchBoost || false,
      tripleCaptain: chipsActive.tripleCaptain || false,
      freeHit: chipsActive.freeHit || false,
      wildcard: chipsActive.wildcard || false
    }
  };
}

// ============================================================================
// QUICK CALCULATION FUNCTIONS
// ============================================================================

/**
 * Quick single gameweek points calculation
 */
export function calculateSingleGameweekPoints(
  userTeam: UserTeam,
  allPlayers: LivePlayer[],
  gameweekData: GameweekData,
  options: {
    transfersMade?: number;
    freeTransfers?: number;
    chipsActive?: {
      benchBoost?: boolean;
      tripleCaptain?: boolean;
      freeHit?: boolean;
      wildcard?: boolean;
    };
  } = {}
) {
  const teamState = convertUserTeamWithExtras(
    userTeam, 
    allPlayers, 
    options.transfersMade || 0,
    options.freeTransfers || 1,
    options.chipsActive || {}
  );

  const playerPoints = convertPlayersToPointsFormat(allPlayers, gameweekData.id);

  const inputs: FPLPointsEngineInputs = {
    season_id: "current",
    gameweeks: [convertGameweekData([gameweekData])[0]],
    player_points_by_gw: { [gameweekData.id]: playerPoints },
    userTeamByGW: { [gameweekData.id]: teamState },
    joinConfig: createDefaultJoinConfig()
  };

  return computeSeasonPoints(inputs);
}

/**
 * Calculate points for multiple gameweeks
 */
export function calculateMultipleGameweeksPoints(
  userTeamsByGW: Record<number, UserTeam>,
  playerPointsByGW: Record<number, LivePlayer[]>,
  gameweeksData: GameweekData[],
  joinConfig: JoinConfig = createDefaultJoinConfig()
) {
  const gameweeks = convertGameweekData(gameweeksData);
  
  const convertedPlayerPoints: Record<number, Record<number, PlayerScore>> = {};
  Object.entries(playerPointsByGW).forEach(([gw, players]) => {
    convertedPlayerPoints[parseInt(gw)] = convertPlayersToPointsFormat(players, parseInt(gw));
  });

  const convertedTeamStates: Record<number, TeamState> = {};
  Object.entries(userTeamsByGW).forEach(([gw, team]) => {
    const allPlayersForGW = playerPointsByGW[parseInt(gw)] || [];
    convertedTeamStates[parseInt(gw)] = convertUserTeamToTeamState(team, allPlayersForGW);
  });

  const inputs: FPLPointsEngineInputs = {
    season_id: "current",
    gameweeks,
    player_points_by_gw: convertedPlayerPoints,
    userTeamByGW: convertedTeamStates,
    joinConfig
  };

  return computeSeasonPoints(inputs);
}

// ============================================================================
// DEMONSTRATION FUNCTIONS
// ============================================================================

/**
 * Example of how to use the points engine with mock data
 */
export function demonstratePointsEngine() {
  // Mock data similar to your existing codebase
  const mockPlayers: LivePlayer[] = [
    { id: 1, name: "Alisson", pos: "GKP", team: "LIV", total_points: 120, event_points: 6, minutes: 90 },
    { id: 2, name: "Alexander-Arnold", pos: "DEF", team: "LIV", total_points: 150, event_points: 8, minutes: 90 },
    { id: 3, name: "Van Dijk", pos: "DEF", team: "LIV", total_points: 140, event_points: 6, minutes: 90 },
    { id: 4, name: "Robertson", pos: "DEF", team: "LIV", total_points: 130, event_points: 2, minutes: 90 },
    { id: 5, name: "Salah", pos: "MID", team: "LIV", total_points: 200, event_points: 12, minutes: 90 },
    { id: 6, name: "Mane", pos: "MID", team: "LIV", total_points: 180, event_points: 8, minutes: 90 },
    { id: 7, name: "Henderson", pos: "MID", team: "LIV", total_points: 100, event_points: 4, minutes: 90 },
    { id: 8, name: "Fabinho", pos: "MID", team: "LIV", total_points: 90, event_points: 4, minutes: 90 },
    { id: 9, name: "Thiago", pos: "MID", team: "LIV", total_points: 85, event_points: 6, minutes: 90 },
    { id: 10, name: "Firmino", pos: "FWD", team: "LIV", total_points: 160, event_points: 8, minutes: 90 },
    { id: 11, name: "Jota", pos: "FWD", team: "LIV", total_points: 140, event_points: 6, minutes: 90 },
    // Bench
    { id: 12, name: "Kelleher", pos: "GKP", team: "LIV", total_points: 20, event_points: 0, minutes: 0 },
    { id: 13, name: "Matip", pos: "DEF", team: "LIV", total_points: 80, event_points: 2, minutes: 30 },
    { id: 14, name: "Keita", pos: "MID", team: "LIV", total_points: 60, event_points: 1, minutes: 15 },
    { id: 15, name: "Origi", pos: "FWD", team: "LIV", total_points: 40, event_points: 0, minutes: 0 }
  ];

  const mockUserTeam: UserTeam = {
    startingXI: mockPlayers.slice(0, 11),
    bench: mockPlayers.slice(11, 15),
    captainId: 5, // Salah
    viceCaptainId: 10, // Firmino
    formation: "4-5-1"
  };

  const mockGameweek: GameweekData = {
    id: 20,
    name: "Gameweek 20",
    deadline_time: "2024-01-13T11:00:00Z",
    finished: true,
    is_current: false
  };

  // Calculate points
  const result = calculateSingleGameweekPoints(mockUserTeam, mockPlayers, mockGameweek);
  
  console.log("=== FPL Points Engine Demonstration ===");
  console.log(`Gameweek ${result.byGW[0].gw} Points: ${result.byGW[0].gwPoints}`);
  console.log(`Captain: Player ${result.byGW[0].captainFinal.playerId} (${result.byGW[0].captainFinal.multiplier}x)`);
  console.log(`Auto-subs applied: ${result.byGW[0].autosubsApplied.length}`);
  console.log("Audit log:");
  result.byGW[0].auditLog.forEach(log => console.log(`  ${log}`));
  
  return result;
}

/**
 * Example with chips and transfers
 */
export function demonstrateAdvancedScenario() {
  const mockPlayers: LivePlayer[] = [
    { id: 1, name: "Ederson", pos: "GKP", team: "MCI", total_points: 130, event_points: 8, minutes: 90 },
    { id: 2, name: "Cancelo", pos: "DEF", team: "MCI", total_points: 160, event_points: 10, minutes: 90 },
    { id: 3, name: "Dias", pos: "DEF", team: "MCI", total_points: 140, event_points: 6, minutes: 90 },
    { id: 4, name: "Walker", pos: "DEF", team: "MCI", total_points: 120, event_points: 2, minutes: 90 },
    { id: 5, name: "De Bruyne", pos: "MID", team: "MCI", total_points: 220, event_points: 15, minutes: 90 },
    { id: 6, name: "Bernardo", pos: "MID", team: "MCI", total_points: 160, event_points: 8, minutes: 90 },
    { id: 7, name: "Gundogan", pos: "MID", team: "MCI", total_points: 140, event_points: 6, minutes: 90 },
    { id: 8, name: "Mahrez", pos: "MID", team: "MCI", total_points: 150, event_points: 12, minutes: 90 },
    { id: 9, name: "Sterling", pos: "MID", team: "MCI", total_points: 170, event_points: 4, minutes: 90 },
    { id: 10, name: "Haaland", pos: "FWD", team: "MCI", total_points: 250, event_points: 20, minutes: 90 },
    { id: 11, name: "Alvarez", pos: "FWD", team: "MCI", total_points: 120, event_points: 8, minutes: 90 },
    // Bench  
    { id: 12, name: "Ortega", pos: "GKP", team: "MCI", total_points: 15, event_points: 6, minutes: 90 },
    { id: 13, name: "Akanji", pos: "DEF", team: "MCI", total_points: 90, event_points: 4, minutes: 90 },
    { id: 14, name: "Phillips", pos: "MID", team: "MCI", total_points: 45, event_points: 2, minutes: 45 },
    { id: 15, name: "Foden", pos: "FWD", team: "MCI", total_points: 140, event_points: 10, minutes: 90 }
  ];

  const mockUserTeam: UserTeam = {
    startingXI: mockPlayers.slice(0, 11),
    bench: mockPlayers.slice(11, 15),
    captainId: 10, // Haaland
    viceCaptainId: 5,  // De Bruyne
    formation: "4-5-1"
  };

  const mockGameweek: GameweekData = {
    id: 25,
    name: "Gameweek 25 (DGW)",
    deadline_time: "2024-02-10T11:00:00Z",
    finished: true
  };

  // Calculate with Bench Boost and Triple Captain
  const result = calculateSingleGameweekPoints(mockUserTeam, mockPlayers, mockGameweek, {
    chipsActive: {
      benchBoost: true,
      tripleCaptain: true
    }
  });
  
  console.log("=== Advanced Scenario (Bench Boost + Triple Captain) ===");
  console.log(`Gameweek ${result.byGW[0].gw} Points: ${result.byGW[0].gwPoints}`);
  console.log(`Captain: Player ${result.byGW[0].captainFinal.playerId} (${result.byGW[0].captainFinal.multiplier}x)`);
  console.log(`Bench Boost active: ${result.byGW[0].chipEffects.benchBoost}`);
  console.log(`Triple Captain active: ${result.byGW[0].chipEffects.tripleCaptain}`);
  console.log(`Bench points: ${result.byGW[0].benchPointsCounted.reduce((sum, p) => sum + p.points, 0)}`);
  
  return result;
}

// ============================================================================
// UTILITY EXPORT
// ============================================================================

export const FPLPointsUtils = {
  convertPlayersToPointsFormat,
  convertGameweekData,
  convertUserTeamToTeamState,
  convertUserTeamWithExtras,
  calculateSingleGameweekPoints,
  calculateMultipleGameweeksPoints,
  demonstratePointsEngine,
  demonstrateAdvancedScenario
};