import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Scale, 
  AlertTriangle, 
  CheckCircle, 
  Shield, 
  Users, 
  CreditCard, 
  Ban,
  Eye,
  Globe,
  Clock,
  Mail,
  Gavel,
  UserX
} from 'lucide-react';

export function TermsOfService() {
  const lastUpdated = "January 15, 2024";
  const effectiveDate = "January 15, 2024";

  const keyTerms = [
    {
      icon: Users,
      title: "User Responsibilities",
      description: "Maintain account security, provide accurate information, use service responsibly"
    },
    {
      icon: Shield,
      title: "Service Availability",
      description: "We strive for 99.9% uptime but cannot guarantee uninterrupted service"
    },
    {
      icon: Ban,
      title: "Prohibited Activities",
      description: "No misuse, abuse, or attempts to compromise platform security"
    },
    {
      icon: Scale,
      title: "Liability Limits",
      description: "Service provided 'as is' with limitations on our liability for damages"
    }
  ];

  const sections = [
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      icon: CheckCircle,
      content: [
        {
          subtitle: "Agreement to Terms",
          details: "By accessing or using our Fantasy Premier League AI prediction platform ('Service'), you agree to be bound by these Terms of Service ('Terms'). If you do not agree to these Terms, you may not use our Service."
        },
        {
          subtitle: "Legal Capacity",
          details: "You must be at least 18 years old or have parental/guardian consent to use our Service. By using the Service, you represent that you meet these age requirements."
        },
        {
          subtitle: "Updates to Terms",
          details: "We reserve the right to modify these Terms at any time. Material changes will be communicated via email and posted on our website. Continued use after changes constitutes acceptance of updated Terms."
        }
      ]
    },
    {
      id: "service-description",
      title: "Service Description",
      icon: FileText,
      content: [
        {
          subtitle: "Platform Overview",
          details: "Our Service provides AI-powered predictions and analytics for Fantasy Premier League managers, including player performance forecasts, team optimization suggestions, and strategic insights."
        },
        {
          subtitle: "Service Accuracy",
          details: "While we strive for high accuracy in our predictions, fantasy football involves inherent uncertainty. Our predictions are analytical tools and should not be considered guarantees of future performance."
        },
        {
          subtitle: "Service Availability",
          details: "We aim to maintain 99.9% service availability but may experience downtime for maintenance, updates, or technical issues. We are not liable for temporary service interruptions."
        },
        {
          subtitle: "Third-Party Integration",
          details: "Our Service integrates with Fantasy Premier League's official platform. We are not affiliated with or endorsed by the Premier League or its official fantasy platform."
        }
      ]
    },
    {
      id: "user-accounts",
      title: "User Accounts & Responsibilities",
      icon: Users,
      content: [
        {
          subtitle: "Account Creation",
          details: "You must provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials."
        },
        {
          subtitle: "Account Security",
          details: "You are solely responsible for all activities under your account. Notify us immediately of any unauthorized access or security breaches."
        },
        {
          subtitle: "Account Suspension",
          details: "We reserve the right to suspend or terminate accounts that violate these Terms, engage in prohibited activities, or pose security risks to our platform."
        },
        {
          subtitle: "Data Accuracy",
          details: "You must provide accurate FPL team information for integration features. Providing false information may result in service limitations or account termination."
        }
      ]
    },
    {
      id: "acceptable-use",
      title: "Acceptable Use Policy",
      icon: Shield,
      content: [
        {
          subtitle: "Permitted Use",
          details: "You may use our Service for personal, non-commercial fantasy football management purposes in accordance with these Terms and applicable laws."
        },
        {
          subtitle: "Prohibited Activities",
          details: "You may not: (a) use automated systems to access our Service, (b) attempt to reverse engineer our AI algorithms, (c) resell or redistribute our predictions, (d) use the Service for illegal purposes, or (e) violate any applicable laws or regulations."
        },
        {
          subtitle: "Content Standards",
          details: "Any content you submit must be legal, appropriate, and not infringe on third-party rights. We reserve the right to remove content that violates these standards."
        },
        {
          subtitle: "Commercial Use Restrictions",
          details: "Commercial use of our Service requires explicit written permission. Contact us for licensing opportunities if you wish to use our Service for commercial purposes."
        }
      ]
    },
    {
      id: "payment-terms",
      title: "Payment & Subscription Terms",
      icon: CreditCard,
      content: [
        {
          subtitle: "Subscription Plans",
          details: "We offer various subscription tiers with different features and pricing. All prices are clearly displayed before purchase and include applicable taxes."
        },
        {
          subtitle: "Billing Cycles",
          details: "Subscriptions are billed in advance on a monthly or annual basis. You will be charged automatically unless you cancel before the next billing cycle."
        },
        {
          subtitle: "Refund Policy",
          details: "We offer a 7-day money-back guarantee for new subscriptions. Refunds beyond this period are at our discretion and may be prorated based on unused service time."
        },
        {
          subtitle: "Price Changes",
          details: "We may change subscription prices with 30 days' advance notice. Existing subscribers will maintain their current pricing until their next renewal period."
        },
        {
          subtitle: "Payment Failures",
          details: "Failed payments may result in service suspension. We will attempt to resolve payment issues and notify you of any problems with your payment method."
        }
      ]
    },
    {
      id: "intellectual-property",
      title: "Intellectual Property Rights",
      icon: Eye,
      content: [
        {
          subtitle: "Our IP Rights",
          details: "All content, features, functionality, AI algorithms, and materials on our Service are owned by us and protected by copyright, trademark, and other intellectual property laws."
        },
        {
          subtitle: "User License",
          details: "We grant you a limited, non-exclusive, non-transferable license to use our Service for personal purposes in accordance with these Terms."
        },
        {
          subtitle: "User Content",
          details: "You retain ownership of any content you submit but grant us a license to use, modify, and display such content as necessary to provide our Service."
        },
        {
          subtitle: "DMCA Compliance",
          details: "We respect intellectual property rights and respond to valid DMCA takedown notices. Contact us if you believe your IP rights have been infringed."
        }
      ]
    },
    {
      id: "privacy-data",
      title: "Privacy & Data Protection",
      icon: Shield,
      content: [
        {
          subtitle: "Privacy Policy",
          details: "Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference."
        },
        {
          subtitle: "Data Security",
          details: "We implement industry-standard security measures to protect your data, but cannot guarantee absolute security due to the inherent risks of internet transmission."
        },
        {
          subtitle: "Data Retention",
          details: "We retain your data as described in our Privacy Policy and as necessary to provide our Service, comply with legal obligations, and resolve disputes."
        }
      ]
    },
    {
      id: "disclaimers",
      title: "Disclaimers & Limitations",
      icon: AlertTriangle,
      content: [
        {
          subtitle: "Service 'As Is'",
          details: "Our Service is provided 'as is' and 'as available' without warranties of any kind, either express or implied, including but not limited to merchantability, fitness for a particular purpose, or non-infringement."
        },
        {
          subtitle: "Prediction Accuracy",
          details: "While we strive for accuracy, fantasy football predictions are inherently uncertain. We do not guarantee the accuracy of predictions or your fantasy football performance."
        },
        {
          subtitle: "Third-Party Content",
          details: "We are not responsible for the accuracy, content, or availability of third-party websites, services, or content linked to or integrated with our Service."
        },
        {
          subtitle: "Force Majeure",
          details: "We are not liable for any delays or failures in performance due to circumstances beyond our reasonable control, including natural disasters, technical failures, or regulatory changes."
        }
      ]
    },
    {
      id: "liability",
      title: "Limitation of Liability",
      icon: Scale,
      content: [
        {
          subtitle: "Damages Limitation",
          details: "To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits or data."
        },
        {
          subtitle: "Maximum Liability",
          details: "Our total liability to you for all claims arising from these Terms or your use of our Service shall not exceed the amount you paid us in the 12 months preceding the claim."
        },
        {
          subtitle: "Time Limitations",
          details: "Any claim against us must be brought within one year of the date the claim arose, or such claim will be permanently barred."
        }
      ]
    },
    {
      id: "termination",
      title: "Termination",
      icon: UserX,
      content: [
        {
          subtitle: "User Termination",
          details: "You may terminate your account at any time through your account settings. Upon termination, your access to paid features will continue until the end of your current billing period."
        },
        {
          subtitle: "Our Termination Rights",
          details: "We may suspend or terminate your access immediately for violations of these Terms, non-payment, or other reasons that may harm our Service or other users."
        },
        {
          subtitle: "Effect of Termination",
          details: "Upon termination, your right to use our Service ceases immediately. Provisions regarding intellectual property, disclaimers, and limitations of liability survive termination."
        }
      ]
    },
    {
      id: "governing-law",
      title: "Governing Law & Disputes",
      icon: Gavel,
      content: [
        {
          subtitle: "Governing Law",
          details: "These Terms are governed by and construed in accordance with the laws of [Jurisdiction], without regard to conflict of law principles."
        },
        {
          subtitle: "Dispute Resolution",
          details: "We encourage resolving disputes through direct communication. For formal disputes, we prefer binding arbitration over litigation where legally permissible."
        },
        {
          subtitle: "Class Action Waiver",
          details: "You agree to resolve disputes individually and waive the right to participate in class action lawsuits or class-wide arbitrations."
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
              <FileText className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white">
              Terms of Service
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              These terms govern your use of our Fantasy Premier League AI platform. Please read them carefully to understand your rights and responsibilities.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                <Clock className="w-4 h-4 mr-2" />
                Last Updated: {lastUpdated}
              </Badge>
              <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                <CheckCircle className="w-4 h-4 mr-2" />
                Effective: {effectiveDate}
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Key Terms Summary */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Key Terms Overview
              </h2>
              <p className="text-xl text-gray-300">
                Important highlights from our Terms of Service
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {keyTerms.map((term, index) => {
                const Icon = term.icon;
                return (
                  <Card key={index} className="text-center p-6 bg-black border border-gray-700">
                    <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-3">{term.title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{term.description}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-12 bg-red-50 border-y border-red-200">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-red-900 mb-2">Legal Agreement</h3>
                <p className="text-red-800 leading-relaxed">
                  These Terms of Service constitute a legally binding agreement between you and our company. 
                  By using our service, you acknowledge that you have read, understood, and agree to be bound by these terms. 
                  If you do not agree with any part of these terms, you must not use our service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Terms Sections */}
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

      {/* Contact for Legal Questions */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto">
              <Mail className="w-8 h-8 text-black" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Legal Questions?
            </h2>
            <p className="text-xl text-gray-300">
              If you have questions about these Terms of Service or need legal clarification, we're here to help.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              <Card className="bg-card border border-white/10 p-6">
                <div className="text-center">
                  <Scale className="w-8 h-8 text-accent mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">Legal Department</h3>
                  <p className="text-white/80 mb-4">
                    For terms questions, compliance issues, or legal concerns.
                  </p>
                  <div className="text-accent">legal@fplpredictor.com</div>
                </div>
              </Card>

              <Card className="bg-card border border-white/10 p-6">
                <div className="text-center">
                  <FileText className="w-8 h-8 text-accent mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-3">Terms Archive</h3>
                  <p className="text-white/80 mb-4">
                    Access previous versions of our Terms of Service.
                  </p>
                  <button className="border border-gray-600 text-white hover:bg-gray-800 px-6 py-3 rounded-lg transition-colors">
                    View Archive
                  </button>
                </div>
              </Card>
            </div>

            <div className="pt-8 border-t border-white/20">
              <p className="text-gray-400 text-sm">
                These Terms of Service are effective as of {effectiveDate} and replace all previous versions. 
                We reserve the right to modify these terms with appropriate notice to users.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Acknowledgment */}
      <section className="py-12 bg-green-50 border-t border-green-200">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-bold text-green-900">Terms Acknowledgment</h3>
            </div>
            <p className="text-green-800">
              By continuing to use our service after these terms become effective, you acknowledge that you have read, 
              understood, and agree to be bound by these Terms of Service and our Privacy Policy.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}