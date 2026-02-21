import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCn5MXzSMzjYWaokAVa4K9Gdond0C98aWo",
  authDomain: "premvision-46163.firebaseapp.com",
  projectId: "premvision-46163",
  storageBucket: "premvision-46163.firebasestorage.app",
  messagingSenderId: "568819864644",
  appId: "1:568819864644:web:d25b81220de7af6e4e9811",
  measurementId: "G-TT178SX4VN",
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firebase JS SDK works in Expo; auth persistence varies by environment.
export const auth = getAuth(app);

export const db = getFirestore(app);

