/**
 * FPL Points Engine - Deterministic Fantasy Premier League Points Calculator
 * 
 * Handles all FPL scoring rules including:
 * - Auto-substitutions with formation constraints
 * - Captaincy (including auto-switch from captain to vice-captain)
 * - Chip effects (Bench Boost, Triple Captain, Free Hit, Wildcard)
 * - Transfer hits calculation
 * - Mid-season join support with points offset
 * - Full audit logging for transparency
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type Position = "GKP" | "DEF" | "MID" | "FWD";

export type PlayerScore = {
  minutes: number;               // >= 1 means "played"
  total_fpl_points: number;      // includes all FPL stats already combined
};

export type SquadPlayer = {
  playerId: number;
  position: Position;        // registered position
};

export type BenchOrder = {
  gkpBench: number | null;   // playerId of bench GKP
  outfield1: number | null;  // bench slot 1 (highest priority)
  outfield2: number | null;  // bench slot 2
  outfield3: number | null;  // bench slot 3 (lowest priority)
};

export type Captaincy = {
  captainId: number | null;
  viceCaptainId: number | null;
};

export type Chips = {
  benchBoost?: boolean;      // true only in the GW used
  tripleCaptain?: boolean;
  freeHit?: boolean;
  wildcard?: boolean;
};

export type Transfers = {
  made: Array<{ inId: number; outId: number }>;
  freeTransfersAvailable: number;
  hitsPerExtraTransfer: number; // usually 4
};

export type Formation = { def: number; mid: number; fwd: number };

export type TeamState = {
  startingXI: number[];        // 11 playerIds
  bench: BenchOrder;           // see above
  squad: SquadPlayer[];        // full 15 with positions
  captaincy: Captaincy;
  formation: Formation; // e.g. 3-5-2
  transfers: Transfers;
  chips: Chips;
};

export type GW = {
  gw: number;                    // 1..38
  deadline_utc: string;          // ISO
  fixtures_complete: boolean;
  is_blank?: boolean;            // optional convenience
  is_double?: boolean;           // optional convenience
};

export type JoinConfig = {
  firstActiveGW: number;        // The first GW the app should compute natively
  userReportedPointsBeforeFirstActiveGW: number; // manual offset from user
};

export type GWBreakdown = {
  gw: number;
  baseXI: Array<{ playerId: number; points: number }>;    // before multipliers/subs
  autosubsApplied: Array<{ outId: number; inId: number; reason: string }>;
  benchPointsCounted: Array<{ playerId: number; points: number }>; // BB only
  effectiveXI: Array<{ playerId: number; points: number }>; // after subs
  captainFinal: { playerId: number | null; multiplier: 1 | 2 | 3 };
  viceCaptainFinal: number | null;
  chipEffects: { benchBoost?: boolean; tripleCaptain?: boolean; freeHit?: boolean; wildcard?: boolean };
  transferHits: number; // negative value, e.g. -4
  gwPoints: number;     // final total for the week
  auditLog: string[];   // human-readable steps taken
};

export type SeasonResult = {
  byGW: GWBreakdown[];
  totalPoints: number;  // includes offset from JoinConfig
};

// ============================================================================
// INPUT TYPES
// ============================================================================

export type FPLPointsEngineInputs = {
  season_id: string;
  gameweeks: GW[];
  player_points_by_gw: Record<number, Record<number, PlayerScore>>;
  userTeamByGW: Record<number, TeamState>;
  joinConfig: JoinConfig;
};

// ============================================================================
// FORMATION VALIDATION
// ============================================================================

export function validateFormation(startingXI: number[], squad: SquadPlayer[]): { 
  isValid: boolean; 
  formation: Formation; 
  errors: string[] 
} {
  const errors: string[] = [];
  
  if (startingXI.length !== 11) {
    errors.push(`Starting XI must have exactly 11 players (has ${startingXI.length})`);
    return { isValid: false, formation: { def: 0, mid: 0, fwd: 0 }, errors };
  }

  // Create position lookup
  const positionMap = new Map<number, Position>();
  squad.forEach(p => positionMap.set(p.playerId, p.position));

  // Count positions in starting XI
  const positionCounts = { GKP: 0, DEF: 0, MID: 0, FWD: 0 };
  
  startingXI.forEach(playerId => {
    const position = positionMap.get(playerId);
    if (!position) {
      errors.push(`Player ${playerId} not found in squad`);
      return;
    }
    positionCounts[position]++;
  });

  // Validate FPL formation rules
  if (positionCounts.GKP !== 1) {
    errors.push(`Must have exactly 1 goalkeeper in starting XI (has ${positionCounts.GKP})`);
  }
  if (positionCounts.DEF < 3 || positionCounts.DEF > 5) {
    errors.push(`Must have 3-5 defenders in starting XI (has ${positionCounts.DEF})`);
  }
  if (positionCounts.MID < 2 || positionCounts.MID > 5) {
    errors.push(`Must have 2-5 midfielders in starting XI (has ${positionCounts.MID})`);
  }
  if (positionCounts.FWD < 1 || positionCounts.FWD > 3) {
    errors.push(`Must have 1-3 forwards in starting XI (has ${positionCounts.FWD})`);
  }

  const formation: Formation = {
    def: positionCounts.DEF,
    mid: positionCounts.MID,
    fwd: positionCounts.FWD
  };

  return {
    isValid: errors.length === 0,
    formation,
    errors
  };
}

// ============================================================================
// AUTO-SUBSTITUTION LOGIC
// ============================================================================

function canMaintainFormationAfterSub(
  startingXI: number[], 
  outId: number, 
  inId: number, 
  squad: SquadPlayer[]
): boolean {
  // Create position lookup
  const positionMap = new Map<number, Position>();
  squad.forEach(p => positionMap.set(p.playerId, p.position));

  // Simulate the substitution
  const newXI = startingXI.map(id => id === outId ? inId : id);
  
  // Validate the new formation
  const validation = validateFormation(newXI, squad);
  return validation.isValid;
}

function pickBenchReplacement(
  outId: number,
  teamState: TeamState,
  scores: Record<number, PlayerScore>
): { inId: number; reason: string } | null {
  const positionMap = new Map<number, Position>();
  teamState.squad.forEach(p => positionMap.set(p.playerId, p.position));
  
  const outPosition = positionMap.get(outId);
  if (!outPosition) return null;

  // If outgoing player is GKP, only bench GKP can replace
  if (outPosition === "GKP") {
    const benchGKP = teamState.bench.gkpBench;
    if (benchGKP && (scores[benchGKP]?.minutes || 0) > 0) {
      return { 
        inId: benchGKP, 
        reason: `Goalkeeper ${outId} (0 mins) replaced by bench keeper ${benchGKP}` 
      };
    }
    return null;
  }

  // For outfield players, try bench order: outfield1 -> outfield2 -> outfield3
  const benchCandidates = [
    teamState.bench.outfield1,
    teamState.bench.outfield2,
    teamState.bench.outfield3
  ].filter(id => id !== null) as number[];

  for (const candidateId of benchCandidates) {
    // Check if candidate played
    if ((scores[candidateId]?.minutes || 0) === 0) continue;

    // Check if substitution maintains valid formation
    if (!canMaintainFormationAfterSub(teamState.startingXI, outId, candidateId, teamState.squad)) {
      continue;
    }

    const candidatePos = positionMap.get(candidateId);
    return { 
      inId: candidateId, 
      reason: `${outPosition} ${outId} (0 mins) replaced by ${candidatePos} ${candidateId} from bench` 
    };
  }

  return null;
}

// ============================================================================
// CAPTAINCY RESOLUTION
// ============================================================================

function resolveCaptaincy(
  teamState: TeamState,
  scores: Record<number, PlayerScore>
): { 
  effectiveCaptain: number | null; 
  multiplier: 1 | 2 | 3; 
  auditLog: string[] 
} {
  const auditLog: string[] = [];
  const { captainId, viceCaptainId } = teamState.captaincy;
  const isTripleCaptain = teamState.chips.tripleCaptain === true;
  
  // Base multiplier (2x normal, 3x if Triple Captain chip active)
  const baseMultiplier = isTripleCaptain ? 3 : 2;
  
  if (!captainId) {
    auditLog.push("No captain selected");
    return { effectiveCaptain: null, multiplier: 1, auditLog };
  }

  const captainPlayed = (scores[captainId]?.minutes || 0) > 0;
  const captainPoints = scores[captainId]?.total_fpl_points || 0;
  
  if (captainPlayed) {
    auditLog.push(`Captain ${captainId} played (${scores[captainId]?.minutes} mins, ${captainPoints} pts) - ${baseMultiplier}x multiplier applied`);
    return { effectiveCaptain: captainId, multiplier: baseMultiplier, auditLog };
  }

  // Captain didn't play, check vice-captain
  auditLog.push(`Captain ${captainId} did not play (0 mins)`);
  
  if (!viceCaptainId) {
    auditLog.push("No vice-captain selected - no captain multiplier applied");
    return { effectiveCaptain: null, multiplier: 1, auditLog };
  }

  const viceCaptainPlayed = (scores[viceCaptainId]?.minutes || 0) > 0;
  const viceCaptainPoints = scores[viceCaptainId]?.total_fpl_points || 0;
  
  if (viceCaptainPlayed) {
    auditLog.push(`Vice-captain ${viceCaptainId} played (${scores[viceCaptainId]?.minutes} mins, ${viceCaptainPoints} pts) - auto-promoted to captain with ${baseMultiplier}x multiplier`);
    return { effectiveCaptain: viceCaptainId, multiplier: baseMultiplier, auditLog };
  }

  auditLog.push(`Vice-captain ${viceCaptainId} also did not play (0 mins) - no captain multiplier applied`);
  return { effectiveCaptain: null, multiplier: 1, auditLog };
}

// ============================================================================
// TRANSFER HITS CALCULATION
// ============================================================================

function calculateTransferHits(teamState: TeamState): { hits: number; auditLog: string[] } {
  const auditLog: string[] = [];
  const { made, freeTransfersAvailable, hitsPerExtraTransfer } = teamState.transfers;
  const { freeHit, wildcard } = teamState.chips;

  if (freeHit) {
    auditLog.push("Free Hit chip active - no transfer hits applied");
    return { hits: 0, auditLog };
  }

  if (wildcard) {
    auditLog.push("Wildcard chip active - no transfer hits applied");
    return { hits: 0, auditLog };
  }

  const extraTransfers = Math.max(0, made.length - freeTransfersAvailable);
  const hits = -extraTransfers * hitsPerExtraTransfer;

  if (extraTransfers === 0) {
    auditLog.push(`${made.length} transfers made, ${freeTransfersAvailable} free transfers available - no hits`);
  } else {
    auditLog.push(`${made.length} transfers made, ${freeTransfersAvailable} free transfers available - ${extraTransfers} extra transfers × ${hitsPerExtraTransfer} points = ${hits} points`);
  }

  return { hits, auditLog };
}

// ============================================================================
// MAIN COMPUTATION FUNCTION
// ============================================================================

export function computeSeasonPoints(inputs: FPLPointsEngineInputs): SeasonResult {
  const { season_id, gameweeks, player_points_by_gw, userTeamByGW, joinConfig } = inputs;
  const result: GWBreakdown[] = [];
  
  // Sort gameweeks to ensure deterministic processing
  const sortedGameweeks = [...gameweeks].sort((a, b) => a.gw - b.gw);
  
  for (const gameweek of sortedGameweeks) {
    const gw = gameweek.gw;
    
    // Skip gameweeks before join
    if (gw < joinConfig.firstActiveGW) {
      continue;
    }

    const teamState = userTeamByGW[gw];
    if (!teamState) {
      throw new Error(`No team state found for gameweek ${gw}`);
    }

    const scores = player_points_by_gw[gw] || {};
    const auditLog: string[] = [];
    
    auditLog.push(`=== GAMEWEEK ${gw} CALCULATION ===`);

    // 1. Validate formation
    const formationValidation = validateFormation(teamState.startingXI, teamState.squad);
    if (!formationValidation.isValid) {
      throw new Error(`Invalid formation in GW${gw}: ${formationValidation.errors.join(', ')}`);
    }
    auditLog.push(`Formation validated: ${formationValidation.formation.def}-${formationValidation.formation.mid}-${formationValidation.formation.fwd}`);

    // 2. Calculate base points for starting XI
    const baseXI = teamState.startingXI.map(playerId => ({
      playerId,
      points: scores[playerId]?.total_fpl_points || 0
    }));
    
    const baseXITotal = baseXI.reduce((sum, p) => sum + p.points, 0);
    auditLog.push(`Starting XI base points: ${baseXITotal} (before subs/multipliers)`);

    // 3. Resolve captaincy
    const captaincyResult = resolveCaptaincy(teamState, scores);
    auditLog.push(...captaincyResult.auditLog);

    // 4. Handle auto-substitutions (skip if Bench Boost)
    let effectiveXI = [...teamState.startingXI];
    const autosubsApplied: Array<{ outId: number; inId: number; reason: string }> = [];
    
    if (!teamState.chips.benchBoost) {
      auditLog.push("Checking for auto-substitutions...");
      
      // Find players who didn't play
      const nonPlayers = effectiveXI.filter(playerId => (scores[playerId]?.minutes || 0) === 0);
      
      if (nonPlayers.length === 0) {
        auditLog.push("All starting XI players played - no substitutions needed");
      } else {
        auditLog.push(`${nonPlayers.length} starting players did not play: [${nonPlayers.join(', ')}]`);
        
        for (const outId of nonPlayers) {
          const replacement = pickBenchReplacement(outId, teamState, scores);
          if (replacement) {
            // Apply the substitution
            const index = effectiveXI.indexOf(outId);
            effectiveXI[index] = replacement.inId;
            autosubsApplied.push({ outId, inId: replacement.inId, reason: replacement.reason });
            auditLog.push(`✓ ${replacement.reason}`);
          } else {
            auditLog.push(`✗ No valid substitute found for player ${outId}`);
          }
        }
      }
    } else {
      auditLog.push("Bench Boost active - no auto-substitutions applied");
    }

    // 5. Calculate effective XI points (after subs, before captain multiplier)
    const effectiveXIBreakdown = effectiveXI.map(playerId => ({
      playerId,
      points: scores[playerId]?.total_fpl_points || 0
    }));
    
    let effectivePoints = effectiveXIBreakdown.reduce((sum, p) => sum + p.points, 0);
    auditLog.push(`Effective XI points: ${effectivePoints} (after substitutions)`);

    // 6. Apply captain multiplier
    let captainBonus = 0;
    if (captaincyResult.effectiveCaptain && captaincyResult.multiplier > 1) {
      const captainBasePoints = scores[captaincyResult.effectiveCaptain]?.total_fpl_points || 0;
      captainBonus = (captaincyResult.multiplier - 1) * captainBasePoints;
      effectivePoints += captainBonus;
      auditLog.push(`Captain bonus: ${captainBonus} points (${captaincyResult.multiplier}x multiplier on ${captainBasePoints} base points)`);
    }

    // 7. Handle Bench Boost
    let benchPoints = 0;
    const benchPointsCounted: Array<{ playerId: number; points: number }> = [];
    
    if (teamState.chips.benchBoost) {
      auditLog.push("Bench Boost active - counting all bench players:");
      
      const benchPlayers = [
        teamState.bench.gkpBench,
        teamState.bench.outfield1,
        teamState.bench.outfield2,
        teamState.bench.outfield3
      ].filter(id => id !== null) as number[];
      
      for (const benchId of benchPlayers) {
        const points = scores[benchId]?.total_fpl_points || 0;
        benchPoints += points;
        benchPointsCounted.push({ playerId: benchId, points });
        auditLog.push(`  Bench player ${benchId}: ${points} points`);
      }
      
      auditLog.push(`Total bench points: ${benchPoints}`);
    }

    // 8. Calculate transfer hits
    const transferResult = calculateTransferHits(teamState);
    auditLog.push(...transferResult.auditLog);

    // 9. Final gameweek total
    const gwPoints = effectivePoints + benchPoints + transferResult.hits;
    auditLog.push(`=== GAMEWEEK ${gw} TOTAL: ${gwPoints} points ===`);
    auditLog.push(`Breakdown: Effective XI (${effectivePoints}) + Bench Boost (${benchPoints}) + Transfer Hits (${transferResult.hits}) = ${gwPoints}`);

    // 10. Build result
    result.push({
      gw,
      baseXI,
      autosubsApplied,
      benchPointsCounted,
      effectiveXI: effectiveXIBreakdown,
      captainFinal: { 
        playerId: captaincyResult.effectiveCaptain, 
        multiplier: captaincyResult.multiplier 
      },
      viceCaptainFinal: teamState.captaincy.viceCaptainId,
      chipEffects: {
        benchBoost: teamState.chips.benchBoost,
        tripleCaptain: teamState.chips.tripleCaptain,
        freeHit: teamState.chips.freeHit,
        wildcard: teamState.chips.wildcard
      },
      transferHits: transferResult.hits,
      gwPoints,
      auditLog
    });
  }

  // Calculate cumulative total
  const gameweekTotal = result.reduce((sum, gw) => sum + gw.gwPoints, 0);
  const totalPoints = joinConfig.userReportedPointsBeforeFirstActiveGW + gameweekTotal;

  return {
    byGW: result,
    totalPoints
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function createDefaultJoinConfig(): JoinConfig {
  return {
    firstActiveGW: 1,
    userReportedPointsBeforeFirstActiveGW: 0
  };
}

export function createEmptyChips(): Chips {
  return {
    benchBoost: false,
    tripleCaptain: false,
    freeHit: false,
    wildcard: false
  };
}

export function createEmptyTransfers(): Transfers {
  return {
    made: [],
    freeTransfersAvailable: 1,
    hitsPerExtraTransfer: 4
  };
}