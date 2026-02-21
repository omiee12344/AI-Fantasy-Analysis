import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginRequest, RegisterRequest, authStorage } from '@/lib/auth';
import { firebaseAuthApi } from '@/lib/firebase-auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Partial<User['profile']>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Listen to Firebase auth state changes
        const unsubscribe = firebaseAuthApi.onAuthStateChanged((user) => {
          setUser(user);
          setIsLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await firebaseAuthApi.login(credentials);
      setUser(response.user);
      
      // Store the token for API authentication
      if (response.token) {
        authStorage.setToken(response.token);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const response = await firebaseAuthApi.signInWithGoogle();
      setUser(response.user);
      
      // Store the token for API authentication
      if (response.token) {
        authStorage.setToken(response.token);
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    try {
      const response = await firebaseAuthApi.register(userData);
      setUser(response.user);
      
      // Store the token for API authentication
      if (response.token) {
        authStorage.setToken(response.token);
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Note: Team saving should be handled by the MyTeam component before logout
      // This ensures the team is saved before the user context is cleared
      await firebaseAuthApi.logout();
      
      // Clear the auth token
      authStorage.removeToken();
      
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      
      // Clear the auth token even if logout fails
      authStorage.removeToken();
      
      // Still clear local state even if Firebase logout fails
      setUser(null);
    }
  };

  const updateProfile = async (profileData: Partial<User['profile']>) => {
    try {
      const updatedUser = await firebaseAuthApi.updateProfile(profileData);
      setUser(updatedUser);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    loginWithGoogle,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};