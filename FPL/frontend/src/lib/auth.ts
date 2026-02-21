import { api } from './api';

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
  fplSquad: any | null; // FPL squad data for team restoration
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
  unlockedAt: string;
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
  favouriteTeam: string | null;
  country: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response;
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/profile');
    return response;
  },

  updateProfile: async (profileData: Partial<UserProfile>): Promise<User> => {
    const response = await api.put<User>('/auth/profile', { profile: profileData });
    return response;
  }
};

export const authStorage = {
  getToken: (): string | null => {
    return localStorage.getItem('fpl-auth-token');
  },

  setToken: (token: string): void => {
    localStorage.setItem('fpl-auth-token', token);
  },

  removeToken: (): void => {
    localStorage.removeItem('fpl-auth-token');
  },

  getUser: (): User | null => {
    const userStr = localStorage.getItem('fpl-user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser: (user: User): void => {
    localStorage.setItem('fpl-user', JSON.stringify(user));
  },

  removeUser: (): void => {
    localStorage.removeItem('fpl-user');
  }
};