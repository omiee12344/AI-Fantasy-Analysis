import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Bot, 
  BarChart3, 
  Users, 
  Target, 
  Play,
  ArrowRight,
  Trophy,
  TrendingUp,
  Zap,
  Brain,
  Star,
  Shield,
  Gamepad2,
  Crown,
  CheckCircle,
  Sparkles,
  ChevronRight,
  Globe,
  Timer,
  Award,
  MousePointer,
  Flame,
  Activity,
  LineChart,
  PieChart,
  BarChart,
  Layers,
  Clock,
  Rocket,
  Cpu,
  Database,
  ArrowRightLeft
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function Homepage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentFeature, setCurrentFeature] = useState(0);

  const primaryFeatures = [
    {
      icon: Brain,
      title: "AI-Powered Predictions",
      description: "Advanced machine learning algorithms analyze 200+ data points to predict player performance, injuries, and optimal transfers.",
      gradient: "from-blue-600 to-purple-600",
      stats: "ML-powered predictions"
    },
    {
      icon: Target,
      title: "Smart Captain Analytics",
      description: "Get personalized captain recommendations based on fixture difficulty, recent form, and expected returns with confidence scores.",
      gradient: "from-green-600 to-blue-600",
      stats: "+25% points boost"
    },
    {
      icon: Trophy,
      title: "Team Optimization",
      description: "Complete squad analysis with transfer suggestions, formation advice, and budget management to maximize your points.",
      gradient: "from-purple-600 to-pink-600",
      stats: "#1 optimization tool"
    },
    {
      icon: Rocket,
      title: "Live Match Tracking",
      description: "Real-time match updates, live points calculation, and instant notifications to track your team's performance as it happens.",
      gradient: "from-orange-600 to-red-600",
      stats: "Real-time updates"
    }
  ];

  const advancedFeatures = [
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Deep statistical analysis with xG, xA, form metrics and fixture difficulty ratings.",
      color: "text-blue-400"
    },
    {
      icon: Database,
      title: "Historical Data",
      description: "5+ seasons of player and team data for comprehensive performance analysis.",
      color: "text-green-400"
    },
    {
      icon: Cpu,
      title: "ML Algorithms",
      description: "State-of-the-art machine learning models continuously learning and improving.",
      color: "text-purple-400"
    },
    {
      icon: Activity,
      title: "Live Insights",
      description: "Real-time player performance tracking and instant tactical recommendations.",
      color: "text-orange-400"
    },
    {
      icon: Shield,
      title: "Risk Management",
      description: "Smart risk assessment for transfers and captaincy decisions.",
      color: "text-cyan-400"
    },
    {
      icon: Award,
      title: "League Tools",
      description: "Mini-league analysis and head-to-head comparison tools.",
      color: "text-pink-400"
    }
  ];

  const testimonials = [
    {
      name: "Alex Thompson",
      rank: "Top 10k Manager",
      quote: "This AI tool helped me climb from 2M to top 10k in just 8 gameweeks. The predictions are incredibly accurate!",
      points: "+347 points"
    },
    {
      name: "Sarah Chen",
      rank: "League Winner",
      quote: "Finally won my work league after 5 years of trying. The captain recommendations alone are worth it.",
      points: "Won 3 leagues"
    },
    {
      name: "Marcus Rodriguez",
      rank: "Top 1k Manager",
      quote: "The transfer suggestions saved me from countless mistakes. Best FPL investment I've ever made.",
      points: "+892 points"
    }
  ];

  // Auto-rotate featured items
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % primaryFeatures.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [primaryFeatures.length]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section - Stats Perform Style */}
      <section className="relative overflow-hidden min-h-screen flex items-center">
        {/* Background Video */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover transform scale-125"
            poster="/hero-poster.jpg"
          >
            <source src="/videoplayback.mp4" type="video/mp4" />
          </video>
          {/* Video Overlay - Lighter to show video more */}
          <div className="absolute inset-0 bg-black/50"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/20 to-black/40"></div>
        </div>

        {/* Hero Content - Left Aligned like Stats Perform */}
        <div className="relative z-10 w-full">
          <div className="container mx-auto px-8 lg:px-16">
            <div className="max-w-4xl space-y-8">
              {/* Hero Badge - Small and Subtle */}
              <div className="inline-flex items-center">
                <Badge className="bg-accent/10 text-accent border-accent/20 px-4 py-2 text-sm font-medium">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI-Powered FPL Intelligence
                </Badge>
              </div>

              {/* Main Headline - Clean Typography */}
              <div className="space-y-6">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
                  Master Fantasy 
                  <span className="block text-accent">Premier League</span>
                  with AI Intelligence
                </h1>
                
                <p className="text-xl md:text-2xl text-white/80 max-w-3xl leading-relaxed">
                  Unlock your potential with cutting-edge artificial intelligence. Get precise player predictions, optimal transfer recommendations, and data-driven insights.
                </p>
              </div>

              {/* CTA Button - Single Primary Action */}
              <div className="pt-8">
                <Button 
                  size="lg" 
                  onClick={() => user ? navigate('/dashboard') : navigate('/login')}
                  className="bg-accent hover:bg-accent/90 text-black font-semibold px-8 py-4 text-lg transition-all duration-200"
                >
                  {user ? 'Go to Dashboard' : 'Get Started'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advanced AI Technology Section - Background Image with Lime Green Overlay */}
      <section className="py-40 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="/Training.jpeg" 
            alt="AI Training" 
            className="w-full h-full object-cover"
          />
          {/* Lime Green Overlay */}
          <div className="absolute inset-0 bg-accent/80"></div>
        </div>
        
        <div className="container mx-auto px-8 lg:px-16 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">
              Advanced AI Technology
            </h2>
            <p className="text-xl text-black/80 leading-relaxed mb-12">
              Our machine learning algorithms analyze millions of data points including player performance, team tactics, injuries, and historical patterns to deliver championship-winning insights.
            </p>
            <div className="grid grid-cols-2 gap-8 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-4xl font-bold text-black mb-2">200+</div>
                <div className="text-base text-black/70">Data Points Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-black mb-2">ML</div>
                <div className="text-base text-black/70">Predictions</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Results Section - Black Background */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-8 lg:px-16">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Proven Results & Performance
                </h2>
                <p className="text-xl text-gray-300 leading-relaxed mb-8">
                  Our AI system processes over 200 performance metrics, fixture difficulty ratings, and historical data patterns to deliver winning recommendations.
                </p>
                <Button 
                  onClick={() => navigate('/predictor')}
                  className="bg-accent hover:bg-accent/90 text-black font-semibold px-8 py-4 text-lg"
                >
                  Try AI Predictor
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
              
              {/* Performance Stats */}
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-800 p-6 rounded-lg text-center">
                    <div className="text-3xl font-bold text-accent mb-2">ML</div>
                    <div className="text-gray-400 text-sm">Predictions</div>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-lg text-center">
                    <div className="text-3xl font-bold text-accent mb-2">Live</div>
                    <div className="text-gray-400 text-sm">Real-time Updates</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-800 p-6 rounded-lg text-center">
                    <div className="text-3xl font-bold text-accent mb-2">xG/xA</div>
                    <div className="text-gray-400 text-sm">Advanced Stats</div>
                  </div>
                  <div className="bg-gray-800 p-6 rounded-lg text-center">
                    <div className="text-3xl font-bold text-accent mb-2">FDR</div>
                    <div className="text-gray-400 text-sm">Fixture Difficulty</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - Black Background */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-8 lg:px-16">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Ready to Transform Your FPL Experience?
            </h2>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Join thousands of successful managers who use our AI-powered platform to dominate Fantasy Premier League. Get started in less than 60 seconds.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
              <Button 
                size="lg" 
                onClick={() => user ? navigate('/dashboard') : navigate('/login')}
                className="bg-accent hover:bg-accent/90 text-black font-semibold px-12 py-4 text-lg"
              >
                <Rocket className="mr-2 h-6 w-6" />
                {user ? 'Go to Dashboard' : 'Start Free Now'}
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                onClick={() => navigate('/my-team')}
                className="border-gray-600 text-white hover:bg-gray-800 px-12 py-4 text-lg"
              >
                <Crown className="mr-2 h-6 w-6" />
                Build My Team
              </Button>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400 pt-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-accent" />
                <span>Free Forever</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-accent" />
                <span>No Setup Fees</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-accent" />
                <span>Cancel Anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
