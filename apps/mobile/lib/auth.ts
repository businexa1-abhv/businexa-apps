import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import Constants from 'expo-constants';

function cfg() {
  const extra = Constants.expoConfig?.extra ?? {};
  return {
    apiKey: (extra.firebaseApiKey as string) || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: (extra.firebaseAuthDomain as string) || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: (extra.firebaseProjectId as string) || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: (extra.firebaseStorageBucket as string) || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: (extra.firebaseMessagingSenderId as string) || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: (extra.firebaseAppId as string) || process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
}

export async function signInWithCustomTokenFromApi(customToken: string): Promise<string> {
  const c = cfg();
  if (!c.apiKey || !c.projectId) {
    throw new Error('Firebase env not configured');
  }
  const app = getApps().length ? getApps()[0] : initializeApp(c);
  const auth = getAuth(app);
  const cred = await signInWithCustomToken(auth, customToken);
  return cred.user.getIdToken();
}
