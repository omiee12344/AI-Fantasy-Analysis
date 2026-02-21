import { Link } from "react-router-dom";
import { 
  Trophy, 
  Brain, 
  BarChart3, 
  Users, 
  Heart,
  HelpCircle,
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const productLinks = [
  { name: "AI Predictor", href: "/predictor", icon: Brain },
  { name: "My Team", href: "/my-team", icon: Users },
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Fixtures", href: "/fixtures", icon: Trophy },
];

const companyLinks = [
  { name: "About Us", href: "/about" },
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms of Service", href: "/terms" },
  { name: "Contact", href: "/contact" },
];

const supportLinks = [
  { name: "Help Center", href: "/help", icon: HelpCircle },
  { name: "Documentation", href: "/docs", icon: FileText },
];

export function Footer() {
  return (
    <footer className="bg-card/30 backdrop-blur-xl border-t border-white/10 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background/50 via-card/30 to-card/50"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzZkZmY0NyIgZmlsbC1vcGFjaXR5PSIwLjA4Ii8+Cjwvc3ZnPg==')] opacity-50"></div>
        <div className="absolute bottom-0 left-1/4 w-32 h-32 bg-accent/5 rounded-full blur-3xl"></div>
        <div className="absolute top-0 right-1/3 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
      </div>
      
      <div className="container mx-auto px-6 py-16 relative z-10">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-center md:justify-start">
              <span className="text-xl font-bold text-white tracking-tight">
                AI Fantasy Analytics
              </span>
            </div>
            
            <p className="text-white/70 leading-relaxed max-w-md">
              AI-powered Fantasy Premier League analytics: player performance prediction, fixture difficulty modeling, and data-driven team optimization.
            </p>
          </div>
          
          {/* Product Links */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-lg tracking-widest uppercase">Product</h4>
            <nav className="space-y-3">
              {productLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="flex items-center space-x-3 text-white/70 hover:text-accent transition-colors group"
                  >
                    <Icon className="w-4 h-4 group-hover:text-accent transition-colors" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* Support Links */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-lg tracking-widest uppercase">Support</h4>
            <nav className="space-y-3">
              {supportLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="flex items-center space-x-3 text-white/70 hover:text-accent transition-colors group"
                  >
                    <Icon className="w-4 h-4 group-hover:text-accent transition-colors" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* Company Links */}
          <div className="space-y-4">
            <h4 className="text-white font-semibold text-lg tracking-widest uppercase">Company</h4>
            <nav className="space-y-3">
              {companyLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="block text-white/70 hover:text-accent transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        
        <Separator className="bg-white/10" />
        
        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 pt-8">
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
            <p className="text-white/60 text-sm">
              © 2026 AI Fantasy Analytics
            </p>
            <p className="text-white/50 text-xs">
              Built for demonstration and research purposes.
            </p>
            <p className="text-white/50 text-xs">
              This project is not affiliated with the Premier League or Fantasy Premier League.
            </p>
          </div>
          
          <div className="flex items-center space-x-2 text-white/50 text-xs">
            <span>Made with</span>
            <Heart className="w-3 h-3 text-red-400 fill-current" />
            <span>for FPL managers worldwide</span>
          </div>
        </div>
        
        {/* Disclaimer */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-center text-white/40 text-xs leading-relaxed max-w-4xl mx-auto">
            <strong>Disclaimer:</strong> AI Fantasy Analytics provides Fantasy Premier League predictions and analysis for entertainment and demonstration purposes only. 
            All predictions are based on statistical analysis and machine learning models. Past performance does not guarantee future results. 
            This project is not affiliated with, endorsed by, or connected to the Premier League, 
            Fantasy Premier League, or any official football organizations.
          </p>
        </div>
      </div>
    </footer>
  );
}