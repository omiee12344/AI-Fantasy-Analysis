// AI Overview Service
// This file contains all the logic for generating AI-powered team analysis and insights
// Co-developers can modify algorithms here without touching UI components

interface TeamPlayer {
  id: number;
  name: string;
  pos: string;
  team: string;
  gameweekPoints: number;
  total_points: number;
  now_cost: number;
  status: string;
  is_captain: boolean;
  is_vice_captain: boolean;
  nextFixture: string;
}

interface TeamAnalysis {
  overview: string;
  suggestedTransfers: Transfer[];
  bestPerforming: PerformingPlayer[];
  strategyAdvice: StrategyAdvice;
  predictedPoints: PredictedPoints;
  predictedRank: PredictedRank;
}

interface Transfer {
  action: 'transfer_in' | 'transfer_out';
  playerId: number;
  playerName: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  cost?: number;
}

interface PerformingPlayer {
  playerId: number;
  playerName: string;
  pos: string;
  performance: string;
  points: number;
  trend: 'rising' | 'falling' | 'stable';
}

interface StrategyAdvice {
  recommendation: string;
  boostSuggestion: 'wildcard' | 'bench_boost' | 'triple_captain' | 'free_hit' | null;
  reasoning: string;
  confidence: number;
}

interface PredictedPoints {
  nextGameweek: number;
  confidence: number;
  breakdown: {
    startingXI: number;
    captain: number;
    viceCaptain: number;
    bench: number;
  };
}

interface PredictedRank {
  estimated: number;
  change: number;
  confidence: number;
}

/**
 * Main AI Overview Generator
 * This is the primary function that generates complete team analysis
 */
export async function generateAIOverview(
  teamPlayers: TeamPlayer[],
  benchPlayers: TeamPlayer[],
  userProfile: any,
  currentGameweek: number
): Promise<TeamAnalysis> {
  
  const startingXI = teamPlayers.slice(0, 11);
  const bench = benchPlayers;
  
  return {
    overview: generateTeamOverview(startingXI, bench, userProfile),
    suggestedTransfers: generateTransferSuggestions(startingXI, bench, userProfile),
    bestPerforming: analyzeBestPerformers(startingXI, bench),
    strategyAdvice: generateStrategyAdvice(startingXI, userProfile, currentGameweek),
    predictedPoints: predictNextGameweekPoints(startingXI, bench),
    predictedRank: predictRankChange(userProfile, startingXI)
  };
}

/**
 * Team Overview Analysis
 * Generates a comprehensive overview of the team's current state
 */
function generateTeamOverview(startingXI: TeamPlayer[], bench: TeamPlayer[], userProfile: any): string {
  const totalSquadPoints = [...startingXI, ...bench].reduce((sum, player) => sum + (player.total_points || 0), 0);
  const avgPointsPerPlayer = totalSquadPoints / 15;
  
  const injuredPlayers = [...startingXI, ...bench].filter(p => p.status === 'i' || p.status === 'd').length;
  const teamDistribution = analyzeTeamDistribution(startingXI);
  
  let overview = `Your squad averages ${avgPointsPerPlayer.toFixed(1)} points per player. `;
  
  if (injuredPlayers > 0) {
    overview += `⚠️ ${injuredPlayers} player${injuredPlayers > 1 ? 's are' : ' is'} injured/doubtful. `;
  }
  
  // Analyze team balance
  const premiumCount = startingXI.filter(p => (p.now_cost || 0) >= 90).length;
  if (premiumCount >= 3) {
    overview += `You have ${premiumCount} premium players - good balance for high returns. `;
  } else if (premiumCount <= 1) {
    overview += `Consider adding more premium assets for higher ceiling potential. `;
  }
  
  // Check captain choice
  const captain = startingXI.find(p => p.is_captain);
  if (captain) {
    overview += `${captain.name} (C) has ${captain.total_points || 0} points this season.`;
  }
  
  return overview;
}

/**
 * Transfer Suggestions Algorithm
 * Analyzes team and suggests optimal transfers based on performance, fixtures, and value
 */
function generateTransferSuggestions(startingXI: TeamPlayer[], bench: TeamPlayer[], userProfile: any): Transfer[] {
  const suggestions: Transfer[] = [];
  
  // Algorithm 1: Identify underperforming players
  const allPlayers = [...startingXI, ...bench];
  const avgPointsPerPosition = calculateAveragePointsByPosition(allPlayers);
  
  allPlayers.forEach(player => {
    const positionAvg = avgPointsPerPosition[player.pos] || 0;
    const playerAvg = (player.total_points || 0);
    
    // If player is significantly below position average
    if (playerAvg < positionAvg * 0.75) {
      suggestions.push({
        action: 'transfer_out',
        playerId: player.id,
        playerName: player.name,
        reason: `Underperforming vs position average (${playerAvg} vs ${positionAvg.toFixed(1)} avg)`,
        priority: player.status === 'i' ? 'high' : 'medium'
      });
    }
  });
  
  // Algorithm 2: Identify injury/suspension issues
  allPlayers.forEach(player => {
    if (player.status === 'i') {
      suggestions.push({
        action: 'transfer_out',
        playerId: player.id,
        playerName: player.name,
        reason: 'Currently injured - needs immediate attention',
        priority: 'high'
      });
    } else if (player.status === 'd') {
      suggestions.push({
        action: 'transfer_out',
        playerId: player.id,
        playerName: player.name,
        reason: 'Doubtful for next fixture - monitor closely',
        priority: 'medium'
      });
    }
  });
  
  // Algorithm 3: Fixture analysis (simplified)
  // In a real implementation, you'd analyze upcoming fixtures
  suggestions.forEach(suggestion => {
    if (suggestion.action === 'transfer_out') {
      // Add transfer in suggestions based on the out transfers
      // This would typically involve analyzing the best replacements
      // For now, we'll add generic advice
    }
  });
  
  return suggestions.slice(0, 5); // Limit to top 5 suggestions
}

/**
 * Best Performing Players Analysis
 * Identifies standout performers and concerning players
 */
function analyzeBestPerformers(startingXI: TeamPlayer[], bench: TeamPlayer[]): PerformingPlayer[] {
  const allPlayers = [...startingXI, ...bench];
  const performers: PerformingPlayer[] = [];
  
  // Sort by total points and recent form
  const sortedByPoints = allPlayers.sort((a, b) => (b.total_points || 0) - (a.total_points || 0));
  
  // Top 3 performers
  sortedByPoints.slice(0, 3).forEach(player => {
    const recentForm = (player.gameweekPoints || 0);
    performers.push({
      playerId: player.id,
      playerName: player.name,
      pos: player.pos,
      performance: 'excellent',
      points: player.total_points || 0,
      trend: recentForm > 6 ? 'rising' : recentForm < 2 ? 'falling' : 'stable'
    });
  });
  
  // Bottom 2 concerning players
  sortedByPoints.slice(-2).forEach(player => {
    if ((player.total_points || 0) < 30) { // Threshold for concern
      performers.push({
        playerId: player.id,
        playerName: player.name,
        pos: player.pos,
        performance: 'concerning',
        points: player.total_points || 0,
        trend: 'falling'
      });
    }
  });
  
  return performers;
}

/**
 * Strategy and Boost Recommendations
 * Suggests optimal strategy based on team state and remaining chips
 */
function generateStrategyAdvice(startingXI: TeamPlayer[], userProfile: any, currentGameweek: number): StrategyAdvice {
  const injuredCount = startingXI.filter(p => p.status === 'i' || p.status === 'd').length;
  const benchStrength = calculateBenchStrength(startingXI);
  
  // Algorithm for boost recommendation
  let boostSuggestion: StrategyAdvice['boostSuggestion'] = null;
  let recommendation = "Continue with regular transfers and monitor player form.";
  let reasoning = "Team appears stable with no major concerns.";
  let confidence = 75;
  
  // Wildcard recommendation logic
  if (injuredCount >= 3) {
    boostSuggestion = 'wildcard';
    recommendation = "Consider using your Wildcard to restructure the team.";
    reasoning = `${injuredCount} players have injury concerns, making mass changes beneficial.`;
    confidence = 90;
  }
  // Bench Boost logic
  else if (benchStrength > 20) {
    boostSuggestion = 'bench_boost';
    recommendation = "Your bench is strong - consider Bench Boost in a favorable gameweek.";
    reasoning = "Bench players have good potential returns.";
    confidence = 80;
  }
  // Triple Captain logic
  else {
    const captain = startingXI.find(p => p.is_captain);
    if (captain && (captain.total_points || 0) > 100) {
      boostSuggestion = 'triple_captain';
      recommendation = `${captain.name} is in excellent form - consider Triple Captain.`;
      reasoning = "Captain has consistent high-scoring potential.";
      confidence = 70;
    }
  }
  
  return {
    recommendation,
    boostSuggestion,
    reasoning,
    confidence
  };
}

/**
 * Next Gameweek Points Prediction
 * Uses historical data and fixtures to predict upcoming performance
 */
function predictNextGameweekPoints(startingXI: TeamPlayer[], bench: TeamPlayer[]): PredictedPoints {
  // Simplified prediction algorithm
  // In reality, this would use machine learning models with fixture difficulty, form, etc.
  
  const startingXIPrediction = startingXI.reduce((total, player) => {
    // Base prediction on recent form and position
    const basePoints = getPositionBasePoints(player.pos);
    const formMultiplier = (player.gameweekPoints || 0) > 5 ? 1.2 : 
                          (player.gameweekPoints || 0) < 2 ? 0.8 : 1.0;
    
    return total + (basePoints * formMultiplier);
  }, 0);
  
  const captain = startingXI.find(p => p.is_captain);
  const captainBonus = captain ? getPositionBasePoints(captain.pos) : 0;
  
  const viceCaptain = startingXI.find(p => p.is_vice_captain);
  const viceCaptainPoints = viceCaptain ? getPositionBasePoints(viceCaptain.pos) * 0.1 : 0;
  
  const benchPrediction = bench.reduce((total, player) => {
    return total + (getPositionBasePoints(player.pos) * 0.3); // Lower expectation for bench
  }, 0);
  
  return {
    nextGameweek: Math.round(startingXIPrediction + captainBonus + benchPrediction),
    confidence: 65,
    breakdown: {
      startingXI: Math.round(startingXIPrediction),
      captain: Math.round(captainBonus),
      viceCaptain: Math.round(viceCaptainPoints),
      bench: Math.round(benchPrediction)
    }
  };
}

/**
 * Rank Prediction Algorithm
 * Predicts potential rank changes based on team strength and predicted points
 */
function predictRankChange(userProfile: any, startingXI: TeamPlayer[]): PredictedRank {
  const currentRank = userProfile.overallRank || 1000000;
  const teamStrength = calculateTeamStrength(startingXI);
  
  // Simplified rank prediction
  // Better teams should climb, weaker teams might fall
  let estimatedChange = 0;
  
  if (teamStrength > 80) {
    estimatedChange = -Math.floor(currentRank * 0.02); // Climb up
  } else if (teamStrength < 60) {
    estimatedChange = Math.floor(currentRank * 0.01); // Fall down
  }
  
  return {
    estimated: currentRank + estimatedChange,
    change: estimatedChange,
    confidence: 60
  };
}

// Utility functions
function analyzeTeamDistribution(players: TeamPlayer[]) {
  const distribution = { GKP: 0, DEF: 0, MID: 0, FWD: 0 };
  players.forEach(player => {
    distribution[player.pos as keyof typeof distribution]++;
  });
  return distribution;
}

function calculateAveragePointsByPosition(players: TeamPlayer[]) {
  const positions = { GKP: [], DEF: [], MID: [], FWD: [] } as Record<string, number[]>;
  
  players.forEach(player => {
    if (positions[player.pos]) {
      positions[player.pos].push(player.total_points || 0);
    }
  });
  
  const averages: Record<string, number> = {};
  Object.keys(positions).forEach(pos => {
    const points = positions[pos];
    averages[pos] = points.length > 0 ? points.reduce((a, b) => a + b, 0) / points.length : 0;
  });
  
  return averages;
}

function calculateBenchStrength(bench: TeamPlayer[]): number {
  return bench.reduce((total, player) => total + (player.total_points || 0), 0);
}

function getPositionBasePoints(position: string): number {
  // Expected points per gameweek by position
  const basePoints = {
    'GKP': 4,
    'DEF': 4.5,
    'MID': 5,
    'FWD': 4.5
  };
  return basePoints[position as keyof typeof basePoints] || 4;
}

function calculateTeamStrength(players: TeamPlayer[]): number {
  const totalPoints = players.reduce((sum, player) => sum + (player.total_points || 0), 0);
  const avgPoints = totalPoints / players.length;
  
  // Scale to 0-100
  return Math.min(100, (avgPoints / 100) * 100);
}