/**
 * Client-only inactivity timeout (JWT remains in localStorage; this tracks idle time).
 * Default 30 minutes after last user activity.
 */

const STORAGE_KEY = 'businexa_last_activity';

/** Inactivity limit in milliseconds (30 minutes). */
export const SESSION_IDLE_MS = 30 * 60 * 1000;

export function touchActivity(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* quota / private mode */
  }
}

export function clearActivityTimestamp(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function getLastActivityTime(): number {
  if (typeof window === 'undefined') return Date.now();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return Date.now();
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : Date.now();
  } catch {
    return Date.now();
  }
}

export function isIdleExceeded(idleMs: number = SESSION_IDLE_MS): boolean {
  return Date.now() - getLastActivityTime() > idleMs;
}
