// src/pages/Predictor.tsx
import { useState, useEffect } from 'react';
import React from 'react';
import { Search, X, ChevronDown, Crown, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import API, { type LivePlayer } from '@/lib/api';
import { getPlayerImageSources } from '@/lib/playerImages';
import { AIPlayerAnalyzer, type PlayerComparisonData, type AIAnalysisResult } from '@/lib/ai-analyzer';

// Enhanced player type for predictor with comprehensive stats
type PredictorPlayer = {
  id: number;
  name: string;
  full_name?: string;
  pos: "GKP" | "DEF" | "MID" | "FWD";
  team: string;
  status: "available" | "yellow" | "red";
  price: number;
  form: number;
  ptsPerMatch: number;
  gw2Pts: number;
  totalPts: number;
  totalBonus: number;
  ictIndex: number;
  tsb: number;
  fixtures: PredictorFixture[];
  history: PredictorHistory[];
  kitCandidates: string[];
};

// Team building types
type TeamSlot = {
  id: string;
  position: "GKP" | "DEF" | "MID" | "FWD" | "OUTFIELD";
  player?: PredictorPlayer;
};

type SavedTeam = {
  startingXI: TeamSlot[];
  bench: TeamSlot[];
  captainId: number | null;
  viceCaptainId: number | null;
  formation: string;
  totalValue: number;
  savedAt: string;
  user: string;
};

type PredictorFixture = {
  gw: number;
  opponent: string;
  isHome: boolean;
  difficulty: 1 | 2 | 3 | 4 | 5;
  points: number; // For future fixtures, this is 0
};

type PredictorHistory = {
  gw: number;
  opponent: string;
  isHome: boolean;
  minutes: number;
  goals: number;
  assists: number;
  points: number;
  bonus: number;
  cleanSheet: number;
  goalsConceded: number;
  saves: number;
  yellowCards: number;
  redCards: number;
  ictIndex: number;
};

// Filter options
const TEAM_OPTIONS = [
  { value: 'all', label: 'All Teams' },
  { value: 'ARS', label: 'Arsenal' },
  { value: 'AVL', label: 'Aston Villa' },
  { value: 'BOU', label: 'Bournemouth' },
  { value: 'BRE', label: 'Brentford' },
  { value: 'BHA', label: 'Brighton' },
  { value: 'CHE', label: 'Chelsea' },
  { value: 'CRY', label: 'Crystal Palace' },
  { value: 'EVE', label: 'Everton' },
  { value: 'FUL', label: 'Fulham' },
  { value: 'LIV', label: 'Liverpool' },
  { value: 'LUT', label: 'Luton Town' },
  { value: 'MCI', label: 'Man City' },
  { value: 'MUN', label: 'Man United' },
  { value: 'NEW', label: 'Newcastle' },
  { value: 'NFO', label: "Nott'm Forest" },
  { value: 'SHU', label: 'Sheffield Utd' },
  { value: 'TOT', label: 'Tottenham' },
  { value: 'WHU', label: 'West Ham' },
  { value: 'WOL', label: 'Wolves' }
];

const POSITION_OPTIONS = [
  { value: 'all', label: 'All Positions' },
  { value: 'GKP', label: 'Goalkeepers' },
  { value: 'DEF', label: 'Defenders' },
  { value: 'MID', label: 'Midfielders' },
  { value: 'FWD', label: 'Forwards' }
];

const PRICE_OPTIONS = [
  { value: 'all', label: 'Any Price' },
  { value: '4.0-5.0', label: '£4.0m - £5.0m' },
  { value: '5.0-6.5', label: '£5.0m - £6.5m' },
  { value: '6.5-8.0', label: '£6.5m - £8.0m' },
  { value: '8.0-10.0', label: '£8.0m - £10.0m' },
  { value: '10.0-12.0', label: '£10.0m - £12.0m' },
  { value: '12.0+', label: '£12.0m+' }
];

// Team names for fallback fixture generation
const TEAM_NAMES = ['ARS', 'CHE', 'LIV', 'MCI', 'MUN', 'TOT', 'NEW', 'BHA', 'AVL', 'WHU', 'EVE', 'BOU', 'BRE', 'CRY', 'FUL', 'LUT', 'NFO', 'SHU', 'WOL'];

// Get current gameweek (would normally come from API)
const currentGameweek = 2; // This should come from the gameweek API

// Helper function to limit concurrent requests
const limitConcurrency = async function<T>(
  items: T[],
  asyncFn: (item: T) => Promise<any>,
  concurrency: number = 10
): Promise<any[]> {
  const results: any[] = [];
  
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(asyncFn));
    results.push(...batchResults);
  }
  
  return results;
};

// Convert LivePlayer to PredictorPlayer with basic data (no additional API calls for now)
const convertToPredictorPlayer = (livePlayer: LivePlayer): PredictorPlayer => {
  const price = ((livePlayer.now_cost || 0) / 10);
  const form = parseFloat(livePlayer.form || "0");
  const ptsPerMatch = parseFloat(livePlayer.points_per_game || "0");
  const totalPts = livePlayer.total_points || 0;
  const tsb = parseFloat(livePlayer.selected_by_percent || "0");
  
  // Use mock data for now to prevent API overload
  const ictIndex = Math.floor(Math.random() * 20 + 5);
  const totalBonus = Math.floor(Math.random() * 15);
  const gw2Pts = Math.floor(Math.random() * 15 - 2);

  // Generate mock fixtures (6 upcoming gameweeks)
  const fixtures: PredictorFixture[] = Array.from({ length: 6 }, (_, i) => ({
    gw: currentGameweek + i + 1,
    opponent: TEAM_NAMES[Math.floor(Math.random() * TEAM_NAMES.length)],
    isHome: Math.random() > 0.5,
    difficulty: (Math.floor(Math.random() * 5) + 1) as 1 | 2 | 3 | 4 | 5,
    points: 0
  }));

  // Generate mock history for 2025/26 season only (current completed gameweeks)
  const completedGameweeks = Math.min(currentGameweek - 1, 10); // Show only completed gameweeks
  const history: PredictorHistory[] = Array.from({ length: completedGameweeks }, (_, i) => {
    const gw = i + 1; // Start from GW1 of current season
    const minutes = Math.random() > 0.2 ? Math.floor(Math.random() * 90 + 1) : 0;
    const goals = minutes > 0 ? Math.floor(Math.random() * 3) : 0;
    const assists = minutes > 0 ? Math.floor(Math.random() * 2) : 0;
    const points = minutes === 0 ? 0 : Math.floor(Math.random() * 15 + 1);
    
    return {
      gw,
      opponent: TEAM_NAMES[Math.floor(Math.random() * TEAM_NAMES.length)],
      isHome: Math.random() > 0.5,
      minutes,
      goals,
      assists,
      points,
      bonus: Math.floor(Math.random() * 4),
      cleanSheet: livePlayer.pos !== "FWD" && Math.random() > 0.7 ? 1 : 0,
      goalsConceded: livePlayer.pos === "GKP" || livePlayer.pos === "DEF" ? Math.floor(Math.random() * 3) : 0,
      saves: livePlayer.pos === "GKP" ? Math.floor(Math.random() * 8) : 0,
      yellowCards: Math.random() > 0.9 ? 1 : 0,
      redCards: Math.random() > 0.98 ? 1 : 0,
      ictIndex: Math.floor(Math.random() * 20 + 5)
    };
  });

  return {
    id: livePlayer.id,
    name: livePlayer.name,
    full_name: livePlayer.full_name,
    pos: livePlayer.pos,
    team: livePlayer.team,
    status: livePlayer.status as "available" | "yellow" | "red",
    price,
    form,
    ptsPerMatch,
    gw2Pts,
    totalPts,
    totalBonus,
    ictIndex,
    tsb,
    fixtures,
    history,
    kitCandidates: [`/Kits/PLAYER/${livePlayer.team}.webp`]
  };
};

// Async function to enhance a single player with detailed API data
const enhancePlayerWithDetailedData = async (player: PredictorPlayer): Promise<PredictorPlayer> => {
  console.log(`🔍 Enhancing data for player: ${player.name} (ID: ${player.id})`);
  
  try {
    const [playerHistory, playerFixtures] = await Promise.all([
      API.playerHistory(player.id).catch((err) => {
        console.warn(`❌ Failed to fetch history for ${player.name}:`, err);
        return { gameweekHistory: [], upcomingFixtures: [], currentGW: currentGameweek, previousGW: currentGameweek - 1 };
      }),
      API.playerFixtures(player.id).catch((err) => {
        console.warn(`❌ Failed to fetch fixtures for ${player.name}:`, err);
        return { fixtures: [] };
      })
    ]);

    console.log(`📊 API Response for ${player.name}:`, {
      historyLength: playerHistory.gameweekHistory?.length || 0,
      fixturesLength: playerFixtures.fixtures?.length || 0,
      sampleHistory: playerHistory.gameweekHistory?.slice(0, 2) || []
    });

    let fixtures = player.fixtures;
    let history = player.history;
    let totalBonus = player.totalBonus;
    let gw2Pts = player.gw2Pts;
    let ictIndex = player.ictIndex;

    // Process real fixtures data
    if (playerFixtures.fixtures && playerFixtures.fixtures.length > 0) {
      console.log(`🏟️ Processing ${playerFixtures.fixtures.length} fixtures for ${player.name}`);
      fixtures = playerFixtures.fixtures.slice(0, 6).map((fixture, i) => ({
        gw: currentGameweek + i + 1,
        opponent: fixture.opponentShort || 'TBD',
        isHome: fixture.home,
        difficulty: fixture.difficulty || 3,
        points: 0
      }));
    }

    // Process real history data - filter for 2025/26 season only
    if (playerHistory.gameweekHistory && playerHistory.gameweekHistory.length > 0) {
      console.log(`📈 Processing ${playerHistory.gameweekHistory.length} history records for ${player.name}`);
      
      // Show all available gameweeks for debugging
      const allGameweeks = playerHistory.gameweekHistory.map((gw: any) => gw.round).sort((a: number, b: number) => a - b);
      console.log(`📅 Available gameweeks for ${player.name}:`, allGameweeks);
      
      // For now, let's show ALL available data instead of filtering by season
      // This will help us see what actual data we're getting
      history = playerHistory.gameweekHistory.map((gwData: any) => ({
        gw: gwData.round || 0,
        opponent: gwData.opponent_team_short || gwData.opponent_team_name || 'TBD',
        isHome: gwData.was_home || false,
        minutes: gwData.minutes || 0,
        goals: gwData.goals_scored || 0,
        assists: gwData.assists || 0,
        points: gwData.total_points || 0,
        bonus: gwData.bonus || 0,
        cleanSheet: gwData.clean_sheets || 0,
        goalsConceded: gwData.goals_conceded || 0,
        saves: gwData.saves || 0,
        yellowCards: gwData.yellow_cards || 0,
        redCards: gwData.red_cards || 0,
        ictIndex: gwData.ict_index ? parseFloat(gwData.ict_index) : 0
      }));

      console.log(`✅ Processed ${history.length} history records for ${player.name}`, {
        sampleRecord: history[0] || null,
        allRecords: history,
        totalPoints: history.reduce((sum, h) => sum + h.points, 0)
      });

      // Calculate total bonus from history
      totalBonus = history.reduce((sum, h) => sum + h.bonus, 0);

      // Get GW2 points if available
      const gw2Data = history.find(h => h.gw === 2);
      if (gw2Data) {
        gw2Pts = gw2Data.points;
      }

      // Calculate ICT Index average from recent games
      const recentGames = history.filter(h => h.ictIndex > 0);
      if (recentGames.length > 0) {
        ictIndex = Math.round(recentGames.reduce((sum, h) => sum + h.ictIndex, 0) / recentGames.length * 10) / 10;
      }
    } else {
      console.log(`❌ No history data received for ${player.name}`);
    }

    const enhancedPlayer = {
      ...player,
      fixtures,
      history,
      totalBonus,
      gw2Pts,
      ictIndex
    };

    console.log(`🎉 Enhanced ${player.name} successfully:`, {
      historyRecords: enhancedPlayer.history.length,
      fixtureRecords: enhancedPlayer.fixtures.length,
      totalBonus: enhancedPlayer.totalBonus,
      gw2Pts: enhancedPlayer.gw2Pts
    });

    return enhancedPlayer;

  } catch (error) {
    console.error(`💥 Failed to enhance data for player ${player.name}:`, error);
    return player; // Return original player data if enhancement fails
  }
};

// Reusable StatDisplay component
const StatDisplay = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between items-center py-2 border-b border-white/10 last:border-none">
    <span className="text-sm text-white/70">{label}</span>
    <span className="font-bold text-md">{value}</span>
  </div>
);

// StatCard component for the stats grid
const StatCard = ({ label, value, subValue, isComparison = false }: { label: string; value: string; subValue?: string; isComparison?: boolean }) => (
  <div className="text-center">
    <div className={`${isComparison ? 'text-xs' : 'text-xs'} text-white/70 ${isComparison ? 'mb-0.5' : 'mb-1'} whitespace-nowrap`}>{label}</div>
    <div className={`${isComparison ? 'text-sm' : 'text-lg'} font-bold text-white whitespace-nowrap`}>{value}</div>
    {subValue && <div className="text-xs text-white/50 whitespace-nowrap">{subValue}</div>}
  </div>
);

// Team name mapping for correct logos
const TEAM_LOGO_MAP: Record<string, string> = {
  'Arsenal': 'ARS',
  'Aston Villa': 'AVL', 
  'Bournemouth': 'BOU',
  'Brentford': 'BRE',
  'Brighton': 'BHA',
  'Chelsea': 'CHE',
  'Crystal Palace': 'CRY',
  'Everton': 'EVE',
  'Fulham': 'FUL',
  'Liverpool': 'LIV',
  'Luton': 'LUT',
  'Man City': 'MCI',
  'Man Utd': 'MUN',
  'Newcastle': 'NEW',
  'Nott\'m Forest': 'NFO',
  'Sheffield Utd': 'SHU',
  'Tottenham': 'TOT',
  'West Ham': 'WHU',
  'Wolves': 'WOL',
  // Add more mappings as needed
  'ARS': 'ARS',
  'AVL': 'AVL',
  'BOU': 'BOU',
  'BRE': 'BRE',
  'BHA': 'BHA',
  'CHE': 'CHE',
  'CRY': 'CRY',
  'EVE': 'EVE',
  'FUL': 'FUL',
  'LIV': 'LIV',
  'LUT': 'LUT',
  'MCI': 'MCI',
  'MUN': 'MUN',
  'NEW': 'NEW',
  'NFO': 'NFO',
  'SHU': 'SHU',
  'TOT': 'TOT',
  'WHU': 'WHU',
  'WOL': 'WOL'
};

// Full team name mapping from short codes
const FULL_TEAM_NAMES: Record<string, string> = {
  "ARS": "Arsenal",
  "AVL": "Aston Villa", 
  "BOU": "AFC Bournemouth",
  "BRE": "Brentford",
  "BHA": "Brighton & Hove Albion",
  "CHE": "Chelsea",
  "CRY": "Crystal Palace",
  "EVE": "Everton",
  "FUL": "Fulham",
  "LIV": "Liverpool",
  "LUT": "Luton Town",
  "MCI": "Manchester City",
  "MUN": "Manchester United",
  "NEW": "Newcastle United",
  "NFO": "Nottingham Forest",
  "SHU": "Sheffield United",
  "TOT": "Tottenham Hotspur",
  "WHU": "West Ham United",
  "WOL": "Wolverhampton Wanderers",
  "BUR": "Burnley",
  "IPS": "Ipswich Town",
  "LEI": "Leicester City",
  "SOU": "Southampton"
};

// Position full names
const POSITION_NAMES: Record<string, string> = {
  "GKP": "Goalkeeper",
  "DEF": "Defender", 
  "MID": "Midfielder",
  "FWD": "Forward"
};

// Helper function to get correct team logo code
const getTeamLogoCode = (teamName: string): string => {
  return TEAM_LOGO_MAP[teamName] || teamName.substring(0, 3).toUpperCase();
};

// Helper function to get full team name
const getFullTeamName = (teamCode: string): string => {
  return FULL_TEAM_NAMES[teamCode] || teamCode;
};

// Helper function to get full position name
const getFullPositionName = (posCode: string): string => {
  return POSITION_NAMES[posCode] || posCode;
};


// History table component
const HistoryTable = ({ player }: { player: PredictorPlayer }) => {
  console.log(`🏆 Rendering history table for ${player.name}:`, {
    totalHistoryRecords: player.history.length,
    sampleRecords: player.history.slice(0, 3)
  });

  // For now, show ALL history data to debug what we're getting from the API
  // We'll add filtering back once we confirm the data is correct
  const currentSeasonHistory = player.history; // Remove filtering temporarily

  // Use match history data from player object
  const historyData = currentSeasonHistory.map((match, index) => ({
    gw: match.gw,
    opp: match.opponent,
    oppShort: getTeamLogoCode(match.opponent),
    isHome: match.isHome,
    pts: match.points,
    st: match.minutes >= 60 ? 1 : 0,
    mp: match.minutes,
    gs: match.goals,
    a: match.assists,
    xG: (Math.random() * 0.8).toFixed(2),
    xA: (Math.random() * 0.5).toFixed(2),
    xGI: (Math.random() * 1.2).toFixed(2),
    cs: match.cleanSheet,
    gc: match.goalsConceded,
    xGC: (Math.random() * 2.5).toFixed(2),
    t: Math.floor(Math.random() * 3),
    cbi: Math.floor(Math.random() * 5),
    r: Math.floor(Math.random() * 15),
    dc: Math.floor(Math.random() * 15)
  }));

  // Calculate totals
  const totals = {
    pts: historyData.reduce((sum, match) => sum + match.pts, 0),
    st: historyData.reduce((sum, match) => sum + match.st, 0),
    mp: historyData.reduce((sum, match) => sum + match.mp, 0),
    gs: historyData.reduce((sum, match) => sum + match.gs, 0),
    a: historyData.reduce((sum, match) => sum + match.a, 0),
    xG: historyData.reduce((sum, match) => sum + parseFloat(match.xG), 0).toFixed(2),
    xA: historyData.reduce((sum, match) => sum + parseFloat(match.xA), 0).toFixed(2),
    xGI: historyData.reduce((sum, match) => sum + parseFloat(match.xGI), 0).toFixed(2),
    cs: historyData.reduce((sum, match) => sum + match.cs, 0),
    gc: historyData.reduce((sum, match) => sum + match.gc, 0),
    xGC: historyData.reduce((sum, match) => sum + parseFloat(match.xGC), 0).toFixed(2),
    t: historyData.reduce((sum, match) => sum + match.t, 0),
    cbi: historyData.reduce((sum, match) => sum + match.cbi, 0),
    r: historyData.reduce((sum, match) => sum + match.r, 0),
    dc: historyData.reduce((sum, match) => sum + match.dc, 0)
  };

  return (
    <div className="bg-white/5 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4">This Season (2025/26)</h3>
      {historyData.length === 0 ? (
        <div className="text-center py-8 text-white/60">
          <p>No matches played in 2025/26 season yet</p>
        </div>
      ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-white">
          <thead>
            <tr className="border-b border-white/20">
              <th className="text-left py-2">GW</th>
              <th className="text-left py-2">OPP</th>
              <th className="text-center py-2">PTS</th>
              <th className="text-center py-2">ST</th>
              <th className="text-center py-2">MP</th>
              <th className="text-center py-2">GS</th>
              <th className="text-center py-2">A</th>
              <th className="text-center py-2">xG</th>
              <th className="text-center py-2">xA</th>
              <th className="text-center py-2">xGI</th>
              <th className="text-center py-2">CS</th>
              <th className="text-center py-2">GC</th>
              <th className="text-center py-2">xGC</th>
              <th className="text-center py-2">T</th>
              <th className="text-center py-2">CBI</th>
              <th className="text-center py-2">R</th>
              <th className="text-center py-2">DC</th>
            </tr>
          </thead>
          <tbody>
            {historyData.map((match, index) => (
              <tr key={index} className="border-b border-white/10">
                <td className="py-2">{match.gw}</td>
                <td className="py-2 flex items-center gap-2">
                  <img src={`/logos/${match.oppShort}.png`} alt={match.opp} className="w-4 h-4" />
                  {match.opp} ({match.isHome ? 'H' : 'A'})
                  {match.pts > 0 && <span className="w-2 h-2 bg-accent rounded-full"></span>}
                </td>
                <td className="text-center py-2">{match.pts}</td>
                <td className="text-center py-2">{match.st}</td>
                <td className="text-center py-2">{match.mp}</td>
                <td className="text-center py-2">{match.gs}</td>
                <td className="text-center py-2">{match.a}</td>
                <td className="text-center py-2">{match.xG}</td>
                <td className="text-center py-2">{match.xA}</td>
                <td className="text-center py-2">{match.xGI}</td>
                <td className="text-center py-2">{match.cs}</td>
                <td className="text-center py-2">{match.gc}</td>
                <td className="text-center py-2">{match.xGC}</td>
                <td className="text-center py-2">{match.t}</td>
                <td className="text-center py-2">{match.cbi}</td>
                <td className="text-center py-2">{match.r}</td>
                <td className="text-center py-2">{match.dc}</td>
              </tr>
            ))}
            <tr className="border-b border-white/10 font-bold">
              <td className="py-2">Totals</td>
              <td className="py-2">-</td>
              <td className="text-center py-2">{totals.pts}</td>
              <td className="text-center py-2">{totals.st}</td>
              <td className="text-center py-2">{totals.mp}</td>
              <td className="text-center py-2">{totals.gs}</td>
              <td className="text-center py-2">{totals.a}</td>
              <td className="text-center py-2">{totals.xG}</td>
              <td className="text-center py-2">{totals.xA}</td>
              <td className="text-center py-2">{totals.xGI}</td>
              <td className="text-center py-2">{totals.cs}</td>
              <td className="text-center py-2">{totals.gc}</td>
              <td className="text-center py-2">{totals.xGC}</td>
              <td className="text-center py-2">{totals.t}</td>
              <td className="text-center py-2">{totals.cbi}</td>
              <td className="text-center py-2">{totals.r}</td>
              <td className="text-center py-2">{totals.dc}</td>
            </tr>
            <tr className="font-bold">
              <td className="py-2">Per 90</td>
              <td className="py-2">-</td>
              <td className="text-center py-2">-</td>
              <td className="text-center py-2">-</td>
              <td className="text-center py-2">-</td>
              <td className="text-center py-2">-</td>
              <td className="text-center py-2">-</td>
              <td className="text-center py-2">{totals.mp > 0 ? (parseFloat(totals.xG) / (totals.mp / 90)).toFixed(2) : '0.00'}</td>
              <td className="text-center py-2">{totals.mp > 0 ? (parseFloat(totals.xA) / (totals.mp / 90)).toFixed(2) : '0.00'}</td>
              <td className="text-center py-2">{totals.mp > 0 ? (parseFloat(totals.xGI) / (totals.mp / 90)).toFixed(2) : '0.00'}</td>
              <td className="text-center py-2">{totals.mp > 0 ? (totals.cs / (totals.mp / 90)).toFixed(0) : '0'}</td>
              <td className="text-center py-2">{totals.mp > 0 ? (totals.gc / (totals.mp / 90)).toFixed(1) : '0'}</td>
              <td className="text-center py-2">{totals.mp > 0 ? (parseFloat(totals.xGC) / (totals.mp / 90)).toFixed(2) : '0.00'}</td>
              <td className="text-center py-2">-</td>
              <td className="text-center py-2">-</td>
              <td className="text-center py-2">-</td>
              <td className="text-center py-2">{totals.mp > 0 ? (totals.dc / (totals.mp / 90)).toFixed(0) : '0'}</td>
            </tr>
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
};

// Fixtures table component
const FixturesTable = ({ fixtures }: { fixtures: PredictorFixture[] }) => {
  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-accent/80';
      case 2: return 'bg-accent';
      case 3: return 'bg-accent/60';
      case 4: return 'bg-red-500';
      case 5: return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white/5 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-4">Upcoming Fixtures</h3>
      <div className="space-y-2">
        {fixtures.map((fixture, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="text-white font-bold">GW{fixture.gw}</div>
              <img src={`/logos/${fixture.opponent}.png`} alt={fixture.opponent} className="w-6 h-6" />
              <div className="text-white">
                {fixture.opponent} ({fixture.isHome ? 'H' : 'A'})
              </div>
            </div>
            <div className={`w-8 h-4 rounded ${getDifficultyColor(fixture.difficulty)}`}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

// AI Overview component for individual player analysis
const AIOverview = ({ player }: { player: PredictorPlayer }) => {
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  // Generate AI analysis when player is available
  useEffect(() => {
    if (player) {
      generateAIAnalysis();
    }
  }, [player]);

  const generateAIAnalysis = () => {
    if (!player) return;
    
    // Convert PredictorPlayer to the format expected by the AI analyzer
    const playerData = {
      name: player.name,
      position: player.pos === 'GKP' ? 'Goalkeeper' : 
               player.pos === 'DEF' ? 'Defender' : 
               player.pos === 'MID' ? 'Midfielder' : 'Forward',
      team: player.team,
      price: player.price,
      form: player.form,
      points_per_game: player.ptsPerMatch,
      total_points: player.totalPts,
      selected_by_percent: player.tsb,
      recent_average_points: player.history.slice(-5).reduce((sum, match) => sum + match.points, 0) / 5,
      goals_scored: player.history.reduce((sum, h) => sum + h.goals, 0),
      assists: player.history.reduce((sum, h) => sum + h.assists, 0),
      clean_sheets: player.history.reduce((sum, h) => sum + h.cleanSheet, 0),
      ict_index: player.ictIndex
    };

    // Generate AI analysis using the local analyzer
    const analysis = AIPlayerAnalyzer.analyzeIndividualPlayer(playerData);
    setAiAnalysis(analysis);
  };

  if (!player) {
    return (
      <div className="bg-white/5 rounded-lg p-4 mt-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span>🤖</span>
          AI Overview
        </h3>
        <div className="text-white/80 text-sm">
          Select a player to generate AI analysis.
        </div>
      </div>
    );
  }

  if (!aiAnalysis) {
    return (
      <div className="bg-white/5 rounded-lg p-4 mt-4">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span>🤖</span>
          AI Overview
        </h3>
        <div className="text-white/80 text-sm">
          Generating intelligent analysis...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-lg p-4 mt-4">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span>🤖</span>
        AI Overview
      </h3>
      
      {/* Combined AI Analysis Paragraph */}
      <div className="text-white/80 text-sm leading-relaxed">
        {aiAnalysis.overview} {aiAnalysis.form_analysis} {aiAnalysis.value_assessment} {aiAnalysis.position_insights} {aiAnalysis.strategic_recommendations}
      </div>
    </div>
  );
};

// Enhanced player card component matching the design
const PlayerCard = ({ player, isComparison = false }: { player: PredictorPlayer | null; isComparison?: boolean }) => {
  const [activeTab, setActiveTab] = useState<'history' | 'fixtures'>('history');
  
  if (!player) {
    return (
      <div className="flex items-center justify-center h-full bg-white/5 rounded-lg p-4 min-h-[300px]">
        <p className="text-white/70">Select a player</p>
      </div>
    );
  }

  // Use real fixtures data from player object
  const upcomingFixtures = player.fixtures;

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return 'bg-accent/80';
      case 2: return 'bg-accent';
      case 3: return 'bg-accent/60';
      case 4: return 'bg-red-500';
      case 5: return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with player image and gradient background */}
      <div className="relative rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-card to-accent/20"></div>
        <div className="relative p-6 flex items-center gap-4">
          {/* Player Image */}
          <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20">
            <PlayerCardImageComponent 
              playerId={player.id} 
              playerName={player.name} 
              teamName={player.team} 
            />
          </div>
          
          {/* Player Info */}
          <div className="flex-1 text-white">
            <div className="text-sm font-medium opacity-90">{getFullPositionName(player.pos)}</div>
            <h2 className="text-2xl font-bold">{player.full_name || player.name}</h2>
            <div className="text-sm opacity-90">{getFullTeamName(player.team)}</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={`grid grid-cols-4 lg:grid-cols-8 ${isComparison ? 'gap-1 lg:gap-2' : 'gap-2 lg:gap-4'} text-center`}>
        <StatCard label="Price" value={`£${player.price.toFixed(1)}m`} subValue="" isComparison={isComparison} />
        <StatCard label="Form" value={player.form.toFixed(1)} subValue="" isComparison={isComparison} />
        <StatCard label="PPG" value={player.ptsPerMatch.toFixed(1)} subValue="" isComparison={isComparison} />
        <StatCard label="GW2" value={player.gw2Pts.toString()} subValue="" isComparison={isComparison} />
        <StatCard label="Points" value={player.totalPts.toString()} subValue="" isComparison={isComparison} />
        <StatCard label="Bonus" value={player.totalBonus.toString()} subValue="" isComparison={isComparison} />
        <StatCard label="ICT" value={player.ictIndex.toFixed(1)} subValue="" isComparison={isComparison} />
        <StatCard label="TSB %" value={`${player.tsb.toFixed(1)}%`} subValue="" isComparison={isComparison} />
      </div>

      {/* History/Fixtures Tabs - Only show in single view mode */}
      {!isComparison && (
        <>
          <div className="flex gap-0 bg-card/50 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${
                activeTab === 'history'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('fixtures')}
              className={`flex-1 py-2 px-4 rounded-md font-semibold transition-colors ${
                activeTab === 'fixtures'
                  ? 'bg-accent text-accent-foreground'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Fixtures
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'history' ? (
            <HistoryTable player={player} />
          ) : (
            <FixturesTable fixtures={upcomingFixtures} />
          )}
          
          {/* AI Overview Section - Only in single view */}
          <AIOverview player={player} />
        </>
      )}
    </div>
  );
};

// AI Comparison Overview component
const AIComparisonOverview = ({ player1, player2 }: { player1: PredictorPlayer | null; player2: PredictorPlayer | null }) => {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);

  // Generate AI analysis when both players are available
  useEffect(() => {
    if (player1 && player2) {
      generateAIAnalysis();
    }
  }, [player1, player2]);

  const generateAIAnalysis = () => {
    if (!player1 || !player2) return;
    
    // Convert PredictorPlayer to the format expected by the AI analyzer
    const player1Data: PlayerComparisonData = {
      name: player1.name,
      position: player1.pos === 'GKP' ? 'Goalkeeper' : 
               player1.pos === 'DEF' ? 'Defender' : 
               player1.pos === 'MID' ? 'Midfielder' : 'Forward',
      team: player1.team,
      price: player1.price,
      total_points: player1.totalPts,
      form: player1.form,
      points_per_game: player1.ptsPerMatch,
      selected_by_percent: player1.tsb,
      minutes: player1.history.reduce((sum, h) => sum + h.minutes, 0),
      goals_scored: player1.history.reduce((sum, h) => sum + h.goals, 0),
      assists: player1.history.reduce((sum, h) => sum + h.assists, 0),
      clean_sheets: player1.history.reduce((sum, h) => sum + h.cleanSheet, 0)
    };
    
    const player2Data: PlayerComparisonData = {
      name: player2.name,
      position: player2.pos === 'GKP' ? 'Goalkeeper' : 
               player2.pos === 'DEF' ? 'Defender' : 
               player2.pos === 'MID' ? 'Midfielder' : 'Forward',
      team: player2.team,
      price: player2.price,
      total_points: player2.totalPts,
      form: player2.form,
      points_per_game: player2.ptsPerMatch,
      selected_by_percent: player2.tsb,
      minutes: player2.history.reduce((sum, h) => sum + h.minutes, 0),
      goals_scored: player2.history.reduce((sum, h) => sum + h.goals, 0),
      assists: player2.history.reduce((sum, h) => sum + h.assists, 0),
      clean_sheets: player2.history.reduce((sum, h) => sum + h.cleanSheet, 0)
    };

    // Generate AI analysis using the local analyzer
    const analysis = AIPlayerAnalyzer.comparePlayers(player1Data, player2Data);
    setAiAnalysis(analysis);
  };

  if (!player1 || !player2) {
    return (
      <div className="bg-white/5 rounded-lg p-6 mt-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span>🤖</span>
          AI Comparison Analysis
        </h3>
        <div className="text-white/80 text-sm">
          Select a second player to generate the AI comparison analysis.
        </div>
      </div>
    );
  }

  if (!aiAnalysis) {
    return (
      <div className="bg-white/5 rounded-lg p-6 mt-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span>🤖</span>
          AI Comparison Analysis
        </h3>
        <div className="text-white/80 text-sm">
          Generating intelligent analysis...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-lg p-6 mt-6">
      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
        <span>🤖</span>
        AI Comparison Analysis
      </h3>
      
      {/* Executive Summary */}
      <div className="mb-6">
        <h4 className="text-white font-medium mb-2 text-sm text-accent">📋 Executive Summary</h4>
        <div className="text-white/90 text-sm leading-relaxed">
          {aiAnalysis.summary}
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="mb-6">
        <h4 className="text-white font-medium mb-2 text-sm text-accent">📊 Detailed Analysis</h4>
        <div className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
          {aiAnalysis.detailed_analysis}
        </div>
      </div>

      {/* Position-Specific Insights */}
      <div className="mb-6">
        <h4 className="text-white font-medium mb-2 text-sm text-accent">🎯 Position Analysis</h4>
        <div className="text-white/80 text-sm leading-relaxed">
          {aiAnalysis.position_specific}
        </div>
      </div>

      {/* Recommendations */}
      <div className="mb-6">
        <h4 className="text-white font-medium mb-2 text-sm text-accent">💡 Strategic Recommendations</h4>
        <div className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
          {aiAnalysis.recommendations}
        </div>
      </div>

      {/* Metrics Comparison */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="text-xs text-white/60 mb-1">Points Winner</div>
          <div className="text-white font-semibold text-sm">
            {aiAnalysis.metrics_comparison.points.winner}
          </div>
          <div className="text-xs text-white/50">
            +{Math.abs(aiAnalysis.metrics_comparison.points.difference)}
          </div>
        </div>
        
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="text-xs text-white/60 mb-1">Form Winner</div>
          <div className="text-white font-semibold text-sm">
            {aiAnalysis.metrics_comparison.form.winner}
          </div>
          <div className="text-xs text-white/50">
            +{Math.abs(aiAnalysis.metrics_comparison.form.difference).toFixed(1)}
          </div>
        </div>
        
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="text-xs text-white/60 mb-1">Better Value</div>
          <div className="text-white font-semibold text-sm">
            {aiAnalysis.metrics_comparison.value_ratio.winner}
          </div>
          <div className="text-xs text-white/50">
            +{Math.abs(aiAnalysis.metrics_comparison.value_ratio.difference).toFixed(2)}
          </div>
        </div>
        
        <div className="bg-white/10 rounded-lg p-3 text-center">
          <div className="text-xs text-white/60 mb-1">More Consistent</div>
          <div className="text-white font-semibold text-sm">
            {aiAnalysis.metrics_comparison.consistency.winner}
          </div>
          <div className="text-xs text-white/50">
            +{Math.abs(aiAnalysis.metrics_comparison.consistency.difference).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};


export default function Predictor() {
  const [searchQuery, setSearchQuery] = useState('');
  const [players, setPlayers] = useState<PredictorPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PredictorPlayer | null>(null);
  const [comparisonPlayers, setComparisonPlayers] = useState<(PredictorPlayer | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [teamFilter, setTeamFilter] = useState('all');
  const [positionFilter, setPositionFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');

  // State for enhanced player data (clear cache on reload)
  const [enhancedPlayers, setEnhancedPlayers] = useState(new Map<number, PredictorPlayer>());

  // Team Building state
  const [startingXI, setStartingXI] = useState<TeamSlot[]>([]);
  const [bench, setBench] = useState<TeamSlot[]>([]);
  const [captainId, setCaptainId] = useState<number | null>(null);
  const [viceCaptainId, setViceCaptainId] = useState<number | null>(null);
  const [formation, setFormation] = useState('4-4-2');
  const [totalValue, setTotalValue] = useState(0);
  const [isTeamBuilderOpen, setIsTeamBuilderOpen] = useState(false);

  // Initialize team slots
  useEffect(() => {
    const initialStartingXI: TeamSlot[] = Array.from({ length: 11 }, (_, i) => ({
      id: `slot_${i + 1}`,
      position: i === 0 ? "GKP" : i <= 4 ? "DEF" : i <= 8 ? "MID" : "FWD"
    }));
    
    const initialBench: TeamSlot[] = Array.from({ length: 4 }, (_, i) => ({
      id: `BENCH_${i + 1}`,
      position: i === 0 ? "GKP" : "OUTFIELD"
    }));
    
    setStartingXI(initialStartingXI);
    setBench(initialBench);
  }, []);

  // Load saved team on mount
  useEffect(() => {
    const savedTeam = localStorage.getItem('fpl-saved-team');
    if (savedTeam) {
      try {
        const parsedTeam: SavedTeam = JSON.parse(savedTeam);
        setStartingXI(parsedTeam.startingXI);
        setBench(parsedTeam.bench);
        setCaptainId(parsedTeam.captainId);
        setViceCaptainId(parsedTeam.viceCaptainId);
        setFormation(parsedTeam.formation);
        setTotalValue(parsedTeam.totalValue);
        console.log('✅ Loaded saved team:', parsedTeam);
      } catch (error) {
        console.error('❌ Failed to load saved team:', error);
      }
    }
  }, []);

  // Function to enhance a player with detailed data when selected
  const enhancePlayerData = async (player: PredictorPlayer) => {
    console.log(`🔄 Enhancing player ${player.name} (ID: ${player.id})`);
    
    // TEMPORARILY DISABLE CACHE to debug the issue
    // if (enhancedPlayers.has(player.id)) {
    //   console.log(`📦 Using cached data for ${player.name}`);
    //   return enhancedPlayers.get(player.id)!;
    // }

    try {
      console.log(`🆕 Fetching fresh data for ${player.name}`);
      const enhancedPlayer = await enhancePlayerWithDetailedData(player);
      
      console.log(`💾 Caching enhanced data for ${player.name}:`, {
        historyLength: enhancedPlayer.history.length,
        totalPts: enhancedPlayer.totalPts,
        firstMatch: enhancedPlayer.history[0] || null
      });
      
      setEnhancedPlayers(prev => new Map(prev).set(player.id, enhancedPlayer));
      return enhancedPlayer;
    } catch (error) {
      console.error(`💥 Failed to enhance player ${player.name}:`, error);
      return player;
    }
  };

  const isComparing = comparisonPlayers.length > 0;

  // Helper function to check price filter
  const matchesPriceFilter = (price: number): boolean => {
    switch (priceFilter) {
      case '4.0-5.0': return price >= 4.0 && price <= 5.0;
      case '5.0-6.5': return price >= 5.0 && price <= 6.5;
      case '6.5-8.0': return price >= 6.5 && price <= 8.0;
      case '8.0-10.0': return price >= 8.0 && price <= 10.0;
      case '10.0-12.0': return price >= 10.0 && price <= 12.0;
      case '12.0+': return price >= 12.0;
      default: return true;
    }
  };

  const handleSelectPlayer = async (player: PredictorPlayer) => {
    console.log(`🎯 Selecting player: ${player.name} (ID: ${player.id})`);
    console.log(`📊 Initial player data:`, {
      historyLength: player.history.length,
      totalPts: player.totalPts,
      sampleHistory: player.history.slice(0, 2)
    });

    if (isComparing) {
      if (comparisonPlayers.length === 1 && comparisonPlayers[0]?.id !== player.id) {
        console.log(`🔄 Enhancing for comparison...`);
        const enhancedPlayer = await enhancePlayerData(player);
        setComparisonPlayers([comparisonPlayers[0], enhancedPlayer]);
      }
    } else {
      console.log(`🔄 Enhancing for single view...`);
      
      // Don't set initial player, wait for enhanced data
      const enhancedPlayer = await enhancePlayerData(player);
      
      console.log(`✅ Setting enhanced player:`, {
        name: enhancedPlayer.name,
        historyLength: enhancedPlayer.history.length,
        totalPts: enhancedPlayer.totalPts,
        sampleHistory: enhancedPlayer.history.slice(0, 2)
      });
      
      setSelectedPlayer(enhancedPlayer);
    }
  };

  // Fetch players from API
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await API.players();
        
        // Convert players with basic data (synchronous, fast)
        const predictorPlayers = response.players.map(convertToPredictorPlayer);
        
        // Sort by total points descending
        predictorPlayers.sort((a, b) => b.totalPts - a.totalPts);
        
        setPlayers(predictorPlayers);
        
        // Automatically enhance the top player on initial load to show live data
        if (predictorPlayers.length > 0) {
          const topPlayer = predictorPlayers[0];
          setSelectedPlayer(topPlayer);
          
          // Enhance the top player with live data immediately
          enhancePlayerData(topPlayer).then(enhancedPlayer => {
            setSelectedPlayer(enhancedPlayer);
          }).catch(error => {
            console.error('Failed to enhance initial player:', error);
            // Fallback to basic player data if enhancement fails
            setSelectedPlayer(topPlayer);
          });
        }
      } catch (err: any) {
        console.error('Failed to fetch players:', err);
        setError(err?.message || 'Failed to load players');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlayers();
  }, []);

  const handleComparisonClick = async () => {
    if (isComparing) {
      setSelectedPlayer(comparisonPlayers[0]);
      setComparisonPlayers([]);
    } else if (selectedPlayer) {
      const enhancedPlayer = await enhancePlayerData(selectedPlayer);
      setComparisonPlayers([enhancedPlayer]);
    }
  };

  const filteredPlayers = players.filter(player => {
    // Search filter
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         player.team.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Team filter
    const matchesTeam = teamFilter === 'all' || player.team === teamFilter;
    
    // Position filter
    const matchesPosition = positionFilter === 'all' || player.pos === positionFilter;
    
    // Price filter
    const matchesPrice = matchesPriceFilter(player.price);
    
    return matchesSearch && matchesTeam && matchesPosition && matchesPrice;
  });
  
  // Reset filters
  const resetFilters = () => {
    setTeamFilter('all');
    setPositionFilter('all');
    setPriceFilter('all');
    setSearchQuery('');
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 w-64 bg-white/20 rounded mb-4 mx-auto" />
            <div className="h-4 w-48 bg-white/10 rounded mx-auto" />
          </div>
          <p className="mt-4 text-white/70">Loading players...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Failed to Load Players</h1>
          <p className="text-red-300 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} className="bg-accent hover:bg-accent/90 text-accent-foreground">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Team building functions
  const addPlayerToTeam = (player: PredictorPlayer, slotId: string, position: "GKP" | "DEF" | "MID" | "FWD" | "OUTFIELD") => {
    const newSlot: TeamSlot = { id: slotId, position, player };
    
    if (slotId.startsWith('BENCH')) {
      setBench(prev => prev.map(slot => slot.id === slotId ? newSlot : slot));
    } else {
      setStartingXI(prev => prev.map(slot => slot.id === slotId ? newSlot : slot));
    }
    
    // Update total value
    setTotalValue(prev => prev + player.price);
  };

  const removePlayerFromTeam = (slotId: string) => {
    const slot = [...startingXI, ...bench].find(s => s.id === slotId);
    if (slot?.player) {
      const playerPrice = slot.player.price;
      setTotalValue(prev => prev - playerPrice);
      
      if (slotId.startsWith('BENCH')) {
        setBench(prev => prev.map(s => s.id === slotId ? { ...s, player: undefined } : s));
      } else {
        setStartingXI(prev => prev.map(s => s.id === slotId ? { ...s, player: undefined } : s));
      }
    }
  };

  const setCaptain = (playerId: number) => {
    setCaptainId(playerId);
  };

  const setViceCaptain = (playerId: number) => {
    setViceCaptainId(playerId);
  };

  const updateFormation = (newFormation: string) => {
    setFormation(newFormation);
  };

  const handleAddPlayerToTeam = (player: PredictorPlayer) => {
    // Find an empty slot in the starting XI first
    const emptyStartingSlot = startingXI.find(slot => !slot.player);
    if (emptyStartingSlot) {
      addPlayerToTeam(player, emptyStartingSlot.id, player.pos);
      alert(`✅ Added ${player.name} to Starting XI (Slot ${emptyStartingSlot.id})`);
      return;
    }
    
    // If no empty starting XI slot, try bench
    const emptyBenchSlot = bench.find(slot => !slot.player);
    if (emptyBenchSlot) {
      addPlayerToTeam(player, emptyBenchSlot.id, player.pos);
      alert(`✅ Added ${player.name} to Bench (Slot ${emptyBenchSlot.id})`);
      return;
    }
    
    alert('❌ No empty slots available. Please remove a player first.');
  };

  const handleSaveTeam = async () => {
    const startingPlayers = startingXI.filter(slot => slot.player);
    if (startingPlayers.length < 11) {
      alert('Please select at least 11 players for your starting XI.');
      return;
    }

    if (!captainId) {
      alert('Please select a captain for your team.');
      return;
    }

    if (!viceCaptainId) {
      alert('Please select a vice captain for your team.');
      return;
    }

    try {
      // Create a team structure for local storage
      const teamData: SavedTeam = {
        startingXI: startingXI.filter(slot => slot.player),
        bench: bench.filter(slot => slot.player),
        captainId,
        viceCaptainId,
        formation,
        totalValue,
        savedAt: new Date().toISOString(),
        user: "local_user" // Placeholder for user ID
      };

      // Save to localStorage
      localStorage.setItem('fpl-saved-team', JSON.stringify(teamData));
      
      console.log('Team saved locally:', teamData);
      alert(`✅ Team saved successfully!\n\nFormation: ${formation}\nStarting XI: ${startingPlayers.length} players\nBench: ${bench.filter(slot => slot.player).length} players\nCaptain: ${startingPlayers.find(p => p.player?.id === captainId)?.player?.name}\nVice Captain: ${startingPlayers.find(p => p.player?.id === viceCaptainId)?.player?.name}\nTotal Value: £${totalValue.toFixed(1)}m\n\nSaved at: ${new Date().toLocaleString()}`);
      
    } catch (error) {
      console.error('Failed to save team:', error);
      alert('❌ Failed to save team. Please try again.');
    }
  };

  const handleViewSavedTeam = () => {
    const savedTeam = localStorage.getItem('fpl-saved-team');
    if (savedTeam) {
      try {
        const parsedTeam: SavedTeam = JSON.parse(savedTeam);
        
        // Show saved team information
        const startingPlayers = parsedTeam.startingXI.filter(slot => slot.player);
        const benchPlayers = parsedTeam.bench.filter(slot => slot.player);
        const captain = startingPlayers.find(p => p.player?.id === parsedTeam.captainId)?.player;
        const viceCaptain = startingPlayers.find(p => p.player?.id === parsedTeam.viceCaptainId)?.player;
        
        const message = `👁️ Saved Team Found!\n\n` +
          `Formation: ${parsedTeam.formation}\n` +
          `Starting XI: ${startingPlayers.length}/11 players\n` +
          `Bench: ${benchPlayers.length}/4 players\n` +
          `Captain: ${captain?.name || 'Not set'}\n` +
          `Vice Captain: ${viceCaptain?.name || 'Not set'}\n` +
          `Total Value: £${parsedTeam.totalValue.toFixed(1)}m\n` +
          `Budget Left: £${(100 - parsedTeam.totalValue).toFixed(1)}m\n\n` +
          `Saved: ${new Date(parsedTeam.savedAt).toLocaleString()}`;
        
        alert(message);
      } catch (error) {
        console.error('Error parsing saved team:', error);
        alert('❌ Error loading saved team data.');
      }
    } else {
      alert('📭 No saved team found. Please save a team first.');
    }
  };

  const handleClearSavedTeam = () => {
    if (window.confirm('Are you sure you want to clear the saved team? This action cannot be undone.')) {
      localStorage.removeItem('fpl-saved-team');
      alert('🗑️ Saved team cleared successfully!');
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <header className="text-center mb-10">
          <h1 className="text-5xl pl-heading text-accent font-bold mb-2 tracking-widest uppercase">AI Player Analyzer</h1>
          <p className="text-lg text-muted-foreground pl-body">
            Search, compare, and get detailed insights on players.
          </p>
          
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Side: Player List & Filters (40%) */}
          <div className="w-full lg:w-2/5 flex flex-col">
            <div className="flex gap-2 mb-4 items-center">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <Input
                  type="text"
                  placeholder={isComparing ? "Select a player to compare" : "Search players..."}
                  className="w-full bg-white/10 border-none pl-9 h-10 text-sm text-white placeholder:text-white/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {!isComparing && (
                <Button 
                  variant="outline" 
                  className="bg-white/10 border-none h-9 text-xs px-3 hover:bg-white/20"
                  onClick={resetFilters}
                >
                  Reset
                </Button>
              )}
            </div>
            
            {/* Filter Dropdowns */}
            {!isComparing && (
              <div className="flex gap-2 mb-4">
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="bg-white/10 border-none text-white h-9 text-xs flex-1">
                    <SelectValue placeholder="Team" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {TEAM_OPTIONS.map(option => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="text-white focus:bg-white/10 text-xs"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={positionFilter} onValueChange={setPositionFilter}>
                  <SelectTrigger className="bg-white/10 border-none text-white h-9 text-xs flex-1">
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {POSITION_OPTIONS.map(option => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="text-white focus:bg-white/10 text-xs"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger className="bg-white/10 border-none text-white h-9 text-xs flex-1">
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {PRICE_OPTIONS.map(option => (
                      <SelectItem 
                        key={option.value} 
                        value={option.value}
                        className="text-white focus:bg-white/10 text-xs"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <ScrollArea className="bg-white/5 rounded-lg h-[calc(100vh+75px)]">
              <div className="p-2 space-y-1">
                {filteredPlayers.map(player => (
                  <div
                    key={player.id}
                    className={`p-2 rounded-md cursor-pointer transition-colors 
                      ${selectedPlayer?.id === player.id && !isComparing ? 'bg-white/20' : 'hover:bg-white/10'}
                      ${comparisonPlayers.find(p => p?.id === player.id) ? 'bg-accent/20' : ''}
                    `}
                    onClick={() => handleSelectPlayer(player)}
                  >
                    <div className="flex items-center gap-2">
                      {/* Player Image */}
                      <PlayerImageComponent playerId={player.id} playerName={player.name} teamName={player.team} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm truncate">{player.name}</div>
                            <div className="text-xs text-white/70">{player.team} - {player.pos}</div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="font-bold text-sm">£{player.price.toFixed(1)}m</div>
                            <div className="text-xs text-white/70">TSB: {player.tsb.toFixed(1)}%</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-1 text-xs text-white/50">
                          <span>{player.totalPts} pts</span>
                          <span>Form: {player.form.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredPlayers.length === 0 && (
                  <div className="text-center py-8 text-white/60">
                    <p className="mb-2">No players found matching your criteria</p>
                    <Button 
                      onClick={resetFilters}
                      variant="outline"
                      size="sm"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Right Side: Player Details (60%) */}
          <div className="w-full lg:w-3/5">
            <div className="bg-white/5 rounded-lg p-6 h-full">
              {/* Comparison View */}
              {isComparing ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">Player Comparison</h2>
                    <Button onClick={handleComparisonClick} variant="destructive" size="sm">
                      <X className="w-4 h-4 mr-2" />
                      Cancel Comparison
                    </Button>
                  </div>
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                        <PlayerCard player={comparisonPlayers[0]} isComparison={true} />
                    </div>
                    <div className="hidden md:block w-px bg-white/20 self-stretch"></div>
                    <div className="flex-1">
                        <PlayerCard player={comparisonPlayers[1]} isComparison={true} />
                    </div>
                  </div>
                  
                  {/* AI Comparison Analysis - Single Box */}
                  <AIComparisonOverview player1={comparisonPlayers[0]} player2={comparisonPlayers[1]} />
                </div>
              ) : (
                /* Single Player View */
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Player Details</h2>
                    <Button onClick={handleComparisonClick} variant="outline" className="bg-white/10 border-none h-9 text-xs px-4">
                      Add to Comparison
                    </Button>
                  </div>

                  <Separator className="bg-white/10 mb-4" />

                  {/* Use the enhanced PlayerCard component for single view too */}
                  <PlayerCard player={selectedPlayer} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Team Builder Modal */}
      {isTeamBuilderOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">🏗️ Build Your Team</h2>
              <Button 
                onClick={() => setIsTeamBuilderOpen(false)}
                variant="outline"
                size="sm"
              >
                ✕
              </Button>
            </div>

            {/* Formation Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white mb-2">Formation</label>
              <Select value={formation} onValueChange={updateFormation}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4-4-2">4-4-2</SelectItem>
                  <SelectItem value="4-3-3">4-3-3</SelectItem>
                  <SelectItem value="3-5-2">3-5-2</SelectItem>
                  <SelectItem value="3-4-3">3-4-3</SelectItem>
                  <SelectItem value="5-3-2">5-3-2</SelectItem>
                  <SelectItem value="5-4-1">5-4-1</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Team Builder Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Starting XI */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Starting XI</h3>
                <div className="space-y-2">
                  {Array.from({ length: 11 }, (_, i) => {
                    const slot = startingXI[i];
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs text-white">
                          {i + 1}
                        </div>
                        {slot?.player ? (
                          <div className="flex-1 flex items-center gap-3">
                            <PlayerImageComponent 
                              playerId={slot.player.id}
                              playerName={slot.player.name}
                              teamName={slot.player.team}
                            />
                            <div className="flex-1">
                              <div className="text-white font-medium">{slot.player.name}</div>
                              <div className="text-white/60 text-sm">{slot.player.team} • {slot.player.pos}</div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCaptain(slot.player!.id)}
                                className={captainId === slot.player!.id ? 'bg-yellow-600 text-white' : ''}
                              >
                                <Crown className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setViceCaptain(slot.player!.id)}
                                className={viceCaptainId === slot.player!.id ? 'bg-blue-600 text-white' : ''}
                              >
                                <Shield className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removePlayerFromTeam(slot.id)}
                                className="text-red-400 hover:text-red-300"
                              >
                                ✕
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 text-white/40 text-sm">
                            Click to add player
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bench */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Bench (4 players)</h3>
                <div className="space-y-2">
                  {Array.from({ length: 4 }, (_, i) => {
                    const slot = bench[i];
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs text-white">
                          B{i + 1}
                        </div>
                        {slot?.player ? (
                          <div className="flex-1 flex items-center gap-3">
                            <PlayerImageComponent 
                              playerId={slot.player.id}
                              playerName={slot.player.name}
                              teamName={slot.player.team}
                            />
                            <div className="flex-1">
                              <div className="text-white font-medium">{slot.player.name}</div>
                              <div className="text-white/60 text-sm">{slot.player.team} • {slot.player.pos}</div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removePlayerFromTeam(slot.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="flex-1 text-white/40 text-sm">
                            Click to add player
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Team Summary */}
            <div className="mt-6 p-4 bg-white/5 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-white/60 text-sm">Starting XI</div>
                  <div className="text-white font-semibold">{startingXI.filter(slot => slot.player).length}/11</div>
                </div>
                <div>
                  <div className="text-white/60 text-sm">Bench</div>
                  <div className="text-white font-semibold">{bench.filter(slot => slot.player).length}/4</div>
                </div>
                <div>
                  <div className="text-white/60 text-sm">Total Value</div>
                  <div className="text-white font-semibold">£{totalValue.toFixed(1)}m</div>
                </div>
                <div>
                  <div className="text-white/60 text-sm">Budget Left</div>
                  <div className="text-white font-semibold">£{(100 - totalValue).toFixed(1)}m</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <Button 
                onClick={handleSaveTeam}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                disabled={startingXI.filter(slot => slot.player).length < 11}
              >
                💾 Save Team
              </Button>
              <Button 
                onClick={() => setIsTeamBuilderOpen(false)}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Player image component for predictor page */
function PlayerImageComponent({ 
  playerId, 
  playerName, 
  teamName 
}: { 
  playerId: number; 
  playerName: string; 
  teamName: string; 
}) {
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);
  
  // Build sources array: player images first, then jersey fallback, then placeholder
  const sources = React.useMemo(() => {
    const playerImageSources = getPlayerImageSources(playerId);
    const jerseySource = `/Kits/PLAYER/${teamName}.webp`;
    
    return [
      ...playerImageSources,
      jerseySource,
      "/placeholder.svg"
    ];
  }, [playerId, teamName]);
  
  const currentSrc = sources[currentSrcIndex];
  const isPlayerImage = currentSrcIndex < getPlayerImageSources(playerId).length;
  
  const handleImageError = () => {
    if (currentSrcIndex < sources.length - 1) {
      setCurrentSrcIndex(currentSrcIndex + 1);
    }
  };
  
  return (
    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
      <img
        src={currentSrc}
        alt={isPlayerImage ? playerName : teamName}
        className={`${
          isPlayerImage 
            ? 'w-10 h-10 rounded-full object-cover' 
            : 'w-8 h-8 object-contain'
        }`}
        onError={handleImageError}
      />
    </div>
  );
}

/** Player image component specifically sized for player cards (larger) */
function PlayerCardImageComponent({ 
  playerId, 
  playerName, 
  teamName 
}: { 
  playerId: number; 
  playerName: string; 
  teamName: string; 
}) {
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);
  
  // Build sources array: player images first, then jersey fallback, then placeholder
  const sources = React.useMemo(() => {
    const playerImageSources = getPlayerImageSources(playerId);
    const jerseySource = `/Kits/PLAYER/${teamName}.webp`;
    
    return [
      ...playerImageSources,
      jerseySource,
      "/placeholder.svg"
    ];
  }, [playerId, teamName]);
  
  const currentSrc = sources[currentSrcIndex];
  const isPlayerImage = currentSrcIndex < getPlayerImageSources(playerId).length;
  
  const handleImageError = () => {
    if (currentSrcIndex < sources.length - 1) {
      setCurrentSrcIndex(currentSrcIndex + 1);
    }
  };
  
  return (
    <img
      src={currentSrc}
      alt={isPlayerImage ? playerName : teamName}
      className={`${
        isPlayerImage 
          ? 'w-20 h-20 rounded-full object-cover' 
          : 'w-16 h-16 object-contain rounded-full'
      }`}
      onError={handleImageError}
    />
  );
}
