import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  User as FirebaseUser 
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { User, LoginRequest, RegisterRequest, AuthResponse } from "./auth";

// Convert Firebase user to our User interface
const convertFirebaseUserToUser = async (firebaseUser: FirebaseUser): Promise<User> => {
  try {
    // First, check if we have a fallback user in localStorage
    try {
      const fallbackUserStr = localStorage.getItem('fpl-user-fallback');
      if (fallbackUserStr) {
        const fallbackUser = JSON.parse(fallbackUserStr);
        if (fallbackUser.id === firebaseUser.uid) {
          console.log("Using fallback user data from localStorage");
          
                     // Validate and update the fallback user to match current interface
           const validatedFallbackUser: User = {
             id: fallbackUser.id || firebaseUser.uid,
             email: fallbackUser.email || firebaseUser.email || "",
             profile: {
               firstName: fallbackUser.profile?.firstName || firebaseUser.displayName?.split(' ')[0] || "",
               lastName: fallbackUser.profile?.lastName || firebaseUser.displayName?.split(' ').slice(1).join(' ') || "",
               teamName: fallbackUser.profile?.teamName || `${firebaseUser.displayName || 'User'}'s Team`,
               favouriteTeam: fallbackUser.profile?.favouriteTeam || null,
               country: fallbackUser.profile?.country || null,
               region: fallbackUser.profile?.region || null,
               fplTeamId: fallbackUser.profile?.fplTeamId || null,
               fplSquad: fallbackUser.profile?.fplSquad || null,
               totalPoints: fallbackUser.profile?.totalPoints || 0,
               overallRank: fallbackUser.profile?.overallRank || 0,
               gameweekRank: fallbackUser.profile?.gameweekRank || 0,
               gameweekPoints: fallbackUser.profile?.gameweekPoints || 0,
               teamValue: fallbackUser.profile?.teamValue || 1000,
               bank: fallbackUser.profile?.bank || 1000,
               freeTransfers: fallbackUser.profile?.freeTransfers || 2,
               transferCost: fallbackUser.profile?.transferCost || 0,
               pointsOnBench: fallbackUser.profile?.pointsOnBench || 0,
               autoSubsCount: fallbackUser.profile?.autoSubsCount || 0,
               wildcardsUsed: fallbackUser.profile?.wildcardsUsed || 0,
               benchBoostsUsed: fallbackUser.profile?.benchBoostsUsed || 0,
               tripleCaptainsUsed: fallbackUser.profile?.tripleCaptainsUsed || 0,
               freeHitUsed: fallbackUser.profile?.freeHitUsed || 0,
               joinedGameweek: fallbackUser.profile?.joinedGameweek || 1,
               currentGameweek: fallbackUser.profile?.currentGameweek || 1,
               leagues: fallbackUser.profile?.leagues || [],
               achievements: fallbackUser.profile?.achievements || [],
               avatar: fallbackUser.profile?.avatar || null,
               bio: fallbackUser.profile?.bio || null
             },
             createdAt: fallbackUser.createdAt || new Date().toISOString(),
             updatedAt: fallbackUser.updatedAt || new Date().toISOString()
           };
          
          // Update the localStorage with the validated data
          try {
            localStorage.setItem('fpl-user-fallback', JSON.stringify(validatedFallbackUser));
          } catch (updateError) {
            console.warn("Could not update localStorage with validated data:", updateError);
          }
          
          return validatedFallbackUser;
        }
      }
    } catch (localStorageError) {
      console.warn("Could not read from localStorage:", localStorageError);
    }

    // Try to access Firestore with a timeout
    const firestorePromise = getDoc(doc(db, "users", firebaseUser.uid));
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Firestore timeout')), 5000)
    );
    
    let userDoc;
    try {
      userDoc = await Promise.race([firestorePromise, timeoutPromise]);
    } catch (firestoreError: any) {
      console.warn("Firestore access failed:", firestoreError);
      throw new Error('Firestore not accessible');
    }
    
    if (userDoc.exists()) {
             // Validate and clean the data to match our User interface exactly
       const firestoreData = userDoc.data() as any;
       const validatedUser: User = {
         id: firestoreData.id || firebaseUser.uid,
         email: firestoreData.email || firebaseUser.email || "",
         profile: {
           firstName: firestoreData.profile?.firstName || firebaseUser.displayName?.split(' ')[0] || "",
           lastName: firestoreData.profile?.lastName || firebaseUser.displayName?.split(' ').slice(1).join(' ') || "",
           teamName: firestoreData.profile?.teamName || `${firebaseUser.displayName || 'User'}'s Team`,
           favouriteTeam: firestoreData.profile?.favouriteTeam || null,
           country: firestoreData.profile?.country || null,
           region: firestoreData.profile?.region || null,
           fplTeamId: firestoreData.profile?.fplTeamId || null,
           fplSquad: firestoreData.profile?.fplSquad || null,
           totalPoints: firestoreData.profile?.totalPoints || 0,
           overallRank: firestoreData.profile?.overallRank || 0,
           gameweekRank: firestoreData.profile?.gameweekRank || 0,
           gameweekPoints: firestoreData.profile?.gameweekPoints || 0,
           teamValue: firestoreData.profile?.teamValue || 1000,
           bank: firestoreData.profile?.bank || 1000,
           freeTransfers: firestoreData.profile?.freeTransfers || 2,
           transferCost: firestoreData.profile?.transferCost || 0,
           pointsOnBench: firestoreData.profile?.pointsOnBench || 0,
           autoSubsCount: firestoreData.profile?.autoSubsCount || 0,
           wildcardsUsed: firestoreData.profile?.wildcardsUsed || 0,
           benchBoostsUsed: firestoreData.profile?.benchBoostsUsed || 0,
           tripleCaptainsUsed: firestoreData.profile?.tripleCaptainsUsed || 0,
           freeHitUsed: firestoreData.profile?.freeHitUsed || 0,
           joinedGameweek: firestoreData.profile?.joinedGameweek || 1,
           currentGameweek: firestoreData.profile?.currentGameweek || 1,
           leagues: firestoreData.profile?.leagues || [],
           achievements: firestoreData.profile?.achievements || [],
           avatar: firestoreData.profile?.avatar || null,
           bio: firestoreData.profile?.bio || null
         },
         createdAt: firestoreData.createdAt || new Date().toISOString(),
         updatedAt: firestoreData.updatedAt || new Date().toISOString()
       };
      
      console.log("User data loaded from Firestore and validated:", validatedUser);
      return validatedUser;
    } else {
      // Create default user profile if it doesn't exist
      const defaultUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || "",
        profile: {
          firstName: firebaseUser.displayName?.split(' ')[0] || "",
          lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || "",
          teamName: `${firebaseUser.displayName || 'User'}'s Team`,
          favouriteTeam: null,
          country: null,
          region: null,
          fplTeamId: null,
          fplSquad: null,
          totalPoints: 0,
          overallRank: 0,
          gameweekRank: 0,
          gameweekPoints: 0,
          teamValue: 1000,
          bank: 1000,
          freeTransfers: 2,
          transferCost: 0,
          pointsOnBench: 0,
          autoSubsCount: 0,
          wildcardsUsed: 0,
          benchBoostsUsed: 0,
          tripleCaptainsUsed: 0,
          freeHitUsed: 0,
          joinedGameweek: 1,
          currentGameweek: 1,
          leagues: [],
          achievements: [],
          avatar: null,
          bio: null
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      try {
        await setDoc(doc(db, "users", firebaseUser.uid), defaultUser);
        console.log("User profile created in Firestore successfully");
      } catch (firestoreError: any) {
        console.warn("Could not save user to Firestore:", firestoreError);
        // Store in localStorage as fallback
        try {
          localStorage.setItem('fpl-user-fallback', JSON.stringify(defaultUser));
          console.log("User profile saved to localStorage as fallback");
        } catch (localStorageError) {
          console.warn("Could not save to localStorage:", localStorageError);
        }
      }
      
      return defaultUser;
    }
  } catch (error: any) {
    console.warn("Firestore access failed, using fallback mode:", error.message);
    
    // If Firestore access fails, create a minimal user object
    // This prevents the entire sign-in from failing
    const fallbackUser: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || "",
      profile: {
        firstName: firebaseUser.displayName?.split(' ')[0] || "",
        lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || "",
        teamName: `${firebaseUser.displayName || 'User'}'s Team`,
        favouriteTeam: null,
        country: null,
        region: null,
        totalPoints: 0,
        overallRank: 0,
        gameweekRank: 0,
        gameweekPoints: 0,
        teamValue: 1000,
        bank: 1000,
        freeTransfers: 2,
        wildcardsUsed: 0,
        benchBoostsUsed: 0,
        tripleCaptainsUsed: 0,
        freeHitUsed: 0,
        joinedGameweek: 1,
        currentGameweek: 1,
        leagues: [],
        achievements: [],
        avatar: null,
        bio: null,
        fplTeamId: null,
        fplSquad: null,
        transferCost: 0,
        pointsOnBench: 0,
        autoSubsCount: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Store in localStorage as fallback
    try {
      localStorage.setItem('fpl-user-fallback', JSON.stringify(fallbackUser));
      console.log("Fallback user profile created and saved to localStorage");
    } catch (localStorageError) {
      console.warn("Could not save to localStorage:", localStorageError);
    }
    
    return fallbackUser;
  }
};

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Check Firestore connectivity
const checkFirestoreAccess = async (): Promise<boolean> => {
  try {
    // Try to read a test document with a timeout
    const testDoc = doc(db, "test", "connectivity");
    const testPromise = getDoc(testDoc);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 3000)
    );
    
    await Promise.race([testPromise, timeoutPromise]);
    return true;
  } catch (error) {
    console.warn("Firestore connectivity check failed:", error);
    return false;
  }
};

// Firebase Authentication API
export const firebaseAuthApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth, 
        credentials.email, 
        credentials.password
      );
      
      const user = await convertFirebaseUserToUser(userCredential.user);
      
      // Get the ID token for authentication
      const token = await userCredential.user.getIdToken();
      
      return { token, user };
    } catch (error) {
      console.error("Firebase login error:", error);
      throw error;
    }
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      // Create user profile in Firestore
      const newUser: User = {
        id: userCredential.user.uid,
        email: userData.email,
        profile: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          teamName: userData.teamName,
          favouriteTeam: userData.favouriteTeam || null,
          country: userData.country || null,
          region: null,
          totalPoints: 0,
          overallRank: 0,
          gameweekRank: 0,
          gameweekPoints: 0,
          teamValue: 1000,
          bank: 1000,
          freeTransfers: 2,
          wildcardsUsed: 0,
          benchBoostsUsed: 0,
          tripleCaptainsUsed: 0,
          freeHitUsed: 0,
          joinedGameweek: 1,
          currentGameweek: 1,
          leagues: [],
          achievements: [],
          avatar: null,
          bio: null,
          fplTeamId: null,
          fplSquad: null,
          transferCost: 0,
          pointsOnBench: 0,
          autoSubsCount: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, "users", userCredential.user.uid), newUser);
      
      // Get the ID token for authentication
      const token = await userCredential.user.getIdToken();
      
      return { token, user: newUser };
    } catch (error) {
      console.error("Firebase registration error:", error);
      throw error;
    }
  },

  getProfile: async (): Promise<User> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user");
      }
      
      return await convertFirebaseUserToUser(currentUser);
    } catch (error) {
      console.error("Firebase get profile error:", error);
      throw error;
    }
  },

  updateProfile: async (profileData: Partial<User['profile']>): Promise<User> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user");
      }
      
      // Try to update Firestore
      try {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, {
          profile: profileData,
          updatedAt: new Date().toISOString()
        });
        
        // Get updated user data
        const updatedDoc = await getDoc(userRef);
        return updatedDoc.data() as User;
      } catch (firestoreError: any) {
        console.warn("Could not update Firestore:", firestoreError);
        
        // If Firestore update fails, create a local updated user object
        // This allows the UI to update even if the database is not accessible
        const currentUserData = await convertFirebaseUserToUser(currentUser);
        const updatedUser: User = {
          ...currentUserData,
          profile: {
            ...currentUserData.profile,
            ...profileData
          },
          updatedAt: new Date().toISOString()
        };
        
        // Store the updated user in localStorage as a fallback
        try {
          localStorage.setItem('fpl-user-fallback', JSON.stringify(updatedUser));
        } catch (localStorageError) {
          console.warn("Could not save to localStorage:", localStorageError);
        }
        
        return updatedUser;
      }
    } catch (error) {
      console.error("Firebase update profile error:", error);
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Firebase logout error:", error);
      throw error;
    }
  },

  // Google Sign In
  signInWithGoogle: async (): Promise<AuthResponse> => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = await convertFirebaseUserToUser(result.user);
      
      // Get the ID token for authentication
      const token = await result.user.getIdToken();
      
      return { token, user };
    } catch (error: any) {
      // Handle specific Firebase auth errors
      if (error.code === 'auth/popup-closed-by-user' || 
          error.code === 'auth/cancelled-popup-request' ||
          error.code === 'auth/popup-blocked') {
        // User cancelled or popup was blocked - don't treat as error
        throw error;
      }
      
      // Handle Firestore permission errors gracefully
      if (error.message && error.message.includes('Missing or insufficient permissions')) {
        console.warn("Firestore permissions issue - user can still sign in");
                          // Create a minimal user response without Firestore data
          const minimalUser: User = {
            id: error.uid || 'temp-user',
            email: error.email || '',
            profile: {
              firstName: '',
              lastName: '',
              teamName: 'My Team',
              favouriteTeam: null,
              country: null,
              region: null,
              totalPoints: 0,
              overallRank: 0,
              gameweekRank: 0,
              gameweekPoints: 0,
              teamValue: 1000,
              bank: 1000,
              freeTransfers: 2,
              wildcardsUsed: 0,
              benchBoostsUsed: 0,
              tripleCaptainsUsed: 0,
              freeHitUsed: 0,
              joinedGameweek: 1,
              currentGameweek: 1,
              leagues: [],
              achievements: [],
              avatar: null,
              bio: null,
              fplTeamId: null,
              fplSquad: null,
              transferCost: 0,
              pointsOnBench: 0,
              autoSubsCount: 0
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
        
        return { token: 'temp-token', user: minimalUser };
      }
      
      console.error("Google sign in error:", error);
      throw error;
    }
  },

  // Listen to authentication state changes
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await convertFirebaseUserToUser(firebaseUser);
          
          // Get and store the ID token for API authentication
          const token = await firebaseUser.getIdToken();
          localStorage.setItem('fpl-auth-token', token);
          
          callback(user);
        } catch (error) {
          console.error("Error converting Firebase user:", error);
          callback(null);
        }
      } else {
        // Clear the token when user logs out
        localStorage.removeItem('fpl-auth-token');
        callback(null);
      }
    });
  },

  // Check database connectivity
  checkDatabaseStatus: async (): Promise<{ isAccessible: boolean; message: string }> => {
    try {
      const isAccessible = await checkFirestoreAccess();
      if (isAccessible) {
        return { 
          isAccessible: true, 
          message: "Firestore database is accessible" 
        };
      } else {
        return { 
          isAccessible: false, 
          message: "Firestore database is not accessible - using local storage" 
        };
      }
    } catch (error) {
      return { 
        isAccessible: false, 
        message: "Database connectivity check failed" 
      };
    }
  }
};
