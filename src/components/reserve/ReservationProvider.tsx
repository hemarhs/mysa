"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { ReservationModal } from "./ReservationModal";

type ReservationContextValue = { open: () => void; close: () => void };

const ReservationContext = createContext<ReservationContextValue | null>(null);

/**
 * One reservation dialog for the whole site, opened from anywhere via
 * useReservation(). Mounted once in the site layout so the modal markup is
 * not duplicated per button.
 */
export function ReservationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <ReservationContext.Provider value={value}>
      {children}
      <ReservationModal open={isOpen} onClose={close} />
    </ReservationContext.Provider>
  );
}

export function useReservation() {
  const context = useContext(ReservationContext);
  if (!context) {
    throw new Error("useReservation must be used inside <ReservationProvider>.");
  }
  return context;
}
