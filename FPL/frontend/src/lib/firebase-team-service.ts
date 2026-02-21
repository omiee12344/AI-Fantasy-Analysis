import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { toast } from "sonner";

// Team data structure that matches MyTeam page
export interface SavedTeamData {
  startingXI: Array<{
    id: number;
    name: string;
    pos: "GKP" | "DEF" | "MID" | "FWD";
    team: string;
    slotId: string;
  }>;
  bench: Array<{
    id: number;
    name: string;
    pos: "GKP" | "DEF" | "MID" | "FWD";
    team: string;
    slotId: string;
  }>;
  captainId?: number | null;
  viceCaptainId?: number | null;
  formation: string;
  savedAt: string;
  gameweek?: number;
}

export interface UserProfileData {
  firstName: string;
  lastName: string;
  teamName: string;
  favouriteTeam?: string | null;
  country?: string | null;
  region?: string | null;
  totalPoints: number;
  overallRank: number;
  gameweekRank: number;
  gameweekPoints: number;
  teamValue: number;
  bank: number;
  freeTransfers: number;
  wildcardsUsed: number;
  benchBoostsUsed: number;
  tripleCaptainsUsed: number;
  freeHitUsed: number;
  joinedGameweek: number;
  currentGameweek: number;
  leagues: Array<{
    id: string;
    name: string;
    type: 'classic' | 'head-to-head';
    position: number;
    totalPlayers: number;
    isAdmin: boolean;
  }>;
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt: Date;
    category: string;
  }>;
  avatar?: string | null;
  bio?: string | null;
  savedTeam?: SavedTeamData;
}

export interface FirebaseUserData {
  id: string;
  email: string;
  profile: UserProfileData;
  createdAt: string;
  updatedAt: string;
}

export const firebaseTeamService = {
  /**
   * Save user's team data to Firebase
   */
  saveTeam: async (teamData: SavedTeamData): Promise<void> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      let userData: FirebaseUserData;
      
      if (userDoc.exists()) {
        // Update existing user with team data
        userData = userDoc.data() as FirebaseUserData;
        userData.profile.savedTeam = teamData;
        userData.updatedAt = new Date().toISOString();
        
        await updateDoc(userRef, {
          'profile.savedTeam': teamData,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new user profile with team data
        const profile: UserProfileData = {
          firstName: currentUser.displayName?.split(' ')[0] || 'User',
          lastName: currentUser.displayName?.split(' ').slice(1).join(' ') || '',
          teamName: `${currentUser.displayName || currentUser.email}'s Team`,
          favouriteTeam: null,
          country: null,
          region: null,
          totalPoints: 0,
          overallRank: 0,
          gameweekRank: 0,
          gameweekPoints: 0,
          teamValue: 100.0,
          bank: 0.0,
          freeTransfers: 1,
          wildcardsUsed: 0,
          benchBoostsUsed: 0,
          tripleCaptainsUsed: 0,
          freeHitUsed: 0,
          joinedGameweek: 1,
          currentGameweek: 1,
          leagues: [
            {
              id: 'overall',
              name: 'Overall',
              type: 'classic',
              position: 0,
              totalPlayers: 10000000,
              isAdmin: false
            }
          ],
          achievements: [
            {
              id: 'welcome',
              name: 'Welcome to FPL!',
              description: 'Successfully created your FPL account',
              icon: '🎉',
              unlockedAt: new Date(),
              category: 'special'
            }
          ],
          savedTeam: teamData
        };

        userData = {
          id: currentUser.uid,
          email: currentUser.email || '',
          profile,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await setDoc(userRef, userData);
      }

      console.log('✅ Team saved to Firebase successfully');
      
    } catch (error) {
      console.error('❌ Failed to save team to Firebase:', error);
      throw error;
    }
  },

  /**
   * Load user's saved team from Firebase
   */
  loadTeam: async (): Promise<SavedTeamData | null> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No authenticated user');
        return null;
      }

      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data() as FirebaseUserData;
        
        if (userData.profile?.savedTeam) {
          console.log('✅ Team loaded from Firebase successfully:', userData.profile.savedTeam);
          console.log('🔍 Firebase team data type:', typeof userData.profile.savedTeam);
          console.log('🔍 Firebase team data structure:', userData.profile.savedTeam);
          
          // Check if this is actual team data or just a user ID/corrupted data
          if (typeof userData.profile.savedTeam === 'string') {
            console.log('❌ Firebase contains corrupted string data, clearing it and returning null');
            // Clear the corrupted data
            await this.clearTeam();
            return null;
          }
          
          // Validate the team data structure
          if (!userData.profile.savedTeam.startingXI || !userData.profile.savedTeam.bench) {
            console.log('❌ Firebase contains invalid team data structure, clearing it');
            await this.clearTeam();
            return null;
          }
          
          return userData.profile.savedTeam;
        } else {
          console.log('📭 No saved team found in Firebase');
          return null;
        }
      } else {
        console.log('📭 User document not found in Firebase');
        return null;
      }
      
    } catch (error) {
      console.error('❌ Failed to load team from Firebase:', error);
      throw error;
    }
  },

  /**
   * Update user profile data
   */
  updateProfile: async (profileUpdates: Partial<UserProfileData>): Promise<void> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const userRef = doc(db, "users", currentUser.uid);
      const updateData: any = {};
      
      // Flatten profile updates for Firestore
      Object.entries(profileUpdates).forEach(([key, value]) => {
        updateData[`profile.${key}`] = value;
      });
      
      updateData.updatedAt = new Date().toISOString();

      await updateDoc(userRef, updateData);
      console.log('✅ Profile updated in Firebase successfully');
      
    } catch (error) {
      console.error('❌ Failed to update profile in Firebase:', error);
      throw error;
    }
  },

  /**
   * Get user profile data
   */
  getUserProfile: async (): Promise<FirebaseUserData | null> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return null;
      }

      const userRef = doc(db, "users", currentUser.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as FirebaseUserData;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to get user profile from Firebase:', error);
      throw error;
    }
  },

  /**
   * Clear saved team from Firebase
   */
  clearTeam: async (): Promise<void> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const userRef = doc(db, "users", currentUser.uid);
      
      await updateDoc(userRef, {
        'profile.savedTeam': null,
        updatedAt: new Date().toISOString()
      });

      console.log('✅ Team cleared from Firebase successfully');
      
    } catch (error) {
      console.error('❌ Failed to clear team from Firebase:', error);
      throw error;
    }
  }
};