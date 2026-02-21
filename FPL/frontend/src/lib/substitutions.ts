import { type Pos, type LivePlayer } from "./api";

// Extended player type for substitution logic
export type SubstitutionPlayer = LivePlayer & {
  played_minutes?: number;
  is_captain?: boolean;
  is_vice_captain?: boolean;
  multiplier?: number; // 1 for normal, 2 for captain, 0 for bench
};

// Team formation constraints
export interface Formation {
  gkp: number;
  def: number;
  mid: number;
  fwd: number;
}

// Valid FPL formations
export const VALID_FORMATIONS: Formation[] = [
  { gkp: 1, def: 3, mid: 4, fwd: 3 }, // 3-4-3
  { gkp: 1, def: 4, mid: 4, fwd: 2 }, // 4-4-2
  { gkp: 1, def: 4, mid: 3, fwd: 3 }, // 4-3-3
  { gkp: 1, def: 5, mid: 3, fwd: 2 }, // 5-3-2
  { gkp: 1, def: 3, mid: 5, fwd: 2 }, // 3-5-2
  { gkp: 1, def: 4, mid: 5, fwd: 1 }, // 4-5-1
];

// Minimum formation requirements
export const MIN_FORMATION: Formation = {
  gkp: 1,
  def: 3,
  mid: 2,
  fwd: 1,
};

/**
 * Check if a player played any minutes in the gameweek
 */
export function playerPlayed(player: SubstitutionPlayer): boolean {
  return (player.played_minutes || 0) > 0;
}

/**
 * Get formation from starting XI
 */
export function getFormationFromTeam(team: SubstitutionPlayer[]): Formation {
  return team.reduce(
    (formation, player) => {
      switch (player.pos) {
        case "GKP":
          formation.gkp++;
          break;
        case "DEF":
          formation.def++;
          break;
        case "MID":
          formation.mid++;
          break;
        case "FWD":
          formation.fwd++;
          break;
      }
      return formation;
    },
    { gkp: 0, def: 0, mid: 0, fwd: 0 }
  );
}

/**
 * Check if formation meets minimum requirements
 */
export function isValidFormation(formation: Formation): boolean {
  return (
    formation.gkp >= MIN_FORMATION.gkp &&
    formation.def >= MIN_FORMATION.def &&
    formation.mid >= MIN_FORMATION.mid &&
    formation.fwd >= MIN_FORMATION.fwd &&
    formation.gkp + formation.def + formation.mid + formation.fwd === 11
  );
}

/**
 * Check if adding a player would create a valid formation
 */
export function canAddPlayerToFormation(
  currentTeam: SubstitutionPlayer[],
  benchPlayer: SubstitutionPlayer
): boolean {
  const testTeam = [...currentTeam, benchPlayer];
  const formation = getFormationFromTeam(testTeam);
  return isValidFormation(formation);
}

/**
 * Get players who didn't play from starting XI
 */
export function getNonPlayingStarters(team: SubstitutionPlayer[]): SubstitutionPlayer[] {
  return team.filter(player => !playerPlayed(player));
}

/**
 * Get available bench players who played
 */
export function getAvailableBenchPlayers(bench: SubstitutionPlayer[]): SubstitutionPlayer[] {
  return bench.filter(player => playerPlayed(player));
}

/**
 * Find valid substitution for a non-playing starter
 */
export function findValidSubstitute(
  nonPlayingStarter: SubstitutionPlayer,
  availableBench: SubstitutionPlayer[],
  currentTeam: SubstitutionPlayer[]
): SubstitutionPlayer | null {
  // Special case: Goalkeeper can only be substituted by goalkeeper
  if (nonPlayingStarter.pos === "GKP") {
    return availableBench.find(player => 
      player.pos === "GKP" && playerPlayed(player)
    ) || null;
  }

  // For outfield players, check formation validity
  for (const benchPlayer of availableBench) {
    // Skip if it's a goalkeeper (already handled above)
    if (benchPlayer.pos === "GKP") continue;

    // Create test team without non-playing starter but with bench player
    const testTeam = currentTeam
      .filter(player => player.id !== nonPlayingStarter.id)
      .concat(benchPlayer);

    const formation = getFormationFromTeam(testTeam);
    if (isValidFormation(formation)) {
      return benchPlayer;
    }
  }

  return null;
}

/**
 * Process automatic substitutions for the gameweek
 */
export interface SubstitutionResult {
  finalTeam: SubstitutionPlayer[];
  substitutions: Array<{
    out: SubstitutionPlayer;
    in: SubstitutionPlayer;
    reason: 'did_not_play' | 'captain_vice_captain';
  }>;
  captainPoints: number;
  viceCaptainUsed: boolean;
}

export function processAutomaticSubstitutions(
  startingXI: SubstitutionPlayer[],
  bench: SubstitutionPlayer[]
): SubstitutionResult {
  let currentTeam = [...startingXI];
  const substitutions: SubstitutionResult['substitutions'] = [];
  
  // Sort bench by order (1st sub, 2nd sub, 3rd sub, GKP last)
  const orderedBench = [...bench].sort((a, b) => {
    // GKP bench should be last for outfield substitutions
    if (a.pos === "GKP" && b.pos !== "GKP") return 1;
    if (b.pos === "GKP" && a.pos !== "GKP") return -1;
    return 0;
  });

  let availableBench = getAvailableBenchPlayers(orderedBench);

  // Get non-playing starters
  const nonPlayingStarters = getNonPlayingStarters(currentTeam);

  // Process substitutions in bench order
  for (const nonPlayingStarter of nonPlayingStarters) {
    const substitute = findValidSubstitute(nonPlayingStarter, availableBench, currentTeam);
    
    if (substitute) {
      // Make the substitution
      currentTeam = currentTeam.map(player =>
        player.id === nonPlayingStarter.id ? substitute : player
      );

      // Record the substitution
      substitutions.push({
        out: nonPlayingStarter,
        in: substitute,
        reason: 'did_not_play'
      });

      // Remove substituted player from available bench
      availableBench = availableBench.filter(player => player.id !== substitute.id);
    }
  }

  // Handle captaincy logic
  const captain = currentTeam.find(player => player.is_captain);
  const viceCaptain = currentTeam.find(player => player.is_vice_captain);
  
  let captainPoints = 0;
  let viceCaptainUsed = false;

  if (captain && playerPlayed(captain)) {
    // Captain played, gets double points
    captainPoints = (captain.total_points || 0) * 2;
  } else if (viceCaptain && playerPlayed(viceCaptain)) {
    // Captain didn't play, vice-captain gets double points
    captainPoints = (viceCaptain.total_points || 0) * 2;
    viceCaptainUsed = true;
  }
  // If neither played, no captain points

  return {
    finalTeam: currentTeam,
    substitutions,
    captainPoints,
    viceCaptainUsed
  };
}

/**
 * Calculate total points for the gameweek including substitutions
 */
export function calculateGameweekPoints(
  startingXI: SubstitutionPlayer[],
  bench: SubstitutionPlayer[]
): {
  totalPoints: number;
  substitutionResult: SubstitutionResult;
  breakdown: {
    playerPoints: number;
    captainBonus: number;
    benchPoints: number;
  };
} {
  const substitutionResult = processAutomaticSubstitutions(startingXI, bench);
  
  // Calculate base points from final playing team (excluding captain bonus)
  const playerPoints = substitutionResult.finalTeam.reduce((total, player) => {
    if (playerPlayed(player)) {
      return total + (player.total_points || 0);
    }
    return total;
  }, 0);

  // Calculate captain bonus (already includes the base points for captain/vice)
  const captainBonus = substitutionResult.captainPoints;
  
  // Subtract captain's base points to avoid double counting
  const captain = substitutionResult.finalTeam.find(p => p.is_captain);
  const viceCaptain = substitutionResult.finalTeam.find(p => p.is_vice_captain);
  
  let captainBasePoints = 0;
  if (substitutionResult.viceCaptainUsed && viceCaptain && playerPlayed(viceCaptain)) {
    captainBasePoints = viceCaptain.total_points || 0;
  } else if (!substitutionResult.viceCaptainUsed && captain && playerPlayed(captain)) {
    captainBasePoints = captain.total_points || 0;
  }

  // Bench points (unused substitutes)
  const benchPoints = 0; // Bench players don't contribute to points

  const totalPoints = playerPoints + captainBonus - captainBasePoints;

  return {
    totalPoints,
    substitutionResult,
    breakdown: {
      playerPoints: playerPoints - captainBasePoints,
      captainBonus,
      benchPoints
    }
  };
}

/**
 * Simulate what the team would look like after gameweek with substitutions
 */
export function simulateGameweekResult(
  startingXI: SubstitutionPlayer[],
  bench: SubstitutionPlayer[],
  gameweekData?: { finished: boolean }
): {
  displayTeam: SubstitutionPlayer[];
  substitutions: SubstitutionResult['substitutions'];
  totalPoints: number;
  showSubstitutions: boolean;
} {
  const showSubstitutions = gameweekData?.finished ?? false;
  
  if (!showSubstitutions) {
    // Gameweek not finished, show original team
    return {
      displayTeam: startingXI,
      substitutions: [],
      totalPoints: 0,
      showSubstitutions: false
    };
  }

  // Gameweek finished, show team with substitutions
  const pointsResult = calculateGameweekPoints(startingXI, bench);
  
  return {
    displayTeam: pointsResult.substitutionResult.finalTeam,
    substitutions: pointsResult.substitutionResult.substitutions,
    totalPoints: pointsResult.totalPoints,
    showSubstitutions: true
  };
}