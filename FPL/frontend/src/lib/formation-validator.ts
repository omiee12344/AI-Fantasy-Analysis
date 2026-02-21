import { type Pos } from "./api";

export interface FormationCounts {
  gkp: number;
  def: number;
  mid: number;
  fwd: number;
}

export interface FPLValidationResult {
  isValid: boolean;
  errors: string[];
  formation: string;
  counts: FormationCounts;
}

// FPL formation rules
export const FPL_RULES = {
  gkp: { min: 1, max: 1 },
  def: { min: 3, max: 5 },
  mid: { min: 2, max: 5 },
  fwd: { min: 1, max: 3 },
  total: 11
};

// FPL squad rules (total 15 players: 11 starting + 4 bench)
export const FPL_SQUAD_RULES = {
  gkp: { total: 2 }, // 1 starting + 1 bench
  def: { total: 5 }, // 3-5 starting + remaining as bench
  mid: { total: 5 }, // 2-5 starting + remaining as bench
  fwd: { total: 3 }, // 1-3 starting + remaining as bench
  totalPlayers: 15,
  benchSize: 4
};

/**
 * Count players by position
 */
export function countPlayersByPosition(players: Array<{ pos: Pos }>): FormationCounts {
  return players.reduce(
    (counts, player) => {
      switch (player.pos) {
        case "GKP":
          counts.gkp++;
          break;
        case "DEF":
          counts.def++;
          break;
        case "MID":
          counts.mid++;
          break;
        case "FWD":
          counts.fwd++;
          break;
      }
      return counts;
    },
    { gkp: 0, def: 0, mid: 0, fwd: 0 }
  );
}

/**
 * Validate if formation meets FPL rules
 */
export function validateFPLFormation(players: Array<{ pos: Pos }>): FPLValidationResult {
  const counts = countPlayersByPosition(players);
  const errors: string[] = [];
  
  // Check total count
  const total = counts.gkp + counts.def + counts.mid + counts.fwd;
  if (total !== FPL_RULES.total) {
    errors.push(`Must have exactly ${FPL_RULES.total} players (currently ${total})`);
  }

  // Check each position
  if (counts.gkp < FPL_RULES.gkp.min || counts.gkp > FPL_RULES.gkp.max) {
    errors.push(`Must have exactly ${FPL_RULES.gkp.min} goalkeeper (currently ${counts.gkp})`);
  }

  if (counts.def < FPL_RULES.def.min || counts.def > FPL_RULES.def.max) {
    errors.push(`Must have ${FPL_RULES.def.min}-${FPL_RULES.def.max} defenders (currently ${counts.def})`);
  }

  if (counts.mid < FPL_RULES.mid.min || counts.mid > FPL_RULES.mid.max) {
    errors.push(`Must have ${FPL_RULES.mid.min}-${FPL_RULES.mid.max} midfielders (currently ${counts.mid})`);
  }

  if (counts.fwd < FPL_RULES.fwd.min || counts.fwd > FPL_RULES.fwd.max) {
    errors.push(`Must have ${FPL_RULES.fwd.min}-${FPL_RULES.fwd.max} forwards (currently ${counts.fwd})`);
  }

  // Generate formation string
  const formation = counts.gkp > 0 && total === FPL_RULES.total 
    ? `${counts.def}-${counts.mid}-${counts.fwd}`
    : "Invalid";

  return {
    isValid: errors.length === 0,
    errors,
    formation,
    counts
  };
}

/**
 * Check if a substitution would result in a valid formation
 */
export function validateSubstitution(
  currentStartingXI: Array<{ pos: Pos; id?: number }>,
  playerOut: { pos: Pos; id?: number },
  playerIn: { pos: Pos; id?: number }
): FPLValidationResult {
  // Create new starting XI with the substitution
  // Find and remove the specific player being substituted out
  const newStartingXI = currentStartingXI.filter(player => {
    // Use ID if available, otherwise fall back to position matching
    if (playerOut.id && player.id) {
      return player.id !== playerOut.id;
    }
    // For the first match by position (fallback)
    return player.pos !== playerOut.pos || player === playerOut;
  });
  
  // Add the new player
  newStartingXI.push({ pos: playerIn.pos, id: playerIn.id });

  return validateFPLFormation(newStartingXI);
}

/**
 * Get formation display name
 */
export function getFormationDisplayName(counts: FormationCounts): string {
  if (counts.gkp !== 1) return "Invalid";
  return `${counts.def}-${counts.mid}-${counts.fwd}`;
}

/**
 * Calculate available bench slots based on starting XI
 */
export function getAvailableBenchSlots(startingXI: Array<{ pos: Pos }>): FormationCounts {
  const startingCounts = countPlayersByPosition(startingXI);
  
  return {
    gkp: FPL_SQUAD_RULES.gkp.total - startingCounts.gkp, // Always 1 (2-1)
    def: FPL_SQUAD_RULES.def.total - startingCounts.def, // 5 - starting defenders
    mid: FPL_SQUAD_RULES.mid.total - startingCounts.mid, // 5 - starting midfielders  
    fwd: FPL_SQUAD_RULES.fwd.total - startingCounts.fwd  // 3 - starting forwards
  };
}

/**
 * Check if a player can be added to bench based on squad composition
 */
export function canAddToBench(
  startingXI: Array<{ pos: Pos }>,
  bench: Array<{ pos: Pos }>,
  playerPos: Pos
): boolean {
  const availableSlots = getAvailableBenchSlots(startingXI);
  const currentBenchCounts = countPlayersByPosition(bench);
  
  switch (playerPos) {
    case "GKP":
      return currentBenchCounts.gkp < availableSlots.gkp;
    case "DEF":
      return currentBenchCounts.def < availableSlots.def;
    case "MID":
      return currentBenchCounts.mid < availableSlots.mid;
    case "FWD":
      return currentBenchCounts.fwd < availableSlots.fwd;
    default:
      return false;
  }
}

/**
 * Check if two players can be substituted based on position rules
 */
export function canSubstitutePositions(playerOut: Pos, playerIn: Pos): boolean {
  // Goalkeepers can only be substituted with goalkeepers
  if (playerOut === "GKP" || playerIn === "GKP") {
    return playerOut === "GKP" && playerIn === "GKP";
  }
  
  // Outfield players can be substituted with any outfield player
  return playerOut !== "GKP" && playerIn !== "GKP";
}

/**
 * Get all valid formations in FPL
 */
export function getValidFPLFormations(): string[] {
  const formations: string[] = [];
  
  // Generate all possible combinations within FPL rules
  for (let def = FPL_RULES.def.min; def <= FPL_RULES.def.max; def++) {
    for (let mid = FPL_RULES.mid.min; mid <= FPL_RULES.mid.max; mid++) {
      for (let fwd = FPL_RULES.fwd.min; fwd <= FPL_RULES.fwd.max; fwd++) {
        if (def + mid + fwd === FPL_RULES.total - 1) { // -1 for the goalkeeper
          formations.push(`${def}-${mid}-${fwd}`);
        }
      }
    }
  }
  
  return formations.sort();
}

/**
 * Suggest formation corrections
 */
export function suggestFormationFix(counts: FormationCounts): string[] {
  const suggestions: string[] = [];
  
  if (counts.gkp !== 1) {
    suggestions.push(`Need exactly 1 goalkeeper`);
  }
  
  if (counts.def < FPL_RULES.def.min) {
    suggestions.push(`Need ${FPL_RULES.def.min - counts.def} more defender(s)`);
  } else if (counts.def > FPL_RULES.def.max) {
    suggestions.push(`Remove ${counts.def - FPL_RULES.def.max} defender(s)`);
  }
  
  if (counts.mid < FPL_RULES.mid.min) {
    suggestions.push(`Need ${FPL_RULES.mid.min - counts.mid} more midfielder(s)`);
  } else if (counts.mid > FPL_RULES.mid.max) {
    suggestions.push(`Remove ${counts.mid - FPL_RULES.mid.max} midfielder(s)`);
  }
  
  if (counts.fwd < FPL_RULES.fwd.min) {
    suggestions.push(`Need ${FPL_RULES.fwd.min - counts.fwd} more forward(s)`);
  } else if (counts.fwd > FPL_RULES.fwd.max) {
    suggestions.push(`Remove ${counts.fwd - FPL_RULES.fwd.max} forward(s)`);
  }
  
  return suggestions;
}