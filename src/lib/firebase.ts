import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Default Firebase config embedded for seamless deployment on Vercel/GitHub
export const firebaseConfig = {
  projectId: "zeta-zenith-mk8sk",
  appId: "1:440271369460:web:38d0ee603c86df1f055aa1",
  apiKey: "AIzaSyBXVouEl5cCgFq_tKNziCiiln6hw15E56k",
  authDomain: "zeta-zenith-mk8sk.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-sapalingkunganst-d2b9b8f6-266c-4ec3-a5d2-4b4a5900293f",
  storageBucket: "zeta-zenith-mk8sk.firebasestorage.app",
  messagingSenderId: "440271369460"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use the specific firestore database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export default app;
