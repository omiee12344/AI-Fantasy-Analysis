import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Code, 
  Zap, 
  Target, 
  BarChart3, 
  Users, 
  ArrowRight,
  ExternalLink,
  Download,
  Play,
  ChevronRight,
  Database,
  Brain,
  Shield,
  Cpu
} from 'lucide-react';

export function Documentation() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const navigationSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Play,
      items: [
        'Quick Start Guide',
        'Account Setup',
        'FPL Integration',
        'First Predictions'
      ]
    },
    {
      id: 'ai-features',
      title: 'AI Features',
      icon: Brain,
      items: [
        'Prediction Models',
        'Confidence Scores',
        'Data Sources',
        'Algorithm Updates'
      ]
    },
    {
      id: 'team-management',
      title: 'Team Management',
      icon: Users,
      items: [
        'Squad Builder',
        'Transfer Optimizer',
        'Captain Selection',
        'Formation Analysis'
      ]
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      icon: Code,
      items: [
        'Authentication',
        'Endpoints',
        'Response Format',
        'Rate Limits'
      ]
    }
  ];

  const features = [
    {
      icon: Brain,
      title: "AI Prediction Engine",
      description: "Advanced machine learning models for player performance prediction",
      details: [
        "ML-powered predictions across player and fixture analysis",
        "Real-time form analysis and injury tracking",
        "Weather impact modeling for player performance",
        "Historical pattern recognition spanning 5+ seasons"
      ]
    },
    {
      icon: Target,
      title: "Captain Recommendations",
      description: "AI-driven captain selection with confidence scoring",
      details: [
        "Confidence-scored captain recommendations",
        "Fixture difficulty integration",
        "Player rotation risk assessment",
        "Expected points calculation with variance analysis"
      ]
    },
    {
      icon: BarChart3,
      title: "Transfer Optimizer",
      description: "Intelligent transfer suggestions based on multiple factors",
      details: [
        "Price change prediction algorithms",
        "Optimal timing for transfers",
        "Budget optimization strategies",
        "Long-term team building recommendations"
      ]
    },
    {
      icon: Database,
      title: "Data Analytics",
      description: "Comprehensive data processing and analysis pipeline",
      details: [
        "200+ data points per player per gameweek",
        "Real-time API integration with official FPL data",
        "Advanced statistical modeling and trend analysis",
        "Custom metrics development for edge cases"
      ]
    }
  ];

  const apiEndpoints = [
    {
      method: "GET",
      endpoint: "/api/predictions/{player_id}",
      description: "Get AI predictions for a specific player",
      response: "Player performance predictions with confidence scores"
    },
    {
      method: "GET",
      endpoint: "/api/team/{team_id}",
      description: "Retrieve team data and current squad",
      response: "Complete team information including squad and statistics"
    },
    {
      method: "POST",
      endpoint: "/api/optimize",
      description: "Get optimal team suggestions",
      response: "Recommended transfers and captain selection"
    },
    {
      method: "GET",
      endpoint: "/api/fixtures",
      description: "Get fixture difficulty analysis",
      response: "Fixture difficulty ratings and schedule analysis"
    }
  ];

  const codeExample = `// Example: Fetching player predictions
const response = await fetch('/api/predictions/1', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const prediction = await response.json();
console.log(prediction);

// Response format:
{
  "player_id": 1,
  "name": "Erling Haaland",
  "predictions": {
    "next_gameweek_points": 8.2,
    "confidence": 87,
    "captain_recommendation": true,
    "transfer_priority": "high"
  },
  "factors": {
    "recent_form": 9.1,
    "fixture_difficulty": 2,
    "injury_risk": "low"
  }
}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              Documentation
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Complete technical documentation for our AI-powered Fantasy Premier League platform. Learn how to maximize your team's potential.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-accent hover:bg-accent/90 text-black font-semibold px-8 py-4 rounded-lg transition-colors">
                Get Started
              </button>
              <button className="border border-white/40 text-white hover:bg-white/10 px-8 py-4 rounded-lg transition-colors">
                <Download className="w-5 h-5 mr-2 inline" />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-2">
                <h3 className="text-lg font-semibold text-white mb-4">Navigation</h3>
                {navigationSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <div key={section.id} className="space-y-1">
                      <button
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                          activeSection === section.id
                            ? 'bg-accent/20 text-accent border border-accent/30'
                            : 'text-white/70 hover:text-accent hover:bg-accent/10'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {section.title}
                      </button>
                      {activeSection === section.id && (
                        <div className="ml-7 space-y-1">
                          {section.items.map((item, index) => (
                            <button
                              key={index}
                              className="block w-full text-left px-3 py-2 text-sm text-white/60 hover:text-accent transition-colors"
                            >
                              {item}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
                {/* Getting Started */}
                <TabsContent value="getting-started" className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-4">Getting Started</h2>
                    <p className="text-white/70 text-lg mb-8">
                      Welcome to our AI-powered FPL platform. Follow this guide to get up and running in minutes.
                    </p>
                  </div>

                  <div className="grid gap-6">
                    <Card className="bg-card border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-3">
                          <span className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-black font-bold">1</span>
                          Create Your Account
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-white/80 space-y-4">
                        <p>Sign up with your email and create a secure password. No credit card required.</p>
                        <div className="bg-background/50 p-4 rounded-lg">
                          <code className="text-accent">navigate('/register')</code>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-3">
                          <span className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-black font-bold">2</span>
                          Connect Your FPL Team
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-white/80 space-y-4">
                        <p>Link your existing Fantasy Premier League team to enable personalized recommendations.</p>
                        <ul className="list-disc list-inside space-y-2 text-sm">
                          <li>Go to Profile → FPL Integration</li>
                          <li>Enter your FPL Team ID</li>
                          <li>Click "Connect FPL" to import your data</li>
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-3">
                          <span className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-black font-bold">3</span>
                          Start Getting Predictions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-white/80 space-y-4">
                        <p>Access AI-powered predictions and recommendations immediately.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-background/50 p-4 rounded-lg">
                            <h4 className="font-semibold text-accent mb-2">Dashboard</h4>
                            <p className="text-sm">Overview and key metrics</p>
                          </div>
                          <div className="bg-background/50 p-4 rounded-lg">
                            <h4 className="font-semibold text-accent mb-2">Predictor</h4>
                            <p className="text-sm">Detailed AI predictions</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* AI Features */}
                <TabsContent value="ai-features" className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-4">AI Features</h2>
                    <p className="text-white/70 text-lg mb-8">
                      Understand our advanced AI capabilities and how they can improve your FPL performance.
                    </p>
                  </div>

                  <div className="grid gap-6">
                    {features.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <Card key={index} className="bg-card border-white/10">
                          <CardHeader>
                            <CardTitle className="text-white flex items-center gap-3">
                              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                                <Icon className="w-5 h-5 text-accent" />
                              </div>
                              {feature.title}
                            </CardTitle>
                            <p className="text-white/70">{feature.description}</p>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2">
                              {feature.details.map((detail, idx) => (
                                <li key={idx} className="text-white/80 flex items-start gap-2">
                                  <ChevronRight className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                                  {detail}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* Team Management */}
                <TabsContent value="team-management" className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-4">Team Management</h2>
                    <p className="text-white/70 text-lg mb-8">
                      Master the tools and strategies for optimal team management and squad selection.
                    </p>
                  </div>

                  <div className="grid gap-6">
                    <Card className="bg-card border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white">Squad Building Strategy</CardTitle>
                      </CardHeader>
                      <CardContent className="text-white/80 space-y-4">
                        <p>Our AI recommends optimal squad composition based on:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-background/50 p-4 rounded-lg">
                            <h4 className="font-semibold text-accent mb-2">Budget Optimization</h4>
                            <p className="text-sm">Maximize value within £100M budget</p>
                          </div>
                          <div className="bg-background/50 p-4 rounded-lg">
                            <h4 className="font-semibold text-accent mb-2">Risk Distribution</h4>
                            <p className="text-sm">Balance high-risk, high-reward picks</p>
                          </div>
                          <div className="bg-background/50 p-4 rounded-lg">
                            <h4 className="font-semibold text-accent mb-2">Fixture Planning</h4>
                            <p className="text-sm">Long-term fixture difficulty analysis</p>
                          </div>
                          <div className="bg-background/50 p-4 rounded-lg">
                            <h4 className="font-semibold text-accent mb-2">Form Analysis</h4>
                            <p className="text-sm">Recent performance trend evaluation</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white">Transfer Timing</CardTitle>
                      </CardHeader>
                      <CardContent className="text-white/80 space-y-4">
                        <p>Optimal transfer strategies powered by AI analysis:</p>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <ChevronRight className="w-4 h-4 text-accent mt-0.5" />
                            <strong>Early Transfers:</strong> Make moves before price changes
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="w-4 h-4 text-accent mt-0.5" />
                            <strong>Deadline Day:</strong> Last-minute injury and team news
                          </li>
                          <li className="flex items-start gap-2">
                            <ChevronRight className="w-4 h-4 text-accent mt-0.5" />
                            <strong>Wildcard Timing:</strong> Optimal gameweeks for major overhauls
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* API Reference */}
                <TabsContent value="api-reference" className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-4">API Reference</h2>
                    <p className="text-white/70 text-lg mb-8">
                      Technical documentation for developers integrating with our platform.
                    </p>
                  </div>

                  <Card className="bg-card border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Authentication</CardTitle>
                    </CardHeader>
                    <CardContent className="text-white/80 space-y-4">
                      <p>All API requests require authentication using Bearer tokens:</p>
                      <div className="bg-background p-4 rounded-lg font-mono text-sm">
                        <code className="text-accent">Authorization: Bearer YOUR_API_KEY</code>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Endpoints</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {apiEndpoints.map((endpoint, index) => (
                        <div key={index} className="border border-white/10 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={`${endpoint.method === 'GET' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                              {endpoint.method}
                            </Badge>
                            <code className="text-accent">{endpoint.endpoint}</code>
                          </div>
                          <p className="text-white/70 text-sm mb-2">{endpoint.description}</p>
                          <p className="text-white/60 text-xs">Returns: {endpoint.response}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card className="bg-card border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Example Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-background p-4 rounded-lg">
                        <pre className="text-sm text-white/80 overflow-x-auto">
                          <code>{codeExample}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Need More Help?
            </h2>
            <p className="text-xl text-gray-300">
              Join our developer community or contact our technical support team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-accent hover:bg-accent/90 text-black font-semibold px-8 py-4 rounded-lg transition-colors">
                <ExternalLink className="w-5 h-5 mr-2 inline" />
                Developer Forum
              </button>
              <button className="border border-gray-600 text-white hover:bg-gray-800 px-8 py-4 rounded-lg transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}