import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import { AuthResponse, LoginRequest, RegisterRequest, User, authStorage } from "./auth";

const convertFirebaseUserToUser = async (firebaseUser: FirebaseUser): Promise<User> => {
  // Try fallback user first (offline / Firestore permissions)
  const fallbackUser = await authStorage.getFallbackUser();
  if (fallbackUser?.id === firebaseUser.uid) return fallbackUser;

  try {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      return userDoc.data() as User;
    }
  } catch {
    // ignore and fall back
  }

  const defaultUser: User = {
    id: firebaseUser.uid,
    email: firebaseUser.email || "",
    profile: {
      firstName: firebaseUser.displayName?.split(" ")[0] || "",
      lastName: firebaseUser.displayName?.split(" ").slice(1).join(" ") || "",
      teamName: `${firebaseUser.displayName || "User"}'s Team`,
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
      bio: null,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, "users", firebaseUser.uid), defaultUser);
  } catch {
    await authStorage.setFallbackUser(defaultUser);
  }

  return defaultUser;
};

export const firebaseAuthApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    const user = await convertFirebaseUserToUser(userCredential.user);
    const token = await userCredential.user.getIdToken();
    await authStorage.setToken(token);
    await authStorage.setUser(user);
    return { token, user };
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);

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
        bio: null,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "users", userCredential.user.uid), newUser);
    } catch {
      await authStorage.setFallbackUser(newUser);
    }

    const token = await userCredential.user.getIdToken();
    await authStorage.setToken(token);
    await authStorage.setUser(newUser);
    return { token, user: newUser };
  },

  getProfile: async (): Promise<User> => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No authenticated user");
    const user = await convertFirebaseUserToUser(currentUser);
    await authStorage.setUser(user);
    return user;
  },

  updateProfile: async (profileData: Partial<User["profile"]>): Promise<User> => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error("No authenticated user");

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { profile: profileData, updatedAt: new Date().toISOString() });
      const updatedDoc = await getDoc(userRef);
      const updatedUser = updatedDoc.data() as User;
      await authStorage.setUser(updatedUser);
      return updatedUser;
    } catch {
      const existing = (await authStorage.getUser()) ?? (await convertFirebaseUserToUser(currentUser));
      const updatedUser: User = {
        ...existing,
        profile: { ...existing.profile, ...profileData },
        updatedAt: new Date().toISOString(),
      };
      await authStorage.setFallbackUser(updatedUser);
      await authStorage.setUser(updatedUser);
      return updatedUser;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await signOut(auth);
    } finally {
      await authStorage.removeToken();
      await authStorage.removeUser();
    }
  },

  // Not implemented for mobile yet (web uses popup flow).
  signInWithGoogle: async (): Promise<AuthResponse> => {
    throw new Error("Google sign-in is not set up for mobile yet.");
  },

  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await convertFirebaseUserToUser(firebaseUser);
        const token = await firebaseUser.getIdToken();
        await authStorage.setToken(token);
        await authStorage.setUser(user);
        callback(user);
      } else {
        await authStorage.removeToken();
        await authStorage.removeUser();
        callback(null);
      }
    });
  },

  // Utility used elsewhere in the web app; kept for API parity.
  findUsersByEmail: async (email: string) => {
    const q = query(collection(db, "users"), where("email", "==", email));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as User);
  },
};

