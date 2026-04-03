'use client';

import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseStorage } from 'firebase/storage';

export type FirebaseClients = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
};

let initPromise: Promise<FirebaseClients | null> | null = null;

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

/** Single Firebase app + Auth + Firestore + Storage (lazy). */
export function getFirebase(): Promise<FirebaseClients | null> {
  if (!initPromise) {
    initPromise = (async () => {
      const cfg = getFirebaseConfig();
      if (!cfg.apiKey || !cfg.projectId) return null;
      const { initializeApp, getApps } = await import('firebase/app');
      const { getAuth } = await import('firebase/auth');
      const { getFirestore } = await import('firebase/firestore');
      const { getStorage } = await import('firebase/storage');
      const app = getApps().length ? getApps()[0]! : initializeApp(cfg);
      return {
        app,
        auth: getAuth(app),
        db: getFirestore(app),
        storage: getStorage(app),
      };
    })();
  }
  return initPromise;
}
