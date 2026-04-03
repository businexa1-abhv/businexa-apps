'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getStoredToken } from '@/lib/storage';
import * as api from '@/lib/api';
import { signInWithCustomTokenFromApi, signOutFirebase } from '@/lib/auth';
import type { AuthUser, BuyerAccess, RegisterPasswordPayload } from '@/types';

export function useAuth() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);
  const setUser = useAuthStore((s) => s.setUser);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = typeof window !== 'undefined' && Boolean(getStoredToken());

  const refreshProfile = useCallback(async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const { data } = await api.getMe();
      const u = data.user as Record<string, unknown>;
      const buyerAccess = (data as { buyerAccess?: BuyerAccess }).buyerAccess;
      setUser({
        userId: String(u._id ?? ''),
        firebaseUid: typeof u.firebaseUid === 'string' ? u.firebaseUid : undefined,
        username: typeof u.username === 'string' ? u.username : undefined,
        mobileNumber: typeof u.mobileNumber === 'string' ? u.mobileNumber : undefined,
        fullName: typeof u.fullName === 'string' ? u.fullName : undefined,
        email: typeof u.email === 'string' ? u.email : undefined,
        role: u.role as AuthUser['role'],
        isNewUser: false,
        businessType: typeof u.businessType === 'string' ? u.businessType : undefined,
        buyerAccess: u.role === 'buyer' && buyerAccess ? buyerAccess : undefined,
      });
    } catch {
      clearSession();
    }
  }, [clearSession, setUser]);

  useEffect(() => {
    const onExpired = () => {
      clearSession();
      router.replace('/');
    };
    window.addEventListener('businexa:auth-expired', onExpired);
    return () => window.removeEventListener('businexa:auth-expired', onExpired);
  }, [clearSession, router]);

  useEffect(() => {
    if (getStoredToken() && !user) {
      refreshProfile();
    }
  }, [user, refreshProfile]);

  const sendOTP = useCallback(async (mobileNumber: string, checkUserExists?: boolean) => {
    setError(null);
    setIsLoading(true);
    try {
      const { data } = await api.sendOTP(mobileNumber, checkUserExists);
      if (!data.success) {
        setError((data as { message?: string }).message || 'Failed to send OTP');
        return { success: false as const };
      }
      return { success: true as const, data };
    } catch (e: unknown) {
      const msg = e && typeof e === 'object' && 'response' in e ? (e as { response?: { data?: { message?: string } } }).response?.data?.message : null;
      setError(msg || 'Failed to send OTP');
      return { success: false as const };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(
    async (mobileNumber: string, otp: string, role: 'buyer' | 'seller' = 'seller') => {
      setError(null);
      setIsLoading(true);
      try {
        const { data } = await api.verifyOTP(mobileNumber, otp, role);
        if (!data.success || !data.firebaseToken) {
          setError((data as { message?: string }).message || 'Verification failed');
          return { success: false as const };
        }
        const idToken = await signInWithCustomTokenFromApi(data.firebaseToken);
        const u = data.user as { userId: string; mobileNumber: string; role: AuthUser['role']; isNewUser: boolean };
        setSession(idToken, {
          userId: u.userId,
          mobileNumber: u.mobileNumber,
          role: u.role,
          isNewUser: u.isNewUser,
        });
        return { success: true as const, isNewUser: u.isNewUser };
      } catch (e: unknown) {
        const msg =
          e && typeof e === 'object' && 'response' in e
            ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
            : e instanceof Error
              ? e.message
              : null;
        setError(msg || 'Verification failed');
        return { success: false as const };
      } finally {
        setIsLoading(false);
      }
    },
    [setSession]
  );

  const loginWithPassword = useCallback(
    async (username: string, password: string) => {
      setError(null);
      setIsLoading(true);
      try {
        const { data } = await api.loginPassword(username, password);
        if (!data.success || !(data as { token?: string }).token) {
          setError((data as { message?: string }).message || 'Login failed');
          return { success: false as const };
        }
        const token = (data as { token: string }).token;
        const u = (data as {
          user: {
            userId: string;
            username?: string;
            email?: string;
            mobileNumber?: string;
            fullName?: string;
            role: AuthUser['role'];
            firebaseUid?: string;
          };
        }).user;
        setSession(token, {
          userId: u.userId,
          firebaseUid: u.firebaseUid,
          username: u.username,
          email: u.email,
          mobileNumber: u.mobileNumber,
          fullName: u.fullName,
          role: u.role,
          isNewUser: false,
          businessType: 'businessType' in u && typeof (u as { businessType?: string }).businessType === 'string'
            ? (u as { businessType?: string }).businessType
            : undefined,
        });
        return { success: true as const };
      } catch (e: unknown) {
        const msg =
          e && typeof e === 'object' && 'response' in e
            ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;
        setError(msg || 'Login failed');
        return { success: false as const };
      } finally {
        setIsLoading(false);
      }
    },
    [setSession]
  );

  const registerWithPassword = useCallback(
    async (payload: RegisterPasswordPayload) => {
      setError(null);
      setIsLoading(true);
      try {
        const { data } = await api.registerPassword(payload);
        if (!data.success || !(data as { token?: string }).token) {
          setError((data as { message?: string }).message || 'Registration failed');
          return { success: false as const, isNewUser: false };
        }
        const token = (data as { token: string }).token;
        const u = (data as {
          user: {
            userId: string;
            username?: string;
            mobileNumber?: string;
            fullName?: string;
            email?: string;
            role: AuthUser['role'];
            isNewUser?: boolean;
            firebaseUid?: string;
          };
          shop?: unknown;
        }).user;
        setSession(token, {
          userId: u.userId,
          firebaseUid: u.firebaseUid,
          username: u.username,
          mobileNumber: u.mobileNumber,
          fullName: u.fullName,
          email: u.email,
          role: u.role,
          isNewUser: u.isNewUser ?? true,
          businessType: 'businessType' in u && typeof (u as { businessType?: string }).businessType === 'string'
            ? (u as { businessType?: string }).businessType
            : undefined,
        });
        return { success: true as const, isNewUser: Boolean(u.isNewUser) };
      } catch (e: unknown) {
        const msg =
          e && typeof e === 'object' && 'response' in e
            ? (e as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;
        setError(msg || 'Registration failed');
        return { success: false as const, isNewUser: false };
      } finally {
        setIsLoading(false);
      }
    },
    [setSession]
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.logoutApi().catch(() => {});
      await signOutFirebase().catch(() => {});
    } finally {
      clearSession();
      setIsLoading(false);
      router.replace('/');
    }
  }, [clearSession, router]);

  return {
    currentUser: user,
    isAuthenticated,
    isLoading,
    error,
    sendOTP,
    verifyOTP,
    loginWithPassword,
    registerWithPassword,
    logout,
    refreshProfile,
    clearError: () => setError(null),
  };
}
