import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  HelpCircle, 
  Book, 
  Users, 
  Zap, 
  Shield, 
  BarChart3,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const categories = [
    {
      icon: Book,
      title: "Getting Started",
      description: "Learn the basics of our AI-powered FPL platform",
      articles: 12,
      color: "text-blue-500"
    },
    {
      icon: Zap,
      title: "AI Predictions",
      description: "Understand how our AI generates player predictions",
      articles: 8,
      color: "text-green-500"
    },
    {
      icon: BarChart3,
      title: "Team Management",
      description: "Master your squad selection and transfers",
      articles: 15,
      color: "text-purple-500"
    },
    {
      icon: Users,
      title: "Account & Profile",
      description: "Manage your account settings and FPL integration",
      articles: 6,
      color: "text-orange-500"
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Data protection and account security information",
      articles: 4,
      color: "text-red-500"
    }
  ];

  const faqs = [
    {
      question: "How accurate are the AI predictions?",
      answer: "Our AI model analyzes over 200 data points including recent form, fixture difficulty, injury reports, and historical patterns to generate player performance predictions. Captain recommendations and transfer suggestions are based on the same underlying models with confidence scores to help you make informed decisions."
    },
    {
      question: "How do I connect my existing FPL team?",
      answer: "Navigate to your Profile page and locate the 'Fantasy Premier League Integration' section. Enter your FPL Team ID (found in your FPL team URL) and click 'Connect FPL'. Your team data will be automatically imported and synced."
    },
    {
      question: "What data does the AI analyze for predictions?",
      answer: "Our AI processes player statistics (goals, assists, minutes played), team performance metrics, fixture difficulty ratings, injury reports, weather conditions, player rotation patterns, historical head-to-head data, and real-time form indicators."
    },
    {
      question: "How often are predictions updated?",
      answer: "Predictions are updated multiple times daily: player form metrics refresh every 6 hours, injury reports update in real-time, fixture difficulty ratings refresh weekly, and captain recommendations update 24 hours before each gameweek deadline."
    },
    {
      question: "Can I use the platform without connecting my FPL team?",
      answer: "Yes! You can access AI predictions, player analysis, fixture difficulty ratings, and team optimization tools without connecting your FPL account. However, connecting enables personalized recommendations and automatic team importing."
    },
    {
      question: "Is my FPL data secure?",
      answer: "Absolutely. We use bank-level encryption for all data transmission and storage. Your FPL credentials are never stored - we only access public team data using your Team ID. All personal information is protected under GDPR compliance."
    },
    {
      question: "How do I interpret the confidence scores?",
      answer: "Confidence scores (0-100%) indicate our AI's certainty in each prediction. 90%+ = Very High confidence, 80-89% = High confidence, 70-79% = Medium confidence, Below 70% = Lower confidence. Higher scores generally indicate more reliable predictions."
    },
    {
      question: "What makes your AI different from other FPL tools?",
      answer: "Our AI uses advanced machine learning algorithms trained on 5+ seasons of comprehensive data. Unlike basic statistical tools, we employ predictive modeling that considers player psychology, team dynamics, and situational factors for more nuanced predictions."
    }
  ];

  const quickLinks = [
    { title: "Setting Up Your Account", time: "2 min read" },
    { title: "Understanding AI Confidence Scores", time: "3 min read" },
    { title: "Connecting Your FPL Team", time: "1 min read" },
    { title: "Reading Player Predictions", time: "4 min read" },
    { title: "Using the Team Optimizer", time: "5 min read" },
    { title: "Captain Selection Guide", time: "3 min read" }
  ];

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto">
              <HelpCircle className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              Help Center
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Get help with our AI-powered Fantasy Premier League platform. Find answers, guides, and support resources.
            </p>
            
            {/* Search */}
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
              <Input
                placeholder="Search for help articles, guides, or common questions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Browse by Category
              </h2>
              <p className="text-xl text-gray-300">
                Find help topics organized by feature and functionality
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <Card key={index} className="bg-black border border-gray-700 hover:border-accent/50 transition-all duration-300 cursor-pointer group">
                    <CardHeader className="pb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                          <Icon className={`h-6 w-6 ${category.color}`} />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg text-white mb-2">{category.title}</CardTitle>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {category.description}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-gray-300 border-gray-600">
                          {category.articles} articles
                        </Badge>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-accent transition-colors" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Guides */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Quick Start Guides
              </h2>
              <p className="text-xl text-gray-300">
                Step-by-step tutorials to get you started quickly
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quickLinks.map((link, index) => (
                <div key={index} className="bg-gray-900 p-6 rounded-lg border border-gray-700 hover:border-accent/50 transition-all duration-300 cursor-pointer group">
                  <div className="flex items-center justify-between mb-4">
                    <Book className="w-6 h-6 text-gray-400 group-hover:text-accent transition-colors" />
                    <Badge variant="outline" className="text-xs text-gray-300 border-gray-600">
                      {link.time}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-accent transition-colors">
                    {link.title}
                  </h3>
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-accent transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-300">
                Common questions about our AI predictions and platform features
              </p>
            </div>
            
            <div className="space-y-4">
              {filteredFAQs.map((faq, index) => (
                <Card key={index} className="bg-black border border-gray-700">
                  <CardHeader 
                    className="cursor-pointer hover:bg-gray-800 transition-colors"
                    onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                  >
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-white pr-4">{faq.question}</CardTitle>
                      {expandedFAQ === index ? (
                        <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  {expandedFAQ === index && (
                    <CardContent className="pt-0">
                      <p className="text-gray-300 leading-relaxed">
                        {faq.answer}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Still Need Help?
            </h2>
            <p className="text-xl text-gray-300">
              Can't find what you're looking for? Our support team is here to help you succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-accent hover:bg-accent/90 text-black font-semibold px-8 py-4 rounded-lg transition-colors">
                Contact Support
              </button>
              <button className="border border-gray-600 text-white hover:bg-gray-800 px-8 py-4 rounded-lg transition-colors">
                Join Community
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}