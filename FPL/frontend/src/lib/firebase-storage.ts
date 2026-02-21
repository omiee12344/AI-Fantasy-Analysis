import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc,
  deleteDoc,
  orderBy,
  limit
} from "firebase/firestore";
import { db } from "./firebase";

// Team management
export interface UserTeam {
  id: string;
  userId: string;
  gameweek: number;
  players: string[]; // Player IDs
  captain: string;
  viceCaptain: string;
  formation: string;
  bench: string[];
  transfers: Transfer[];
  createdAt: string;
  updatedAt: string;
}

export interface Transfer {
  id: string;
  playerOut: string;
  playerIn: string;
  gameweek: number;
  timestamp: string;
}

export interface PlayerData {
  id: string;
  name: string;
  team: string;
  position: string;
  price: number;
  totalPoints: number;
  gameweekPoints: number;
  form: number;
  selectedBy: number;
  lastUpdated: string;
}

// Firebase Storage API
export const firebaseStorage = {
  // User team management
  saveUserTeam: async (userId: string, team: Omit<UserTeam, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    try {
      const teamRef = doc(collection(db, "userTeams"));
      const newTeam: UserTeam = {
        ...team,
        id: teamRef.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(teamRef, newTeam);
      return teamRef.id;
    } catch (error) {
      console.error("Error saving user team:", error);
      throw error;
    }
  },

  getUserTeam: async (userId: string, gameweek: number): Promise<UserTeam | null> => {
    try {
      const teamsRef = collection(db, "userTeams");
      const q = query(
        teamsRef, 
        where("userId", "==", userId),
        where("gameweek", "==", gameweek)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const teamDoc = querySnapshot.docs[0];
        return teamDoc.data() as UserTeam;
      }
      return null;
    } catch (error) {
      console.error("Error getting user team:", error);
      throw error;
    }
  },

  updateUserTeam: async (teamId: string, updates: Partial<UserTeam>): Promise<void> => {
    try {
      const teamRef = doc(db, "userTeams", teamId);
      await updateDoc(teamRef, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating user team:", error);
      throw error;
    }
  },

  // Player data management
  savePlayerData: async (playerData: Omit<PlayerData, 'lastUpdated'>): Promise<void> => {
    try {
      const playerRef = doc(db, "players", playerData.id);
      await setDoc(playerRef, {
        ...playerData,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error saving player data:", error);
      throw error;
    }
  },

  getPlayerData: async (playerId: string): Promise<PlayerData | null> => {
    try {
      const playerRef = doc(db, "players", playerId);
      const playerDoc = await getDoc(playerRef);
      
      if (playerDoc.exists()) {
        return playerDoc.data() as PlayerData;
      }
      return null;
    } catch (error) {
      console.error("Error getting player data:", error);
      throw error;
    }
  },

  getPlayersByTeam: async (team: string): Promise<PlayerData[]> => {
    try {
      const playersRef = collection(db, "players");
      const q = query(playersRef, where("team", "==", team));
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => doc.data() as PlayerData);
    } catch (error) {
      console.error("Error getting players by team:", error);
      throw error;
    }
  },

  getTopPlayers: async (position?: string, limit: number = 50): Promise<PlayerData[]> => {
    try {
      const playersRef = collection(db, "players");
      let q = query(playersRef, orderBy("totalPoints", "desc"), limit(limit));
      
      if (position) {
        q = query(playersRef, where("position", "==", position), orderBy("totalPoints", "desc"), limit(limit));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as PlayerData);
    } catch (error) {
      console.error("Error getting top players:", error);
      throw error;
    }
  },

  // Transfer history
  saveTransfer: async (transfer: Omit<Transfer, 'id' | 'timestamp'>): Promise<string> => {
    try {
      const transferRef = doc(collection(db, "transfers"));
      const newTransfer: Transfer = {
        ...transfer,
        id: transferRef.id,
        timestamp: new Date().toISOString()
      };
      
      await setDoc(transferRef, newTransfer);
      return transferRef.id;
    } catch (error) {
      console.error("Error saving transfer:", error);
      throw error;
    }
  },

  getUserTransfers: async (userId: string, gameweek?: number): Promise<Transfer[]> => {
    try {
      const transfersRef = collection(db, "transfers");
      let q = query(transfersRef, where("userId", "==", userId));
      
      if (gameweek) {
        q = query(transfersRef, where("userId", "==", userId), where("gameweek", "==", gameweek));
      }
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as Transfer);
    } catch (error) {
      console.error("Error getting user transfers:", error);
      throw error;
    }
  },

  // League management
  createLeague: async (leagueData: {
    name: string;
    type: 'classic' | 'head-to-head';
    adminId: string;
    password?: string;
  }): Promise<string> => {
    try {
      const leagueRef = doc(collection(db, "leagues"));
      const newLeague = {
        id: leagueRef.id,
        ...leagueData,
        members: [leagueData.adminId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(leagueRef, newLeague);
      return leagueRef.id;
    } catch (error) {
      console.error("Error creating league:", error);
      throw error;
    }
  },

  joinLeague: async (leagueId: string, userId: string): Promise<void> => {
    try {
      const leagueRef = doc(db, "leagues", leagueId);
      const leagueDoc = await getDoc(leagueRef);
      
      if (leagueDoc.exists()) {
        const league = leagueDoc.data();
        if (!league.members.includes(userId)) {
          await updateDoc(leagueRef, {
            members: [...league.members, userId],
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error("Error joining league:", error);
      throw error;
    }
  }
};
