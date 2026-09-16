'use client';

import { useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const list = window.matchMedia(QUERY);
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
}

function getSnapshot(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}

/** The server cannot know the preference, so it assumes motion is allowed. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * Reads the user's motion preference as an external store rather than syncing it
 * into state from an effect. Avoids the cascading render that setState-in-effect
 * causes, and stays correct if the preference changes mid-session.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
