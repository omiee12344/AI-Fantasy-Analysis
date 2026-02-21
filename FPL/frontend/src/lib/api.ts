// src/lib/api.ts

// Default to the Vite proxy base ("/api"). If you host elsewhere, set VITE_API_URL to that full base (e.g. "http://localhost:3000/api").
const DEFAULT_BASE = (import.meta.env.VITE_API_URL as string) || "/api";

export function apiBase() {
  return DEFAULT_BASE.replace(/\/$/, "");
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  // IMPORTANT: pass paths WITHOUT the "/api" prefix here (e.g. "/players", "/fpl/opponents/current").
  const headers: Record<string, string> = { 
    "Content-Type": "application/json" 
  };
  
  // Add custom headers if provided
  if (init?.headers) {
    if (typeof init.headers === 'object' && !Array.isArray(init.headers)) {
      Object.assign(headers, init.headers);
    }
  }

  // Add Firebase auth token if available
  try {
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn('Failed to get Firebase auth token:', error);
  }

  const res = await fetch(`${apiBase()}${path}`, {
    headers,
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

/** Types */
export type LivePlayer = {
  id: number;
  name: string;
  full_name?: string;
  pos: "GKP" | "DEF" | "MID" | "FWD";
  team: string;
  nextFixture?: string; // Opponent info like "WHU (A)"
  status: "available" | "yellow" | "red" | string;
  now_cost?: number;
  form?: string;
  points_per_game?: string;
  selected_by_percent?: string;
  minutes?: number;
  total_points?: number;
  event_points?: number; // Current gameweek points
};

export type PlayerMeta = { price?: number; form?: string; ppm?: string; tsb?: string };
export type PlayerFixture = { gw: number; opponentShort: string; home: boolean; difficulty?: 1 | 2 | 3 | 4 | 5 };
export type Pos = "GKP" | "DEF" | "MID" | "FWD";

export type LivePoints = {
  totalPoints: number;
  minutes: number;
  goals: number;
  assists: number;
  bonus: number;
  isPlaying: boolean;
};

export type LiveMatchData = {
  started: boolean;
  finished: boolean;
  minutes: number;
  fixtureId: number;
  isHome: boolean;
  livePoints?: LivePoints | null;
};

export type TeamPlayer = {
  id: number;
  name: string;
  pos: "GKP" | "DEF" | "MID" | "FWD";
  team: string;
  nextFixture: string;
  status: "available" | "yellow" | "red";
  kitCandidates: string[];
  is_captain?: boolean;
  is_vice_captain?: boolean;
  multiplier?: number;
  position?: number;
  gameweekPoints?: number; // Points scored in current gameweek
  liveMatch?: LiveMatchData | null;
};

export type TeamSquad = {
  GKP: TeamPlayer[];
  DEF: TeamPlayer[];
  MID: TeamPlayer[];
  FWD: TeamPlayer[];
};

export type GameweekInfo = {
  id: number;
  name: string;
  deadlineTime: string;
  deadlineEpoch: number;
  finished: boolean;
  isCurrent: boolean;
  isNext: boolean;
};

/** Client */
const API = {
  // Health (optional)
  health: () => http<{ ok?: boolean; success?: boolean; time?: string }>("/health"),

  // Players (LIVE)
  players: () => http<{ players: LivePlayer[]; events?: any[] }>("/players"),
   playersByPos: (pos: Pos) =>
    http<{ players: LivePlayer[] }>(`/players?pos=${encodeURIComponent(pos.toUpperCase() as Pos)}`),

  // Player details (LIVE)
  playerMeta: (id: number) => http<PlayerMeta>(`/players/${id}/meta`),
  playerStats: (id: number) => http<any>(`/players/${id}/stats`),
  playerFixtures: (id: number) => http<{ fixtures: PlayerFixture[] }>(`/players/${id}/fixtures`),
  playerHistory: (id: number) => http<{ gameweekHistory: any[], upcomingFixtures: any[], currentGW: number, previousGW: number }>(`/players/${id}/history`),

  // Gameweek data
  currentGameweek: () => http<{ 
    id: number, 
    name: string, 
    deadline_time: string, 
    deadline_time_epoch: number, 
    finished: boolean, 
    is_current: boolean, 
    is_next: boolean,
    next_gameweek?: {
      id: number,
      name: string,
      deadline_time: string,
      deadline_time_epoch: number
    }
  }>(`/gameweek/current`),
  
  // Comprehensive gameweek data with fixtures-first logic
  comprehensiveGameweek: () => http<{
    currentGameweek: {
      id: number;
      name: string;
      deadline_time: string;
      deadline_time_epoch: number;
      finished: boolean;
      is_current: boolean;
    };
    fixtures: Array<{
      id: number;
      event: number;
      kickoff_time: string;
      team_h: number;
      team_a: number;
      team_h_score: number | null;
      team_a_score: number | null;
      finished: boolean;
      started: boolean;
      status: string;
      minutes: number;
    }>;
    completion: {
      isComplete: boolean;
      completedCount: number;
      totalCount: number;
    };
    dateRange: {
      start: string;
      end: string;
    } | null;
    teams: Record<string, {
      id: number;
      name: string;
      short_name: string;
    }>;
    events: Array<{
      id: number;
      name: string;
      deadline_time: string;
      deadline_time_epoch: number;
      finished: boolean;
      is_current: boolean;
      is_next: boolean;
    }>;
  }>(`/gameweek/comprehensive`),

  // Team data (LIVE)
  team: (userId: number) => http<{ 
    squad: TeamSquad; 
    gameweek: number; 
    actualGameweek: number;
    currentGameweekStatus: string;
    gameweekInfo: GameweekInfo;
    entry_history?: any; 
    automatic_subs?: any[];
    lastUpdated: string;
  }>(`/team/${userId}`),

  // Opponent label map for current/next GW (LIVE) — make sure this route exists and is mounted
  opponentsMap: () => http<{ map: Record<string, string>; gw?: number }>(`/fpl/opponents/current`),

  // Fixtures for specific gameweek
  fixtures: (gameweek: number) => http<{ 
    fixtures: Array<{
      id: number;
      gameweek: number;
      homeTeam: { id: number; name: string; shortName: string };
      awayTeam: { id: number; name: string; shortName: string };
      homeScore: number | null;
      awayScore: number | null;
      status: string;
      kickoffTime: string;
      finished: boolean;
      started: boolean;
    }>;
    gameweek: number;
    currentGameweek: number;
    timestamp: string;
  }>(`/fixtures/${gameweek}`),

  // Premier League table
  table: () => http<{
    standings: Array<{
      position: number;
      shortName: string;
      name: string;
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDifference: number;
      points: number;
    }>;
    lastUpdated: string;
  }>(`/fpl/table`),

  // Save team data
  saveTeam: (teamData: {
    startingXI: Array<{
      id: number;
      name: string;
      pos: Pos;
      team: string;
      slotId: string;
    }>;
    bench: Array<{
      id: number;
      name: string;
      pos: Pos;
      team: string;
      slotId: string;
    }>;
    captainId?: number;
    viceCaptainId?: number;
    formation: string;
  }) => http<{
    success: boolean;
    message: string;
    savedAt: string;
  }>(`/team/save`, {
    method: 'POST',
    body: JSON.stringify(teamData)
  }),

  // Get saved team data
  getSavedTeam: () => http<{
    savedTeam: {
      startingXI: Array<{
        id: number;
        name: string;
        pos: Pos;
        team: string;
        slotId: string;
      }>;
      bench: Array<{
        id: number;
        name: string;
        pos: Pos;
        team: string;
        slotId: string;
      }>;
      captainId?: number;
      viceCaptainId?: number;
      formation: string;
      savedAt: string;
    } | null;
  }>(`/team/saved`),

  // AI Overview
  aiOverview: (userId: number) => http<{
    success: boolean;
    gameweek: number;
    analysis: {
      overview: string;
      suggestedTransfers: Array<{
        action: 'transfer_in' | 'transfer_out';
        playerId: number;
        playerName: string;
        reason: string;
        priority: 'high' | 'medium' | 'low';
      }>;
      bestPerforming: Array<{
        playerId: number;
        playerName: string;
        pos: string;
        performance: string;
        points: number;
        trend: 'rising' | 'falling' | 'stable';
      }>;
      strategyAdvice: {
        recommendation: string;
        boostSuggestion: 'wildcard' | 'bench_boost' | 'triple_captain' | 'free_hit' | null;
        reasoning: string;
        confidence: number;
      };
      predictedPoints: {
        nextGameweek: number;
        confidence: number;
        breakdown: {
          startingXI: number;
          captain: number;
          viceCaptain: number;
          bench: number;
        };
      };
      predictedRank: {
        estimated: number;
        change: number;
        confidence: number;
      };
    };
    generatedAt: string;
  }>(`/ai-overview/${userId}`),
};

// Export http function for auth API
export const api = {
  get: <T>(path: string) => http<T>(path, { method: 'GET' }),
  post: <T>(path: string, data?: any) => http<T>(path, { 
    method: 'POST', 
    body: data ? JSON.stringify(data) : undefined 
  }),
  put: <T>(path: string, data?: any) => http<T>(path, { 
    method: 'PUT', 
    body: data ? JSON.stringify(data) : undefined 
  }),
  delete: <T>(path: string) => http<T>(path, { method: 'DELETE' })
};

export default API;
