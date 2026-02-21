import React from 'react';
import { useAutoFPLReconnection } from '@/hooks/useAutoFPLReconnection';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Component that handles automatic FPL team reconnection
 * Runs silently in the background when users log in
 */
export const AutoFPLReconnection: React.FC = () => {
  const { user } = useAuth();
  const { isReconnecting, reconnectionStatus, error } = useAutoFPLReconnection();

  // Only show visual feedback during reconnection for users with FPL teams
  if (!user?.profile.fplTeamId || reconnectionStatus === 'idle') {
    return null;
  }

  // Show subtle notification during reconnection
  if (isReconnecting) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-blue-900/90 backdrop-blur-sm border border-blue-700 rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2 text-sm text-blue-100">
          <div className="w-4 h-4 border-2 border-blue-300 border-t-transparent rounded-full animate-spin"></div>
          <span>Syncing FPL data...</span>
        </div>
      </div>
    );
  }

  // Success state - no visual feedback needed
  if (reconnectionStatus === 'success') {
    return null;
  }

  // Show error notification if reconnection failed
  if (reconnectionStatus === 'error' && error) {
    return (
      <div className="fixed top-4 right-4 z-50 bg-red-900/90 backdrop-blur-sm border border-red-700 rounded-lg px-4 py-2 shadow-lg">
        <div className="flex items-center gap-2 text-sm text-red-100">
          <div className="w-4 h-4 bg-red-400 rounded-full flex items-center justify-center">
            <span className="text-red-900 text-xs font-bold">!</span>
          </div>
          <span>FPL sync failed - using cached data</span>
        </div>
      </div>
    );
  }

  return null;
};