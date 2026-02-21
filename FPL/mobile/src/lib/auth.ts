import { getItem, removeItem, setItem, getJson, setJson } from "./storage";

export interface User {
  id: string;
  email: string;
  profile: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  teamName: string;
  favouriteTeam: string | null;
  country: string | null;
  region: string | null;
  fplTeamId: string | null;
  fplSquad: any | null;
  totalPoints: number;
  overallRank: number;
  gameweekRank: number;
  gameweekPoints: number;
  teamValue: number;
  bank: number;
  freeTransfers: number;
  transferCost: number;
  pointsOnBench: number;
  autoSubsCount: number;
  wildcardsUsed: number;
  benchBoostsUsed: number;
  tripleCaptainsUsed: number;
  freeHitUsed: number;
  joinedGameweek: number;
  currentGameweek: number;
  leagues: League[];
  achievements: Achievement[];
  avatar: string | null;
  bio: string | null;
}

export interface League {
  id: string;
  name: string;
  type: "classic" | "head-to-head";
  position: number;
  totalPlayers: number;
  isAdmin: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: "points" | "rank" | "transfers" | "streak" | "special";
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
  favouriteTeam: string | null;
  country: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

const TOKEN_KEY = "fpl-auth-token";
const USER_KEY = "fpl-user";
const USER_FALLBACK_KEY = "fpl-user-fallback";

export const authStorage = {
  getToken: () => getItem(TOKEN_KEY),
  setToken: (token: string) => setItem(TOKEN_KEY, token),
  removeToken: () => removeItem(TOKEN_KEY),

  getUser: () => getJson<User>(USER_KEY),
  setUser: (user: User) => setJson(USER_KEY, user),
  removeUser: () => removeItem(USER_KEY),

  getFallbackUser: () => getJson<User>(USER_FALLBACK_KEY),
  setFallbackUser: (user: User) => setJson(USER_FALLBACK_KEY, user),
  removeFallbackUser: () => removeItem(USER_FALLBACK_KEY),
};

