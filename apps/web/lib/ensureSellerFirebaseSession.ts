'use client';

import { signInWithCustomTokenFromApi } from './auth';
import { getFirebase } from './firebaseClient';
import * as api from './api';
import { skipGlobalLoaderConfig } from './api';
import { getStoredToken } from './storage';

/**
 * Ensures Firebase Auth matches the seller's `firebaseUid` so Firestore/Storage rules apply.
 * Call after JWT login / on seller routes when `firebaseUid` is known.
 */
export async function ensureSellerFirebaseSession(firebaseUid: string | undefined): Promise<boolean> {
  if (typeof window === 'undefined' || !firebaseUid) return false;
  const jwt = getStoredToken();
  if (!jwt) return false;

  const f = await getFirebase();
  if (!f) return false;

  const cur = f.auth.currentUser;
  if (cur?.uid === firebaseUid) {
    return true;
  }

  try {
    const { data } = await api.getFirebaseCustomToken(skipGlobalLoaderConfig);
    const token = (data as { firebaseCustomToken?: string }).firebaseCustomToken;
    if (!token) return false;
    await signInWithCustomTokenFromApi(token);
    return f.auth.currentUser?.uid === firebaseUid;
  } catch {
    return false;
  }
}
