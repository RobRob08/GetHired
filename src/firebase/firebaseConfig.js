import { getApp, getApps, initializeApp } from 'firebase/app';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';

const readEnv = (key) => (process.env[key] ?? '').trim();

const firebaseConfig = {
  apiKey: readEnv('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: readEnv('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: readEnv('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: readEnv('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readEnv('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readEnv('EXPO_PUBLIC_FIREBASE_APP_ID'),
};

if (!firebaseConfig.apiKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_FIREBASE_API_KEY. Create a .env file at project root, then restart Expo with: npx expo start -c'
  );
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Auth may already be initialized after fast refresh.
  auth = getAuth(app);
}

const db = getFirestore(app);

export { app, auth, db };

