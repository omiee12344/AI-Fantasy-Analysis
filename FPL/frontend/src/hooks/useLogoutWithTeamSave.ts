import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Global event system for team saving before logout
let teamSaveBeforeLogout: (() => Promise<void>) | null = null;

export const setTeamSaveBeforeLogout = (callback: () => Promise<void>) => {
  teamSaveBeforeLogout = callback;
};

export const useLogoutWithTeamSave = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    try {
      // If there's a team save function registered, call it first
      if (teamSaveBeforeLogout) {
        await teamSaveBeforeLogout();
      }
      
      // Proceed with logout
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Still proceed with logout even if team saving fails
      await logout();
      navigate('/');
    }
  }, [logout, navigate]);

  return { handleLogout };
};
