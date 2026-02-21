import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import API from '@/lib/api';
import { toast } from 'sonner';
import { firebaseTeamService, SavedTeamData } from '@/lib/firebase-team-service';

interface UseTeamPersistenceProps {
  startingXI: any[];
  bench: any[];
  captainId: number | null;
  viceCaptainId: number | null;
  formationValidation: any;
}

export const useTeamPersistence = ({
  startingXI,
  bench,
  captainId,
  viceCaptainId,
  formationValidation
}: UseTeamPersistenceProps) => {
  const { user } = useAuth();

  // Helper function to automatically save team to Firebase
  const autoSaveTeam = useCallback(async () => {
    if (!user) return;

    const startingXICount = startingXI.filter(slot => slot.player).length;
    const benchCount = bench.filter(slot => slot.player).length;
    const totalPlayers = startingXICount + benchCount;

    console.log('💾 useTeamPersistence: autoSaveTeam called');
    console.log('Starting XI slots with players:', startingXICount);
    console.log('Bench slots with players:', benchCount);
    console.log('Total players:', totalPlayers);
    console.log('Captain ID:', captainId);
    console.log('Vice Captain ID:', viceCaptainId);
    console.log('Formation:', formationValidation.formation);

    // Prevent saving completely empty teams (unless user explicitly cleared)
    if (totalPlayers === 0) {
      console.log('⚠️ Skipping auto-save: Team is empty (probably due to app restart)');
      return;
    }

    try {
      // Prepare team data for saving
      const startingXIData = startingXI
        .filter(slot => slot.player)
        .map(slot => ({
          id: slot.player!.id,
          name: slot.player!.name,
          pos: slot.player!.pos,
          team: slot.player!.team,
          slotId: slot.id
        }));

      const benchData = bench
        .filter(slot => slot.player)
        .map(slot => ({
          id: slot.player!.id,
          name: slot.player!.name,
          pos: slot.player!.pos,
          team: slot.player!.team,
          slotId: slot.id
        }));

      const teamData: SavedTeamData = {
        startingXI: startingXIData,
        bench: benchData,
        captainId,
        viceCaptainId,
        formation: formationValidation.formation,
        savedAt: new Date().toISOString()
      };

      console.log('📤 Saving team data to Firebase:', teamData);

      // Save team to Firebase Firestore
      await firebaseTeamService.saveTeam(teamData);
      console.log('✅ Team auto-saved to Firebase successfully');

      // Also keep localStorage as backup for quick access
      localStorage.setItem('fpl-myteam-backup', JSON.stringify({
        ...teamData,
        user: user.email
      }));
    } catch (error) {
      console.error('❌ Auto-save to Firebase failed:', error);
      // Fallback to localStorage if Firebase fails
      try {
        const fallbackData = {
          startingXI: startingXI.filter(slot => slot.player).map(slot => ({
            id: slot.player!.id,
            name: slot.player!.name,
            pos: slot.player!.pos,
            team: slot.player!.team,
            slotId: slot.id
          })),
          bench: bench.filter(slot => slot.player).map(slot => ({
            id: slot.player!.id,
            name: slot.player!.name,
            pos: slot.player!.pos,
            team: slot.player!.team,
            slotId: slot.id
          })),
          captainId,
          viceCaptainId,
          formation: formationValidation.formation,
          savedAt: new Date().toISOString(),
          user: user.email
        };
        localStorage.setItem('fpl-myteam-backup', JSON.stringify(fallbackData));
        console.log('✅ Team saved to localStorage as fallback');
      } catch (fallbackError) {
        console.error('❌ Fallback save also failed:', fallbackError);
      }
    }
  }, [user, startingXI, bench, captainId, viceCaptainId, formationValidation]);

  // Load saved team from Firebase
  const loadSavedTeam = useCallback(async (allPlayers: any[]) => {
    console.log('🔧 useTeamPersistence: loadSavedTeam ENTRY');
    console.log('User exists:', !!user);
    console.log('User email:', user?.email);
    console.log('All players count:', allPlayers.length);
    console.log('Has FPL Squad:', !!user?.profile.fplSquad);
    console.log('FPL Team ID:', user?.profile.fplTeamId);
    
    if (!user || !allPlayers.length) {
      console.log('❌ Early return - missing user or players');
      return null;
    }

    try {
      console.log('📡 Loading team from Firebase...');
      const savedTeamData = await firebaseTeamService.loadTeam();
      
      if (savedTeamData) {
        console.log('✅ Valid team data found in Firebase, using it');
        console.log('📡 Parsed team data from Firebase:', savedTeamData);
        console.log('📡 Team data type:', typeof savedTeamData);
        console.log('📡 Team data keys:', Object.keys(savedTeamData || {}));
        
        const { startingXI: savedStartingXI, bench: savedBench, captainId: savedCaptainId, viceCaptainId: savedViceCaptainId } = savedTeamData;
        
        console.log('📋 Parsed saved team data from Firebase:');
        console.log('- Starting XI:', savedStartingXI);
        console.log('- Bench:', savedBench);
        console.log('- Captain ID:', savedCaptainId);
        console.log('- Vice Captain ID:', savedViceCaptainId);
        
        // Return the saved team data for restoration
        return {
          startingXI: savedStartingXI,
          bench: savedBench,
          captainId: savedCaptainId,
          viceCaptainId: savedViceCaptainId
        };
      } else {
        console.log('📭 No valid manually saved team found in Firebase (null returned)');
        console.log('🔍 Checking for FPL squad data for auto-conversion...');
        
        // Check if user has FPL squad data in their profile for auto-population
        if (user.profile.fplSquad) {
          console.log('✅ FPL squad data found in user profile, converting to MyTeam format...');
          console.log('📊 FPL Squad data preview:', {
            picks_count: user.profile.fplSquad.picks?.length,
            entry_history_exists: !!user.profile.fplSquad.entry_history,
            has_automatic_subs: !!user.profile.fplSquad.automatic_subs
          });
          
          try {
            // Import the conversion function
            const { convertFPLTeamToMyTeam } = await import('@/lib/fpl-team-importer');
            const { startingXI: fplStartingXI, bench: fplBench, captainId: fplCaptainId, viceCaptainId: fplViceCaptainId } = convertFPLTeamToMyTeam(user.profile.fplSquad);
            
            // Convert to the format expected by the team restoration logic
            const convertedStartingXI = fplStartingXI
              .filter(slot => slot.player)
              .map(slot => ({
                id: slot.player!.id,
                name: slot.player!.name,
                pos: slot.player!.pos,
                team: slot.player!.team,
                slotId: slot.id
              }));
            
            const convertedBench = fplBench
              .filter(slot => slot.player)
              .map(slot => ({
                id: slot.player!.id,
                name: slot.player!.name,
                pos: slot.player!.pos,
                team: slot.player!.team,
                slotId: slot.id
              }));
            
            console.log('✅ Successfully converted FPL squad to team format');
            console.log('- Starting XI players:', convertedStartingXI.length);
            console.log('- Bench players:', convertedBench.length);
            console.log('- Captain ID:', fplCaptainId);
            console.log('- Vice-Captain ID:', fplViceCaptainId);
            
            return {
              startingXI: convertedStartingXI,
              bench: convertedBench,
              captainId: fplCaptainId,
              viceCaptainId: fplViceCaptainId
            };
          } catch (conversionError) {
            console.error('❌ Failed to convert FPL squad data:', conversionError);
          }
        }
        
        // Fallback to localStorage backup if no FPL data
        try {
          const backupData = localStorage.getItem('fpl-myteam-backup');
          if (backupData) {
            const parsedBackup = JSON.parse(backupData);
            if (parsedBackup.user === user.email) {
              console.log('📡 Using localStorage backup data');
              return {
                startingXI: parsedBackup.startingXI,
                bench: parsedBackup.bench,
                captainId: parsedBackup.captainId,
                viceCaptainId: parsedBackup.viceCaptainId
              };
            }
          }
        } catch (backupError) {
          console.error('❌ Failed to load backup data:', backupError);
        }
      }
    } catch (error) {
      console.error('❌ useTeamPersistence: Failed to load saved team from Firebase:', error);
      
      // Fallback to localStorage on error
      try {
        const backupData = localStorage.getItem('fpl-myteam-backup');
        if (backupData) {
          const parsedBackup = JSON.parse(backupData);
          if (parsedBackup.user === user.email) {
            console.log('📡 Using localStorage as fallback due to Firebase error');
            return {
              startingXI: parsedBackup.startingXI,
              bench: parsedBackup.bench,
              captainId: parsedBackup.captainId,
              viceCaptainId: parsedBackup.viceCaptainId
            };
          }
        }
      } catch (fallbackError) {
        console.error('❌ Fallback load also failed:', fallbackError);
      }
    }
    
    return null;
  }, [user]);

  // Clear saved team from Firebase
  const clearSavedTeam = useCallback(async () => {
    if (!user) return;
    
    try {
      await firebaseTeamService.clearTeam();
      localStorage.removeItem('fpl-myteam-backup');
      console.log('🗑️ Saved team cleared from Firebase and localStorage');
      toast.success('Team cleared successfully!');
    } catch (error) {
      console.error('❌ Failed to clear saved team:', error);
      toast.error('Failed to clear team');
    }
  }, [user]);

  // Save team before logout
  const saveTeamBeforeLogout = useCallback(async () => {
    if (!user) return;
    
    try {
      await autoSaveTeam();
      console.log('Team saved before logout');
    } catch (error) {
      console.error('Failed to save team before logout:', error);
    }
  }, [user, autoSaveTeam]);

  return {
    autoSaveTeam,
    loadSavedTeam,
    clearSavedTeam,
    saveTeamBeforeLogout
  };
};
