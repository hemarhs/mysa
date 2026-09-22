"use client";

import Link from "next/link";
import { useCallback, useRef, type ComponentProps, type ReactNode } from "react";

import { cn } from "@/lib/cn";

type Variant = "solid" | "outline" | "ghost";
type Tone = "gold" | "ink";

/**
 * Shared surface for every call to action.
 *
 * The hover is a gold panel that wipes up from the bottom edge rather than a
 * colour fade — it costs one transform, reads as a physical thing moving,
 * and cannot produce the muddy mid-colour that a cross-fade between brass
 * and espresso gives you.
 */
const base = [
  "group/btn relative isolate inline-flex items-center justify-center gap-2.5",
  "overflow-hidden whitespace-nowrap select-none",
  "font-sans text-[0.75rem] font-semibold uppercase tracking-[0.2em]",
  "px-8 py-4 transition-colors duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
  "disabled:pointer-events-none disabled:opacity-40",
].join(" ");

const styles: Record<Tone, Record<Variant, string>> = {
  gold: {
    solid: "bg-gold text-espresso hover:text-espresso",
    outline: "border border-gold/45 text-gold hover:border-gold hover:text-espresso",
    ghost: "text-gold hover:text-gold-light",
  },
  ink: {
    solid: "bg-espresso text-cream hover:text-espresso",
    outline:
      "border border-espresso/25 text-espresso hover:border-espresso/60 hover:text-espresso",
    ghost: "text-espresso hover:text-gold-ink",
  },
};

/** The wiping panel. Absent on ghost buttons, which are pure type. */
function Wipe({ tone, variant }: { tone: Tone; variant: Variant }) {
  if (variant === "ghost") return null;

  return (
    <span
      aria-hidden
      className={cn(
        "absolute inset-0 -z-10 origin-bottom scale-y-0 transition-transform duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        "group-hover/btn:scale-y-100 group-focus-visible/btn:scale-y-100",
        tone === "gold" && variant === "solid" && "bg-gold-light",
        tone === "gold" && variant === "outline" && "bg-gold",
        tone === "ink" && variant === "solid" && "bg-gold",
        tone === "ink" && variant === "outline" && "bg-gold"
      )}
    />
  );
}

type SharedProps = {
  variant?: Variant;
  tone?: Tone;
  children: ReactNode;
  className?: string;
  /** Pulls the button gently toward the cursor. Desktop, fine pointers only. */
  magnetic?: boolean;
};

/**
 * Magnetism, implemented on the DOM node.
 *
 * Kept off React state for the same reason as the cursor: a pointermove
 * handler that calls setState would re-render a component sixty times a
 * second. This writes one transform and clears it on leave.
 */
function useMagnet(enabled: boolean) {
  const ref = useRef<HTMLElement | null>(null);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (!enabled) return;
      const node = ref.current;
      if (!node || event.pointerType !== "mouse") return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const rect = node.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);
      // Capped at roughly a fifth of the button's own size — enough to feel
      // alive, never enough to move the hit area away from the pointer.
      node.style.transform = `translate3d(${x * 0.18}px, ${y * 0.22}px, 0)`;
    },
    [enabled]
  );

  const onPointerLeave = useCallback(() => {
    const node = ref.current;
    if (node) node.style.transform = "";
  }, []);

  return { ref, onPointerMove, onPointerLeave };
}

export function Button({
  variant = "solid",
  tone = "gold",
  className,
  children,
  magnetic = true,
  ...props
}: SharedProps & Omit<ComponentProps<"button">, "ref">) {
  const { ref, onPointerMove, onPointerLeave } = useMagnet(magnetic);

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cn(
        base,
        styles[tone][variant],
        "duration-500 will-change-transform",
        className
      )}
      style={{ transitionProperty: "color, background-color, border-color, transform" }}
      {...props}
    >
      <Wipe tone={tone} variant={variant} />
      <span className="relative">{children}</span>
    </button>
  );
}

export function ButtonLink({
  variant = "solid",
  tone = "gold",
  className,
  children,
  magnetic = true,
  ...props
}: SharedProps & Omit<ComponentProps<typeof Link>, "ref">) {
  const { ref, onPointerMove, onPointerLeave } = useMagnet(magnetic);

  return (
    <Link
      ref={ref as React.Ref<HTMLAnchorElement>}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cn(
        base,
        styles[tone][variant],
        "duration-500 will-change-transform",
        className
      )}
      style={{ transitionProperty: "color, background-color, border-color, transform" }}
      {...props}
    >
      <Wipe tone={tone} variant={variant} />
      <span className="relative">{children}</span>
    </Link>
  );
}

/**
 * Text link with a rule that wipes through on hover: the old rule leaves to
 * the right as the new one arrives from the left, so the line never simply
 * grows — it travels.
 */
export function UnderlineLink({
  className,
  children,
  tone = "gold",
  ...props
}: ComponentProps<typeof Link> & { tone?: Tone }) {
  return (
    <Link
      className={cn(
        "group/link relative inline-flex flex-col items-start gap-1.5",
        "font-sans text-[0.75rem] font-semibold uppercase tracking-[0.2em]",
        "transition-colors duration-300",
        tone === "gold"
          ? "text-gold hover:text-gold-light"
          : "text-espresso hover:text-gold-ink",
        className
      )}
      {...props}
    >
      <span className="relative">{children}</span>
      <span className="relative block h-px w-full overflow-hidden bg-current/25">
        <span className="absolute inset-0 block origin-left scale-x-0 bg-current transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/link:scale-x-100 group-focus-visible/link:scale-x-100" />
      </span>
    </Link>
  );
}
