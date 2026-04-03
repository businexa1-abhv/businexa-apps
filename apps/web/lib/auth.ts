import type { Auth } from 'firebase/auth';
import { getFirebase } from './firebaseClient';

/** Loads Firebase Auth (shared app with Firestore/Storage). */
export async function getFirebaseAuthLazy(): Promise<Auth | null> {
  const f = await getFirebase();
  return f?.auth ?? null;
}

/** Exchange API custom token for Firebase session; returns Firebase ID token for API Bearer. */
export async function signInWithCustomTokenFromApi(customToken: string): Promise<string> {
  const a = await getFirebaseAuthLazy();
  if (!a) throw new Error('Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* in .env.local');
  const { signInWithCustomToken } = await import('firebase/auth');
  const cred = await signInWithCustomToken(a, customToken);
  return cred.user.getIdToken();
}

export async function signOutFirebase() {
  const a = await getFirebaseAuthLazy();
  if (!a) return;
  const { signOut } = await import('firebase/auth');
  await signOut(a);
}
