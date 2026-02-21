import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Eye, 
  Lock, 
  Database, 
  UserCheck, 
  FileText, 
  Globe, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Settings,
  Mail
} from 'lucide-react';

export function PrivacyPolicy() {
  const lastUpdated = "January 15, 2024";

  const quickSummary = [
    {
      icon: Database,
      title: "Data We Collect",
      description: "Email, FPL Team ID, usage analytics, and performance preferences"
    },
    {
      icon: Shield,
      title: "How We Protect",
      description: "Bank-level encryption, secure servers, and GDPR compliance"
    },
    {
      icon: Eye,
      title: "What We Share",
      description: "We never sell your data. Limited sharing only for service operation"
    },
    {
      icon: UserCheck,
      title: "Your Rights",
      description: "Access, modify, or delete your data anytime through your account"
    }
  ];

  const sections = [
    {
      id: "information-collection",
      title: "Information We Collect",
      icon: Database,
      content: [
        {
          subtitle: "Account Information",
          details: "When you create an account, we collect your email address, chosen username, and any profile information you provide. This information is necessary to create and maintain your account."
        },
        {
          subtitle: "FPL Integration Data",
          details: "If you choose to connect your Fantasy Premier League account, we collect your FPL Team ID and publicly available team information. We never store your FPL login credentials."
        },
        {
          subtitle: "Usage and Analytics Data",
          details: "We collect information about how you interact with our platform, including pages visited, features used, prediction accuracy tracking, and performance metrics to improve our service."
        },
        {
          subtitle: "Technical Information",
          details: "We automatically collect certain technical information including IP address, browser type, device information, and operating system to ensure platform compatibility and security."
        }
      ]
    },
    {
      id: "data-usage",
      title: "How We Use Your Information",
      icon: Settings,
      content: [
        {
          subtitle: "Service Provision",
          details: "Your data enables us to provide personalized AI predictions, track your FPL performance, and customize recommendations based on your team and preferences."
        },
        {
          subtitle: "Platform Improvement",
          details: "We analyze aggregated usage patterns to enhance our AI algorithms, develop new features, and improve overall user experience."
        },
        {
          subtitle: "Communication",
          details: "We use your email to send important account updates, feature announcements, and optional marketing communications (which you can opt out of anytime)."
        },
        {
          subtitle: "Security and Compliance",
          details: "Your information helps us maintain platform security, prevent fraud, and comply with legal obligations."
        }
      ]
    },
    {
      id: "data-protection",
      title: "Data Protection & Security",
      icon: Lock,
      content: [
        {
          subtitle: "Encryption Standards",
          details: "All data transmission uses industry-standard TLS 1.3 encryption. Personal data is encrypted at rest using AES-256 encryption standards."
        },
        {
          subtitle: "Access Controls",
          details: "We implement strict access controls ensuring only authorized personnel can access user data, and only when necessary for service operation or user support."
        },
        {
          subtitle: "Regular Security Audits",
          details: "Our systems undergo regular security assessments and penetration testing to identify and address potential vulnerabilities."
        },
        {
          subtitle: "Incident Response",
          details: "We maintain a comprehensive incident response plan to quickly address any potential security breaches and notify affected users promptly."
        }
      ]
    },
    {
      id: "data-sharing",
      title: "Information Sharing & Disclosure",
      icon: Globe,
      content: [
        {
          subtitle: "Third-Party Services",
          details: "We use trusted service providers for hosting, analytics, and email delivery. These providers are contractually bound to protect your data and use it only for specified purposes."
        },
        {
          subtitle: "Legal Requirements",
          details: "We may disclose information when required by law, legal process, or to protect our rights, users' safety, or the security of our platform."
        },
        {
          subtitle: "Business Transfers",
          details: "In the event of a merger, acquisition, or sale of assets, user information may be transferred as part of that transaction, subject to the same privacy protections."
        },
        {
          subtitle: "Aggregated Data",
          details: "We may share anonymized, aggregated data that cannot identify individual users for research, analytics, or promotional purposes."
        }
      ]
    },
    {
      id: "user-rights",
      title: "Your Rights & Controls",
      icon: UserCheck,
      content: [
        {
          subtitle: "Data Access",
          details: "You can access and review all personal data we hold about you through your account settings or by contacting our support team."
        },
        {
          subtitle: "Data Correction",
          details: "You can update or correct your personal information anytime through your profile settings. For assistance, contact our support team."
        },
        {
          subtitle: "Data Deletion",
          details: "You can request deletion of your account and associated data. Some information may be retained for legal compliance or legitimate business purposes."
        },
        {
          subtitle: "Data Portability",
          details: "You can request a copy of your data in a portable format. We'll provide this within 30 days of your request."
        },
        {
          subtitle: "Communication Preferences",
          details: "You control all communication preferences and can opt out of marketing emails while continuing to receive essential service communications."
        }
      ]
    },
    {
      id: "retention",
      title: "Data Retention",
      icon: Clock,
      content: [
        {
          subtitle: "Account Data",
          details: "We retain your account information as long as your account remains active. After account deletion, most data is removed within 90 days."
        },
        {
          subtitle: "Usage Analytics",
          details: "Aggregated usage data may be retained longer for product improvement and research purposes, but is anonymized and cannot identify individual users."
        },
        {
          subtitle: "Legal Compliance",
          details: "Some data may be retained longer when required by law, regulation, or for legitimate business purposes such as fraud prevention."
        }
      ]
    },
    {
      id: "compliance",
      title: "Regulatory Compliance",
      icon: CheckCircle,
      content: [
        {
          subtitle: "GDPR Compliance",
          details: "We fully comply with the General Data Protection Regulation (GDPR) for users in the European Union, providing comprehensive data protection rights."
        },
        {
          subtitle: "CCPA Compliance",
          details: "California residents have additional rights under the California Consumer Privacy Act (CCPA), including the right to know, delete, and opt-out of data sales."
        },
        {
          subtitle: "SOC 2 Certification",
          details: "Our infrastructure and security practices are SOC 2 Type II certified, ensuring industry-standard security and availability controls."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="py-24 bg-black">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto">
              <Shield className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              Privacy Policy
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Your privacy is fundamental to our service. Learn how we collect, use, and protect your information to deliver the best FPL experience while keeping your data secure.
            </p>
            <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
              Last Updated: {lastUpdated}
            </Badge>
          </div>
        </div>
      </section>

      {/* Quick Summary */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Privacy at a Glance
              </h2>
              <p className="text-xl text-gray-300">
                Quick overview of our key privacy practices
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickSummary.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Card key={index} className="text-center p-6 bg-black border border-gray-700">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-3">{item.title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{item.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-12 bg-amber-50 border-y border-amber-200">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-amber-900 mb-2">Important Notice</h3>
                <p className="text-amber-800 leading-relaxed">
                  This Privacy Policy applies to all users of our Fantasy Premier League AI platform. 
                  By using our service, you agree to the collection and use of information as described in this policy. 
                  We encourage you to read this policy in full to understand how we handle your data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Sections */}
      {sections.map((section, sectionIndex) => (
        <section key={section.id} className={`py-20 ${sectionIndex % 2 === 0 ? 'bg-black' : 'bg-gray-900'}`}>
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <section.icon className="w-6 h-6 text-accent" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                  {section.title}
                </h2>
              </div>

              <div className="space-y-8">
                {section.content.map((item, itemIndex) => (
                  <Card key={itemIndex} className="bg-gray-800 border border-gray-600 p-6">
                    <h3 className="text-xl font-bold text-white mb-4">{item.subtitle}</h3>
                    <p className="text-gray-300 leading-relaxed">{item.details}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      ))}

      {/* Contact & Updates */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-black" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Questions About Privacy?
            </h2>
            <p className="text-xl text-gray-300">
              We're committed to transparency and are here to address any privacy concerns you may have.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              <Card className="bg-card border border-white/10 p-6">
                <div className="text-center">
                  <FileText className="w-8 h-8 text-accent mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">Privacy Requests</h3>
                  <p className="text-white/80 mb-4">
                    Exercise your data rights including access, correction, or deletion requests.
                  </p>
                  <button className="bg-accent hover:bg-accent/90 text-black font-semibold px-6 py-3 rounded-lg transition-colors">
                    Submit Request
                  </button>
                </div>
              </Card>

              <Card className="bg-card border border-white/10 p-6">
                <div className="text-center">
                  <Settings className="w-8 h-8 text-accent mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">Privacy Settings</h3>
                  <p className="text-white/80 mb-4">
                    Manage your privacy preferences and communication settings in your account.
                  </p>
                  <button className="border border-gray-600 text-white hover:bg-gray-800 px-6 py-3 rounded-lg transition-colors">
                    Manage Settings
                  </button>
                </div>
              </Card>
            </div>

            <div className="pt-8 border-t border-white/20">
              <p className="text-gray-400">
                For privacy-related questions or concerns, contact our Data Protection Officer at 
                <span className="text-accent"> privacy@fplpredictor.com</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Policy Updates */}
      <section className="py-12 bg-blue-50 border-t border-blue-200">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-lg font-bold text-blue-900 mb-2">Policy Updates</h3>
            <p className="text-blue-800">
              We may update this Privacy Policy from time to time. We will notify you of any material changes 
              by email and by posting the updated policy on our website. Your continued use of our service 
              after such modifications constitutes acceptance of the updated Privacy Policy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}