"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

type Props = {
  categories: { slug: string; name: string }[];
};

/**
 * Sticky category rail with scroll-spy. Uses IntersectionObserver rather than
 * scroll maths so it stays cheap, and falls back gracefully to plain anchors
 * if the observer never fires.
 */
export function MenuRail({ categories }: Props) {
  const [active, setActive] = useState(categories[0]?.slug ?? "");

  useEffect(() => {
    const sections = categories
      .map((c) => document.getElementById(c.slug))
      .filter((el): el is HTMLElement => Boolean(el));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]?.target.id) setActive(visible[0].target.id);
      },
      // Band across the upper-middle of the viewport: whichever section owns
      // that band is the one the reader is actually looking at.
      { rootMargin: "-25% 0px -60% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [categories]);

  return (
    <div className="sticky top-[4.5rem] z-30 border-b border-hairline bg-espresso/92 backdrop-blur-xl">
      <div className="container-wide">
        <nav aria-label="Menu sections" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto">
          {categories.map((category) => {
            const isActive = active === category.slug;
            return (
              <a
                key={category.slug}
                href={`#${category.slug}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "relative shrink-0 px-4 py-5 font-sans text-[0.75rem] font-medium uppercase tracking-[0.16em] transition-colors duration-400",
                  isActive ? "text-gold" : "text-cream-muted hover:text-cream"
                )}
              >
                {category.name}
                <span
                  className={cn(
                    "absolute inset-x-4 bottom-0 block h-px bg-gold transition-opacity duration-400",
                    isActive ? "opacity-100" : "opacity-0"
                  )}
                />
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
