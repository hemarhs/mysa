import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import type { MenuCategoryWithItems } from "@/lib/db/queries";
import { MenuRow } from "./MenuRow";

type Props = {
  category: MenuCategoryWithItems;
  currency: string;
  tone: "dark" | "linen";
};

export function MenuSection({ category, currency, tone }: Props) {
  const dark = tone === "dark";

  return (
    <section
      id={category.slug}
      className={cn("scroll-mt-32 py-20 md:py-28", dark ? "bg-espresso" : "bg-linen")}
    >
      <div className="container-wide">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-4">
            <div className="lg:sticky lg:top-40">
              <span className={cn("eyebrow flex items-center gap-3", dark ? "text-gold" : "text-gold-dim")}>
                <span
                  className={cn("h-px w-12", dark ? "bg-gold/50" : "bg-gold-dim/50")}
                  aria-hidden
                />
                {String(category.items.length).padStart(2, "0")} items
              </span>

              <h2
                className={cn(
                  "display mt-6 text-[clamp(2.25rem,4.4vw,3.25rem)]",
                  dark ? "text-cream" : "text-ink"
                )}
              >
                {category.name}
              </h2>

              {category.description ? (
                <p
                  className={cn(
                    "mt-6 max-w-sm text-[0.9375rem] leading-[1.85]",
                    dark ? "text-cream-muted" : "text-ink-muted"
                  )}
                >
                  {category.description}
                </p>
              ) : null}
            </div>
          </Reveal>

          <div className="lg:col-span-8">
            {category.items.length ? (
              <ul>
                {category.items.map((item) => (
                  <MenuRow key={item.id} item={item} currency={currency} tone={tone} />
                ))}
              </ul>
            ) : (
              <p className={cn("py-8 text-[0.9375rem]", dark ? "text-cream-muted" : "text-ink-muted")}>
                Nothing on this section of the board today.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
