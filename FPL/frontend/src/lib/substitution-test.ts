import {
  processAutomaticSubstitutions,
  calculateGameweekPoints,
  type SubstitutionPlayer
} from './substitutions';

// Mock player data for testing
export const createMockPlayer = (
  id: number,
  name: string,
  pos: "GKP" | "DEF" | "MID" | "FWD",
  team: string,
  played_minutes: number = 0,
  total_points: number = 0,
  is_captain: boolean = false,
  is_vice_captain: boolean = false
): SubstitutionPlayer => ({
  id,
  name,
  pos,
  team,
  played_minutes,
  total_points,
  is_captain,
  is_vice_captain,
  multiplier: is_captain ? 2 : 1,
  status: "available",
  now_cost: 50,
  form: "5.0",
  points_per_game: "5.0",
  selected_by_percent: "10.0",
  minutes: played_minutes,
});

// Test Scenarios
export const testScenarios = {
  // Scenario 1: No substitutions needed - all players played
  allPlayersPlayed: {
    description: "All players played - no substitutions needed",
    startingXI: [
      createMockPlayer(1, "Allison", "GKP", "LIV", 90, 6, true),
      createMockPlayer(2, "Alexander-Arnold", "DEF", "LIV", 90, 8),
      createMockPlayer(3, "Virgil", "DEF", "LIV", 90, 6),
      createMockPlayer(4, "Robbo", "DEF", "LIV", 90, 2),
      createMockPlayer(5, "Salah", "MID", "LIV", 90, 12, false, true),
      createMockPlayer(6, "Mac Allister", "MID", "LIV", 90, 4),
      createMockPlayer(7, "Szoboszlai", "MID", "LIV", 90, 6),
      createMockPlayer(8, "Gakpo", "MID", "LIV", 90, 8),
      createMockPlayer(9, "Haaland", "FWD", "MCI", 90, 15),
      createMockPlayer(10, "Jesus", "FWD", "ARS", 90, 7),
      createMockPlayer(11, "Watkins", "FWD", "AVL", 90, 9),
    ],
    bench: [
      createMockPlayer(12, "Steele", "GKP", "BHA", 0, 2),
      createMockPlayer(13, "Dunk", "DEF", "BHA", 0, 1),
      createMockPlayer(14, "Gross", "MID", "BHA", 0, 3),
      createMockPlayer(15, "Welbeck", "FWD", "BHA", 0, 2),
    ],
  },

  // Scenario 2: Simple substitution - one player didn't play
  simpleSubstitution: {
    description: "One midfielder didn't play, first sub comes in",
    startingXI: [
      createMockPlayer(1, "Allison", "GKP", "LIV", 90, 6, true),
      createMockPlayer(2, "Alexander-Arnold", "DEF", "LIV", 90, 8),
      createMockPlayer(3, "Virgil", "DEF", "LIV", 90, 6),
      createMockPlayer(4, "Robbo", "DEF", "LIV", 90, 2),
      createMockPlayer(5, "Salah", "MID", "LIV", 0, 0, false, true), // Didn't play
      createMockPlayer(6, "Mac Allister", "MID", "LIV", 90, 4),
      createMockPlayer(7, "Szoboszlai", "MID", "LIV", 90, 6),
      createMockPlayer(8, "Gakpo", "MID", "LIV", 90, 8),
      createMockPlayer(9, "Haaland", "FWD", "MCI", 90, 15),
      createMockPlayer(10, "Jesus", "FWD", "ARS", 90, 7),
      createMockPlayer(11, "Watkins", "FWD", "AVL", 90, 9),
    ],
    bench: [
      createMockPlayer(12, "Steele", "GKP", "BHA", 0, 2),
      createMockPlayer(13, "Dunk", "DEF", "BHA", 90, 8), // First sub - played
      createMockPlayer(14, "Gross", "MID", "BHA", 90, 6), // Second sub - played
      createMockPlayer(15, "Welbeck", "FWD", "BHA", 0, 2),
    ],
  },

  // Scenario 3: Formation constraint - first sub can't come in
  formationConstraint: {
    description: "Defender didn't play, but first sub is DEF - would break formation",
    startingXI: [
      createMockPlayer(1, "Allison", "GKP", "LIV", 90, 6, true),
      createMockPlayer(2, "Alexander-Arnold", "DEF", "LIV", 0, 0), // Didn't play
      createMockPlayer(3, "Virgil", "DEF", "LIV", 90, 6),
      createMockPlayer(4, "Robbo", "DEF", "LIV", 90, 2),
      createMockPlayer(5, "Salah", "MID", "LIV", 90, 12, false, true),
      createMockPlayer(6, "Mac Allister", "MID", "LIV", 90, 4),
      createMockPlayer(7, "Szoboszlai", "MID", "LIV", 90, 6),
      createMockPlayer(8, "Gakpo", "MID", "LIV", 90, 8),
      createMockPlayer(9, "Haaland", "FWD", "MCI", 90, 15),
      createMockPlayer(10, "Jesus", "FWD", "ARS", 90, 7),
      createMockPlayer(11, "Watkins", "FWD", "AVL", 90, 9),
    ],
    bench: [
      createMockPlayer(12, "Steele", "GKP", "BHA", 0, 2),
      createMockPlayer(13, "Mitoma", "MID", "BHA", 90, 6), // First sub - MID, can come in
      createMockPlayer(14, "Dunk", "DEF", "BHA", 90, 5), // Second sub - DEF, would prefer this but formation
      createMockPlayer(15, "Welbeck", "FWD", "BHA", 0, 2),
    ],
  },

  // Scenario 4: Captain and vice-captain scenario
  captainViceCaptainSwap: {
    description: "Captain didn't play, vice-captain gets double points",
    startingXI: [
      createMockPlayer(1, "Allison", "GKP", "LIV", 90, 6),
      createMockPlayer(2, "Alexander-Arnold", "DEF", "LIV", 90, 8),
      createMockPlayer(3, "Virgil", "DEF", "LIV", 90, 6),
      createMockPlayer(4, "Robbo", "DEF", "LIV", 90, 2),
      createMockPlayer(5, "Salah", "MID", "LIV", 90, 12, false, true), // Vice-captain played
      createMockPlayer(6, "Mac Allister", "MID", "LIV", 90, 4),
      createMockPlayer(7, "Szoboszlai", "MID", "LIV", 90, 6),
      createMockPlayer(8, "Gakpo", "MID", "LIV", 90, 8),
      createMockPlayer(9, "Haaland", "FWD", "MCI", 0, 0, true), // Captain didn't play
      createMockPlayer(10, "Jesus", "FWD", "ARS", 90, 7),
      createMockPlayer(11, "Watkins", "FWD", "AVL", 90, 9),
    ],
    bench: [
      createMockPlayer(12, "Steele", "GKP", "BHA", 0, 2),
      createMockPlayer(13, "Dunk", "DEF", "BHA", 90, 5),
      createMockPlayer(14, "Gross", "MID", "BHA", 90, 6),
      createMockPlayer(15, "Welbeck", "FWD", "BHA", 90, 8), // Can sub for Haaland
    ],
  },

  // Scenario 5: Goalkeeper substitution
  goalkeeperSubstitution: {
    description: "Starting goalkeeper didn't play, bench keeper comes in",
    startingXI: [
      createMockPlayer(1, "Allison", "GKP", "LIV", 0, 0, true), // Didn't play
      createMockPlayer(2, "Alexander-Arnold", "DEF", "LIV", 90, 8),
      createMockPlayer(3, "Virgil", "DEF", "LIV", 90, 6),
      createMockPlayer(4, "Robbo", "DEF", "LIV", 90, 2),
      createMockPlayer(5, "Salah", "MID", "LIV", 90, 12, false, true),
      createMockPlayer(6, "Mac Allister", "MID", "LIV", 90, 4),
      createMockPlayer(7, "Szoboszlai", "MID", "LIV", 90, 6),
      createMockPlayer(8, "Gakpo", "MID", "LIV", 90, 8),
      createMockPlayer(9, "Haaland", "FWD", "MCI", 90, 15),
      createMockPlayer(10, "Jesus", "FWD", "ARS", 90, 7),
      createMockPlayer(11, "Watkins", "FWD", "AVL", 90, 9),
    ],
    bench: [
      createMockPlayer(12, "Steele", "GKP", "BHA", 90, 8), // Bench keeper played
      createMockPlayer(13, "Dunk", "DEF", "BHA", 90, 5),
      createMockPlayer(14, "Gross", "MID", "BHA", 90, 6),
      createMockPlayer(15, "Welbeck", "FWD", "BHA", 90, 8),
    ],
  },
};

// Run all test scenarios
export function runSubstitutionTests() {
  const results: Record<string, any> = {};

  Object.entries(testScenarios).forEach(([key, scenario]) => {
    console.log(`\n🔄 Testing: ${scenario.description}`);
    
    const substitutionResult = processAutomaticSubstitutions(
      scenario.startingXI,
      scenario.bench
    );
    
    const pointsResult = calculateGameweekPoints(
      scenario.startingXI,
      scenario.bench
    );

    results[key] = {
      scenario: scenario.description,
      substitutions: substitutionResult.substitutions,
      captainPoints: substitutionResult.captainPoints,
      viceCaptainUsed: substitutionResult.viceCaptainUsed,
      totalPoints: pointsResult.totalPoints,
      finalTeam: substitutionResult.finalTeam.map(p => ({ 
        name: p.name, 
        pos: p.pos, 
        points: p.total_points,
        played: (p.played_minutes || 0) > 0
      }))
    };

    // Log results
    console.log(`📊 Substitutions made: ${substitutionResult.substitutions.length}`);
    substitutionResult.substitutions.forEach(sub => {
      console.log(`   ${sub.out.name} → ${sub.in.name} (${sub.reason})`);
    });
    console.log(`🏆 Captain points: ${substitutionResult.captainPoints}`);
    console.log(`👑 Vice-captain used: ${substitutionResult.viceCaptainUsed}`);
    console.log(`📈 Total points: ${pointsResult.totalPoints}`);
  });

  return results;
}

// Test a specific scenario
export function testScenario(scenarioKey: keyof typeof testScenarios) {
  const scenario = testScenarios[scenarioKey];
  if (!scenario) {
    throw new Error(`Scenario '${scenarioKey}' not found`);
  }

  console.log(`🔄 Testing: ${scenario.description}`);
  
  const substitutionResult = processAutomaticSubstitutions(
    scenario.startingXI,
    scenario.bench
  );
  
  const pointsResult = calculateGameweekPoints(
    scenario.startingXI,
    scenario.bench
  );

  return {
    scenario: scenario.description,
    substitutions: substitutionResult.substitutions,
    captainPoints: substitutionResult.captainPoints,
    viceCaptainUsed: substitutionResult.viceCaptainUsed,
    totalPoints: pointsResult.totalPoints,
    breakdown: pointsResult.breakdown,
    finalTeam: substitutionResult.finalTeam
  };
}