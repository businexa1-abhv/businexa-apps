import { create } from 'zustand';

/**
 * Tracks in-flight `apiClient` requests for a single global loader.
 * Use header `X-Skip-Global-Loader: true` on a request to opt out (polling, background refresh).
 */
type ApiLoadingState = {
  pending: number;
  begin: () => void;
  end: () => void;
};

export const useApiLoadingStore = create<ApiLoadingState>((set, get) => ({
  pending: 0,
  begin: () => set({ pending: get().pending + 1 }),
  end: () => set({ pending: Math.max(0, get().pending - 1) }),
}));

/** For use outside React (axios interceptors). */
export function getApiLoadingStore() {
  return useApiLoadingStore.getState();
}
