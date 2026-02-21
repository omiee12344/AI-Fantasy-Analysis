import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, Crown, ArrowLeftRight, Repeat, Trash2, TrendingUp, Calendar, Target, Trophy, Users, Clock, AlertCircle } from "lucide-react";
import type { TeamPlayer } from "@/lib/api";
import { useState, useEffect } from "react";
import React from "react";
import API from "@/lib/api";
import { getPlayerImageSources } from "@/lib/playerImages";

type PlayerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player: TeamPlayer | null;
  onMakeCaptain?: (playerId: number) => void;
  onMakeViceCaptain?: (playerId: number) => void;
  onSubstitute?: (playerId: number) => void;
  onTransfer?: () => void;
  onRemove?: () => void;
};

type PlayerStats = {
  total_points?: number;
  minutes?: number;
  goals_scored?: number;
  assists?: number;
  clean_sheets?: number;
  goals_conceded?: number;
  own_goals?: number;
  penalties_saved?: number;
  penalties_missed?: number;
  yellow_cards?: number;
  red_cards?: number;
  saves?: number;
  bonus?: number;
  bps?: number;
  influence?: number;
  creativity?: number;
  threat?: number;
  ict_index?: number;
  starts?: number;
  expected_goals?: number;
  expected_assists?: number;
  expected_goal_involvements?: number;
  expected_goals_conceded?: number;
  form?: string;
  points_per_game?: string;
  selected_by_percent?: string;
  transfers_in?: number;
  transfers_out?: number;
  transfers_in_event?: number;
  transfers_out_event?: number;
  now_cost?: number;
  cost_change_start?: number;
  cost_change_event?: number;
  dreamteam_count?: number;
};

type PlayerFixture = {
  gw: number;
  opponent: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  is_home: boolean;
};

type FixtureOrPoints = {
  gw: number;
  opponent: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  is_home: boolean;
  points?: number; // If match is finished, show points instead
  finished: boolean;
};

export default function PlayerSheet({
  open,
  onOpenChange,
  player,
  onMakeCaptain,
  onMakeViceCaptain,
  onSubstitute,
  onTransfer,
  onRemove,
}: PlayerSheetProps) {
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [fixturesAndPoints, setFixturesAndPoints] = useState<FixtureOrPoints[]>([]);
  const [loading, setLoading] = useState(false);
  const [usingFallbackData, setUsingFallbackData] = useState(false);

  useEffect(() => {
    if (open && player) {
      fetchPlayerDetails();
    }
  }, [open, player]);

  const fetchPlayerDetails = async () => {
    if (!player) return;
    
    setLoading(true);
    try {
      const [statsResponse, historyResponse, fixturesResponse] = await Promise.all([
        API.playerStats(player.id).catch((err) => {
          console.error(`❌ STATS API FAILED for player ${player.id} (${player.name}):`, err);
          return null;
        }),
        API.playerHistory(player.id).catch((err) => {
          console.error(`❌ HISTORY API FAILED for player ${player.id} (${player.name}):`, err);
          return null;
        }),
        API.playerFixtures(player.id).catch((err) => {
          console.error(`❌ FIXTURES API FAILED for player ${player.id} (${player.name}):`, err);
          return null;
        })
      ]);

      console.log(`✅ API RESPONSES for ${player.name} (ID: ${player.id}):`, {
        statsResponse: !!statsResponse,
        historyResponse: !!historyResponse,
        fixturesResponse: !!fixturesResponse,
        statsResponseKeys: statsResponse ? Object.keys(statsResponse).slice(0, 10) : [],
        historyResponseKeys: historyResponse ? Object.keys(historyResponse) : []
      });

      console.log(`🔴 LIVE FIXTURES DEBUG for ${player.name}:`, {
        fixturesResponse,
        hasFixtures: !!fixturesResponse?.fixtures,
        fixturesCount: fixturesResponse?.fixtures?.length || 0,
        sampleFixtures: fixturesResponse?.fixtures?.slice(0, 3)
      });
      
      // Use comprehensive real stats from API if available
      if (statsResponse) {
        const realStats: PlayerStats = {
          // All real data from the comprehensive /stats endpoint
          total_points: statsResponse.total_points,
          minutes: statsResponse.minutes,
          goals_scored: statsResponse.goals_scored,
          assists: statsResponse.assists,
          clean_sheets: statsResponse.clean_sheets,
          goals_conceded: statsResponse.goals_conceded,
          own_goals: statsResponse.own_goals,
          penalties_saved: statsResponse.penalties_saved,
          penalties_missed: statsResponse.penalties_missed,
          yellow_cards: statsResponse.yellow_cards,
          red_cards: statsResponse.red_cards,
          saves: statsResponse.saves,
          bonus: statsResponse.bonus,
          bps: statsResponse.bps,
          starts: statsResponse.starts,
          influence: statsResponse.influence,
          creativity: statsResponse.creativity,
          threat: statsResponse.threat,
          ict_index: statsResponse.ict_index,
          expected_goals: statsResponse.expected_goals,
          expected_assists: statsResponse.expected_assists,
          expected_goal_involvements: statsResponse.expected_goal_involvements,
          expected_goals_conceded: statsResponse.expected_goals_conceded,
          form: statsResponse.form?.toString(),
          points_per_game: statsResponse.points_per_game?.toString(),
          selected_by_percent: statsResponse.selected_by_percent?.toString(),
          transfers_in: statsResponse.transfers_in,
          transfers_out: statsResponse.transfers_out,
          transfers_in_event: statsResponse.transfers_in_event,
          transfers_out_event: statsResponse.transfers_out_event,
          now_cost: statsResponse.now_cost,
          cost_change_start: statsResponse.cost_change_start,
          cost_change_event: statsResponse.cost_change_event,
          cost_change_start_fall: statsResponse.cost_change_start_fall,
          cost_change_event_fall: statsResponse.cost_change_event_fall,
          dreamteam_count: statsResponse.dreamteam_count
        };
        
        setPlayerStats(realStats);
        setUsingFallbackData(false);
      } else {
        // Fallback stats when stats API call fails - only show warning if both APIs failed
        const shouldShowWarning = !historyResponse;
        setUsingFallbackData(shouldShowWarning);
        
        if (shouldShowWarning) {
          console.warn(`⚠️ Using fallback stats for player ${player.name} (ID: ${player.id}) - both stats and history APIs failed`);
        } else {
          console.warn(`⚠️ Stats API failed for player ${player.name} (ID: ${player.id}), but history API succeeded`);
        }
        
        const fallbackStats: PlayerStats = {
          total_points: 0,
          minutes: 0,
          goals_scored: 0,
          assists: 0,
          clean_sheets: 0,
          goals_conceded: 0,
          yellow_cards: 0,
          red_cards: 0,
          saves: 0,
          bonus: 0,
          starts: 0,
          form: "0.0",
          points_per_game: "0.0",
          selected_by_percent: "0.0",
          transfers_in: 0,
          transfers_out: 0,
          transfers_in_event: 0,
          transfers_out_event: 0,
          now_cost: 50,
          cost_change_start: 0,
          cost_change_event: 0,
          expected_goals: 0,
          expected_assists: 0,
          dreamteam_count: 0
        };
        
        setPlayerStats(fallbackStats);
      }
      
      // Process fixtures and points intelligently - combine history and live fixtures
      if (historyResponse || fixturesResponse) {
        const historyData = historyResponse || {};
        const { gameweekHistory = [], upcomingFixtures = [], currentGW = 1, previousGW = 0 } = historyData;
        const liveFixtures = fixturesResponse?.fixtures || [];
        
        // Map team short names to IDs for lookup
        const teamIdMap: { [key: string]: number } = {
          "ARS": 1, "AVL": 2, "BOU": 3, "BRE": 4, "BHA": 5, "CHE": 6, "CRY": 7, "EVE": 8,
          "FUL": 9, "IPS": 10, "LEI": 11, "LIV": 12, "MCI": 13, "MUN": 14, "NEW": 15,
          "NFO": 16, "SOU": 17, "TOT": 18, "WHU": 19, "WOL": 20
        };
        
        // Create team ID mapping for opponent display - Updated for 2024-25 season
        const teamNames: { [key: number]: string } = {
          1: "ARS", 2: "AVL", 3: "BOU", 4: "BRE", 5: "BHA", 6: "CHE", 7: "CRY", 8: "EVE",
          9: "FUL", 10: "IPS", 11: "LEI", 12: "LIV", 13: "MCI", 14: "MUN", 15: "NEW",
          16: "NFO", 17: "SOU", 18: "TOT", 19: "WHU", 20: "WOL"
        };

        console.log(`🔴 TEAM MAPPING DEBUG for ${player.name}:`, {
          playerTeam: player.team,
          playerTeamIdFromMapping: teamIdMap[player.team],
          allTeamNames: teamNames
        });
        
        // Get recent completed matches (last 5 matches with points)
        const recentMatches = gameweekHistory.slice(-5).map((match: any) => ({
          gw: match.round,
          opponent: teamNames[match.opponent_team] || "TBC",
          difficulty: 3, // We'll use default difficulty for past matches
          is_home: match.was_home,
          points: match.total_points,
          finished: true
        }));
        
        // Get player's team ID from the player object
        const playerTeamId = teamIdMap[player.team] || 6; // Default to Chelsea if not found
        
        // Process live fixtures first (these have the most current data)
        const liveFixturesFormatted = liveFixtures.slice(0, 8).map((fixture: any) => {
          // The fixtures API returns a different structure with opponentShort directly
          const opponentName = fixture.opponentShort || "TBC";
          const isPlayerHome = fixture.home || false;
          
          console.log(`🔴 LIVE FIXTURE MAPPING for ${player.name}:`, {
            fixtureStructure: fixture,
            opponentName,
            isPlayerHome,
            gw: fixture.gw
          });
          
          return {
            gw: fixture.gw,
            opponent: opponentName,
            difficulty: fixture.difficulty || 3,
            is_home: isPlayerHome,
            finished: fixture.finished || false,
            kickoff_time: fixture.kickoff_time,
            started: fixture.started || false,
            team_h_score: fixture.team_h_score || null,
            team_a_score: fixture.team_a_score || null
          };
        });

        // Get upcoming fixtures as fallback and mark them as not finished
        const upcomingFixturesFormatted = upcomingFixtures.slice(0, 5).map((fixture: any) => {
          const isPlayerHome = fixture.team_h === playerTeamId;
          const opponentTeamId = isPlayerHome ? fixture.team_a : fixture.team_h;
          
          return {
            gw: fixture.event,
            opponent: teamNames[opponentTeamId] || "TBC",
            difficulty: fixture.difficulty || 3,
            is_home: isPlayerHome,
            finished: false,
            kickoff_time: fixture.kickoff_time
          };
        });
        
        // SMART LOGIC: Prioritize most recent matches (including current GW if played)
        // Find the latest gameweek with points
        const latestPlayedGW = recentMatches.length > 0 ? Math.max(...recentMatches.map(m => m.gw)) : 0;
        
        // Prioritize live fixtures if available, otherwise use upcoming fixtures from history
        const allUpcomingFixtures = liveFixturesFormatted.length > 0 ? liveFixturesFormatted : upcomingFixturesFormatted;
        
        // Filter upcoming fixtures - but also include current GW if not finished
        const upcomingOnly = allUpcomingFixtures.filter(fixture => {
          // Include fixtures from future gameweeks
          if (fixture.gw > latestPlayedGW) return true;
          // Include current gameweek fixtures that haven't finished
          if (fixture.gw === latestPlayedGW && !fixture.finished) return true;
          return false;
        });
        
        console.log(`🔴 FIXTURE PROCESSING for ${player.name}:`, {
          liveFixturesCount: liveFixturesFormatted.length,
          upcomingFromHistoryCount: upcomingFixturesFormatted.length,
          recentMatchesCount: recentMatches.length,
          latestPlayedGW,
          upcomingOnlyCount: upcomingOnly.length,
          liveFixturesGWs: liveFixturesFormatted.map(f => f.gw),
          upcomingFixturesGWs: upcomingFixturesFormatted.map(f => f.gw),
          recentMatchesGWs: recentMatches.map(m => m.gw),
          upcomingOnlyGWs: upcomingOnly.map(f => f.gw)
        });
        
        // If no upcoming fixtures after filtering, show all available upcoming fixtures
        const upcomingToShow = upcomingOnly.length > 0 ? upcomingOnly.slice(0, 4) : allUpcomingFixtures.slice(0, 4);
        
        // Combine: Show recent matches (prioritizing latest) + upcoming fixtures with live data
        const combined: FixtureOrPoints[] = [
          ...recentMatches.slice(-4), // Show last 4 matches with points (including current GW if played)
          ...upcomingToShow // Show next 4 upcoming fixtures with live data if available
        ];
        
        setFixturesAndPoints(combined);
      } else {
        // Fallback fixtures
        setFixturesAndPoints([{
          gw: 1,
          opponent: "TBC",
          difficulty: 3,
          is_home: true,
          finished: false
        }]);
      }
    } catch (error) {
      console.error('Failed to fetch player details:', error);
      
      // Set fallback data on error
      setUsingFallbackData(true);
      setPlayerStats({
        total_points: 0,
        form: "0.0",
        points_per_game: "0.0",
        selected_by_percent: "0.0",
        now_cost: 50,
        minutes: 0,
        goals_scored: 0,
        assists: 0,
        transfers_in: 0,
        transfers_out: 0,
        transfers_in_event: 0,
        transfers_out_event: 0,
        cost_change_start: 0
      });
      
      setFixturesAndPoints([]);
    } finally {
      setLoading(false);
    }
  };

  if (!player) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "bg-green-500";
      case "yellow": return "bg-yellow-500";
      case "red": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "available": return "Available";
      case "yellow": return "Doubtful";
      case "red": return "Injured";
      default: return "Unknown";
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    switch (difficulty) {
      case 1: return "bg-green-500";
      case 2: return "bg-green-400";
      case 3: return "bg-yellow-500";
      case 4: return "bg-orange-500";
      case 5: return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[500px] bg-card border-border p-0">
        <div className="h-full overflow-y-auto">
          {/* Header with Player Info */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-start gap-4">
              <PlayerImage playerId={player.id} playerName={player.name} teamName={player.team} kitSources={player.kitCandidates} />
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-2">{player.name}</h1>
                <div className="flex items-center gap-3 mb-2">
                  <Badge variant="secondary" className="bg-accent text-accent-foreground font-medium">
                    {player.pos}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white">
                    {player.team}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(player.status)}`} />
                    <span className="text-sm text-white/70">{getStatusText(player.status)}</span>
                  </div>
                </div>
                
                {/* Price and Selection */}
                <div className="flex items-center gap-4 text-sm text-white/70">
                  <span>£{((playerStats?.now_cost || 50) / 10).toFixed(1)}m</span>
                  <span>{playerStats?.selected_by_percent || "15.2"}% selected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-6 border-b border-white/10">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-pulse text-white/60">Loading player stats...</div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{playerStats?.total_points || "0"}</div>
                  <div className="text-xs text-white/60">Total Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{playerStats?.form || "0.0"}</div>
                  <div className="text-xs text-white/60">Form</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{playerStats?.points_per_game || "0.0"}</div>
                  <div className="text-xs text-white/60">Avg Points</div>
                </div>
              </div>
            )}
          </div>

          {/* Data Warning */}
          {usingFallbackData && (
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg mx-6">
              <div className="flex items-center gap-2 text-orange-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">
                  Player stats unavailable. Showing limited data.
                </span>
              </div>
            </div>
          )}

          {/* Season Stats */}
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Season Stats
            </h3>
            {loading ? (
              <div className="space-y-3">
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className="flex justify-between items-center animate-pulse">
                    <div className="h-4 bg-white/10 rounded w-24"></div>
                    <div className="h-4 bg-white/10 rounded w-8"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {player.pos === 'GKP' ? (
                  <>
                    <StatRow label="Clean Sheets" value={playerStats?.clean_sheets || 0} />
                    <StatRow label="Saves" value={playerStats?.saves || 0} />
                    <StatRow label="Goals Conceded" value={playerStats?.goals_conceded || 0} />
                    <StatRow label="Penalties Saved" value={playerStats?.penalties_saved || 0} />
                  </>
                ) : (
                  <>
                    <StatRow label="Goals" value={playerStats?.goals_scored || 0} />
                    <StatRow label="Assists" value={playerStats?.assists || 0} />
                    {player.pos === 'DEF' && <StatRow label="Clean Sheets" value={playerStats?.clean_sheets || 0} />}
                    <StatRow label="Expected Goals" value={playerStats?.expected_goals?.toFixed(2) || "0.00"} />
                    <StatRow label="Expected Assists" value={playerStats?.expected_assists?.toFixed(2) || "0.00"} />
                  </>
                )}
                <StatRow label="Minutes Played" value={playerStats?.minutes || 0} />
                <StatRow label="Starts" value={playerStats?.starts || 0} />
                <StatRow label="Bonus Points" value={playerStats?.bonus || 0} />
                <StatRow label="Yellow Cards" value={playerStats?.yellow_cards || 0} />
                <StatRow label="Red Cards" value={playerStats?.red_cards || 0} />
              </div>
            )}
          </div>

          {/* Fixtures & Recent Points */}
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent & Upcoming
            </h3>
            <div className="space-y-2">
              {fixturesAndPoints.slice(0, 7).map((item, index) => (
                <div key={index} className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                  item.finished ? 'bg-gray-800/50' : 'bg-white/5'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getDifficultyColor(item.difficulty)}`} />
                    <span className="text-white font-medium">
                      {item.opponent} {item.is_home ? "(H)" : "(A)"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/60">
                      GW{item.gw}
                    </span>
                    
                    {/* Live match indicator */}
                    {item.started && !item.finished && (item.team_h_score !== null || item.team_a_score !== null) && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-500/20 text-blue-400 font-semibold">
                        LIVE
                      </span>
                    )}
                    
                    {/* Historical points for finished matches */}
                    {item.finished && item.points !== undefined && (
                      <span className={`text-sm font-semibold px-2 py-1 rounded ${
                        item.points >= 8 ? 'bg-green-500/20 text-green-400' :
                        item.points >= 4 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {item.points} pts
                      </span>
                    )}
                    
                    {/* Kickoff time for upcoming matches */}
                    {!item.finished && !item.started && item.kickoff_time && (
                      <span className="text-xs text-white/50">
                        {new Date(item.kickoff_time).toLocaleDateString('en-GB', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transfer Activity */}
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Transfer Activity
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/70">Transferred In (Total)</span>
                <span className="text-accent font-medium">{(playerStats?.transfers_in || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Transferred Out (Total)</span>
                <span className="text-red-400 font-medium">{(playerStats?.transfers_out || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Net Transfers (This GW)</span>
                <span className={`font-medium ${
                  (playerStats?.transfers_in_event || 0) - (playerStats?.transfers_out_event || 0) >= 0 
                    ? 'text-accent' 
                    : 'text-red-400'
                }`}>
                  {((playerStats?.transfers_in_event || 0) - (playerStats?.transfers_out_event || 0)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Price Change (Season)</span>
                <span className={`font-medium ${
                  (playerStats?.cost_change_start || 0) >= 0 ? 'text-accent' : 'text-red-400'
                }`}>
                  {(playerStats?.cost_change_start || 0) >= 0 ? '+' : ''}
                  £{((playerStats?.cost_change_start || 0) / 10).toFixed(1)}m
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 space-y-3">
            {/* Transfer/Remove buttons for My Team page */}
            {onTransfer && (
              <Button
                onClick={onTransfer}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium"
                size="lg"
              >
                <Repeat className="w-5 h-5 mr-2" />
                Transfer Player
              </Button>
            )}

            {onRemove && (
              <Button
                onClick={onRemove}
                className="w-full bg-red-500 hover:bg-red-600 text-white"
                variant="destructive"
                size="lg"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Remove Player
              </Button>
            )}

            {/* Captain buttons */}
            {onMakeCaptain && !player.is_captain && (
              <Button
                onClick={() => onMakeCaptain(player.id)}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                size="lg"
              >
                <Crown className="w-5 h-5 mr-2" />
                Make Captain
              </Button>
            )}

            {onMakeCaptain && player.is_captain && (
              <Button
                onClick={() => onMakeCaptain(player.id)}
                className="w-full bg-yellow-600 border-2 border-yellow-400 text-black"
                size="lg"
              >
                <Crown className="w-5 h-5 mr-2" />
                Remove Captain
              </Button>
            )}

            {onMakeViceCaptain && !player.is_vice_captain && (
              <Button
                onClick={() => onMakeViceCaptain(player.id)}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white"
                variant="secondary"
                size="lg"
              >
                <Star className="w-5 h-5 mr-2" />
                Make Vice Captain
              </Button>
            )}

            {onMakeViceCaptain && player.is_vice_captain && (
              <Button
                onClick={() => onMakeViceCaptain(player.id)}
                className="w-full bg-gray-600 border-2 border-gray-400 text-white"
                variant="secondary"
                size="lg"
              >
                <Star className="w-5 h-5 mr-2" />
                Remove Vice Captain
              </Button>
            )}

            {onSubstitute && (
              <Button
                onClick={() => onSubstitute(player.id)}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                variant="secondary"
                size="lg"
              >
                <ArrowLeftRight className="w-5 h-5 mr-2" />
                Substitute
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Helper component for stat rows
function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-white/70 text-sm">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

// Player image component with fallbacks
function PlayerImage({ playerId, playerName, teamName, kitSources }: { 
  playerId: number; 
  playerName: string; 
  teamName: string; 
  kitSources?: string[] 
}) {
  const [currentSrcIndex, setCurrentSrcIndex] = useState(0);
  
  // Build sources array: player images first, then kit images, then placeholder
  const sources = React.useMemo(() => {
    const playerImageSources = getPlayerImageSources(playerId);
    const kitImageSources = kitSources || [`/Kits/PLAYER/${teamName}.webp`];
    
    return [
      ...playerImageSources,
      ...kitImageSources,
      "/placeholder.svg"
    ];
  }, [playerId, kitSources, teamName]);
  
  const currentSrc = sources[currentSrcIndex];
  const isPlayerImage = currentSrcIndex < getPlayerImageSources(playerId).length;
  
  const handleImageError = () => {
    if (currentSrcIndex < sources.length - 1) {
      setCurrentSrcIndex(currentSrcIndex + 1);
    }
  };
  
  return (
    <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
      <img
        src={currentSrc}
        alt={isPlayerImage ? playerName : teamName}
        className={`${
          isPlayerImage 
            ? 'w-18 h-18 rounded-full object-cover' 
            : 'w-16 h-16 object-contain'
        }`}
        onError={handleImageError}
      />
    </div>
  );
}