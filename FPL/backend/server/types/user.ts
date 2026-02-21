export interface User {
  id: string;
  email: string;
  password: string;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  teamName: string;
  favouriteTeam?: string;
  country?: string;
  region?: string;
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
  leagues: League[];
  achievements: Achievement[];
  avatar?: string;
  bio?: string;
  savedTeam?: SavedTeam;
}

export interface SavedTeam {
  startingXI: SavedPlayer[];
  bench: SavedPlayer[];
  captainId?: number;
  viceCaptainId?: number;
  formation: string;
  savedAt: Date;
}

export interface SavedPlayer {
  id: number;
  name: string;
  pos: 'GKP' | 'DEF' | 'MID' | 'FWD';
  team: string;
  slotId: string;
}

export interface League {
  id: string;
  name: string;
  type: 'classic' | 'head-to-head';
  position: number;
  totalPlayers: number;
  isAdmin: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  category: 'points' | 'rank' | 'transfers' | 'streak' | 'special';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  teamName: string;
  favouriteTeam?: string;
  country?: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}