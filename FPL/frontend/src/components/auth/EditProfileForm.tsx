import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/lib/auth';
import { getFirebaseErrorMessage } from '@/lib/firebase-errors';
import { firebaseAuthApi } from '@/lib/firebase-auth';
import API from '@/lib/api';
import { autoPopulateTeamFromFPL } from '@/lib/team-auto-population';

const editProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  teamName: z.string().min(1, 'Team name is required'),
  favouriteTeam: z.string().nullable(),
  country: z.string().nullable(),
  region: z.string().nullable(),
  bio: z.string().max(200, 'Bio must be 200 characters or less').nullable(),
  // FPL Team Integration
  fplTeamId: z.string().nullable(),
  totalPoints: z.number().min(0, 'Total points must be positive').nullable(),
});

type EditProfileForm = z.infer<typeof editProfileSchema>;

interface EditProfileFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  onError?: (error: Error) => void;
}

const premierLeagueTeams = [
  'Arsenal', 'Aston Villa', 'Brighton & Hove Albion', 'Bournemouth', 'Brentford',
  'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Liverpool',
  'Luton Town', 'Manchester City', 'Manchester United', 'Newcastle United', 'Nottingham Forest',
  'Sheffield United', 'Tottenham Hotspur', 'West Ham United', 'Wolverhampton Wanderers'
];

export const EditProfileForm: React.FC<EditProfileFormProps> = ({ onCancel, onSuccess, onError }) => {
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingFPL, setIsFetchingFPL] = useState(false);
  const [isPopulatingTeam, setIsPopulatingTeam] = useState(false);
  const [fplData, setFplData] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<string>('');
  const { user, updateProfile } = useAuth();
  
  // Ref to store timeout ID for success message auto-dismiss
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function to set success message with auto-dismiss
  const setSuccessWithTimeout = (message: string, timeoutMs: number = 3000) => {
    // Clear any existing timeout
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    
    // Set the success message
    setSuccess(message);
    
    // Set new timeout
    successTimeoutRef.current = setTimeout(() => {
      setSuccess('');
      successTimeoutRef.current = null;
    }, timeoutMs);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: user?.profile.firstName || '',
      lastName: user?.profile.lastName || '',
      teamName: user?.profile.teamName || '',
      favouriteTeam: user?.profile.favouriteTeam || null,
      country: user?.profile.country || null,
      region: user?.profile.region || null,
      bio: user?.profile.bio || null,
      fplTeamId: user?.profile.fplTeamId || null,
      totalPoints: user?.profile.totalPoints || null,
    }
  });

  // Set the favourite team value properly for the Select component
  React.useEffect(() => {
    if (user?.profile.favouriteTeam) {
      setValue('favouriteTeam', user.profile.favouriteTeam);
    } else {
      setValue('favouriteTeam', null);
    }
  }, [user?.profile.favouriteTeam, setValue]);

  // Smart FPL Auto-Refresh: Automatically refresh FPL data if user already has FPL connection
  React.useEffect(() => {
    const autoRefreshFPLData = async () => {
      // Only auto-refresh if user already has FPL Team ID connected
      if (user?.profile.fplTeamId && !fplData) {
        console.log('Auto-refreshing FPL data for connected team:', user.profile.fplTeamId);
        setIsFetchingFPL(true);
        
        try {
          const teamData = await fetch(`http://localhost:3007/api/team/${user.profile.fplTeamId}`)
            .then(response => {
              if (!response.ok) throw new Error(`Failed to refresh FPL data: ${response.status}`);
              return response.json();
            });
          
          console.log('Auto-refreshed FPL data:', teamData);
          setFplData(teamData);
          setSuccessWithTimeout('FPL data auto-refreshed successfully!');
          
        } catch (err) {
          console.warn('Auto-refresh failed, but connection still exists:', err);
          // Don't show error for auto-refresh failures, user can manually refresh if needed
        } finally {
          setIsFetchingFPL(false);
        }
      }
    };

    // Run auto-refresh after component mounts and user data is available
    if (user?.profile.fplTeamId) {
      autoRefreshFPLData();
    }
  }, [user?.profile.fplTeamId, fplData]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Fetch FPL data from Team ID
  const fetchFPLData = async () => {
    const teamId = watch('fplTeamId');
    if (!teamId) {
      setError('Please enter a valid FPL Team ID');
      return;
    }

    setIsFetchingFPL(true);
    setError('');

    try {
      console.log('Fetching FPL data for team ID:', teamId);
      
      // Fetch team data from backend
      const teamData = await fetch(`http://localhost:3007/api/team/${teamId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch FPL data: ${response.status}`);
          }
          return response.json();
        });

      console.log('FPL data fetched:', teamData);
      setFplData(teamData);

      // Auto-populate form fields with comprehensive FPL data
      const totalPoints = teamData.entry_history?.total_points || 0;
      const gameweekPoints = teamData.entry_history?.points || 0;
      const teamValue = teamData.entry_history?.value ? (teamData.entry_history.value / 10) : 0; // Convert to millions
      const bank = teamData.entry_history?.bank ? (teamData.entry_history.bank / 10) : 0; // Convert to millions

      if (totalPoints > 0) {
        setValue('totalPoints', totalPoints);
      }

      // Extract team name from manager name if available
      if (!watch('teamName') && teamData.managerName) {
        setValue('teamName', `${teamData.managerName}'s Team`);
      }

      // Show detailed success message with team info
      const playersCount = Object.values(teamData.squad || {}).flat().length;
      setSuccess(`FPL data loaded successfully! 
        • Total Points: ${totalPoints}
        • GW Points: ${gameweekPoints}
        • Team Value: £${teamValue.toFixed(1)}m
        • Bank: £${bank.toFixed(1)}m
        • Players Found: ${playersCount}
        • Current GW: ${teamData.gameweek || 'TBC'}
        Your team data is ready to be saved!`);

    } catch (err) {
      console.error('❌ Failed to fetch FPL data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch FPL data. Please check your Team ID and try again.');
      setFplData(null);
    } finally {
      setIsFetchingFPL(false);
    }
  };

  const onSubmit = async (data: EditProfileForm) => {
    try {
      setError('');
      setIsLoading(true);
      
      // Check if we're using fallback storage
      const isUsingFallback = localStorage.getItem('fpl-user-fallback');
      
      // Prepare enhanced profile data with FPL information if available
      const profileData = {
        ...data,
        ...(fplData && {
          // Add comprehensive FPL data to profile
          totalPoints: fplData.entry_history?.total_points || data.totalPoints,
          gameweekPoints: fplData.entry_history?.points || 0,
          teamValue: fplData.entry_history?.value ? (fplData.entry_history.value / 10) : 0,
          bank: fplData.entry_history?.bank ? (fplData.entry_history.bank / 10) : 0,
          freeTransfers: fplData.entry_history?.event_transfers || 0,
          currentGameweek: fplData.gameweek || 1,
          overallRank: fplData.entry_history?.overall_rank || 0,
          gameweekRank: fplData.entry_history?.rank || 0,
          // Additional FPL stats
          transferCost: fplData.entry_history?.event_transfers_cost || 0,
          pointsOnBench: fplData.entry_history?.points_on_bench || 0,
          // Auto-substitutions count
          autoSubsCount: fplData.automatic_subs ? fplData.automatic_subs.length : 0,
          // Save the squad data for team restoration
          fplSquad: fplData.squad || null,
        })
      };
      
      await updateProfile(profileData);

      // Smart Team Auto-Population: Only populate if this is a NEW FPL connection
      let teamMessage = '';
      const isNewFPLConnection = fplData?.squad && user?.id && !user.profile.fplTeamId; // Only if user didn't have FPL connected before
      
      if (isNewFPLConnection) {
        try {
          setIsPopulatingTeam(true);
          console.log('NEW FPL connection detected - Starting team auto-population...');
          
          const teamResult = await autoPopulateTeamFromFPL(
            user.id,
            fplData.squad,
            user.email
          );

          if (teamResult.success) {
            teamMessage = `\nYour complete FPL team has been loaded into "My Team"!`;
            console.log('Team auto-population completed for new connection:', teamResult);
          } else {
            console.warn('Team auto-population failed:', teamResult.message);
          }
        } catch (teamError) {
          console.error('Team auto-population error:', teamError);
          // Don't fail the profile update if team population fails
        } finally {
          setIsPopulatingTeam(false);
        }
      } else if (user?.profile.fplTeamId) {
        console.log('Existing FPL connection - Skipping team auto-population (data already imported)');
        teamMessage = `\nFPL data refreshed successfully!`;
      }
      
      // Show comprehensive success message
      const fplMessage = fplData ? ` Your FPL data (${fplData.totalPoints || 0} points) has been imported!` : '';
      
      if (isUsingFallback) {
        setSuccess(`Profile updated successfully!${fplMessage}${teamMessage} (Using local storage - Firestore not accessible)`);
      } else {
        setSuccess(`Profile updated successfully!${fplMessage}${teamMessage}`);
      }

      // Auto-hide success message
      setTimeout(() => {
        setSuccess('');
        onSuccess();
      }, 2000);
    } catch (err: any) {
      // Show user-friendly error message
      const errorMessage = getFirebaseErrorMessage(err.code) || err.message || 'Failed to update profile';
      setError(errorMessage);
      
      // Also call the onError callback if provided
      if (onError && err instanceof Error) {
        onError(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <Card className="bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
              {user?.profile.firstName?.[0] || 'U'}
            </div>
            Account Settings
          </CardTitle>
          <p className="text-white/70">Manage your FPL Predictor profile and preferences</p>
          {localStorage.getItem('fpl-user-fallback') && (
            <div className="flex items-center justify-between mt-4 p-3 bg-amber-900/30 border border-amber-600/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <p className="text-sm text-amber-400">
                  Using local storage - Firestore database not accessible
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('fpl-user-fallback');
                  window.location.reload();
                }}
                className="text-xs h-7 px-3 border-amber-600/50 text-amber-400 hover:bg-amber-900/50"
              >
                Retry Firestore
              </Button>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="bg-red-900/30 border-red-600/30 text-red-300">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert variant="default" className="bg-green-900/30 border-green-600/30 text-green-300">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}
            
            {/* FPL Integration Section - Moved to top */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                Fantasy Premier League Integration
                {user?.profile.fplTeamId && (
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-normal">
                    Connected
                  </span>
                )}
              </h3>

              {/* Show different UI based on FPL connection status */}
              {user?.profile.fplTeamId ? (
                // Already Connected - Show Status and Refresh Option
                <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-sm text-green-300 font-medium">
                        FPL Team Connected: #{user.profile.fplTeamId}
                      </p>
                      <p className="text-xs text-green-400/70">
                        Auto-syncs when you log in. No need to reconnect every time!
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={() => {
                        setFplData(null); // Clear current data to force refresh
                        fetchFPLData();
                      }}
                      disabled={isFetchingFPL}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm py-2 px-4"
                    >
                      {isFetchingFPL ? (
                        <>
                          <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Refreshing...
                        </>
                      ) : (
                        <>Refresh Data</>
                      )}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setValue('fplTeamId', null);
                        setFplData(null);
                      }}
                      className="border-red-600/50 text-red-400 hover:bg-red-900/20 text-sm py-2 px-4"
                    >
                      Disconnect FPL
                    </Button>
                  </div>
                </div>
              ) : (
                // Not Connected - Show Initial Setup
                <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4">
                  <p className="text-sm text-blue-300 mb-4">
                    Connect your existing FPL team to automatically import your squad, stats, and continue from where you left off.
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="fplTeamId" className="text-white/90">FPL Team ID</Label>
                    <div className="flex gap-2">
                      <Input
                        id="fplTeamId"
                        {...register('fplTeamId')}
                        placeholder="e.g., 2459312"
                        className={`bg-card border-white/20 text-white placeholder:text-white/50 focus:border-blue-500 focus:ring-blue-500/20 ${errors.fplTeamId ? 'border-red-500' : ''}`}
                      />
                      <Button
                        type="button"
                        onClick={fetchFPLData}
                        disabled={isFetchingFPL || !watch('fplTeamId')}
                        className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap min-w-[120px]"
                      >
                        {isFetchingFPL ? 'Connecting...' : 'Connect FPL'}
                      </Button>
                    </div>
                    {errors.fplTeamId && (
                      <p className="text-sm text-red-400">{errors.fplTeamId.message}</p>
                    )}
                    <p className="text-xs text-white/60">
                      Find your FPL Team ID in the URL when viewing your team on fantasy.premierleague.com
                    </p>
                  </div>
                </div>
              )}

              {/* Manual Points Override - Only show when not connected */}
              {!user?.profile.fplTeamId && (
                <div className="bg-gray-800/20 border border-gray-600/30 rounded-lg p-4">
                  <div className="space-y-2">
                    <Label htmlFor="totalPoints" className="text-white/90">Manual Points Entry (Alternative)</Label>
                    <Input
                      id="totalPoints"
                      type="number"
                      {...register('totalPoints', { valueAsNumber: true })}
                      placeholder="e.g., 1250"
                      className={`bg-card border-white/20 text-white placeholder:text-white/50 focus:border-green-500 focus:ring-green-500/20 ${errors.totalPoints ? 'border-red-500' : ''}`}
                    />
                    {errors.totalPoints && (
                      <p className="text-sm text-red-400">{errors.totalPoints.message}</p>
                    )}
                    <p className="text-xs text-white/60">
                      Only use this if you don't want to connect your FPL team
                    </p>
                  </div>
                </div>
              )}

              {/* FPL Data Preview */}
              {fplData && (
                <div className="mt-4 p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
                  <h4 className="font-semibold text-green-300 mb-3 flex items-center gap-2">
                    Your FPL Team Preview
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center p-3 bg-green-800/20 rounded-lg">
                      <div className="text-white/70 text-xs">Total Points</div>
                      <div className="font-bold text-green-300 text-lg">{fplData.entry_history?.total_points || 0}</div>
                    </div>
                    <div className="text-center p-3 bg-blue-800/20 rounded-lg">
                      <div className="text-white/70 text-xs">Team Value</div>
                      <div className="font-bold text-blue-300 text-lg">£{fplData.entry_history?.value ? (fplData.entry_history.value / 10).toFixed(1) : 0}m</div>
                    </div>
                    <div className="text-center p-3 bg-purple-800/20 rounded-lg">
                      <div className="text-white/70 text-xs">GW Points</div>
                      <div className="font-bold text-purple-300 text-lg">{fplData.entry_history?.points || 0}</div>
                    </div>
                    <div className="text-center p-3 bg-amber-800/20 rounded-lg">
                      <div className="text-white/70 text-xs">Overall Rank</div>
                      <div className="font-bold text-amber-300 text-lg">{fplData.entry_history?.overall_rank?.toLocaleString() || 'TBC'}</div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-800/30 border border-green-600/40 rounded-lg">
                    <p className="text-sm text-green-300 flex items-center gap-2">
                      Your FPL team data is ready! Click "Save Changes" to import this data and auto-populate your "My Team" page.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Personal Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-white/90">First Name</Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    className={`bg-card border-white/20 text-white placeholder:text-white/50 focus:border-green-500 focus:ring-green-500/20 ${errors.firstName ? 'border-red-500' : ''}`}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-400">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-white/90">Last Name</Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    className={`bg-card border-white/20 text-white placeholder:text-white/50 focus:border-green-500 focus:ring-green-500/20 ${errors.lastName ? 'border-red-500' : ''}`}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-400">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="teamName" className="text-white/90">Team Name</Label>
                <Input
                  id="teamName"
                  {...register('teamName')}
                  className={`bg-card border-white/20 text-white placeholder:text-white/50 focus:border-green-500 focus:ring-green-500/20 ${errors.teamName ? 'border-red-500' : ''}`}
                />
                {errors.teamName && (
                  <p className="text-sm text-red-400">{errors.teamName.message}</p>
                )}
              </div>
            </div>

            {/* Preferences Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Preferences</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-white/90">Favourite Team</Label>
                  <Select 
                    defaultValue={user?.profile.favouriteTeam || "none"}
                    onValueChange={(value) => setValue('favouriteTeam', value === "none" ? null : value)}
                  >
                    <SelectTrigger className="bg-card border-white/20 text-white">
                      <SelectValue placeholder="Select your favourite team" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-white/20">
                      <SelectItem value="none" className="text-white hover:bg-white/10">None</SelectItem>
                      {premierLeagueTeams.map((team) => (
                        <SelectItem key={team} value={team} className="text-white hover:bg-white/10">
                          {team}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-white/90">Country</Label>
                  <Input
                    id="country"
                    {...register('country')}
                    placeholder="e.g., United Kingdom"
                    defaultValue={user?.profile.country || ''}
                    className="bg-card border-white/20 text-white placeholder:text-white/50 focus:border-green-500 focus:ring-green-500/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="region" className="text-white/90">Region</Label>
                <Input
                  id="region"
                  {...register('region')}
                  placeholder="e.g., London, Manchester"
                  defaultValue={user?.profile.region || ''}
                  className="bg-card border-white/20 text-white placeholder:text-white/50 focus:border-green-500 focus:ring-green-500/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-white/90">Bio</Label>
                <Textarea
                  id="bio"
                  {...register('bio')}
                  placeholder="Tell us about yourself (max 200 characters)"
                  className="min-h-20 bg-card border-white/20 text-white placeholder:text-white/50 focus:border-green-500 focus:ring-green-500/20"
                  maxLength={200}
                  defaultValue={user?.profile.bio || ''}
                />
                {errors.bio && (
                  <p className="text-sm text-red-400">{errors.bio.message}</p>
                )}
                <p className="text-xs text-white/50">
                  {watch('bio')?.length || 0}/200 characters
                </p>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="pt-6 border-t border-white/10">
              <Button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-8 py-3 w-full"
                disabled={isLoading || isPopulatingTeam}
              >
                {isLoading || isPopulatingTeam ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isPopulatingTeam ? 'Loading Team...' : 'Saving Changes...'}
                  </>
                ) : (
                  <>
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};