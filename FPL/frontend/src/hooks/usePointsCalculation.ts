/**
 * Hook for integrating FPL Points Engine with existing team data
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  calculateSingleGameweekPoints,
  calculateMultipleGameweeksPoints,
  type LivePlayer,
  type UserTeam,
  type GameweekData
} from '../lib/fpl-points-integration';
import type { SeasonResult } from '../lib/fpl-points-engine';

interface UsePointsCalculationProps {
  startingXI: any[];
  bench: any[];
  captainId?: number;
  viceCaptainId?: number;
  gameweekData?: any;
  allPlayers?: any[];
  transfersMade?: number;
  freeTransfers?: number;
  chipsActive?: {
    benchBoost?: boolean;
    tripleCaptain?: boolean;
    freeHit?: boolean;
    wildcard?: boolean;
  };
}

export function usePointsCalculation({
  startingXI = [],
  bench = [],
  captainId,
  viceCaptainId,
  gameweekData,
  allPlayers = [],
  transfersMade = 0,
  freeTransfers = 1,
  chipsActive = {}
}: UsePointsCalculationProps) {
  const [calculationResult, setCalculationResult] = useState<SeasonResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);

  // Convert existing player data to LivePlayer format
  const convertToLivePlayer = (player: any): LivePlayer => ({
    id: player.id || player.element,
    name: player.web_name || player.name || 'Unknown',
    pos: player.element_type_name || player.pos || 'MID',
    team: player.team_name || player.team || 'Unknown',
    total_points: player.total_points || 0,
    event_points: player.event_points || player.points || 0,
    minutes: player.minutes || (player.event_points > 0 ? 90 : 0)
  });

  // Convert to UserTeam format
  const userTeam: UserTeam | null = useMemo(() => {
    if (startingXI.length === 0) return null;
    
    return {
      startingXI: startingXI.map(convertToLivePlayer),
      bench: bench.map(convertToLivePlayer),
      captainId,
      viceCaptainId,
      formation: getFormationString(startingXI)
    };
  }, [startingXI, bench, captainId, viceCaptainId]);

  // Convert gameweek data
  const currentGameweek: GameweekData | null = useMemo(() => {
    if (!gameweekData) return null;
    
    return {
      id: gameweekData.id || gameweekData.event,
      name: gameweekData.name || `Gameweek ${gameweekData.id}`,
      deadline_time: gameweekData.deadline_time || new Date().toISOString(),
      finished: gameweekData.finished || false,
      is_current: gameweekData.is_current || false
    };
  }, [gameweekData]);

  // Convert all players
  const livePlayers: LivePlayer[] = useMemo(() => {
    if (!allPlayers.length) return [];
    return allPlayers.map(convertToLivePlayer);
  }, [allPlayers]);

  // Calculate points when dependencies change
  useEffect(() => {
    if (!userTeam || !currentGameweek || !livePlayers.length) {
      setCalculationResult(null);
      return;
    }

    const calculatePoints = async () => {
      setIsCalculating(true);
      setCalculationError(null);
      
      try {
        console.log('🧮 Calculating FPL points...', {
          gameweek: currentGameweek.id,
          teamSize: userTeam.startingXI.length + userTeam.bench.length,
          captain: userTeam.captainId,
          transfersMade,
          chipsActive
        });

        const result = calculateSingleGameweekPoints(
          userTeam,
          livePlayers,
          currentGameweek,
          {
            transfersMade,
            freeTransfers,
            chipsActive
          }
        );

        console.log('✅ Points calculation complete:', {
          totalPoints: result.byGW[0]?.gwPoints,
          captainPoints: result.byGW[0]?.captainFinal,
          autoSubs: result.byGW[0]?.autosubsApplied?.length || 0
        });

        setCalculationResult(result);
      } catch (error) {
        console.error('❌ Points calculation failed:', error);
        setCalculationError(error instanceof Error ? error.message : 'Calculation failed');
        setCalculationResult(null);
      } finally {
        setIsCalculating(false);
      }
    };

    calculatePoints();
  }, [userTeam, currentGameweek, livePlayers, transfersMade, freeTransfers, chipsActive]);

  // Extract key metrics from calculation result
  const pointsData = useMemo(() => {
    if (!calculationResult?.byGW?.[0]) return null;

    const gwResult = calculationResult.byGW[0];
    
    return {
      totalPoints: gwResult.gwPoints,
      captainInfo: {
        playerId: gwResult.captainFinal.playerId,
        multiplier: gwResult.captainFinal.multiplier,
        points: gwResult.captainFinal.points
      },
      autoSubs: gwResult.autosubsApplied || [],
      benchPoints: gwResult.benchPointsCounted || [],
      transferHits: gwResult.transferHitPoints,
      chipEffects: gwResult.chipEffects,
      auditLog: gwResult.auditLog || []
    };
  }, [calculationResult]);

  return {
    pointsData,
    calculationResult,
    isCalculating,
    calculationError,
    hasValidTeam: !!userTeam && userTeam.startingXI.length === 11,
    hasValidGameweek: !!currentGameweek
  };
}

// Helper function to determine formation string from starting XI
function getFormationString(startingXI: any[]): string {
  const positions = { GKP: 0, DEF: 0, MID: 0, FWD: 0 };
  
  startingXI.forEach(player => {
    const pos = player.element_type_name || player.pos;
    if (pos && positions.hasOwnProperty(pos)) {
      positions[pos as keyof typeof positions]++;
    }
  });

  return `${positions.DEF}-${positions.MID}-${positions.FWD}`;
}