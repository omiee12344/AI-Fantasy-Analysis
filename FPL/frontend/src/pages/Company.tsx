import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Target, 
  Users, 
  Award, 
  Globe, 
  TrendingUp,
  Brain,
  Shield,
  Zap,
  Heart,
  Lightbulb,
  Rocket,
  MapPin,
  Calendar,
  ExternalLink
} from 'lucide-react';

export function Company() {
  const values = [
    {
      icon: Brain,
      title: "Innovation First",
      description: "We push the boundaries of AI and machine learning to deliver cutting-edge solutions for Fantasy Premier League managers."
    },
    {
      icon: Shield,
      title: "Trust & Transparency",
      description: "We maintain the highest standards of data security and provide clear, honest insights into our AI's decision-making process."
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Our platform is built for the FPL community, with features and improvements guided by user feedback and needs."
    },
    {
      icon: Target,
      title: "Results Focused",
      description: "Every feature is designed with one goal: helping you achieve better FPL performance and climb the global rankings."
    }
  ];

  const team = [
    {
      name: "Alex Thompson",
      role: "CEO & Co-Founder",
      description: "Former data scientist at Google with 10+ years in AI/ML. Passionate FPL manager since 2009.",
      image: "/team/alex.jpg",
      linkedin: "#"
    },
    {
      name: "Sarah Chen",
      role: "CTO & Co-Founder", 
      description: "Machine learning engineer with expertise in sports analytics. Built predictive models for Premier League clubs.",
      image: "/team/sarah.jpg",
      linkedin: "#"
    },
    {
      name: "Marcus Rodriguez",
      role: "Head of Product",
      description: "Product management veteran with experience at fantasy sports platforms. Top 10k FPL manager.",
      image: "/team/marcus.jpg",
      linkedin: "#"
    },
    {
      name: "Dr. Emily Watson",
      role: "Lead Data Scientist",
      description: "PhD in Statistics from Cambridge. Specializes in sports performance modeling and predictive analytics.",
      image: "/team/emily.jpg",
      linkedin: "#"
    }
  ];

  const milestones = [
    {
      year: "2020",
      title: "Company Founded",
      description: "Started as a side project by two FPL enthusiasts who wanted to apply AI to fantasy football."
    },
    {
      year: "2021",
      title: "First AI Model",
      description: "Launched our initial prediction algorithm and beta platform."
    },
    {
      year: "2022",
      title: "Platform Launch",
      description: "Public launch with improved AI model and expanded features."
    },
    {
      year: "2023",
      title: "Expansion",
      description: "Enhanced AI capabilities and team optimization tools."
    },
    {
      year: "2024",
      title: "Ongoing Development",
      description: "Continuous improvements to predictions and analytics features."
    }
  ];

  const stats = [
    {
      icon: Users,
      value: "AI",
      label: "Predictions",
      description: "Player and fixture analysis"
    },
    {
      icon: Brain,
      value: "ML",
      label: "Models",
      description: "Data-driven recommendations"
    },
    {
      icon: Globe,
      value: "FPL",
      label: "Integration",
      description: "Official API data"
    },
    {
      icon: Award,
      value: "Dashboard",
      label: "Analytics",
      description: "Team and performance insights"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto">
              <Building className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              About Our Company
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              We're revolutionizing Fantasy Premier League through artificial intelligence, helping managers make smarter decisions and achieve better results.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div>
                  <Badge className="bg-accent/10 text-accent border-accent/30 mb-4">
                    Our Mission
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                    Democratizing Fantasy Football Intelligence
                  </h2>
                  <p className="text-xl text-gray-300 leading-relaxed">
                    Our mission is to make advanced sports analytics accessible to every Fantasy Premier League manager, regardless of their technical background or experience level.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">Our Vision</h3>
                  <p className="text-gray-300 leading-relaxed">
                    To provide a transparent, data-driven AI platform for Fantasy Premier League analytics that helps managers make informed decisions.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={index} className="text-center p-6 bg-black border border-gray-700">
                      <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6 text-accent" />
                      </div>
                      <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                      <div className="text-lg font-semibold text-gray-300 mb-2">{stat.label}</div>
                      <div className="text-sm text-gray-400">{stat.description}</div>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Values */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Our Core Values
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                The principles that guide everything we do and every decision we make.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <Card key={index} className="bg-gray-900 border border-gray-700 p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                        <p className="text-gray-300 leading-relaxed">{value.description}</p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Meet Our Team
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Passionate AI experts and FPL enthusiasts working together to revolutionize fantasy football.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {team.map((member, index) => (
                <Card key={index} className="bg-black border border-gray-700 overflow-hidden">
                  <div className="w-full h-48 bg-gray-800 flex items-center justify-center">
                    <Users className="w-16 h-16 text-gray-400" />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                    <p className="text-accent font-semibold mb-3">{member.role}</p>
                    <p className="text-gray-300 text-sm leading-relaxed mb-4">{member.description}</p>
                    <button className="text-accent hover:text-accent/80 transition-colors">
                      <ExternalLink className="w-4 h-4 inline mr-1" />
                      LinkedIn
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Company Timeline */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Our Journey
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                From a simple idea to serving hundreds of thousands of FPL managers worldwide.
              </p>
            </div>
            
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex gap-6 items-start">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center">
                      <Calendar className="w-8 h-8 text-black" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="bg-card border border-white/10 rounded-lg p-6">
                      <div className="flex items-center gap-4 mb-3">
                        <Badge className="bg-accent/20 text-accent border-accent/30">
                          {milestone.year}
                        </Badge>
                        <h3 className="text-xl font-bold text-white">{milestone.title}</h3>
                      </div>
                      <p className="text-white/80 leading-relaxed">{milestone.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Technology & Innovation */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div>
                  <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30 mb-4">
                    Technology
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                    Cutting-Edge AI Technology
                  </h2>
                  <p className="text-xl text-gray-300 leading-relaxed mb-6">
                    Our platform uses machine learning and FPL data to deliver predictions and analytics for fantasy managers.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    <span className="text-gray-300">Advanced neural networks for player performance prediction</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    <span className="text-gray-700">Real-time data processing and analysis pipeline</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    <span className="text-gray-700">Cloud-based infrastructure for 99.9% uptime</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    <span className="text-gray-700">Continuous model improvement and optimization</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <Card className="bg-gray-900 border border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Brain className="w-8 h-8 text-accent" />
                    <h3 className="text-xl font-bold text-white">AI Research</h3>
                  </div>
                  <p className="text-gray-300">
                    Our dedicated research team continuously improves our AI models, incorporating the latest advances in machine learning and sports analytics.
                  </p>
                </Card>
                
                <Card className="bg-gray-900 border border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-8 h-8 text-blue-500" />
                    <h3 className="text-xl font-bold text-white">Data Security</h3>
                  </div>
                  <p className="text-gray-300">
                    Bank-level encryption and security protocols ensure your data is always protected. We're GDPR compliant and SOC 2 certified.
                  </p>
                </Card>
                
                <Card className="bg-gray-900 border border-gray-700 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Rocket className="w-8 h-8 text-purple-500" />
                    <h3 className="text-xl font-bold text-white">Performance</h3>
                  </div>
                  <p className="text-gray-300">
                    Optimized for speed and reliability, our platform delivers real-time predictions and updates with sub-second response times.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Join Us */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Join Our Mission
            </h2>
            <p className="text-xl text-gray-300">
              We're always looking for talented individuals who share our passion for AI, sports analytics, and fantasy football.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-accent hover:bg-accent/90 text-black font-semibold px-8 py-4 rounded-lg transition-colors">
                View Open Positions
              </button>
              <button className="border border-gray-600 text-white hover:bg-gray-800 px-8 py-4 rounded-lg transition-colors">
                Learn About Our Culture
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}