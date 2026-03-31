import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, type Auth } from 'firebase/auth';

let app: FirebaseApp | undefined;
let auth: Auth | undefined;

function getFirebaseConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
}

export function getFirebaseAuth(): Auth | null {
  const cfg = getFirebaseConfig();
  if (!cfg.apiKey || !cfg.projectId) return null;
  if (!getApps().length) {
    app = initializeApp(cfg);
  } else {
    app = getApps()[0];
  }
  if (!auth) auth = getAuth(app);
  return auth;
}

/** Exchange API custom token for Firebase session; returns Firebase ID token for API Bearer. */
export async function signInWithCustomTokenFromApi(customToken: string): Promise<string> {
  const a = getFirebaseAuth();
  if (!a) throw new Error('Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* in .env.local');
  const cred = await signInWithCustomToken(a, customToken);
  return cred.user.getIdToken();
}

export async function signOutFirebase() {
  const a = getFirebaseAuth();
  if (!a) return;
  const { signOut } = await import('firebase/auth');
  await signOut(a);
}
