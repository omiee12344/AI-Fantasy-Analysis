import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  ArrowRightLeft, 
  Star, 
  Crown,
  Zap,
  Target,
  Trophy,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3
} from 'lucide-react';
import API from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Transfer {
  action: 'transfer_in' | 'transfer_out';
  playerId: number;
  playerName: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface PerformingPlayer {
  playerId: number;
  playerName: string;
  pos: string;
  performance: string;
  points: number;
  trend: 'rising' | 'falling' | 'stable';
}

interface StrategyAdvice {
  recommendation: string;
  boostSuggestion: 'wildcard' | 'bench_boost' | 'triple_captain' | 'free_hit' | null;
  reasoning: string;
  confidence: number;
}

interface PredictedPoints {
  nextGameweek: number;
  confidence: number;
  breakdown: {
    startingXI: number;
    captain: number;
    viceCaptain: number;
    bench: number;
  };
}

interface PredictedRank {
  estimated: number;
  change: number;
  confidence: number;
}

interface TeamAnalysis {
  overview: string;
  suggestedTransfers: Transfer[];
  bestPerforming: PerformingPlayer[];
  strategyAdvice: StrategyAdvice;
  predictedPoints: PredictedPoints;
  predictedRank: PredictedRank;
}

interface AIOverviewSidebarProps {
  className?: string;
}

export default function AIOverviewSidebar({ className = '' }: AIOverviewSidebarProps) {
  const { user } = useAuth();
  const [analysis, setAnalysis] = useState<TeamAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.profile.fplTeamId) {
      fetchAIAnalysis();
    } else {
      setLoading(false);
      setError('Connect your FPL team to see AI insights');
    }
  }, [user?.profile.fplTeamId]);

  const fetchAIAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await API.aiOverview(user!.profile.fplTeamId!);
      
      if (data.success) {
        setAnalysis(data.analysis);
      } else {
        setError('Failed to generate AI insights');
      }
    } catch (err) {
      console.error('AI Overview fetch failed:', err);
      setError('Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'concerning': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising': return <TrendingUp className="h-3 w-3 text-green-400" />;
      case 'falling': return <TrendingDown className="h-3 w-3 text-red-400" />;
      default: return <div className="h-3 w-3 bg-gray-400 rounded-full" />;
    }
  };

  const getBoostIcon = (boost: string | null) => {
    switch (boost) {
      case 'wildcard': return <Star className="h-4 w-4" />;
      case 'bench_boost': return <BarChart3 className="h-4 w-4" />;
      case 'triple_captain': return <Crown className="h-4 w-4" />;
      case 'free_hit': return <Zap className="h-4 w-4" />;
      default: return <CheckCircle2 className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-2.5 ${className}`}>
        <Card className="bg-card border-border">
          <CardHeader className="pb-1 pt-3">
            <CardTitle className="text-white flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4 text-accent animate-pulse" />
              AI Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-6">
            <div className="animate-spin h-6 w-6 border border-white/30 border-t-accent rounded-full"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-2.5 ${className}`}>
        <Card className="bg-card border-border">
          <CardHeader className="pb-1 pt-3">
            <CardTitle className="text-white flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4 text-accent" />
              AI Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-4">
            <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-white/70 text-xs">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* AI Overview Header */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-white flex items-center gap-2 text-sm">
            <Brain className="h-4 w-4 text-accent" />
            AI Overview
            <Badge className="bg-accent/20 text-accent text-xs px-1.5 py-0.5">BETA</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-white/90 px-3 py-2.5">
          <p className="leading-relaxed">{analysis.overview}</p>
        </CardContent>
      </Card>

      {/* Predicted Points */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-green-400" />
            Next Gameweek Prediction
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-3 py-2.5">
          <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 p-2.5 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-green-300 font-medium text-xs">Predicted Points</span>
              <span className="text-xl font-bold text-white">
                {analysis.predictedPoints.nextGameweek}
              </span>
            </div>
            <div className="text-xs text-green-400/80 mt-0.5">
              {analysis.predictedPoints.confidence}% confidence
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-white/60">Starting XI</span>
              <span className="text-white font-medium">
                {analysis.predictedPoints.breakdown.startingXI}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60">Captain</span>
              <span className="text-white font-medium">
                +{analysis.predictedPoints.breakdown.captain}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rank Prediction */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-yellow-400" />
            Rank Prediction
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 py-2.5">
          <div className="bg-gradient-to-r from-purple-900/30 to-purple-800/30 p-2.5 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-purple-300 font-medium text-xs">Est. New Rank</span>
              <div className="text-right">
                <span className="text-lg font-bold text-white">
                  {analysis.predictedRank.estimated.toLocaleString()}
                </span>
                <div className={`text-xs mt-0.5 flex items-center gap-1 justify-end ${
                  analysis.predictedRank.change < 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {analysis.predictedRank.change < 0 ? 
                    <TrendingUp className="h-3 w-3" /> : 
                    <TrendingDown className="h-3 w-3" />
                  }
                  {Math.abs(analysis.predictedRank.change).toLocaleString()} places
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Advice */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-accent" />
            Strategy Advice
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-3 py-2.5">
          <p className="text-white/90 text-xs leading-relaxed">
            {analysis.strategyAdvice.recommendation}
          </p>
          
          {analysis.strategyAdvice.boostSuggestion && (
            <div className="bg-gradient-to-r from-accent/20 to-accent/10 p-2.5 rounded-lg border border-accent/30">
              <div className="flex items-center gap-2 mb-1.5">
                {getBoostIcon(analysis.strategyAdvice.boostSuggestion)}
                <span className="text-accent font-medium text-xs capitalize">
                  {analysis.strategyAdvice.boostSuggestion.replace('_', ' ')}
                </span>
              </div>
              <p className="text-white/70 text-xs leading-relaxed">
                {analysis.strategyAdvice.reasoning}
              </p>
            </div>
          )}
          
          <div className="text-xs text-white/50">
            Confidence: {analysis.strategyAdvice.confidence}%
          </div>
        </CardContent>
      </Card>

      {/* Best Performing Players */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-yellow-400" />
            Performance Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 px-3 py-2.5">
          {analysis.bestPerforming.map((player, index) => (
            <div key={player.playerId} className="flex items-center justify-between py-1.5 border-b border-white/10 last:border-0">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {getTrendIcon(player.trend)}
                  <span className={`text-xs font-medium ${getPerformanceColor(player.performance)}`}>
                    {player.performance}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-medium text-xs">{player.playerName}</div>
                <div className="text-white/60 text-xs">{player.points} pts</div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Transfer Suggestions */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-1 pt-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <ArrowRightLeft className="h-3.5 w-3.5 text-blue-400" />
            Transfer Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 px-3 py-2.5">
          {analysis.suggestedTransfers.slice(0, 3).map((transfer, index) => (
            <div key={index} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium text-xs">{transfer.playerName}</span>
                <Badge className={`text-xs border px-1.5 py-0.5 ${getPriorityColor(transfer.priority)}`}>
                  {transfer.priority}
                </Badge>
              </div>
              <p className="text-white/60 text-xs leading-relaxed">
                {transfer.reason}
              </p>
            </div>
          ))}
          
          {analysis.suggestedTransfers.length === 0 && (
            <div className="text-center py-3">
              <CheckCircle2 className="h-6 w-6 text-green-400 mx-auto mb-1.5" />
              <p className="text-white/70 text-xs">No urgent transfers needed</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Updated */}
      <div className="text-center pt-1">
        <div className="flex items-center justify-center gap-2 text-xs text-white/40">
          <Clock className="h-3 w-3" />
          Updated a few seconds ago
        </div>
      </div>
    </div>
  );
}