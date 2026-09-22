/**
 * Seeds the database with Mysa's launch content.
 *
 *   npm run db:seed
 *
 * Safe to re-run: it clears menu, gallery and hours first, then re-inserts.
 * It never touches admin_users or messages.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { PHOTOS } from "../images";
import { DEFAULT_HOURS, DEFAULT_LOCATION, SITE } from "../site";
import { installResilientFetch } from "./resilient-fetch";
import { GALLERY, MENU } from "./seed-data";
import * as schema from "./schema";

const { categories, galleryImages, menuItems, openingHours, siteSettings } = schema;

installResilientFetch({ verbose: true });

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Add it to .env.local first.");

  const db = drizzle(neon(url), { schema });

  console.log("Clearing menu, gallery and hours…");
  await db.delete(menuItems);
  await db.delete(categories);
  await db.delete(galleryImages);
  await db.delete(openingHours);

  console.log("Inserting categories and menu items…");
  let itemCount = 0;

  for (const [categoryIndex, category] of MENU.entries()) {
    const [inserted] = await db
      .insert(categories)
      .values({
        slug: category.slug,
        name: category.name,
        description: category.description,
        position: categoryIndex,
      })
      .returning();

    await db.insert(menuItems).values(
      category.items.map((item, itemIndex) => ({
        categoryId: inserted.id,
        name: item.name,
        description: item.description,
        priceCents: item.priceCents,
        imageUrl: item.imageUrl ?? null,
        tags: item.tags ?? [],
        isFeatured: item.isFeatured ?? false,
        isSoldOut: item.isSoldOut ?? false,
        isActive: true,
        position: itemIndex,
      }))
    );

    itemCount += category.items.length;
  }

  console.log("Inserting gallery…");
  await db.insert(galleryImages).values(
    GALLERY.map((entry, index) => ({
      url: PHOTOS[entry.key].src,
      alt: PHOTOS[entry.key].alt,
      caption: entry.caption ?? null,
      category: entry.category,
      position: index,
    }))
  );

  console.log("Inserting opening hours…");
  await db.insert(openingHours).values(
    DEFAULT_HOURS.map((h) => ({
      dayOfWeek: h.day,
      opensAt: h.opensAt,
      closesAt: h.closesAt,
      isClosed: h.closed,
    }))
  );

  console.log("Upserting site settings…");
  await db
    .insert(siteSettings)
    .values({
      id: "default",
      addressLine1: DEFAULT_LOCATION.addressLine1,
      addressLine2: DEFAULT_LOCATION.addressLine2,
      city: DEFAULT_LOCATION.city,
      region: DEFAULT_LOCATION.region,
      postalCode: DEFAULT_LOCATION.postalCode,
      country: DEFAULT_LOCATION.country,
      latitude: DEFAULT_LOCATION.latitude,
      longitude: DEFAULT_LOCATION.longitude,
      mapUrl: DEFAULT_LOCATION.mapUrl,
      neighbourhoodNote: DEFAULT_LOCATION.neighbourhoodNote,
      phone: SITE.phone,
      email: SITE.email,
      currency: "USD",
    })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: { updatedAt: new Date() },
    });

  console.log(
    `\nSeeded ${MENU.length} categories, ${itemCount} menu items, ${GALLERY.length} gallery images.`
  );
  console.log("Next: npm run db:create-admin\n");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("\nSeed failed: " + message);

  if (/relation .* does not exist/i.test(message)) {
    console.error("\nThe tables do not exist yet. Run:  npm run db:migrate\n");
  } else if (/fetch failed|ENOTFOUND|network/i.test(message)) {
    console.error(
      "\nThe database could not be reached. Check it with:\n" +
        "  node --env-file=.env.local netcheck.mjs\n"
    );
  } else {
    console.error("");
  }

  process.exit(1);
});
