import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD1fl_rvOaCCuaEvYnKqicX0OLsEDIlUSU",
  authDomain: "promptwars-95388.firebaseapp.com",
  projectId: "promptwars-95388",
  storageBucket: "promptwars-95388.firebasestorage.app",
  messagingSenderId: "724504838351",
  appId: "1:724504838351:web:f6788bb6ab964e5d99f7ba",
  measurementId: "G-32QFPMJD3Q"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
