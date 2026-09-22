"use client";

import { Button } from "@/components/ui/Button";
import { useReservation } from "./ReservationProvider";

type Variant = "outline" | "solid" | "ghost";

/**
 * Thin wrapper so every "hold a table" affordance on the site is the same
 * button, opens the same single dialog, and picks up magnetism and the gold
 * wipe for free.
 */
export function ReserveButton({
  variant = "outline",
  tone = "gold",
  className,
  children = "Reserve",
}: {
  variant?: Variant;
  tone?: "gold" | "ink";
  className?: string;
  children?: React.ReactNode;
}) {
  const { open } = useReservation();

  return (
    <Button type="button" onClick={open} variant={variant} tone={tone} className={className}>
      {children}
    </Button>
  );
}
