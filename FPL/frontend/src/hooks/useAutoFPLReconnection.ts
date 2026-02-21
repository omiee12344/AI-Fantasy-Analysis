import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firebaseTeamService } from '@/lib/firebase-team-service';

interface AutoFPLReconnectionState {
  isReconnecting: boolean;
  reconnectionStatus: 'idle' | 'checking' | 'reconnecting' | 'success' | 'error';
  lastReconnection: string | null;
  error: string | null;
}

/**
 * Hook to automatically reconnect user's FPL team when they log in
 * This eliminates the need for users to manually connect their FPL team every time
 */
export function useAutoFPLReconnection() {
  const { user, updateProfile } = useAuth();
  const [state, setState] = useState<AutoFPLReconnectionState>({
    isReconnecting: false,
    reconnectionStatus: 'idle',
    lastReconnection: null,
    error: null,
  });

  useEffect(() => {
    const performAutoReconnection = async () => {
      // Only proceed if user is logged in and has a stored FPL Team ID
      if (!user?.profile.fplTeamId) {
        console.log('🔍 Auto-reconnection: No FPL Team ID found for user');
        return;
      }

      // Skip if we've already reconnected recently (within last 5 minutes)
      const lastReconnectionTime = localStorage.getItem(`fpl_last_reconnection_${user.id}`);
      if (lastReconnectionTime) {
        const timeSince = Date.now() - parseInt(lastReconnectionTime);
        const fiveMinutes = 5 * 60 * 1000;
        if (timeSince < fiveMinutes) {
          console.log('🔍 Auto-reconnection: Skipping - recently reconnected');
          return;
        }
      }

      console.log(`🔄 Auto-reconnection: Starting for FPL Team #${user.profile.fplTeamId}`);
      
      setState(prev => ({
        ...prev,
        isReconnecting: true,
        reconnectionStatus: 'checking',
        error: null,
      }));

      try {
        // Fetch fresh FPL data from the backend
        console.log('📡 Fetching fresh FPL data...');
        const response = await fetch(`http://localhost:3007/api/team/${user.profile.fplTeamId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch FPL data: ${response.status} ${response.statusText}`);
        }

        const fplData = await response.json();
        console.log('✅ Fresh FPL data retrieved:', {
          teamName: fplData.team?.name,
          totalPoints: fplData.team?.summary_overall_points,
          currentGameweek: fplData.team?.current_event,
        });

        setState(prev => ({
          ...prev,
          reconnectionStatus: 'reconnecting',
        }));

        // Update user profile with fresh FPL data
        const updatedProfile = {
          ...user.profile,
          fplSquad: fplData.squad, // Store squad data for team restoration
          totalPoints: fplData.team?.summary_overall_points || user.profile.totalPoints,
          gameweekPoints: fplData.team?.summary_event_points || user.profile.gameweekPoints,
          overallRank: fplData.team?.summary_overall_rank || user.profile.overallRank,
          gameweekRank: fplData.team?.summary_event_rank || user.profile.gameweekRank,
          teamValue: fplData.team?.value ? fplData.team.value / 10 : user.profile.teamValue, // Convert to millions
          bank: fplData.team?.bank ? fplData.team.bank / 10 : user.profile.bank, // Convert to millions
          freeTransfers: fplData.team?.transfers?.free || user.profile.freeTransfers,
          transferCost: fplData.team?.transfers?.cost || user.profile.transferCost,
          currentGameweek: fplData.team?.current_event || user.profile.currentGameweek,
          pointsOnBench: fplData.team?.points_on_bench || user.profile.pointsOnBench,
          // Add chips data if available
          wildcardsUsed: fplData.team?.wildcards_used || user.profile.wildcardsUsed,
          benchBoostsUsed: fplData.team?.bench_boost_used || user.profile.benchBoostsUsed,
          tripleCaptainsUsed: fplData.team?.triple_captain_used || user.profile.tripleCaptainsUsed,
          freeHitUsed: fplData.team?.free_hit_used || user.profile.freeHitUsed,
        };

        // Update profile in Firebase
        await updateProfile(updatedProfile);
        console.log('✅ Profile updated with fresh FPL data');

        // Store timestamp of successful reconnection
        localStorage.setItem(`fpl_last_reconnection_${user.id}`, Date.now().toString());

        setState(prev => ({
          ...prev,
          isReconnecting: false,
          reconnectionStatus: 'success',
          lastReconnection: new Date().toISOString(),
        }));

        console.log('🎉 Auto-reconnection completed successfully');

      } catch (error) {
        console.error('❌ Auto-reconnection failed:', error);
        
        setState(prev => ({
          ...prev,
          isReconnecting: false,
          reconnectionStatus: 'error',
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        }));

        // Don't block the user, just log the error
        // The app will still work with cached data
      }
    };

    // Trigger auto-reconnection when user logs in and has FPL team ID
    if (user?.profile.fplTeamId && state.reconnectionStatus === 'idle') {
      performAutoReconnection();
    }
  }, [user, updateProfile, state.reconnectionStatus]);

  return {
    ...state,
    // Helper method to manually trigger reconnection
    triggerReconnection: () => {
      setState(prev => ({ ...prev, reconnectionStatus: 'idle' }));
    },
  };
}