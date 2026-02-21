// Team Auto-Population Service
import { firebaseTeamService } from '@/lib/firebase-team-service';
import { convertFPLTeamToMyTeam, analyzeFPLFormation } from '@/lib/fpl-team-importer';

export interface AutoPopulationResult {
  success: boolean;
  message: string;
  teamData?: {
    playersCount: number;
    formation: string;
    captainName?: string;
    viceCaptainName?: string;
  };
}

/**
 * Auto-populates the user's MyTeam with their FPL squad data
 */
export async function autoPopulateTeamFromFPL(
  userId: string,
  fplSquad: any,
  userEmail?: string
): Promise<AutoPopulationResult> {
  try {
    console.log('🚀 Starting team auto-population for user:', userId);
    console.log('📊 FPL Squad data:', fplSquad);

    if (!fplSquad) {
      return {
        success: false,
        message: 'No FPL squad data available to import'
      };
    }

    // Convert FPL data to MyTeam format
    const { startingXI, bench, captainId, viceCaptainId } = convertFPLTeamToMyTeam(fplSquad);
    
    // Analyze formation
    const formationData = analyzeFPLFormation(startingXI);
    
    console.log('✅ Converted team data:', {
      startingXICount: startingXI.filter(s => s.player).length,
      benchCount: bench.filter(s => s.player).length,
      formation: formationData.formation,
      captainId,
      viceCaptainId
    });

    // Prepare team data for saving
    const teamData = {
      startingXI: startingXI.map(slot => ({
        id: slot.player?.id,
        name: slot.player?.name,
        pos: slot.player?.pos,
        team: slot.player?.team,
        slotId: slot.id
      })).filter(p => p.id), // Only include slots with players
      
      bench: bench.map(slot => ({
        id: slot.player?.id,
        name: slot.player?.name,
        pos: slot.player?.pos,
        team: slot.player?.team,
        slotId: slot.id
      })).filter(p => p.id), // Only include slots with players
      
      captainId,
      viceCaptainId,
      formation: formationData.formation,
      autoImported: true,
      importedAt: new Date()
    };

    console.log('💾 Saving team data to Firebase:', teamData);

    // Save team to Firebase
    await firebaseTeamService.saveTeam(userId, teamData, userEmail);

    // Get player names for success message
    const captain = startingXI.find(s => s.player?.id === captainId)?.player;
    const viceCaptain = startingXI.find(s => s.player?.id === viceCaptainId)?.player;

    const playersCount = teamData.startingXI.length + teamData.bench.length;

    console.log('🎉 Team auto-population completed successfully!');

    return {
      success: true,
      message: `🎯 Your FPL team has been imported successfully! 
        • ${playersCount} players loaded
        • Formation: ${formationData.formation}
        • Captain: ${captain?.name || 'None'}
        • Vice-Captain: ${viceCaptain?.name || 'None'}`,
      teamData: {
        playersCount,
        formation: formationData.formation,
        captainName: captain?.name,
        viceCaptainName: viceCaptain?.name
      }
    };

  } catch (error) {
    console.error('❌ Team auto-population failed:', error);
    return {
      success: false,
      message: `Failed to import FPL team: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}