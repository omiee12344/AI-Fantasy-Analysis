// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, Auth, User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, Firestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCn5MXzSMzjYWaokAVa4K9Gdond0C98aWo",
  authDomain: "premvision-46163.firebaseapp.com",
  projectId: "premvision-46163",
  storageBucket: "premvision-46163.firebasestorage.app",
  messagingSenderId: "568819864644",
  appId: "1:568819864644:web:d25b81220de7af6e4e9811",
  measurementId: "G-TT178SX4VN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const analytics = getAnalytics(app);

// Export Firebase app instance
export default app;
