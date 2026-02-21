import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Brain, Sparkles, Trophy } from 'lucide-react';

export const Login: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => setIsLogin(!isLogin);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Modern Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-card/50"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZG90cyIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIxLjUiIGZpbGw9IiM2ZGZmNDciIG9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNkb3RzKSIvPjwvc3ZnPg==')] opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-accent/8 via-transparent to-blue-500/8"></div>
        {/* Floating Elements */}
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-accent/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/3 left-1/4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="w-full max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Branding */}
          <div className="hidden lg:block space-y-8">
            <div className="space-y-6">
              <Badge className="bg-accent/20 text-accent border-accent/30 px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                #1 AI-Powered FPL Tool
              </Badge>
              
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                  Master Fantasy
                  <span className="block bg-gradient-to-r from-accent via-green-400 to-blue-400 bg-clip-text text-transparent">
                    Premier League
                  </span>
                </h1>
                <p className="text-xl text-white/80 leading-relaxed max-w-lg">
                  Join thousands of managers using AI predictions to dominate their leagues and climb the global rankings.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-card/30 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-accent mb-1">AI</div>
                  <div className="text-white/70 text-sm">Predictions</div>
                </div>
                <div className="bg-card/30 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">Data</div>
                  <div className="text-white/70 text-sm">Driven</div>
                </div>
              </div>
              
              <div className="flex items-center gap-8 text-sm text-white/60">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-accent" />
                  <span>AI Predictions</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-400" />
                  <span>Expert Analysis</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Auth Forms */}
          <div className="w-full max-w-md mx-auto lg:max-w-none">
            {isLogin ? (
              <LoginForm onToggleMode={toggleMode} />
            ) : (
              <RegisterForm onToggleMode={toggleMode} />
            )}
          </div>
        </div>
        
        {/* Mobile Branding */}
        <div className="lg:hidden text-center mt-8 space-y-4">
          <div className="text-3xl font-bold text-white">
            Master Fantasy <span className="text-accent">Premier League</span>
          </div>
          <p className="text-white/70">AI-powered predictions for smarter decisions</p>
        </div>
      </div>
    </div>
  );
};