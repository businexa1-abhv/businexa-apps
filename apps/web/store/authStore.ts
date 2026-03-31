import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types';
import { setStoredToken } from '@/lib/storage';

interface AuthState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      setSession: (token, user) => {
        setStoredToken(token);
        set({ user });
      },
      clearSession: () => {
        setStoredToken(null);
        set({ user: null });
      },
    }),
    {
      name: 'businexa-auth',
      partialize: (s) => ({ user: s.user }),
    }
  )
);
