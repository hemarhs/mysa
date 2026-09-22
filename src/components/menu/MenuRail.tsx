"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

type Props = {
  categories: { slug: string; name: string }[];
};

/**
 * Sticky category rail with scroll-spy and a gold indicator that slides
 * between entries rather than blinking on and off.
 *
 * The indicator is a single absolutely-positioned element whose `transform`
 * and `width` are measured from the active anchor. Animating one element is
 * both cheaper and far better looking than fading a border under each of
 * eight tabs, and it survives the rail being horizontally scrolled on a
 * phone because the measurement is relative to the track, not the viewport.
 *
 * Scroll-spy uses IntersectionObserver rather than scroll arithmetic, so it
 * stays cheap; if the observer never fires, the rail degrades to plain
 * anchors, which still work.
 */
export function MenuRail({ categories }: Props) {
  const [active, setActive] = useState(categories[0]?.slug ?? "");
  const trackRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

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

        const id = visible[0]?.target.id;
        if (id) setActive((current) => (current === id ? current : id));
      },
      // A band across the upper-middle of the viewport: whichever section
      // owns that band is the one the reader is actually looking at.
      { rootMargin: "-25% 0px -60% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [categories]);

  // Move the indicator to the active tab, and keep that tab in view when the
  // rail is scrollable.
  useEffect(() => {
    const track = trackRef.current;
    const indicator = indicatorRef.current;
    if (!track || !indicator) return;

    const place = () => {
      const tab = track.querySelector<HTMLElement>(`[data-slug="${CSS.escape(active)}"]`);
      if (!tab) return;

      indicator.style.width = `${tab.offsetWidth}px`;
      indicator.style.transform = `translate3d(${tab.offsetLeft}px, 0, 0)`;
      indicator.style.opacity = "1";

      if (track.scrollWidth > track.clientWidth) {
        const target = tab.offsetLeft - track.clientWidth / 2 + tab.offsetWidth / 2;
        track.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
      }
    };

    place();

    // Widths change with the font load and with the viewport.
    const observer = new ResizeObserver(place);
    observer.observe(track);
    return () => observer.disconnect();
  }, [active]);

  return (
    <div className="sticky top-[4.25rem] z-40 border-y border-hairline bg-void/88 backdrop-blur-xl backdrop-saturate-150">
      <div className="container-wide">
        <nav
          ref={trackRef}
          aria-label="Menu sections"
          className="no-scrollbar relative -mx-1 flex gap-1 overflow-x-auto"
        >
          <span
            ref={indicatorRef}
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 h-px bg-gold opacity-0 transition-[transform,width,opacity] duration-[650ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          />

          {categories.map((category) => {
            const isActive = active === category.slug;
            return (
              <a
                key={category.slug}
                data-slug={category.slug}
                href={`#${category.slug}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "relative shrink-0 px-4 py-5 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.2em] transition-colors duration-500",
                  isActive ? "text-gold" : "text-latte/75 hover:text-cream"
                )}
              >
                {category.name}
              </a>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
