import { User, UserProfile } from '../types/user';

// In-memory user store (in production, this would be a database)
const users: User[] = [];

const createDefaultProfile = (firstName: string, lastName: string, teamName: string, favouriteTeam?: string): UserProfile => ({
  firstName,
  lastName,
  teamName,
  favouriteTeam,
  country: undefined,
  region: undefined,
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
  bio: undefined
});

export const userStore = {
  findByEmail: (email: string): User | undefined => {
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
  },

  findById: (id: string): User | undefined => {
    return users.find(user => user.id === id);
  },

  create: (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> | (Omit<User, 'createdAt' | 'updatedAt'> & { id: string })): User => {
    const now = new Date();
    const user: User = {
      id: 'id' in userData ? userData.id : generateId(),
      ...userData,
      createdAt: now,
      updatedAt: now
    };
    users.push(user);
    return user;
  },

  update: (id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | null => {
    const userIndex = users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;
    
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date()
    };
    return users[userIndex];
  },

  createDefaultProfile
};

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}