import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { LivePlayer } from "@/lib/api";
import { Crown, Star, ArrowRightLeft, AlertCircle, TrendingUp, Users, Coins, Shuffle, Trophy, Calendar, Target, Shield } from "lucide-react";

interface SidebarLeftProps {
  teamPlayers?: (LivePlayer & { opponent?: string })[];
  benchPlayers?: (LivePlayer & { opponent?: string })[];
  squadValue?: number;
  bankValue?: number;
  pointsData?: {
    captainInfo?: {
      playerId: number;
      multiplier: number;
      points: number;
    };
  } | null;
  isCalculatingPoints?: boolean;
  currentGameweekInfo?: {
    id: number;
    name: string;
  };
}

export default function SidebarLeft({ 
  teamPlayers = [], 
  benchPlayers = [], 
  squadValue = 0, 
  bankValue = 0, 
  pointsData, 
  isCalculatingPoints = false,
  currentGameweekInfo 
}: SidebarLeftProps) {
  const { user } = useAuth();

  // Calculate live gameweek points from current team with proper gameweek logic
  const calculateLiveGameweekPoints = () => {
    // Check if we have current gameweek info and if there's a mismatch
    const currentGameweekId = currentGameweekInfo?.id;
    const userCurrentGameweek = user?.profile.currentGameweek;
    
    // If there's a gameweek mismatch (API showing old gameweek data), show 0
    if (currentGameweekId && userCurrentGameweek && userCurrentGameweek !== currentGameweekId) {
      console.log(`Sidebar: User profile shows GW${userCurrentGameweek} but current is GW${currentGameweekId}, showing 0 points`);
      return 0;
    }
    
    // If current gameweek hasn't started or no matches played yet, check if any player actually has live points
    const hasAnyLivePoints = teamPlayers.some(player => 
      (player?.event_points !== undefined && player.event_points > 0) ||
      (player?.gameweekPoints !== undefined && player.gameweekPoints > 0)
    );
    
    // If current gameweek just started and no live points yet, show 0
    if (currentGameweekId && !hasAnyLivePoints && 
        teamPlayers.length > 0 && 
        teamPlayers.every(player => !player?.event_points)) {
      console.log(`Sidebar: GW${currentGameweekId} just started, no live points yet, showing 0`);
      return 0;
    }
    
    // Calculate points from current team (use event_points first as it's more current)
    const totalPoints = teamPlayers.reduce((total, player) => {
      const playerPoints = player?.event_points !== undefined ? player.event_points : 
                          (player?.gameweekPoints || 0);
      return total + playerPoints;
    }, 0);
    
    return totalPoints;
  };

  // Get user display data
  const displayName = user?.profile.teamName || "My Team";
  const userInfo = user ? `${user.profile.firstName} ${user.profile.lastName}` : "Guest User";
  const countryFlag = user?.profile.country === "United Kingdom" ? "🇬🇧" : 
                     user?.profile.country === "India" ? "🇮🇳" : 
                     user?.profile.country === "United States" ? "🇺🇸" : "";

  // Clean API data mapping - no complex calculations, just direct API values
  const fplData = {
    totalPoints: user?.profile.totalPoints || 0,
    lastGameweekPoints: user?.profile.gameweekPoints || 0, // Points from last completed GW
    currentGameweek: user?.profile.currentGameweek || 0,
    hasConnection: !!user?.profile.fplTeamId
  };

  // Calculate fallback gameweek points from playing 11 if pointsData not available
  const calculateFallbackGameweekPoints = () => {
    return teamPlayers.reduce((total, player) => {
      return total + (player?.event_points || 0);
    }, 0);
  };
  
  // Use FPL team value and bank from profile if available, otherwise use calculated values
  const effectiveSquadValue = user?.profile.teamValue || squadValue;
  const effectiveBankValue = user?.profile.bank || bankValue;


  return (
    <div className="space-y-3">
      {/* Team Info Card */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-white text-base flex items-center gap-2">
            {displayName}
            {user?.profile.fplTeamId && (
              <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-normal">
                FPL
              </span>
            )}
          </CardTitle>
          <div className="text-white/60 text-xs">{userInfo} {countryFlag}</div>
        </CardHeader>
        <CardContent className="text-xs text-white/90 space-y-2 px-3 py-3">
          {fplData.hasConnection ? (
            // FPL Connected - Show Complete API Data
            <>
              {/* Total Season Points */}
              <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 p-2.5 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-blue-300 text-xs font-medium">Total Points</span>
                  <span className="text-lg font-bold text-white">{user?.profile.totalPoints?.toLocaleString() || 0}</span>
                </div>
                <div className="text-xs text-blue-400/80 mt-0.5">Season Total</div>
              </div>

              {/* Current Gameweek Performance */}
              <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 p-2.5 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-green-300 text-xs font-medium">
                    {currentGameweekInfo?.name || 'GW'} Points
                  </span>
                  <span className="text-lg font-bold text-white">
                    {calculateLiveGameweekPoints()}
                  </span>
                </div>
                <div className="text-xs text-green-400/80 mt-0.5">
                  {currentGameweekInfo?.name ? 'Current GW' : 'Live Points'}
                </div>
              </div>

            </>
          ) : (
            // No FPL Connection - Show Basic Points
            <>
              <div className="flex justify-between items-center">
                <span>Total Points</span>
                <span className="font-semibold text-lg">0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  Current Points
                  {isCalculatingPoints && (
                    <div className="animate-spin h-3 w-3 border border-white/30 border-t-white rounded-full"></div>
                  )}
                </span>
                <span className="font-semibold text-primary text-lg">{calculateFallbackGameweekPoints()}</span>
              </div>
              <div className="text-xs text-center text-gray-400 py-2 border-t border-white/10">
                Connect your FPL team for accurate stats
              </div>
            </>
          )}
          
          {fplData.hasConnection && (
            <>
              <div className="h-px bg-white/10 my-1.5" />
              
              {/* FPL Rankings & Stats */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-white/90">FPL Statistics</div>
                
                {user?.profile.overallRank && user.profile.overallRank > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-blue-300 text-xs">
                      <TrendingUp className="h-3 w-3" />
                      Overall Rank
                    </span>
                    <span className="text-blue-300 font-semibold text-xs">{user.profile.overallRank.toLocaleString()}</span>
                  </div>
                )}
                
                {user?.profile.gameweekRank && user.profile.gameweekRank > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-purple-300 text-xs">
                      <Users className="h-3 w-3" />
                      GW{user?.profile.currentGameweek} Rank
                    </span>
                    <span className="text-purple-300 font-semibold text-xs">{user.profile.gameweekRank.toLocaleString()}</span>
                  </div>
                )}

                {user?.profile.joinedGameweek && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-cyan-300 text-xs">
                      <Calendar className="h-3 w-3" />
                      Joined GW
                    </span>
                    <span className="text-cyan-300 font-semibold text-xs">GW{user.profile.joinedGameweek}</span>
                  </div>
                )}

                {user?.profile.pointsOnBench !== undefined && user.profile.pointsOnBench >= 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-orange-300 text-xs">Points on bench</span>
                    <span className="text-orange-300 font-semibold text-xs">{user.profile.pointsOnBench}</span>
                  </div>
                )}

                {user?.profile.autoSubsCount !== undefined && user.profile.autoSubsCount >= 0 && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-amber-300 text-xs">
                      <Shuffle className="h-3 w-3" />
                      Auto-subs
                    </span>
                    <span className="text-amber-300 font-semibold text-xs">{user.profile.autoSubsCount}</span>
                  </div>
                )}

                {user?.profile.transferCost !== undefined && user.profile.transferCost > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-red-300 text-xs">
                      <Coins className="h-3 w-3" />
                      Transfer hits
                    </span>
                    <span className="text-red-300 font-semibold text-xs">-{user.profile.transferCost}</span>
                  </div>
                )}

                {user?.profile.freeTransfers !== undefined && (
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-green-300 text-xs">
                      <ArrowRightLeft className="h-3 w-3" />
                      Free transfers
                    </span>
                    <span className="text-green-300 font-semibold text-xs">{user.profile.freeTransfers}</span>
                  </div>
                )}
              </div>
              
              <div className="h-px bg-white/10 my-1.5" />

              {/* Chips Usage Section */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-white/90">Chips Used</div>
                
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-300 flex items-center gap-1 text-xs">
                      <Shield className="h-3 w-3" />
                      Wildcard
                    </span>
                    <span className="text-emerald-300 font-semibold text-xs">{user?.profile.wildcardsUsed || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-blue-300 text-xs">Bench Boost</span>
                    <span className="text-blue-300 font-semibold text-xs">{user?.profile.benchBoostsUsed || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-300 flex items-center gap-1 text-xs">
                      <Crown className="h-3 w-3" />
                      Triple Cap
                    </span>
                    <span className="text-yellow-300 font-semibold text-xs">{user?.profile.tripleCaptainsUsed || 0}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-red-300 text-xs">Free Hit</span>
                    <span className="text-red-300 font-semibold text-xs">{user?.profile.freeHitUsed || 0}</span>
                  </div>
                </div>
              </div>
              
              {/* Leagues Section */}
              {user?.profile.leagues && user.profile.leagues.length > 0 && (
                <>
                  <div className="h-px bg-white/10 my-1.5" />
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-white/90">Top Leagues</div>
                    {user.profile.leagues.slice(0, 3).map((league) => (
                      <div key={league.id} className="flex justify-between items-center">
                        <span className="text-purple-300 text-xs truncate pr-2 flex items-center gap-1" title={league.name}>
                          <Trophy className="h-3 w-3 flex-shrink-0" />
                          {league.name.length > 15 ? `${league.name.substring(0, 15)}...` : league.name}
                        </span>
                        <span className="text-purple-300 font-semibold text-xs flex-shrink-0">
                          {league.position}/{league.totalPlayers}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          <div className="h-px bg-white/10 my-1.5" />
          
          {/* Team Value & Finances */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-white/70">Squad Value</span>
              <span className="font-medium text-white">£{effectiveSquadValue.toFixed(1)}m</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/70">In the bank</span>
              <span className="font-medium text-white">£{effectiveBankValue.toFixed(1)}m</span>
            </div>
          </div>

          {/* FPL Data Source Footer */}
          {fplData.hasConnection && (
            <div className="text-xs text-center text-blue-400/50 pt-2 border-t border-white/10">
              FPL #{user?.profile.fplTeamId}
            </div>
          )}

        </CardContent>
      </Card>

    </div>
  );
}