'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredToken, setStoredToken } from '@/lib/storage';
import { useAuthStore } from '@/store/authStore';
import {
  SESSION_IDLE_MS,
  touchActivity,
  clearActivityTimestamp,
  getLastActivityTime,
} from '@/lib/sessionIdle';

const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'visibilitychange',
] as const;

/** Throttle writes to sessionStorage (mousemove fires very often). */
const THROTTLE_MS = 10_000;

/**
 * Logs out after {@link SESSION_IDLE_MS} with no user activity while a token exists.
 */
export function SessionIdleGuard() {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastWriteRef = useRef(0);

  useEffect(() => {
    const tick = () => {
      const token = getStoredToken();
      if (!token) {
        clearActivityTimestamp();
        return;
      }
      if (Date.now() - getLastActivityTime() > SESSION_IDLE_MS) {
        clearSession();
        setStoredToken(null);
        clearActivityTimestamp();
        window.dispatchEvent(new CustomEvent('businexa:session-idle-expired'));
        router.replace('/');
      }
    };

    const onActivity = () => {
      if (!getStoredToken()) return;
      const now = Date.now();
      if (now - lastWriteRef.current < THROTTLE_MS) return;
      lastWriteRef.current = now;
      touchActivity();
    };

    ACTIVITY_EVENTS.forEach((ev) => {
      const target: Window | Document = ev === 'visibilitychange' ? document : window;
      target.addEventListener(ev, onActivity, { passive: true });
    });

    intervalRef.current = setInterval(tick, 15_000);
    tick();

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => {
        const target: Window | Document = ev === 'visibilitychange' ? document : window;
        target.removeEventListener(ev, onActivity);
      });
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [clearSession, router]);

  return null;
}
