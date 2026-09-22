"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { NAV_LINKS, SITE } from "@/lib/site";
import { cn } from "@/lib/cn";
import { Wordmark } from "./Wordmark";
import { ReserveButton } from "@/components/reserve/ReserveButton";

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile sheet on navigation. Adjusting state during render is
  // React's recommended pattern for this — an effect here would cause a
  // cascading second render on every route change.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Lock the page behind the open sheet.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
        scrolled || open
          ? "bg-espresso/92 backdrop-blur-xl border-b border-hairline"
          : "bg-transparent border-b border-transparent"
      )}
    >
      <div className="container-wide">
        <div
          className={cn(
            "flex items-center justify-between transition-[height] duration-700",
            scrolled ? "h-[4.5rem]" : "h-[5.5rem]"
          )}
        >
          <Link href="/" aria-label={`${SITE.name} — home`} className="text-cream hover:text-gold transition-colors duration-500">
            <Wordmark />
          </Link>

          <nav className="hidden md:flex items-center gap-10" aria-label="Primary">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative py-2 font-sans text-[0.8125rem] font-medium uppercase tracking-[0.16em] transition-colors duration-400",
                    active ? "text-gold" : "text-cream/80 hover:text-cream"
                  )}
                >
                  {link.label}
                  <span
                    className={cn(
                      "absolute -bottom-0.5 left-0 block h-px bg-gold transition-[width] duration-600 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      active ? "w-full" : "w-0 group-hover:w-full"
                    )}
                  />
                </Link>
              );
            })}

            <ReserveButton variant="outline" className="px-6 py-3 text-[0.75rem]" />
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="md:hidden flex h-11 w-11 -mr-2 flex-col items-center justify-center gap-[5px] text-cream"
          >
            <span
              className={cn(
                "block h-px w-6 bg-current transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                open && "translate-y-[3px] rotate-45"
              )}
            />
            <span
              className={cn(
                "block h-px w-6 bg-current transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                open && "-translate-y-[3px] -rotate-45"
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
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden overflow-hidden border-t border-hairline bg-espresso/98"
          >
            <nav className="container-wide flex flex-col py-8" aria-label="Mobile">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i + 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={link.href}
                    className="block border-b border-hairline py-5 font-serif text-3xl font-light text-cream"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="mt-8 flex flex-col items-start gap-5">
                <ReserveButton variant="solid" className="w-full" />
                <a
                  href={`mailto:${SITE.email}`}
                  className="font-sans text-[0.8125rem] uppercase tracking-[0.16em] text-gold"
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
