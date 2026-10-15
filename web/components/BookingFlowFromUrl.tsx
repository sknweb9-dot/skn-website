'use client';

import { useSearchParams } from 'next/navigation';
import BookingFlow from './BookingFlow';
import { parsePrefill } from '@/lib/booking';

/**
 * Reads the prefill from the query string and hands it to the flow.
 *
 * Split out so the page can wrap only this in Suspense — see app/book/page.tsx.
 * The key remounts the flow if the query changes while the page is open (the
 * masthead's own button, pressed from /book?for=adult, lands on /book), so a
 * new arrival never inherits half of an old draft.
 */
export default function BookingFlowFromUrl() {
  const params = useSearchParams();
  const prefill = parsePrefill((key) => params.get(key));
  return <BookingFlow key={params.toString()} prefill={prefill} />;
}
