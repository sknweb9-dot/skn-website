'use client';

import { useEffect, useLayoutEffect } from 'react';

/**
 * useLayoutEffect on the client, useEffect on the server.
 *
 * Needed for anything that restructures the DOM — GSAP's ScrollTrigger `pin`
 * reparents its target into a generated `.pin-spacer`. React runs
 * useLayoutEffect cleanups during the mutation phase, *before* it removes host
 * nodes, whereas useEffect cleanups run after. With useEffect, React deletes
 * the reparented nodes first and then GSAP tries to restore them, which throws
 * "removeChild: The node to be removed is not a child of this node".
 *
 * The plain useEffect fallback avoids React's SSR warning; it never actually
 * runs on the server.
 */
export const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;
