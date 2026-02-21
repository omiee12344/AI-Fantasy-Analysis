import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  HeadphonesIcon,
  Users,
  Bug,
  Lightbulb,
  CreditCard,
  Shield,
  Globe,
  ExternalLink,
  CheckCircle
} from 'lucide-react';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  });

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email with detailed responses",
      contact: "support@fplpredictor.com",
      responseTime: "24 hours",
      availability: "24/7",
      color: "text-blue-500"
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Instant support for urgent questions",
      contact: "Available in-app",
      responseTime: "< 5 minutes",
      availability: "9 AM - 6 PM GMT",
      color: "text-green-500"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Direct phone support for premium users",
      contact: "+44 20 7946 0958",
      responseTime: "Immediate",
      availability: "Business hours",
      color: "text-purple-500"
    }
  ];

  const supportCategories = [
    {
      icon: HeadphonesIcon,
      title: "General Support",
      description: "Account help, feature questions, and platform guidance",
      email: "support@fplpredictor.com"
    },
    {
      icon: Bug,
      title: "Technical Issues",
      description: "Bug reports, performance issues, and technical problems",
      email: "technical@fplpredictor.com"
    },
    {
      icon: CreditCard,
      title: "Billing & Payments",
      description: "Subscription issues, payment problems, and refund requests",
      email: "billing@fplpredictor.com"
    },
    {
      icon: Lightbulb,
      title: "Feature Requests",
      description: "Suggestions, feedback, and new feature ideas",
      email: "feedback@fplpredictor.com"
    },
    {
      icon: Shield,
      title: "Privacy & Security",
      description: "Data protection, privacy concerns, and security reports",
      email: "privacy@fplpredictor.com"
    },
    {
      icon: Users,
      title: "Partnerships",
      description: "Business partnerships, API access, and collaboration",
      email: "partnerships@fplpredictor.com"
    }
  ];

  const faqs = [
    {
      question: "How quickly do you respond to support requests?",
      answer: "Email support: within 24 hours. Live chat: under 5 minutes during business hours. Phone: immediate during business hours."
    },
    {
      question: "What information should I include in my support request?",
      answer: "Include your account email, describe the issue clearly, mention what you were trying to do, and include any error messages or screenshots."
    },
    {
      question: "Do you offer phone support for all users?",
      answer: "Phone support is available for Premium and Pro subscription users. Free tier users can access email and live chat support."
    },
    {
      question: "Can I request new features or improvements?",
      answer: "Absolutely! We welcome feature requests and feedback. Use our feedback form or email feedback@fplpredictor.com with your suggestions."
    }
  ];

  const officeLocations = [
    {
      city: "London, UK",
      address: "123 Tech Street, London EC2A 4DP",
      phone: "+44 20 7946 0958",
      hours: "9 AM - 6 PM GMT"
    },
    {
      city: "San Francisco, USA",
      address: "456 Innovation Ave, San Francisco CA 94107",
      phone: "+1 (555) 123-4567",
      hours: "9 AM - 6 PM PST"
    }
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto">
              <HeadphonesIcon className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              Contact Support
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Get the help you need to maximize your FPL performance. Our expert support team is here to assist with any questions or issues.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                <Clock className="w-4 h-4 mr-2" />
                24/7 Email Support
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                <MessageSquare className="w-4 h-4 mr-2" />
                Live Chat Available
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                How to Reach Us
              </h2>
              <p className="text-xl text-gray-300">
                Choose the support method that works best for you
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {contactMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <Card key={index} className="text-center p-6 bg-black border border-gray-700 hover:shadow-lg transition-shadow">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Icon className={`w-8 h-8 ${method.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">{method.title}</h3>
                    <p className="text-gray-300 mb-4">{method.description}</p>
                    <div className="space-y-2 text-sm">
                      <div className="font-semibold text-white">{method.contact}</div>
                      <div className="text-gray-300">Response: {method.responseTime}</div>
                      <div className="text-gray-300">{method.availability}</div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Send us a Message
              </h2>
              <p className="text-xl text-gray-300">
                Fill out the form below and we'll get back to you as soon as possible
              </p>
            </div>

            <Card className="bg-gray-900 border border-gray-700 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Full Name *
                    </label>
                    <Input
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Subject *
                    </label>
                    <Input
                      placeholder="Brief description of your inquiry"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      required
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-white mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent"
                    >
                      <option value="">Select a category</option>
                      <option value="general">General Support</option>
                      <option value="technical">Technical Issues</option>
                      <option value="billing">Billing & Payments</option>
                      <option value="feedback">Feature Requests</option>
                      <option value="privacy">Privacy & Security</option>
                      <option value="partnership">Partnerships</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Message *
                  </label>
                  <textarea
                    placeholder="Please describe your inquiry in detail..."
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    required
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-accent resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-gray-300">
                    * Required fields. We'll respond within 24 hours.
                  </p>
                  <button
                    type="submit"
                    className="bg-accent hover:bg-accent/90 text-black font-semibold px-8 py-3 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send Message
                  </button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* Support Categories */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Specialized Support Teams
              </h2>
              <p className="text-xl text-gray-300">
                Direct access to our specialized support departments
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {supportCategories.map((category, index) => {
                const Icon = category.icon;
                return (
                  <Card key={index} className="bg-black border border-gray-700 hover:border-accent/50 transition-all duration-300 p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-accent" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">{category.title}</h3>
                        <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                          {category.description}
                        </p>
                        <div className="text-accent text-sm font-semibold">
                          {category.email}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Support FAQ
              </h2>
              <p className="text-xl text-gray-300">
                Quick answers to common support questions
              </p>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index} className="bg-gray-900 border border-gray-700 p-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-bold text-white mb-3">{faq.question}</h3>
                      <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Our Offices
              </h2>
              <p className="text-xl text-gray-300">
                Visit us at our global headquarters
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {officeLocations.map((office, index) => (
                <Card key={index} className="bg-black border border-gray-700 p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MapPin className="w-8 h-8 text-accent" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">{office.city}</h3>
                    <div className="space-y-3 text-gray-300">
                      <div className="flex items-center justify-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{office.address}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{office.phone}</span>
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{office.hours}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Community & Social */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Join Our Community
            </h2>
            <p className="text-xl text-gray-300">
              Connect with other FPL managers and get community support
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Card className="bg-card border border-white/10 p-6">
                <div className="text-center">
                  <Globe className="w-8 h-8 text-accent mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">Discord Community</h3>
                  <p className="text-white/80 mb-4">
                    Join thousands of FPL managers for tips, discussions, and support.
                  </p>
                  <button className="bg-accent hover:bg-accent/90 text-black font-semibold px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto">
                    Join Discord
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </Card>

              <Card className="bg-card border border-white/10 p-6">
                <div className="text-center">
                  <Users className="w-8 h-8 text-accent mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">Reddit Community</h3>
                  <p className="text-white/80 mb-4">
                    Participate in discussions and share strategies with fellow managers.
                  </p>
                  <button className="border border-gray-600 text-white hover:bg-gray-800 px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto">
                    Visit Reddit
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </Card>

              <Card className="bg-card border border-white/10 p-6">
                <div className="text-center">
                  <MessageSquare className="w-8 h-8 text-accent mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">Knowledge Base</h3>
                  <p className="text-white/80 mb-4">
                    Browse our comprehensive guides and tutorials.
                  </p>
                  <button className="border border-gray-600 text-white hover:bg-gray-800 px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto">
                    Browse Guides
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}