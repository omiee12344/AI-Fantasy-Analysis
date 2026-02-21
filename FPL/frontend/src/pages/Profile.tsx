import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EditProfileForm } from '@/components/auth/EditProfileForm';
import { ErrorFallback } from '@/components/ui/ErrorFallback';
import { Badge } from '@/components/ui/badge';
import { Settings, User, Shield } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return (
      <ErrorFallback 
        error={error} 
        resetError={() => setError(null)} 
      />
    );
  }

  if (!user) {
    return (
      <div className="w-full min-h-screen bg-background text-foreground flex items-center justify-center relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-card/50"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZG90cyIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIxLjUiIGZpbGw9IiM2ZGZmNDciIG9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNkb3RzKSIvPjwvc3ZnPg==')] opacity-40"></div>
          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        </div>
        
        <div className="text-center relative z-10">
          <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-white/70 text-lg">Please login to view your profile</p>
          <Badge className="mt-4 bg-red-500/20 text-red-400 border-red-500/30">
            Authentication Required
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Modern Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-card/30"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZG90cyIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIxLjUiIGZpbGw9IiM2ZGZmNDciIG9wYWNpdHk9IjAuMTIiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZG90cykiLz48L3N2Zz4=')] opacity-60"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-accent/5 via-transparent to-blue-500/5"></div>
        {/* Floating Elements */}
        <div className="absolute top-20 left-1/4 w-24 h-24 bg-accent/8 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-32 right-1/3 w-32 h-32 bg-blue-500/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="w-full px-4 lg:px-8 py-12 relative z-10">
        {/* Profile Header */}
        <div className="w-full max-w-6xl mx-auto mb-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-r from-accent to-green-500 rounded-full flex items-center justify-center mx-auto">
              <User className="w-10 h-10 text-black" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                Profile <span className="text-accent">Settings</span>
              </h1>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">
                Manage your account settings and preferences for the ultimate FPL experience
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge className="bg-accent/20 text-accent border-accent/30 px-4 py-2">
                <Settings className="w-4 h-4 mr-2" />
                Account Management
              </Badge>
              {user.profile.fplTeamId && (
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 px-4 py-2">
                  <Shield className="w-4 h-4 mr-2" />
                  FPL Connected
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="w-full flex justify-center">
          <div className="w-full max-w-[900px]">
            <EditProfileForm
              onCancel={() => {}} 
              onSuccess={() => {}} 
              onError={(error) => setError(error)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};