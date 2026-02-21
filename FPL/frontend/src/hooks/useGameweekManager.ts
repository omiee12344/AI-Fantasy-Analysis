import { useState, useEffect, useCallback, useRef } from 'react';
import API from '@/lib/api';
import { 
  GameweekRefreshManager, 
  GameweekStatus, 
  analyzeGameweekCompletion,
  getGameweekDateRange,
  getMatchProgress,
  formatDeadlineLocal,
  type FPLEvent,
  type FPLFixture
} from '@/lib/gameweek-manager';

export interface ComprehensiveGameweekData {
  currentGameweek: {
    id: number;
    name: string;
    deadline_time: string;
    deadline_time_epoch: number;
    finished: boolean;
    is_current: boolean;
  };
  fixtures: FPLFixture[];
  completion: {
    isComplete: boolean;
    completedCount: number;
    totalCount: number;
  };
  dateRange: {
    start: string;
    end: string;
  } | null;
  teams: Record<string, {
    id: number;
    name: string;
    short_name: string;
  }>;
  events: FPLEvent[];
}

export interface GameweekDisplayData {
  title: string;
  dateRange: string;
  deadline: string;
  matchProgress: string;
  isComplete: boolean;
}

export function useGameweekManager() {
  const [gameweekData, setGameweekData] = useState<ComprehensiveGameweekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshManagerRef = useRef<GameweekRefreshManager | null>(null);

  // Fetch comprehensive gameweek data
  const fetchGameweekData = useCallback(async () => {
    try {
      setError(null);
      const data = await API.comprehensiveGameweek();
      setGameweekData(data);
      console.log('🎯 Fixtures-first gameweek loaded:', {
        gwId: data.currentGameweek.id,
        fixturesTotalCount: data.fixtures.length,
        completedCount: data.completion.completedCount,
        isComplete: data.completion.isComplete,
        dateRange: data.dateRange
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch gameweek data';
      setError(errorMsg);
      console.error('❌ Failed to fetch comprehensive gameweek data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize and setup refresh manager
  useEffect(() => {
    // Initial load
    fetchGameweekData();

    // Setup refresh manager for auto-updates
    refreshManagerRef.current = new GameweekRefreshManager(fetchGameweekData);
    refreshManagerRef.current.start();

    // Cleanup on unmount
    return () => {
      if (refreshManagerRef.current) {
        refreshManagerRef.current.stop();
      }
    };
  }, [fetchGameweekData]);

  // Manual refresh function
  const refreshGameweek = useCallback(async () => {
    console.log('🔄 Manual comprehensive gameweek refresh');
    await fetchGameweekData();
  }, [fetchGameweekData]);

  // Get display data for UI components
  const getDisplayData = useCallback((): GameweekDisplayData => {
    if (!gameweekData) {
      return {
        title: 'Loading...',
        dateRange: '',
        deadline: '',
        matchProgress: '',
        isComplete: false
      };
    }

    const gwStatus: GameweekStatus = {
      gwId: gameweekData.currentGameweek.id,
      isComplete: gameweekData.completion.isComplete,
      completedCount: gameweekData.completion.completedCount,
      totalCount: gameweekData.completion.totalCount,
      fixtures: gameweekData.fixtures,
      dateRange: gameweekData.dateRange ? {
        start: new Date(gameweekData.dateRange.start),
        end: new Date(gameweekData.dateRange.end),
        startLocal: new Date(gameweekData.dateRange.start).toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        endLocal: new Date(gameweekData.dateRange.end).toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      } : null
    };

    return {
      title: gameweekData.currentGameweek.name,
      dateRange: getGameweekDateRange(gwStatus),
      deadline: formatDeadlineLocal(gameweekData.currentGameweek.deadline_time),
      matchProgress: getMatchProgress(gwStatus),
      isComplete: gameweekData.completion.isComplete
    };
  }, [gameweekData]);

  // Get current gameweek fixtures
  const getCurrentFixtures = useCallback(() => {
    return gameweekData?.fixtures || [];
  }, [gameweekData]);

  // Get all events data
  const getAllEvents = useCallback(() => {
    return gameweekData?.events || [];
  }, [gameweekData]);

  // Check if specific gameweek is complete
  const isGameweekComplete = useCallback((gwId: number) => {
    if (!gameweekData) return false;
    
    const event = gameweekData.events.find(e => e.id === gwId);
    if (!event) return false;

    // For current gameweek, use the completion data
    if (gwId === gameweekData.currentGameweek.id) {
      return gameweekData.completion.isComplete;
    }

    // For other gameweeks, check the event finished flag
    return event.finished;
  }, [gameweekData]);

  return {
    gameweekData,
    displayData: getDisplayData(),
    currentFixtures: getCurrentFixtures(),
    allEvents: getAllEvents(),
    loading,
    error,
    refreshGameweek,
    isGameweekComplete
  };
}