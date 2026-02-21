import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';
import { isUserCancellation, getFirebaseErrorMessage } from '@/lib/firebase-errors';
import { UserPlus, Mail, Lock, User, Trophy, Globe } from 'lucide-react';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  teamName: z.string().min(1, 'Team name is required'),
  favouriteTeam: z.string().optional(),
  country: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onToggleMode: () => void;
}

const premierLeagueTeams = [
  'Arsenal', 'Aston Villa', 'Brighton & Hove Albion', 'Bournemouth', 'Brentford',
  'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Liverpool',
  'Luton Town', 'Manchester City', 'Manchester United', 'Newcastle United', 'Nottingham Forest',
  'Sheffield United', 'Tottenham Hotspur', 'West Ham United', 'Wolverhampton Wanderers'
];

export const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleMode }) => {
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { register: registerUser, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError('');
      setIsLoading(true);
      
      // Transform form data to match RegisterRequest interface
      const registerData = {
        ...data,
        favouriteTeam: data.favouriteTeam || null,
        country: data.country || null
      };
      
      await registerUser(registerData);
      navigate(from, { replace: true });
    } catch (err: any) {
      // Show user-friendly error message
      const errorMessage = getFirebaseErrorMessage(err.code);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setIsGoogleLoading(true);
      await loginWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      // Don't show error for user cancellation
      if (isUserCancellation(err.code)) {
        console.log('Google sign-in cancelled by user');
      } else {
        // Show user-friendly error message
        const errorMessage = getFirebaseErrorMessage(err.code);
        setError(errorMessage);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full bg-card/50 backdrop-blur-xl border-white/10 shadow-2xl">
      <CardHeader className="text-center space-y-4">
        <div className="w-16 h-16 bg-gradient-to-r from-accent to-green-500 rounded-full flex items-center justify-center mx-auto">
          <UserPlus className="w-8 h-8 text-black" />
        </div>
        <CardTitle className="text-3xl font-bold text-white tracking-widest">Join FPL Predictor</CardTitle>
        <CardDescription className="text-white/70 text-base">
          Create your account and start your journey to Fantasy Premier League mastery
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive" className="bg-red-900/30 border-red-600/30 text-red-300">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-white/90 font-medium">First Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                <Input
                  id="firstName"
                  placeholder="John"
                  {...register('firstName')}
                  className={`pl-10 bg-card/50 border-white/20 text-white placeholder:text-white/50 focus:border-accent focus:ring-accent/20 ${errors.firstName ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.firstName && (
                <p className="text-sm text-red-400">{errors.firstName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-white/90 font-medium">Last Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...register('lastName')}
                  className={`pl-10 bg-card/50 border-white/20 text-white placeholder:text-white/50 focus:border-accent focus:ring-accent/20 ${errors.lastName ? 'border-red-500' : ''}`}
                />
              </div>
              {errors.lastName && (
                <p className="text-sm text-red-400">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="teamName" className="text-white/90 font-medium">Team Name</Label>
            <div className="relative">
              <Trophy className="absolute left-3 top-3 h-4 w-4 text-white/50" />
              <Input
                id="teamName"
                placeholder="My Awesome Team"
                {...register('teamName')}
                className={`pl-10 bg-card/50 border-white/20 text-white placeholder:text-white/50 focus:border-accent focus:ring-accent/20 ${errors.teamName ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.teamName && (
              <p className="text-sm text-red-400">{errors.teamName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-white/90 font-medium">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-white/50" />
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                {...register('email')}
                className={`pl-10 bg-card/50 border-white/20 text-white placeholder:text-white/50 focus:border-accent focus:ring-accent/20 ${errors.email ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-white/90 font-medium">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-white/50" />
              <Input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                {...register('password')}
                className={`pl-10 bg-card/50 border-white/20 text-white placeholder:text-white/50 focus:border-accent focus:ring-accent/20 ${errors.password ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.password && (
              <p className="text-sm text-red-400">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-white/90 font-medium">Favourite Team (Optional)</Label>
            <Select onValueChange={(value) => setValue('favouriteTeam', value)}>
              <SelectTrigger className="bg-card/50 border-white/20 text-white focus:border-accent focus:ring-accent/20">
                <SelectValue placeholder="Select your favourite team" />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/20">
                {premierLeagueTeams.map((team) => (
                  <SelectItem key={team} value={team} className="text-white hover:bg-white/10">
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country" className="text-white/90 font-medium">Country (Optional)</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-3 h-4 w-4 text-white/50" />
              <Input
                id="country"
                placeholder="United Kingdom"
                {...register('country')}
                className="pl-10 bg-card/50 border-white/20 text-white placeholder:text-white/50 focus:border-accent focus:ring-accent/20"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-accent to-green-600 hover:from-accent/90 hover:to-green-600/90 text-black font-bold py-3 text-lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full bg-white/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-4 text-white/60 font-medium">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full border-white/20 text-white hover:bg-white/10 hover:text-white py-3"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Signing up...
            </div>
          ) : (
            <>
              <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign up with Google
            </>
          )}
        </Button>
      </CardContent>
      <CardFooter className="text-center pt-6">
        <p className="text-sm text-white/70">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onToggleMode}
            className="text-accent hover:text-accent/90 font-semibold underline underline-offset-2"
          >
            Sign in here
          </button>
        </p>
      </CardFooter>
    </Card>
  );
};