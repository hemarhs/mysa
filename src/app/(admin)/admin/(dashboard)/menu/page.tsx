import { PageTitle } from "@/components/admin/ui";
import { MenuManager } from "@/components/admin/MenuManager";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { getAllMenuItems, getCategories } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function AdminMenuPage() {
  const [rows, categories] = await Promise.all([getAllMenuItems(), getCategories()]);

  return (
    <div className="space-y-12">
      <PageTitle
        title="Menu"
        description="Add, edit and retire items. Sold-out items stay on the board but are marked out; hidden items disappear from the site entirely."
      />

      <MenuManager rows={rows} categories={categories} />

      <CategoryForm categories={categories} />
    </div>
  );
}
