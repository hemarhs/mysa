"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { NAV_LINKS, SITE } from "@/lib/site";
import { cn } from "@/lib/cn";
import { EASE_EXPO } from "@/lib/motion";
import { Wordmark } from "@/components/brand/Wordmark";
import { ReserveButton } from "@/components/reserve/ReserveButton";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  /**
   * One piece of state from one scroll listener: whether we have left the top
   * of the page, which drops the glass background in.
   *
   * The header used to tuck itself away on downward scroll. It had to go. The
   * menu and gallery pages both carry a sticky category rail pinned to
   * `top-[4.25rem]` — the header's own height — so when the header slid up it
   * left a transparent 4.25rem band with page content scrolling through it,
   * directly above the rail. Auto-hiding chrome also fights the reader: the
   * bar reappears the moment you nudge upward, which reads as the header
   * "coming down" at you.
   *
   * A header that is simply always there is calmer, and it makes the sticky
   * offsets below it exact instead of conditional.
   */
  useEffect(() => {
    let frame = 0;

    const read = () => {
      setScrolled(window.scrollY > 24);
      frame = 0;
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  // Close the mobile sheet on navigation. Adjusting state during render is
  // React's recommended pattern for this — an effect here would cause a
  // cascading second render on every route change.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Lock the page behind the open sheet, and let Escape close it.
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.removeProperty("overflow");
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[100] transition-[background-color,border-color,backdrop-filter] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        scrolled || open
          ? "border-b border-hairline bg-void/92 backdrop-blur-xl backdrop-saturate-150"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="container-wide">
        <div
          className={cn(
            // 4.25rem when scrolled is not a free choice: the menu rail and
            // the gallery filter bar are `sticky top-[4.25rem]`, and the two
            // numbers have to agree or a strip of page shows between them.
            "flex items-center justify-between transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            scrolled ? "h-[4.25rem]" : "h-[5.75rem]"
          )}
        >
          <Link
            href="/"
            aria-label={`${SITE.name} — home`}
            className="group/mark flex items-center gap-3.5 text-cream transition-colors duration-500 hover:text-gold"
          >
            <Wordmark className="h-[0.95rem] md:h-[1.05rem]" />
            <span
              className="hidden h-4 w-px bg-current opacity-25 sm:block"
              aria-hidden
            />
            <span
              className="hidden font-sans text-[0.5625rem] font-semibold uppercase tracking-[0.26em] text-latte/70 transition-colors duration-500 group-hover/mark:text-gold/80 sm:block"
              aria-hidden
            >
              Hayes Valley
            </span>
          </Link>

          <nav className="hidden items-center gap-9 md:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group/nav relative py-2 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.2em] transition-colors duration-500",
                    active ? "text-gold" : "text-cream/75 hover:text-cream"
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      "absolute -bottom-0.5 left-0 block h-px bg-gold transition-[width] duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
                      active ? "w-full" : "w-0 group-hover/nav:w-full"
                    )}
                    aria-hidden
                  />
                </Link>
              );
            })}

            <ReserveButton variant="outline" className="px-6 py-3" />
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="-mr-2 flex h-11 w-11 flex-col items-center justify-center gap-[6px] text-cream md:hidden"
          >
            <span
              className={cn(
                "block h-px w-6 bg-current transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                open && "translate-y-[3.5px] rotate-45"
              )}
            />
            <span
              className={cn(
                "block h-px w-6 bg-current transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                open && "-translate-y-[3.5px] -rotate-45"
              )}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease: EASE_EXPO }}
            className="overflow-hidden border-t border-hairline bg-espresso/98 md:hidden"
          >
            <nav className="container-wide flex flex-col py-8" aria-label="Mobile">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i + 0.08, duration: 0.55, ease: EASE_EXPO }}
                >
                  <Link
                    href={link.href}
                    className="flex items-baseline justify-between border-b border-hairline py-5 font-display text-[2rem] font-light text-cream"
                  >
                    {link.label}
                    <span className="font-sans text-[0.625rem] tracking-[0.2em] text-gold/60 tnum">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </Link>
                </motion.div>
              ))}
              <div className="mt-9 flex flex-col items-start gap-5">
                <ReserveButton variant="solid" className="w-full" />
                <a
                  href={`mailto:${SITE.email}`}
                  className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-gold"
                >
                  {SITE.email}
                </a>
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
