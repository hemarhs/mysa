import { PageTitle } from "@/components/admin/ui";
import { HoursEditor, LocationEditor } from "@/components/admin/HoursEditor";
import { getHours, getSettings } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function AdminHoursPage() {
  const [hours, settings] = await Promise.all([getHours(), getSettings()]);

  return (
    <div className="space-y-10">
      <PageTitle
        title="Hours & location"
        description="Where the café is and when it is open. These values feed the footer, the contact page and the structured data search engines read."
      />
      <HoursEditor hours={hours} />
      <LocationEditor settings={settings} />
    </div>
  );
}
