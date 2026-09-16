'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

type BookingContextValue = {
  isOpen: boolean;
  /** Where the CTA was clicked, so the form can carry intent through. */
  source: string;
  open: (source?: string) => void;
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

  const open = useCallback((from = 'site') => {
    setSource(from);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ isOpen, source, open, close }), [isOpen, source, open, close]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}
