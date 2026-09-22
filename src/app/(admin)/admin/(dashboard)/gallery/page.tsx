import { PageTitle } from "@/components/admin/ui";
import { GalleryManager } from "@/components/admin/GalleryManager";
import { getGallery } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const images = await getGallery();

  return (
    <div className="space-y-10">
      <PageTitle
        title="Gallery"
        description="Photographs shown on the gallery page and in the teaser on the home page. Lower numbers appear first."
      />
      <GalleryManager images={images} />
    </div>
  );
}
