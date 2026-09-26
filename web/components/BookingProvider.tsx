'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * What the button that opened the form already knows. A parent who pressed
 * "Enquire about Appswamy Springs" has told us the venue; the form should not
 * make them say it again, or reset it to the city default.
 */
export type BookingPrefill = {
  /** Branch slug from lib/site.ts, or 'online' */
  branch?: string;
  /** Venue id from lib/classes.ts */
  venue?: string;
};

type BookingContextValue = {
  isOpen: boolean;
  /** Where the CTA was clicked, so the form can carry intent through. */
  source: string;
  prefill: BookingPrefill;
  open: (source?: string, prefill?: BookingPrefill) => void;
  close: () => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used inside <BookingProvider>');
  return ctx;
}

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState('site');
  const [prefill, setPrefill] = useState<BookingPrefill>({});

  const open = useCallback((from = 'site', with_: BookingPrefill = {}) => {
    setSource(from);
    setPrefill(with_);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, source, prefill, open, close }),
    [isOpen, source, prefill, open, close],
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}
