import type { Metadata } from "next";

import { PageHeader } from "@/components/site/PageHeader";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { ClosingCTA } from "@/components/home/ClosingCTA";
import { getGallery } from "@/lib/db/queries";
import { PHOTOS } from "@/lib/images";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "The room, the drinks and the desserts at Mysa — fourteen seats on Linden Row, low light and no hurry.",
  alternates: { canonical: "/gallery" },
};

export default async function GalleryPage() {
  const images = await getGallery();

  return (
    <>
      <PageHeader
        eyebrow="Gallery"
        heading={"The room, and what\ncomes _out_ of it."}
        standfirst="Photographs from ordinary mornings — no styling, no props brought in for the day."
        plate={PHOTOS.latteArt}
        margin="Fourteen seats"
      />

      <GalleryGrid images={images} />

      <ClosingCTA />
    </>
  );
}
