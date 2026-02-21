// Mobile API client (React Native / Expo)
import { authStorage } from "./auth";
import { auth } from "./firebase";

const DEFAULT_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api";

export function apiBase() {
  return DEFAULT_BASE.replace(/\/$/, "");
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (init?.headers && typeof init.headers === "object" && !Array.isArray(init.headers)) {
    Object.assign(headers, init.headers as Record<string, string>);
  }

  // Prefer Firebase token if available, otherwise fall back to stored token.
  try {
    if (auth.currentUser) {
      const token = await auth.currentUser.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    } else {
      const token = await authStorage.getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore
  }

  const res = await fetch(`${apiBase()}${path}`, {
    headers,
    ...init,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export type Pos = "GKP" | "DEF" | "MID" | "FWD";

export type LivePlayer = {
  id: number;
  name: string;
  full_name?: string;
  pos: Pos;
  team: string;
  nextFixture?: string;
  status: "available" | "yellow" | "red" | string;
  now_cost?: number;
  form?: string;
  points_per_game?: string;
  selected_by_percent?: string;
  minutes?: number;
  total_points?: number;
  event_points?: number;
};

export type PlayerMeta = { price?: number; form?: string; ppm?: string; tsb?: string };
export type PlayerFixture = {
  gw: number;
  opponentShort: string;
  home: boolean;
  difficulty?: 1 | 2 | 3 | 4 | 5;
};

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
  pos: Pos;
  team: string;
  nextFixture: string;
  status: "available" | "yellow" | "red";
  kitCandidates: string[];
  is_captain?: boolean;
  is_vice_captain?: boolean;
  multiplier?: number;
  position?: number;
  gameweekPoints?: number;
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

const API = {
  health: () => http<{ ok?: boolean; success?: boolean; time?: string }>("/health"),
  players: () => http<{ players: LivePlayer[]; events?: any[] }>("/players"),
  playersByPos: (pos: Pos) =>
    http<{ players: LivePlayer[] }>(`/players?pos=${encodeURIComponent(pos.toUpperCase() as Pos)}`),
  playerMeta: (id: number) => http<PlayerMeta>(`/players/${id}/meta`),
  playerStats: (id: number) => http<any>(`/players/${id}/stats`),
  playerFixtures: (id: number) => http<{ fixtures: PlayerFixture[] }>(`/players/${id}/fixtures`),
  playerHistory: (id: number) =>
    http<{ gameweekHistory: any[]; upcomingFixtures: any[]; currentGW: number; previousGW: number }>(
      `/players/${id}/history`
    ),
  currentGameweek: () =>
    http<{
      id: number;
      name: string;
      deadline_time: string;
      deadline_time_epoch: number;
      finished: boolean;
      is_current: boolean;
      is_next: boolean;
      next_gameweek?: { id: number; name: string; deadline_time: string; deadline_time_epoch: number };
    }>(`/gameweek/current`),
  comprehensiveGameweek: () =>
    http<any>(`/gameweek/comprehensive`),
  team: (userId: number) =>
    http<{
      squad: TeamSquad;
      gameweek: number;
      actualGameweek: number;
      currentGameweekStatus: string;
      gameweekInfo: GameweekInfo;
      entry_history?: any;
      automatic_subs?: any[];
      lastUpdated: string;
    }>(`/team/${userId}`),
  opponentsMap: () => http<{ map: Record<string, string>; gw?: number }>(`/fpl/opponents/current`),
  fixtures: (gameweek: number) => http<any>(`/fixtures/${gameweek}`),
  table: () => http<any>(`/fpl/table`),
};

export const api = {
  get: <T>(path: string) => http<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: any) =>
    http<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data?: any) =>
    http<T>(path, { method: "PUT", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => http<T>(path, { method: "DELETE" }),
};

export default API;

