import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Users, 
  Trophy, 
  TrendingUp, 
  Brain, 
  Target, 
  Lightbulb,
  Heart,
  Star,
  Globe,
  Award,
  Rocket,
  Shield,
  BarChart3,
  Clock
} from 'lucide-react';

export function AboutUs() {
  const story = [
    {
      year: "The Beginning",
      title: "Born from Frustration",
      description: "Two passionate FPL managers, frustrated by endless hours of manual research and inconsistent results, decided there had to be a better way.",
      detail: "After years of mediocre finishes despite countless hours analyzing stats, watching matches, and reading expert opinions, we realized the problem wasn't lack of effort—it was the inability to process and interpret vast amounts of data effectively."
    },
    {
      year: "The Vision",
      title: "AI-Powered Innovation",
      description: "We envisioned a platform where artificial intelligence could process millions of data points to provide insights no human could match.",
      detail: "Our vision was simple: democratize elite-level sports analytics. If professional clubs use advanced AI for player analysis, why shouldn't every FPL manager have access to similar technology?"
    },
    {
      year: "The Mission",
      title: "Leveling the Playing Field",
      description: "Our mission became clear: make advanced sports analytics accessible to every Fantasy Premier League manager, regardless of experience.",
      detail: "We believe that with the right tools and insights, any manager can compete at the highest level. Our platform is designed to turn casual players into strategic masterminds."
    }
  ];

  const values = [
    {
      icon: Brain,
      title: "Data-Driven Excellence",
      description: "Every recommendation is backed by comprehensive analysis of over 200 data points, ensuring you make informed decisions.",
      color: "text-blue-500"
    },
    {
      icon: Users,
      title: "Community First",
      description: "Built by FPL managers, for FPL managers. We understand the passion, frustration, and joy of the beautiful game.",
      color: "text-green-500"
    },
    {
      icon: Lightbulb,
      title: "Continuous Innovation",
      description: "We're constantly evolving our AI models and features based on the latest research and community feedback.",
      color: "text-yellow-500"
    },
    {
      icon: Heart,
      title: "Transparency & Trust",
      description: "We explain our AI's reasoning, provide confidence scores, and maintain open communication about our methods.",
      color: "text-red-500"
    },
    {
      icon: Target,
      title: "Results-Focused",
      description: "Everything we build has one goal: improving your FPL performance and helping you climb the global rankings.",
      color: "text-purple-500"
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Your data is sacred. We use bank-level encryption and never share your personal information with third parties.",
      color: "text-gray-500"
    }
  ];

  const achievements = [
    {
      icon: Users,
      stat: "AI",
      label: "Predictions",
      description: "Player performance and fixture analysis"
    },
    {
      icon: Brain,
      stat: "ML",
      label: "Models",
      description: "Data-driven recommendation engine"
    },
    {
      icon: Trophy,
      stat: "Team",
      label: "Optimization",
      description: "Squad and transfer suggestions"
    },
    {
      icon: Globe,
      stat: "FPL",
      label: "Data",
      description: "Official API integration"
    },
    {
      icon: TrendingUp,
      stat: "Dashboard",
      label: "Analytics",
      description: "Performance and form insights"
    },
    {
      icon: Star,
      stat: "Live",
      label: "Updates",
      description: "Real-time data and injury tracking"
    }
  ];

  const principles = [
    {
      icon: Zap,
      title: "Speed & Efficiency",
      description: "Get insights in seconds, not hours. Our AI processes complex analysis instantly, saving you valuable time."
    },
    {
      icon: BarChart3,
      title: "Accuracy First",
      description: "We prioritize precision over speed. Every prediction undergoes rigorous testing and validation."
    },
    {
      icon: Clock,
      title: "Real-Time Updates",
      description: "Stay ahead with live data feeds, injury updates, and lineup confirmations as they happen."
    },
    {
      icon: Rocket,
      title: "Continuous Improvement",
      description: "Our AI learns from every gameweek, constantly refining predictions and enhancing accuracy."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              About Our Story
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              From frustrated FPL managers to AI pioneers - discover how our passion for Fantasy Premier League led to revolutionary technology that's changing the game for hundreds of thousands of managers worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Our Journey
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Every great platform starts with a problem that needs solving. Here's how our frustration became your solution.
              </p>
            </div>

            <div className="space-y-12">
              {story.map((chapter, index) => (
                <div key={index} className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className={`space-y-6 ${index % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <div>
                      <Badge className="bg-accent/10 text-accent border-accent/30 mb-4">
                        {chapter.year}
                      </Badge>
                      <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                        {chapter.title}
                      </h3>
                      <p className="text-xl text-gray-300 mb-6">
                        {chapter.description}
                      </p>
                      <p className="text-gray-400 leading-relaxed">
                        {chapter.detail}
                      </p>
                    </div>
                  </div>
                  <div className={`${index % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <Card className="bg-black border border-gray-700 p-8">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                          {index === 0 && <Lightbulb className="w-10 h-10 text-accent" />}
                          {index === 1 && <Brain className="w-10 h-10 text-accent" />}
                          {index === 2 && <Target className="w-10 h-10 text-accent" />}
                        </div>
                        <div className="text-4xl font-bold text-white mb-2">
                          {index === 0 && "The Problem"}
                          {index === 1 && "The Solution"}
                          {index === 2 && "The Impact"}
                        </div>
                        <p className="text-gray-300">
                          {index === 0 && "Manual research was time-consuming and ineffective"}
                          {index === 1 && "AI could process data beyond human capability"}
                          {index === 2 && "Democratizing elite sports analytics for everyone"}
                        </p>
                      </div>
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Our Impact in Numbers
              </h2>
              <p className="text-xl text-gray-300">
                Real results from real managers who trust our platform
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {achievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <Card key={index} className="text-center p-6 bg-gray-900 border border-gray-700">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-8 h-8 text-accent" />
                    </div>
                    <div className="text-4xl font-bold text-white mb-2">{achievement.stat}</div>
                    <div className="text-xl font-semibold text-gray-300 mb-3">{achievement.label}</div>
                    <div className="text-sm text-gray-400">{achievement.description}</div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                What Drives Us
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                The core values that guide every decision we make and every feature we build.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <Card key={index} className="bg-black border border-gray-700 p-6 hover:shadow-lg transition-shadow">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Icon className={`w-6 h-6 ${value.color}`} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                      <p className="text-gray-300 leading-relaxed">{value.description}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* How We Work */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Our Operating Principles
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                How we deliver exceptional results for our community of FPL managers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {principles.map((principle, index) => {
                const Icon = principle.icon;
                return (
                  <Card key={index} className="bg-card border border-white/10 p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-3">{principle.title}</h3>
                        <p className="text-white/80 leading-relaxed">{principle.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Looking Forward */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              The Future is Bright
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed">
              We're just getting started. Our roadmap includes advanced machine learning features, 
              expanded league coverage, mobile applications, and community tools that will further 
              revolutionize how fantasy football is played.
            </p>
            <p className="text-lg text-gray-400">
              Join us on this journey as we continue to push the boundaries of what's possible 
              in fantasy sports analytics. Together, we're not just improving FPL performance - 
              we're shaping the future of fantasy football.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-accent hover:bg-accent/90 text-black font-semibold px-8 py-4 rounded-lg transition-colors">
                Join Our Community
              </button>
              <button className="border border-gray-600 text-white hover:bg-gray-800 px-8 py-4 rounded-lg transition-colors">
                Learn About Our Technology
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}