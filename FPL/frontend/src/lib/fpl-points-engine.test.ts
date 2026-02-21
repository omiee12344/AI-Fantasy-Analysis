/**
 * Comprehensive unit tests for FPL Points Engine
 * 
 * Tests cover all edge cases mentioned in the specification:
 * - Captain/vice-captain scenarios
 * - Auto-substitutions with formation constraints
 * - Chip effects (BB, TC, FH, WC)
 * - Transfer hits
 * - Mid-season join offset
 * - Formation validation
 */

import {
  computeSeasonPoints,
  validateFormation,
  createDefaultJoinConfig,
  createEmptyChips,
  createEmptyTransfers,
  type FPLPointsEngineInputs,
  type TeamState,
  type SquadPlayer,
  type PlayerScore,
  type GW
} from './fpl-points-engine';

// ============================================================================
// TEST UTILITIES
// ============================================================================

function createMockSquad(): SquadPlayer[] {
  return [
    // Starting XI
    { playerId: 1, position: "GKP" },  // Goalkeeper
    { playerId: 2, position: "DEF" },  // Defenders
    { playerId: 3, position: "DEF" },
    { playerId: 4, position: "DEF" },
    { playerId: 5, position: "MID" },  // Midfielders  
    { playerId: 6, position: "MID" },
    { playerId: 7, position: "MID" },
    { playerId: 8, position: "MID" },
    { playerId: 9, position: "MID" },
    { playerId: 10, position: "FWD" }, // Forwards
    { playerId: 11, position: "FWD" },
    
    // Bench
    { playerId: 12, position: "GKP" }, // Bench GKP
    { playerId: 13, position: "DEF" }, // Bench DEF
    { playerId: 14, position: "MID" }, // Bench MID  
    { playerId: 15, position: "FWD" }  // Bench FWD
  ];
}

function createBasicTeamState(overrides: Partial<TeamState> = {}): TeamState {
  const defaultState: TeamState = {
    startingXI: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // GKP + 3DEF + 5MID + 2FWD
    bench: {
      gkpBench: 12,
      outfield1: 13,  // DEF
      outfield2: 14,  // MID
      outfield3: 15   // FWD
    },
    squad: createMockSquad(),
    captaincy: {
      captainId: 10,      // Forward
      viceCaptainId: 9    // Midfielder
    },
    formation: { def: 3, mid: 5, fwd: 2 },
    transfers: createEmptyTransfers(),
    chips: createEmptyChips()
  };
  
  return { ...defaultState, ...overrides };
}

function createPlayerScores(scores: Record<number, { minutes: number; points: number }>): Record<number, PlayerScore> {
  const result: Record<number, PlayerScore> = {};
  Object.entries(scores).forEach(([playerId, data]) => {
    result[parseInt(playerId)] = {
      minutes: data.minutes,
      total_fpl_points: data.points
    };
  });
  return result;
}

// ============================================================================
// FORMATION VALIDATION TESTS
// ============================================================================

describe('Formation Validation', () => {
  const squad = createMockSquad();

  test('Valid 3-5-2 formation', () => {
    const startingXI = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const result = validateFormation(startingXI, squad);
    
    expect(result.isValid).toBe(true);
    expect(result.formation).toEqual({ def: 3, mid: 5, fwd: 2 });
    expect(result.errors).toHaveLength(0);
  });

  test('Invalid formation - too many defenders', () => {
    // Try to play 6 defenders (impossible)
    const startingXI = [1, 2, 3, 4, 13, 5, 6, 7, 8, 10, 11];
    const result = validateFormation(startingXI, squad);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Must have 3-5 defenders in starting XI (has 6)');
    expect(result.errors).toContain('Must have 2-5 midfielders in starting XI (has 4)');
  });

  test('Invalid formation - no goalkeeper', () => {
    const startingXI = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13];
    const result = validateFormation(startingXI, squad);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Must have exactly 1 goalkeeper in starting XI (has 0)');
  });

  test('Invalid formation - wrong number of players', () => {
    const startingXI = [1, 2, 3, 4, 5]; // Only 5 players
    const result = validateFormation(startingXI, squad);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Starting XI must have exactly 11 players (has 5)');
  });
});

// ============================================================================
// CAPTAINCY TESTS
// ============================================================================

describe('Captaincy Resolution', () => {
  test('Captain plays normally - gets 2x points', () => {
    const teamState = createBasicTeamState();
    const playerScores = createPlayerScores({
      10: { minutes: 90, points: 8 }, // Captain (FWD)
      9: { minutes: 90, points: 6 },  // Vice-captain
      1: { minutes: 90, points: 6 },  // GKP
      2: { minutes: 90, points: 2 },  // DEF
      3: { minutes: 90, points: 2 },  // DEF
      4: { minutes: 90, points: 2 },  // DEF
      5: { minutes: 90, points: 4 },  // MID
      6: { minutes: 90, points: 4 },  // MID
      7: { minutes: 90, points: 4 },  // MID
      8: { minutes: 90, points: 4 },  // MID
      11: { minutes: 90, points: 6 }  // FWD
    });

    const inputs: FPLPointsEngineInputs = {
      season_id: "2023-24",
      gameweeks: [{ gw: 1, deadline_utc: "2023-08-12T10:00:00Z", fixtures_complete: true }],
      player_points_by_gw: { 1: playerScores },
      userTeamByGW: { 1: teamState },
      joinConfig: createDefaultJoinConfig()
    };

    const result = computeSeasonPoints(inputs);
    
    expect(result.byGW).toHaveLength(1);
    expect(result.byGW[0].captainFinal.playerId).toBe(10);
    expect(result.byGW[0].captainFinal.multiplier).toBe(2);
    
    // Base points: 6+2+2+2+4+4+4+4+6+8+6 = 48
    // Captain bonus: 8 extra points (captain gets 8*2 instead of 8*1)
    // Total: 48 + 8 = 56
    expect(result.byGW[0].gwPoints).toBe(56);
  });

  test('Captain does not play, vice-captain takes over', () => {
    const teamState = createBasicTeamState();
    const playerScores = createPlayerScores({
      10: { minutes: 0, points: 0 },  // Captain doesn't play
      9: { minutes: 90, points: 6 },  // Vice-captain plays
      1: { minutes: 90, points: 6 },  // GKP
      2: { minutes: 90, points: 2 },  // DEF
      3: { minutes: 90, points: 2 },  // DEF
      4: { minutes: 90, points: 2 },  // DEF
      5: { minutes: 90, points: 4 },  // MID
      6: { minutes: 90, points: 4 },  // MID
      7: { minutes: 90, points: 4 },  // MID
      8: { minutes: 90, points: 4 },  // MID
      11: { minutes: 90, points: 6 }  // FWD
    });

    const inputs: FPLPointsEngineInputs = {
      season_id: "2023-24",
      gameweeks: [{ gw: 1, deadline_utc: "2023-08-12T10:00:00Z", fixtures_complete: true }],
      player_points_by_gw: { 1: playerScores },
      userTeamByGW: { 1: teamState },
      joinConfig: createDefaultJoinConfig()
    };

    const result = computeSeasonPoints(inputs);
    
    expect(result.byGW[0].captainFinal.playerId).toBe(9);  // Vice-captain becomes captain
    expect(result.byGW[0].captainFinal.multiplier).toBe(2);
    
    // Base points: 6+2+2+2+4+4+4+4+6+0+6 = 40
    // Captain bonus: 6 extra points (vice-captain gets 6*2)
    // Total: 40 + 6 = 46
    expect(result.byGW[0].gwPoints).toBe(46);
  });

  test('Both captain and vice-captain do not play - no multiplier', () => {
    const teamState = createBasicTeamState();
    const playerScores = createPlayerScores({
      10: { minutes: 0, points: 0 },  // Captain doesn't play
      9: { minutes: 0, points: 0 },   // Vice-captain doesn't play
      1: { minutes: 90, points: 6 },  // GKP
      2: { minutes: 90, points: 2 },  // DEF
      3: { minutes: 90, points: 2 },  // DEF
      4: { minutes: 90, points: 2 },  // DEF
      5: { minutes: 90, points: 4 },  // MID
      6: { minutes: 90, points: 4 },  // MID
      7: { minutes: 90, points: 4 },  // MID
      8: { minutes: 90, points: 4 },  // MID
      11: { minutes: 90, points: 6 }  // FWD
    });

    const inputs: FPLPointsEngineInputs = {
      season_id: "2023-24",
      gameweeks: [{ gw: 1, deadline_utc: "2023-08-12T10:00:00Z", fixtures_complete: true }],
      player_points_by_gw: { 1: playerScores },
      userTeamByGW: { 1: teamState },
      joinConfig: createDefaultJoinConfig()
    };

    const result = computeSeasonPoints(inputs);
    
    expect(result.byGW[0].captainFinal.playerId).toBe(null);
    expect(result.byGW[0].captainFinal.multiplier).toBe(1);
    
    // Base points: 6+2+2+2+4+4+4+4+6+0+6 = 40
    // No captain bonus
    // Total: 40
    expect(result.byGW[0].gwPoints).toBe(40);
  });

  test('Triple Captain chip - captain gets 3x multiplier', () => {
    const teamState = createBasicTeamState({
      chips: { tripleCaptain: true }
    });
    const playerScores = createPlayerScores({
      10: { minutes: 90, points: 12 }, // Captain (FWD) - big haul!
      9: { minutes: 90, points: 6 },   // Vice-captain
      1: { minutes: 90, points: 6 },   // GKP
      2: { minutes: 90, points: 2 },   // DEF
      3: { minutes: 90, points: 2 },   // DEF
      4: { minutes: 90, points: 2 },   // DEF
      5: { minutes: 90, points: 4 },   // MID
      6: { minutes: 90, points: 4 },   // MID
      7: { minutes: 90, points: 4 },   // MID
      8: { minutes: 90, points: 4 },   // MID
      11: { minutes: 90, points: 6 }   // FWD
    });

    const inputs: FPLPointsEngineInputs = {
      season_id: "2023-24",
      gameweeks: [{ gw: 1, deadline_utc: "2023-08-12T10:00:00Z", fixtures_complete: true }],
      player_points_by_gw: { 1: playerScores },
      userTeamByGW: { 1: teamState },
      joinConfig: createDefaultJoinConfig()
    };

    const result = computeSeasonPoints(inputs);
    
    expect(result.byGW[0].captainFinal.multiplier).toBe(3);
    
    // Base points: 6+2+2+2+4+4+4+4+6+12+6 = 52
    // Captain bonus: 24 extra points (captain gets 12*3 instead of 12*1)
    // Total: 52 + 24 = 76
    expect(result.byGW[0].gwPoints).toBe(76);
  });
});

// ============================================================================
// AUTO-SUBSTITUTION TESTS  
// ============================================================================

describe('Auto-Substitutions', () => {
  test('Basic outfield substitution maintaining formation', () => {
    const teamState = createBasicTeamState();
    const playerScores = createPlayerScores({
      // Starting XI - one midfielder doesn't play
      1: { minutes: 90, points: 6 },   // GKP
      2: { minutes: 90, points: 2 },   // DEF
      3: { minutes: 90, points: 2 },   // DEF
      4: { minutes: 90, points: 2 },   // DEF
      5: { minutes: 90, points: 4 },   // MID
      6: { minutes: 90, points: 4 },   // MID
      7: { minutes: 0, points: 0 },    // MID - doesn't play
      8: { minutes: 90, points: 4 },   // MID
      9: { minutes: 90, points: 6 },   // MID (vice-captain)
      10: { minutes: 90, points: 8 },  // FWD (captain)
      11: { minutes: 90, points: 6 },  // FWD
      
      // Bench
      12: { minutes: 90, points: 4 },  // Bench GKP
      13: { minutes: 90, points: 3 },  // Bench DEF - first sub
      14: { minutes: 90, points: 5 },  // Bench MID
      15: { minutes: 90, points: 7 }   // Bench FWD
    });

    const inputs: FPLPointsEngineInputs = {
      season_id: "2023-24",
      gameweeks: [{ gw: 1, deadline_utc: "2023-08-12T10:00:00Z", fixtures_complete: true }],
      player_points_by_gw: { 1: playerScores },
      userTeamByGW: { 1: teamState },
      joinConfig: createDefaultJoinConfig()
    };

    const result = computeSeasonPoints(inputs);
    
    expect(result.byGW[0].autosubsApplied).toHaveLength(1);
    expect(result.byGW[0].autosubsApplied[0].outId).toBe(7);  // MID who didn't play
    expect(result.byGW[0].autosubsApplied[0].inId).toBe(13);  // First bench player (DEF)
    
    // Base points with sub: 6+2+2+2+4+4+3+4+6+8+6 = 47 (13's 3 points replace 7's 0)
    // Captain bonus: 8 points
    // Total: 47 + 8 = 55
    expect(result.byGW[0].gwPoints).toBe(55);
  });

  test('Goalkeeper substitution', () => {
    const teamState = createBasicTeamState();
    const playerScores = createPlayerScores({
      // Starting XI - GKP doesn't play
      1: { minutes: 0, points: 0 },    // GKP - doesn't play
      2: { minutes: 90, points: 2 },   // DEF
      3: { minutes: 90, points: 2 },   // DEF
      4: { minutes: 90, points: 2 },   // DEF
      5: { minutes: 90, points: 4 },   // MID
      6: { minutes: 90, points: 4 },   // MID
      7: { minutes: 90, points: 4 },   // MID
      8: { minutes: 90, points: 4 },   // MID
      9: { minutes: 90, points: 6 },   // MID (vice-captain)
      10: { minutes: 90, points: 8 },  // FWD (captain)
      11: { minutes: 90, points: 6 },  // FWD
      
      // Bench
      12: { minutes: 90, points: 5 },  // Bench GKP - will sub in
      13: { minutes: 90, points: 3 },  // Bench DEF
      14: { minutes: 90, points: 5 },  // Bench MID
      15: { minutes: 90, points: 7 }   // Bench FWD
    });

    const inputs: FPLPointsEngineInputs = {
      season_id: "2023-24",
      gameweeks: [{ gw: 1, deadline_utc: "2023-08-12T10:00:00Z", fixtures_complete: true }],
      player_points_by_gw: { 1: playerScores },
      userTeamByGW: { 1: teamState },
      joinConfig: createDefaultJoinConfig()
    };

    const result = computeSeasonPoints(inputs);
    
    expect(result.byGW[0].autosubsApplied).toHaveLength(1);
    expect(result.byGW[0].autosubsApplied[0].outId).toBe(1);   // Starting GKP
    expect(result.byGW[0].autosubsApplied[0].inId).toBe(12);  // Bench GKP
    
    // Base points with sub: 5+2+2+2+4+4+4+4+6+8+6 = 47 (GKP 12's 5 points replace GKP 1's 0)
    // Captain bonus: 8 points
    // Total: 47 + 8 = 55
    expect(result.byGW[0].gwPoints).toBe(55);
  });

  test('No valid substitutes available', () => {
    const teamState = createBasicTeamState();
    const playerScores = createPlayerScores({
      // Starting XI - one midfielder doesn't play
      1: { minutes: 90, points: 6 },   // GKP
      2: { minutes: 90, points: 2 },   // DEF
      3: { minutes: 90, points: 2 },   // DEF
      4: { minutes: 90, points: 2 },   // DEF
      5: { minutes: 90, points: 4 },   // MID
      6: { minutes: 90, points: 4 },   // MID
      7: { minutes: 0, points: 0 },    // MID - doesn't play
      8: { minutes: 90, points: 4 },   // MID
      9: { minutes: 90, points: 6 },   // MID (vice-captain)
      10: { minutes: 90, points: 8 },  // FWD (captain)
      11: { minutes: 90, points: 6 },  // FWD
      
      // Bench - none of them play
      12: { minutes: 0, points: 0 },   // Bench GKP
      13: { minutes: 0, points: 0 },   // Bench DEF
      14: { minutes: 0, points: 0 },   // Bench MID
      15: { minutes: 0, points: 0 }    // Bench FWD
    });

    const inputs: FPLPointsEngineInputs = {
      season_id: "2023-24",
      gameweeks: [{ gw: 1, deadline_utc: "2023-08-12T10:00:00Z", fixtures_complete: true }],
      player_points_by_gw: { 1: playerScores },
      userTeamByGW: { 1: teamState },
      joinConfig: createDefaultJoinConfig()
    };

    const result = computeSeasonPoints(inputs);
    
    expect(result.byGW[0].autosubsApplied).toHaveLength(0);  // No substitutions possible
    
    // Base points: 6+2+2+2+4+4+0+4+6+8+6 = 44 (player 7 stays with 0 points)
    // Captain bonus: 8 points
    // Total: 44 + 8 = 52
    expect(result.byGW[0].gwPoints).toBe(52);
  });
});

// ============================================================================
// CHIP EFFECTS TESTS
// ============================================================================

describe('Chip Effects', () => {
  test('Bench Boost - all 15 players count, no auto-subs', () => {
    const teamState = createBasicTeamState({
      chips: { benchBoost: true }
    });
    const playerScores = createPlayerScores({
      // Starting XI
      1: { minutes: 90, points: 6 },   // GKP
      2: { minutes: 90, points: 2 },   // DEF
      3: { minutes: 90, points: 2 },   // DEF
      4: { minutes: 90, points: 2 },   // DEF
      5: { minutes: 90, points: 4 },   // MID
      6: { minutes: 90, points: 4 },   // MID
      7: { minutes: 0, points: 0 },    // MID - doesn't play, but no auto-sub due to BB
      8: { minutes: 90, points: 4 },   // MID
      9: { minutes: 90, points: 6 },   // MID (vice-captain)
      10: { minutes: 90, points: 8 },  // FWD (captain)
      11: { minutes: 90, points: 6 },  // FWD
      
      // Bench - all count towards total
      12: { minutes: 90, points: 5 },  // Bench GKP
      13: { minutes: 90, points: 3 },  // Bench DEF
      14: { minutes: 90, points: 7 },  // Bench MID
      15: { minutes: 90, points: 9 }   // Bench FWD
    });

    const inputs: FPLPointsEngineInputs = {
      season_id: "2023-24",
      gameweeks: [{ gw: 1, deadline_utc: "2023-08-12T10:00:00Z", fixtures_complete: true }],
      player_points_by_gw: { 1: playerScores },
      userTeamByGW: { 1: teamState },
      joinConfig: createDefaultJoinConfig()
    };

    const result = computeSeasonPoints(inputs);
    
    expect(result.byGW[0].autosubsApplied).toHaveLength(0);  // No auto-subs with BB
    expect(result.byGW[0].chipEffects.benchBoost).toBe(true);
    expect(result.byGW[0].benchPointsCounted).toHaveLength(4);
    
    // Starting XI: 6+2+2+2+4+4+0+4+6+8+6 = 44
    // Captain bonus: 8 points
    // Bench points: 5+3+7+9 = 24
    // Total: 44 + 8 + 24 = 76
    expect(result.byGW[0].gwPoints).toBe(76);
  });
});

// ============================================================================
// TRANSFER HITS TESTS
// ============================================================================

describe('Transfer Hits', () => {
  test('Extra transfers incur hits', () => {
    const teamState = createBasicTeamState({
      transfers: {
        made: [
          { inId: 101, outId: 201 },
          { inId: 102, outId: 202 },
          { inId: 103, outId: 203 }
        ],
        freeTransfersAvailable: 1,
        hitsPerExtraTransfer: 4
      }
    });
    
    const playerScores = createPlayerScores({
      1: { minutes: 90, points: 6 }, 2: { minutes: 90, points: 2 },
      3: { minutes: 90, points: 2 }, 4: { minutes: 90, points: 2 },
      5: { minutes: 90, points: 4 }, 6: { minutes: 90, points: 4 },
      7: { minutes: 90, points: 4 }, 8: { minutes: 90, points: 4 },
      9: { minutes: 90, points: 6 }, 10: { minutes: 90, points: 8 },
      11: { minutes: 90, points: 6 }
    });

    const inputs: FPLPointsEngineInputs = {
      season_id: "2023-24",
      gameweeks: [{ gw: 1, deadline_utc: "2023-08-12T10:00:00Z", fixtures_complete: true }],
      player_points_by_gw: { 1: playerScores },
      userTeamByGW: { 1: teamState },
      joinConfig: createDefaultJoinConfig()
    };

    const result = computeSeasonPoints(inputs);
    
    expect(result.byGW[0].transferHits).toBe(-8);  // 2 extra transfers × 4 points
    
    // Base points: 6+2+2+2+4+4+4+4+6+8+6 = 48
    // Captain bonus: 8 points
    // Transfer hits: -8 points
    // Total: 48 + 8 - 8 = 48
    expect(result.byGW[0].gwPoints).toBe(48);
  });

  test('Free Hit chip negates transfer hits', () => {
    const teamState = createBasicTeamState({
      chips: { freeHit: true },
      transfers: {
        made: [
          { inId: 101, outId: 201 },
          { inId: 102, outId: 202 },
          { inId: 103, outId: 203 },
          { inId: 104, outId: 204 },
          { inId: 105, outId: 205 }
        ],
        freeTransfersAvailable: 1,
        hitsPerExtraTransfer: 4
      }
    });
    
    const playerScores = createPlayerScores({
      1: { minutes: 90, points: 6 }, 2: { minutes: 90, points: 2 },
      3: { minutes: 90, points: 2 }, 4: { minutes: 90, points: 2 },
      5: { minutes: 90, points: 4 }, 6: { minutes: 90, points: 4 },
      7: { minutes: 90, points: 4 }, 8: { minutes: 90, points: 4 },
      9: { minutes: 90, points: 6 }, 10: { minutes: 90, points: 8 },
      11: { minutes: 90, points: 6 }
    });

    const inputs: FPLPointsEngineInputs = {
      season_id: "2023-24",
      gameweeks: [{ gw: 1, deadline_utc: "2023-08-12T10:00:00Z", fixtures_complete: true }],
      player_points_by_gw: { 1: playerScores },
      userTeamByGW: { 1: teamState },
      joinConfig: createDefaultJoinConfig()
    };

    const result = computeSeasonPoints(inputs);
    
    expect(result.byGW[0].transferHits).toBe(0);   // Free Hit negates hits
    expect(result.byGW[0].chipEffects.freeHit).toBe(true);
    
    // Base points: 6+2+2+2+4+4+4+4+6+8+6 = 48
    // Captain bonus: 8 points
    // Transfer hits: 0 points (negated by Free Hit)
    // Total: 48 + 8 = 56
    expect(result.byGW[0].gwPoints).toBe(56);
  });

  test('Wildcard chip negates transfer hits', () => {
    const teamState = createBasicTeamState({
      chips: { wildcard: true },
      transfers: {
        made: Array.from({ length: 10 }, (_, i) => ({ inId: 100 + i, outId: 200 + i })),
        freeTransfersAvailable: 1,
        hitsPerExtraTransfer: 4
      }
    });
    
    const playerScores = createPlayerScores({
      1: { minutes: 90, points: 6 }, 2: { minutes: 90, points: 2 },
      3: { minutes: 90, points: 2 }, 4: { minutes: 90, points: 2 },
      5: { minutes: 90, points: 4 }, 6: { minutes: 90, points: 4 },
      7: { minutes: 90, points: 4 }, 8: { minutes: 90, points: 4 },
      9: { minutes: 90, points: 6 }, 10: { minutes: 90, points: 8 },
      11: { minutes: 90, points: 6 }
    });

    const inputs: FPLPointsEngineInputs = {
      season_id: "2023-24",
      gameweeks: [{ gw: 1, deadline_utc: "2023-08-12T10:00:00Z", fixtures_complete: true }],
      player_points_by_gw: { 1: playerScores },
      userTeamByGW: { 1: teamState },
      joinConfig: createDefaultJoinConfig()
    };

    const result = computeSeasonPoints(inputs);
    
    expect(result.byGW[0].transferHits).toBe(0);   // Wildcard negates hits
    expect(result.byGW[0].chipEffects.wildcard).toBe(true);
    
    // Total should be same as no hits
    expect(result.byGW[0].gwPoints).toBe(56);
  });
});

// ============================================================================
// MID-SEASON JOIN TESTS
// ============================================================================

describe('Mid-Season Join', () => {
  test('Points offset applied correctly', () => {
    const teamState = createBasicTeamState();
    const playerScores = createPlayerScores({
      1: { minutes: 90, points: 6 }, 2: { minutes: 90, points: 2 },
      3: { minutes: 90, points: 2 }, 4: { minutes: 90, points: 2 },
      5: { minutes: 90, points: 4 }, 6: { minutes: 90, points: 4 },
      7: { minutes: 90, points: 4 }, 8: { minutes: 90, points: 4 },
      9: { minutes: 90, points: 6 }, 10: { minutes: 90, points: 8 },
      11: { minutes: 90, points: 6 }
    });

    const inputs: FPLPointsEngineInputs = {
      season_id: "2023-24",
      gameweeks: [
        { gw: 10, deadline_utc: "2023-10-28T10:00:00Z", fixtures_complete: true },
        { gw: 11, deadline_utc: "2023-11-04T10:00:00Z", fixtures_complete: true }
      ],
      player_points_by_gw: { 
        10: playerScores,
        11: playerScores 
      },
      userTeamByGW: { 
        10: teamState,
        11: teamState 
      },
      joinConfig: {
        firstActiveGW: 10,
        userReportedPointsBeforeFirstActiveGW: 500
      }
    };

    const result = computeSeasonPoints(inputs);
    
    expect(result.byGW).toHaveLength(2);
    
    // Each GW should give 56 points (48 base + 8 captain bonus)
    const expectedGwPoints = 56;
    expect(result.byGW[0].gwPoints).toBe(expectedGwPoints);
    expect(result.byGW[1].gwPoints).toBe(expectedGwPoints);
    
    // Total should be offset + computed points
    const expectedTotal = 500 + (expectedGwPoints * 2);
    expect(result.totalPoints).toBe(expectedTotal); // 500 + 56 + 56 = 612
  });

  test('Gameweeks before firstActiveGW are skipped', () => {
    const teamState = createBasicTeamState();
    const playerScores = createPlayerScores({
      1: { minutes: 90, points: 6 }, 2: { minutes: 90, points: 2 },
      3: { minutes: 90, points: 2 }, 4: { minutes: 90, points: 2 },
      5: { minutes: 90, points: 4 }, 6: { minutes: 90, points: 4 },
      7: { minutes: 90, points: 4 }, 8: { minutes: 90, points: 4 },
      9: { minutes: 90, points: 6 }, 10: { minutes: 90, points: 8 },
      11: { minutes: 90, points: 6 }
    });

    const inputs: FPLPointsEngineInputs = {
      season_id: "2023-24",
      gameweeks: [
        { gw: 1, deadline_utc: "2023-08-12T10:00:00Z", fixtures_complete: true },
        { gw: 2, deadline_utc: "2023-08-19T10:00:00Z", fixtures_complete: true },
        { gw: 10, deadline_utc: "2023-10-28T10:00:00Z", fixtures_complete: true }
      ],
      player_points_by_gw: { 
        1: playerScores,
        2: playerScores,
        10: playerScores 
      },
      userTeamByGW: { 
        1: teamState,
        2: teamState,
        10: teamState 
      },
      joinConfig: {
        firstActiveGW: 10,
        userReportedPointsBeforeFirstActiveGW: 742
      }
    };

    const result = computeSeasonPoints(inputs);
    
    expect(result.byGW).toHaveLength(1);  // Only GW10 processed
    expect(result.byGW[0].gw).toBe(10);
    expect(result.totalPoints).toBe(742 + 56); // 798
  });
});

// ============================================================================
// EDGE CASES & ERROR HANDLING
// ============================================================================

describe('Edge Cases', () => {
  test('Throws error for invalid formation', () => {
    const invalidTeamState = createBasicTeamState({
      startingXI: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] // Only 10 players
    });

    const inputs: FPLPointsEngineInputs = {
      season_id: "2023-24",
      gameweeks: [{ gw: 1, deadline_utc: "2023-08-12T10:00:00Z", fixtures_complete: true }],
      player_points_by_gw: { 1: {} },
      userTeamByGW: { 1: invalidTeamState },
      joinConfig: createDefaultJoinConfig()
    };

    expect(() => computeSeasonPoints(inputs)).toThrow('Invalid formation in GW1');
  });

  test('Handles missing player scores gracefully', () => {
    const teamState = createBasicTeamState();
    // No player scores provided

    const inputs: FPLPointsEngineInputs = {
      season_id: "2023-24",
      gameweeks: [{ gw: 1, deadline_utc: "2023-08-12T10:00:00Z", fixtures_complete: true }],
      player_points_by_gw: { 1: {} }, // Empty scores
      userTeamByGW: { 1: teamState },
      joinConfig: createDefaultJoinConfig()
    };

    const result = computeSeasonPoints(inputs);
    
    expect(result.byGW[0].gwPoints).toBe(0);  // All players get 0 points
    expect(result.totalPoints).toBe(0);
  });

  test('Handles missing gameweek team state', () => {
    const inputs: FPLPointsEngineInputs = {
      season_id: "2023-24",
      gameweeks: [{ gw: 1, deadline_utc: "2023-08-12T10:00:00Z", fixtures_complete: true }],
      player_points_by_gw: { 1: {} },
      userTeamByGW: {}, // No team state for GW1
      joinConfig: createDefaultJoinConfig()
    };

    expect(() => computeSeasonPoints(inputs)).toThrow('No team state found for gameweek 1');
  });
});