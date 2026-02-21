// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ArrowRight, Target, Trophy, Zap, Star, ArrowRightLeft, TrendingUp, TrendingDown, Brain } from 'lucide-react';
import PremierLeagueTable from '@/components/fpl/PremierLeagueTable';
import API, { type LivePlayer } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { getPlayerImageUrl } from '@/lib/playerImages';


// --- Reusable Card Component ---

const DashboardCard = ({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) => (
  <Card className={`pl-card hover:border-accent/30 ${className}`}>
    <CardHeader>
      <CardTitle className="pl-heading text-2xl text-accent font-bold tracking-widest uppercase">{title}</CardTitle>
    </CardHeader>
    <CardContent className="pl-body">
      {children}
    </CardContent>
  </Card>
);

// --- Player Image Component ---
const PlayerImage = ({ playerId, playerName, teamName, className }: { playerId: number; playerName: string; teamName: string; className?: string }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadPlayerImage = async () => {
      try {
        const url = await getPlayerImageUrl(playerId, '110x140');
        setImageUrl(url);
      } catch (error) {
        console.error('Failed to load player image:', error);
        setImageError(true);
      }
    };

    loadPlayerImage();
  }, [playerId]);

  const handleImageError = () => {
    setImageError(true);
  };

  if (imageError || !imageUrl) {
    return (
      <img 
        src={`/logos/${teamName}.png`} 
        alt={teamName}
        className={className}
      />
    );
  }

  return (
    <img 
      src={imageUrl}
      alt={playerName}
      className={className}
      onError={handleImageError}
    />
  );
};


export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [topPlayers, setTopPlayers] = useState<LivePlayer[]>([]);
  const [upcomingFixtures, setUpcomingFixtures] = useState<any[]>([]);
  const [gameweekInfo, setGameweekInfo] = useState<any>(null);
  const [liveTeamData, setLiveTeamData] = useState<any>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const [
          gameweekResponse,
          playersResponse,
          fixturesResponse
        ] = await Promise.all([
          API.currentGameweek(),
          API.players(),
          API.currentGameweek().then(gw => API.fixtures(gw.id))
        ]);

        setGameweekInfo(gameweekResponse);
        
        // Get top players by total points
        const sortedPlayers = [...playersResponse.players]
          .filter(p => p.total_points && p.total_points > 0)
          .sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
          .slice(0, 10);
        setTopPlayers(sortedPlayers);

        // Get next 3 upcoming fixtures
        const upcoming = fixturesResponse.fixtures
          .filter(f => !f.finished)
          .slice(0, 3)
          .map(f => {
            const kickoffDate = new Date(f.kickoffTime);
            return {
              home: f.homeTeam.shortName,
              away: f.awayTeam.shortName,
              time: kickoffDate.toLocaleTimeString('en-GB', { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              date: kickoffDate.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
              })
            };
          });
        setUpcomingFixtures(upcoming);

        // Fetch user's team data if available
        if (user?.profile?.fplTeamId) {
          try {
            const teamResponse = await API.team(Number(user.profile.fplTeamId));
            setDashboardData(teamResponse);
            setLiveTeamData(teamResponse);
            console.log('Dashboard: Fetched live team data:', teamResponse);
            
            // Fetch AI analysis data
            try {
              const aiResponse = await API.aiOverview(Number(user.profile.fplTeamId));
              if (aiResponse.success) {
                setAiAnalysis(aiResponse.analysis);
                console.log('Dashboard: Fetched AI analysis:', aiResponse.analysis);
              }
            } catch (aiError) {
              console.error('Failed to fetch AI analysis:', aiError);
            }
          } catch (error) {
            console.error('Failed to fetch team data:', error);
          }
        }

      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center pl-bounce-in">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent mx-auto mb-4 pl-glow"></div>
          <p className="text-xl font-display">Loading your dashboard...</p>
          <p className="text-sm text-muted-foreground font-body mt-2">Fetching live FPL data...</p>
        </div>
      </div>
    );
  }

  // Extract data for display with live FPL data
  const myTeam = liveTeamData ? {
    // Use live FPL data from API
    points: liveTeamData.team?.summary_overall_points || user?.profile.totalPoints || 0,
    rank: liveTeamData.team?.summary_overall_rank?.toLocaleString() || user?.profile.overallRank?.toLocaleString() || 'N/A',
    gameweekPoints: (() => {
      // Calculate correct current gameweek points
      if (liveTeamData && gameweekInfo) {
        const apiGameweek = liveTeamData.gameweek;
        const currentGameweek = gameweekInfo.id;
        
        // If API is showing data from a different gameweek than current, show 0
        if (apiGameweek !== currentGameweek) {
          console.log(`Dashboard: API showing GW${apiGameweek} but current is GW${currentGameweek}, showing 0 points`);
          return 0;
        }
        
        // If it's the current gameweek but not finished, calculate from live data
        if (apiGameweek === currentGameweek && !gameweekInfo.finished) {
          const livePoints = Object.values(liveTeamData.squad || {})
            .flat()
            .reduce((total: number, player: any) => total + (player.gameweekPoints || 0), 0);
          console.log(`Dashboard: Calculated ${livePoints} live points for GW${currentGameweek}`);
          return livePoints;
        }
        
        // Gameweek finished, use API total
        return liveTeamData.entry_history?.points || 0;
      }
      
      // No live data, fallback to profile
      return user?.profile.gameweekPoints || 0;
    })(),
    teamValue: liveTeamData.team?.value ? (liveTeamData.team.value / 10).toFixed(1) : user?.profile.teamValue?.toFixed(1) || '100.0',
    bank: liveTeamData.team?.bank ? (liveTeamData.team.bank / 10).toFixed(1) : user?.profile.bank?.toFixed(1) || '0.0',
    freeTransfers: liveTeamData.team?.transfers?.free || user?.profile.freeTransfers || 1,
    transferCost: liveTeamData.team?.transfers?.cost || user?.profile.transferCost || 0,
    captain: liveTeamData.squad ? Object.values(liveTeamData.squad).flat().find((p: any) => p.is_captain) as any : null,
    viceCaptain: liveTeamData.squad ? Object.values(liveTeamData.squad).flat().find((p: any) => p.is_vice_captain) as any : null,
    // Team performance metrics
    pointsOnBench: liveTeamData.team?.points_on_bench || user?.profile.pointsOnBench || 0,
    activeChip: liveTeamData.team?.active_chip || null,
    wildcardsUsed: liveTeamData.team?.wildcards_used || user?.profile.wildcardsUsed || 0,
    hasLiveData: true
  } : {
    // Fallback to user profile data
    points: user?.profile.totalPoints || 0,
    rank: user?.profile.overallRank?.toLocaleString() || 'N/A',
    gameweekPoints: user?.profile.gameweekPoints || 0,
    teamValue: user?.profile.teamValue?.toFixed(1) || '100.0',
    bank: user?.profile.bank?.toFixed(1) || '0.0',
    freeTransfers: user?.profile.freeTransfers || 1,
    transferCost: user?.profile.transferCost || 0,
    captain: null,
    viceCaptain: null,
    pointsOnBench: user?.profile.pointsOnBench || 0,
    activeChip: null,
    wildcardsUsed: user?.profile.wildcardsUsed || 0,
    hasLiveData: false
  };

  const topPlayer = topPlayers[0] ? {
    id: topPlayers[0].id,
    name: topPlayers[0].name,
    team: topPlayers[0].team,
    points: topPlayers[0].total_points || 0,
    details: `${topPlayers[0].form || 0} avg points per game`,
  } : null;

  // AI picks (top players by form)
  const aiPicks = topPlayers
    .filter(p => p.form && parseFloat(p.form) > 0)
    .sort((a, b) => parseFloat(b.form || '0') - parseFloat(a.form || '0'))
    .slice(0, 3)
    .map(p => ({
      name: p.name,
      team: p.team,
      xPts: parseFloat(p.form || '0')
    }));

  // AI Overview Compact Display Component
  const AIOverviewCompact = () => {
    if (!aiAnalysis) {
      return (
        <div className="bg-gradient-to-r from-accent/20 to-accent/10 p-3 rounded-lg border border-accent/30 text-center">
          <Brain className="h-6 w-6 text-accent mx-auto mb-2" />
          <p className="text-accent font-semibold text-sm">AI Analysis Loading</p>
          <p className="text-white/70 text-xs mt-1">Connect your FPL team to see AI insights</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {/* Predictions Row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 p-2 rounded-md">
            <div className="flex items-center gap-1 mb-1">
              <Target className="h-3 w-3 text-green-400" />
              <span className="text-green-300 font-semibold text-xs">Next GW</span>
            </div>
            <p className="text-white font-bold text-sm">{aiAnalysis.predictedPoints?.nextGameweek || 0} pts</p>
            <p className="text-green-400/80 text-xs">{aiAnalysis.predictedPoints?.confidence || 0}% confidence</p>
          </div>
          
          <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/30 p-2 rounded-md">
            <div className="flex items-center gap-1 mb-1">
              <Trophy className="h-3 w-3 text-yellow-400" />
              <span className="text-purple-300 font-semibold text-xs">Est. Rank</span>
            </div>
            <p className="text-white font-bold text-sm">{aiAnalysis.predictedRank?.estimated?.toLocaleString() || 'N/A'}</p>
            <p className="text-purple-400/80 text-xs flex items-center gap-1">
              {aiAnalysis.predictedRank?.change < 0 ? (
                <>
                  <TrendingUp className="h-2 w-2" />
                  +{Math.abs(aiAnalysis.predictedRank.change).toLocaleString()}
                </>
              ) : aiAnalysis.predictedRank?.change > 0 ? (
                <>
                  <TrendingDown className="h-2 w-2" />
                  -{Math.abs(aiAnalysis.predictedRank.change).toLocaleString()}
                </>
              ) : (
                'No change'
              )}
            </p>
          </div>
        </div>

        {/* Performance & Transfers Row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 p-2 rounded-md">
            <div className="flex items-center gap-1 mb-1">
              <Star className="h-3 w-3 text-yellow-400" />
              <span className="text-yellow-300 font-semibold text-xs">Top Performer</span>
            </div>
            <p className="text-white font-bold text-xs truncate">
              {aiAnalysis.bestPerforming?.length > 0 ? aiAnalysis.bestPerforming[0].playerName : 'N/A'}
            </p>
            <p className="text-yellow-400/80 text-xs">
              {aiAnalysis.bestPerforming?.length > 0 ? aiAnalysis.bestPerforming[0].performance : 'No data'}
            </p>
          </div>
          
          <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 p-2 rounded-md">
            <div className="flex items-center gap-1 mb-1">
              <ArrowRightLeft className="h-3 w-3 text-blue-400" />
              <span className="text-blue-300 font-semibold text-xs">Transfers</span>
            </div>
            <p className="text-white font-bold text-sm">
              {aiAnalysis.suggestedTransfers?.length || 0}
            </p>
            <p className="text-blue-400/80 text-xs">
              {aiAnalysis.suggestedTransfers?.length > 0 ? 'suggestions' : 'No urgent moves'}
            </p>
          </div>
        </div>

        {/* Strategy Advice */}
        <div className="bg-gradient-to-r from-accent/20 to-accent/10 p-2 rounded-md border border-accent/30">
          <div className="flex items-center gap-1 mb-1">
            <Zap className="h-3 w-3 text-accent" />
            <span className="text-accent font-semibold text-xs">Strategy</span>
          </div>
          <p className="text-white/90 text-xs leading-snug line-clamp-2">
            {aiAnalysis.strategyAdvice?.recommendation || "No specific advice at this time"}
          </p>
          {aiAnalysis.strategyAdvice?.boostSuggestion && (
            <p className="text-accent text-xs mt-1 font-medium">
              Consider: {aiAnalysis.strategyAdvice.boostSuggestion.replace('_', ' ')}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-5xl font-heading text-accent mb-4">YOUR DASHBOARD</h1>
          <p className="text-xl font-display text-muted-foreground">
            WELCOME BACK, HERE'S YOUR FPL SUMMARY FOR {gameweekInfo?.name || 'THE CURRENT GAMEWEEK'}.
          </p>
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

          {/* My Team Card (Larger) */}
          <div className={`pl-card hover:border-accent/30 md:col-span-2`}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="pl-heading text-2xl text-accent font-bold tracking-widest uppercase">My Team</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="pl-button-primary text-xs"
                  onClick={() => navigate('/my-team')}
                >
                  View Full Team <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pl-body">
              {/* Main Stats Row */}
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <p className="text-3xl md:text-4xl font-heading text-accent">{myTeam.points?.toLocaleString()}</p>
                  <p className="text-xs font-display text-muted-foreground">Total Points</p>
                </div>
                <div>
                  <p className="text-3xl md:text-4xl font-heading text-foreground">{myTeam.rank}</p>
                  <p className="text-xs font-display text-muted-foreground">Overall Rank</p>
                </div>
                <div>
                  <p className="text-3xl md:text-4xl font-heading text-green-400">{myTeam.gameweekPoints}</p>
                  <p className="text-xs font-display text-muted-foreground">{gameweekInfo?.name || 'Current GW'} Points</p>
                </div>
              </div>
            
            <Separator className="my-3 bg-border" />
            
            {/* Team Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-accent">Squad Value</p>
                <p className="text-white">£{myTeam.teamValue}m</p>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-accent">In Bank</p>
                <p className="text-white">£{myTeam.bank}m</p>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-accent">Free Transfers</p>
                <p className="text-white">{myTeam.freeTransfers}</p>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-accent">Captain</p>
                <p className="text-white truncate">{myTeam.captain?.web_name || myTeam.captain?.name || 'Not set'}</p>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-accent">Vice-Captain</p>
                <p className="text-white truncate">{myTeam.viceCaptain?.web_name || myTeam.viceCaptain?.name || 'Not set'}</p>
              </div>
              <div className="space-y-1">
                <p className="font-bold text-accent">Bench Points</p>
                <p className="text-white">{myTeam.pointsOnBench}</p>
              </div>
            </div>
            
            {/* Transfer Cost Warning */}
            {myTeam.transferCost > 0 && (
              <div className="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-300">Transfer hits taken: -{myTeam.transferCost} points</p>
              </div>
            )}
            
            {/* Active Chip */}
            {myTeam.activeChip && (
              <div className="mt-3 p-2 bg-accent/20 border border-accent/30 rounded-lg">
                <p className="text-xs text-accent font-bold">Active Chip: {myTeam.activeChip.replace('_', ' ').toUpperCase()}</p>
              </div>
            )}
            </CardContent>
          </div>

          {/* Outstanding Player Card */}
          <DashboardCard title="Outstanding Player">
            {topPlayer ? (
              <div className="flex items-center justify-between">
                  {/* Player Info */}
                  <div className="flex-1">
                    <p className="text-2xl font-heading mb-1">{topPlayer.name}</p>
                    <p className="text-lg text-accent font-bold mb-1">{topPlayer.points} Points</p>
                    <p className="text-sm text-muted-foreground font-body mb-2">{topPlayer.details}</p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <img src={`/logos/${topPlayer.team}.png`} alt={topPlayer.team} className="w-6 h-6 mr-2" />
                        <span className="text-sm font-medium text-muted-foreground">{topPlayer.team}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Player Image */}
                  <div className="flex-shrink-0">
                    <PlayerImage 
                      playerId={topPlayer.id}
                      playerName={topPlayer.name}
                      teamName={topPlayer.team}
                      className="w-24 h-32 object-cover object-top rounded-lg border-2 border-accent/30"
                    />
                  </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground font-body">Loading player data...</p>
              </div>
            )}
          </DashboardCard>

          {/* AI Top Picks Card */}
          <DashboardCard title={`Top Form Players (${gameweekInfo?.name || 'Current GW'})`}>
            <div className="space-y-3">
              {aiPicks.length > 0 ? aiPicks.map(player => (
                <div key={player.name} className="flex justify-between items-center text-sm p-2 rounded hover:bg-accent/10 transition-colors">
                  <div className="flex items-center">
                    <img src={`/logos/${player.team}.png`} alt={player.team} className="w-5 h-5 mr-3" />
                    <span className="font-display font-semibold tracking-wide">{player.name}</span>
                  </div>
                  <span className="text-accent font-bold">{player.xPts.toFixed(1)} avg</span>
                </div>
              )) : (
                <p className="text-muted-foreground text-sm font-body">Loading player form data...</p>
              )}
            </div>
          </DashboardCard>

          {/* Premier League Table (Larger) */}
          <div className="lg:col-span-2">
            <DashboardCard title="Top 6 Clubs">
              <PremierLeagueTable showAll={false} showTitle={false} />
            </DashboardCard>
          </div>

          {/* Upcoming Fixtures Card */}
          <DashboardCard title="Upcoming Fixtures">
            <div className="space-y-2">
                {upcomingFixtures.length > 0 ? upcomingFixtures.map(fixture => (
                    <div key={`${fixture.home}-${fixture.away}`} className="flex items-center justify-between text-sm p-3 bg-card/50 border border-accent/20 rounded-md hover:border-accent/40 transition-colors">
                        <div className="flex items-center font-display font-semibold tracking-wide">
                            <img src={`/logos/${fixture.home}.png`} alt={fixture.home} className="w-5 h-5 mr-2" />
                            {fixture.home}
                        </div>
                        <div className="text-center">
                          <div className="text-xs px-3 py-1 bg-accent/20 text-accent font-bold rounded-full">{fixture.time}</div>
                          <div className="text-xs text-muted-foreground mt-1 font-medium">{fixture.date}</div>
                        </div>
                        <div className="flex items-center font-display font-semibold tracking-wide">
                            {fixture.away}
                            <img src={`/logos/${fixture.away}.png`} alt={fixture.away} className="w-5 h-5 ml-2" />
                        </div>
                    </div>
                )) : (
                  <p className="text-muted-foreground text-sm font-body">Loading fixtures...</p>
                )}
            </div>
          </DashboardCard>

          {/* AI Overview Compact */}
          <DashboardCard title="AI Insights">
            <AIOverviewCompact />
          </DashboardCard>

        </div>
      </div>
    </div>
  );
}