// src/firebase/rtdb-config.ts
import { initializeApp } from 'firebase/app';
import { 
  getDatabase,
  ref,
  onValue,
  set,
  push,
  serverTimestamp,
  off,
  get,
  update,
  Database
} from 'firebase/database';
import { getStorage } from 'firebase/storage';

// Firebase configuration - same as website
const firebaseConfig = {
  apiKey: "AIzaSyDPxXUrCP-Juhj1kTGIflfbrb66_97MrCI",
  authDomain: "web-app-c1fa1.firebaseapp.com",
  databaseURL: "https://web-app-c1fa1-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "web-app-c1fa1",
  storageBucket: "web-app-c1fa1.firebasestorage.app",
  messagingSenderId: "606306901710",
  appId: "1:606306901710:web:ebecaec41d0b89be5dfa9f",
  measurementId: "G-Y8K58MXYP0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
export const rtdb: Database = getDatabase(app);

// Initialize Storage
export const storage = getStorage(app);

// Export Firebase Realtime Database functions
export { 
  ref as dbRef,
  onValue,
  set,
  push,
  serverTimestamp as rtdbServerTimestamp,
  off,
  get,
  update
};