import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(callback) {
  const media = window.matchMedia?.(QUERY);
  media?.addEventListener('change', callback);
  return () => media?.removeEventListener('change', callback);
}

const getSnapshot = () => window.matchMedia?.(QUERY).matches ?? false;
const getServerSnapshot = () => false;

/** True when the visitor asked the OS for less motion (accessibility). */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
