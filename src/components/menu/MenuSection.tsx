import { Reveal } from "@/components/ui/Reveal";
import { Eyebrow } from "@/components/ui/Ornament";
import { SplitText } from "@/components/ui/SplitText";
import { cn } from "@/lib/cn";
import type { MenuCategoryWithItems } from "@/lib/db/queries";
import { MenuRow } from "./MenuRow";

type Props = {
  category: MenuCategoryWithItems;
  currency: string;
  tone: "dark" | "light";
};

/**
 * One category of the board.
 *
 * Alternating dark and cream grounds break the menu into readable chapters —
 * forty items on one continuous background is a spreadsheet. The category
 * title sticks beside its items on wide screens so you always know which
 * part of the board you are reading.
 */
export function MenuSection({ category, currency, tone }: Props) {
  const dark = tone === "dark";

  return (
    <section
      id={category.slug}
      className={cn(
        "scroll-mt-32",
        dark ? "lustre bg-espresso" : "luxe text-espresso"
      )}
    >
      <div className="container-wide py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <Reveal className="lg:col-span-4">
            <div className="lg:sticky lg:top-44">
              <Eyebrow tone={dark ? "dark" : "light"}>
                {String(category.items.length).padStart(2, "0")} items
              </Eyebrow>

              <SplitText
                as="h2"
                lines={[category.name]}
                className={cn(
                  "display mt-6 text-[clamp(2rem,4.2vw,3.25rem)]",
                  dark ? "text-cream" : "text-espresso"
                )}
                lineClassName="pb-[0.14em] -mb-[0.1em]"
                stagger={0.05}
              />

              {category.description ? (
                <Reveal delay={0.12}>
                  <p
                    className={cn(
                      "mt-7 max-w-sm text-[0.9375rem] leading-[1.9]",
                      dark ? "text-latte" : "text-mocha"
                    )}
                  >
                    {category.description}
                  </p>
                </Reveal>
              ) : null}
            </div>
          </Reveal>

          <div className="lg:col-span-8">
            {category.items.length ? (
              <ul>
                {category.items.map((item, index) => (
                  <MenuRow
                    key={item.id}
                    item={item}
                    currency={currency}
                    tone={tone}
                    index={index}
                  />
                ))}
              </ul>
            ) : (
              <p
                className={cn(
                  "py-8 text-[0.9375rem]",
                  dark ? "text-latte" : "text-mocha"
                )}
              >
                Nothing on this section of the board today.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
