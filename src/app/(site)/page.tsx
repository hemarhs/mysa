import { HeroSection } from "@/components/hero/HeroSection";
import { StorySection } from "@/components/home/StorySection";
import { FeaturedMenu } from "@/components/home/FeaturedMenu";
import { GalleryTeaser } from "@/components/home/GalleryTeaser";
import { LocationSection } from "@/components/home/LocationSection";
import { ClosingCTA } from "@/components/home/ClosingCTA";
import { Marquee } from "@/components/ui/Marquee";
import { StructuredData } from "@/components/site/StructuredData";
import { getFeaturedItems, getHours, getSettings } from "@/lib/db/queries";

/** Rebuilt every 5 minutes, and immediately when admin saves a change. */
export const revalidate = 300;

export default async function HomePage() {
  const [featured, settings, hours] = await Promise.all([
    getFeaturedItems(3),
    getSettings(),
    getHours(),
  ]);

  return (
    <>
      <StructuredData settings={settings} hours={hours} />
      <HeroSection announcement={settings.announcement} />

      <Marquee
        items={[
          "Single origin",
          "Roasted Tuesdays",
          "Small lots",
          "Made downstairs each morning",
          "Fourteen seats",
          "Hayes Valley",
        ]}
      />

      <StorySection />
      <FeaturedMenu items={featured} currency={settings.currency} />
      <GalleryTeaser />

      <Marquee
        items={[
          "Nothing sold more than sixteen days off roast",
          "Direct trade",
          "Named farms",
          "No queue, no hurry",
        ]}
        duration={56}
      />

      <LocationSection settings={settings} hours={hours} />
      <ClosingCTA />
    </>
  );
}
