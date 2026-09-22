"use client";

import { cn } from "@/lib/cn";
import { useReservation } from "./ReservationProvider";

type Variant = "outline" | "solid" | "ghost";

const styles: Record<Variant, string> = {
  outline:
    "border border-gold/40 text-gold hover:border-gold hover:bg-gold hover:text-espresso",
  solid: "bg-gold text-espresso hover:bg-gold-light",
  ghost: "text-gold hover:text-gold-light",
};

export function ReserveButton({
  variant = "outline",
  className,
  children = "Reserve",
}: {
  variant?: Variant;
  className?: string;
  children?: React.ReactNode;
}) {
  const { open } = useReservation();

  return (
    <button
      type="button"
      onClick={open}
      className={cn(
        "inline-flex items-center justify-center gap-2.5 whitespace-nowrap px-7 py-4 font-sans text-[0.8125rem] font-medium uppercase tracking-[0.16em] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        styles[variant],
        className
      )}
    >
      {children}
    </button>
  );
}
