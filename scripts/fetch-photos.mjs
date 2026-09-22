/**
 * Downloads every photograph into public/images/photos, so the site stops
 * depending on a third-party CDN.
 *
 *   npm run photos:fetch
 *
 * Then add NEXT_PUBLIC_LOCAL_PHOTOS=1 to .env.local and re-run `npm run db:seed`
 * (menu and gallery rows store the image URL, so they need rewriting too).
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const outDir = join(root, "public", "images", "photos");

const WIDTH = 1800;
const MAX_ATTEMPTS = 4;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function download(key, id) {
  const url = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80&w=${WIDTH}`;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(45000) });
      if (!res.ok) {
        console.log(`  FAIL  ${key} — HTTP ${res.status}  (${id})`);
        return false;
      }

      const bytes = Buffer.from(await res.arrayBuffer());
      await writeFile(join(outDir, `${key}.jpg`), bytes);
      console.log(`  OK    ${key}  ${(bytes.length / 1024).toFixed(0)} KB`);
      return true;
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) {
        console.log(`  FAIL  ${key} — ${error.message}`);
        return false;
      }
      await wait(500 * 2 ** (attempt - 1));
    }
  }
  return false;
}

async function main() {
  const sources = JSON.parse(await readFile(join(root, "src", "lib", "photo-sources.json"), "utf8"));
  await mkdir(outDir, { recursive: true });

  console.log(`\nDownloading ${Object.keys(sources).length} photographs at ${WIDTH}px…\n`);

  let ok = 0;
  // Sequential on purpose: a flaky connection copes far better with one
  // request at a time than with seventeen at once.
  for (const [key, source] of Object.entries(sources)) {
    if (await download(key, source.id)) ok += 1;
  }

  console.log(`\n${ok} of ${Object.keys(sources).length} downloaded to public/images/photos\n`);

  if (ok === Object.keys(sources).length) {
    console.log("Next:");
    console.log("  1. Add this line to .env.local:   NEXT_PUBLIC_LOCAL_PHOTOS=1");
    console.log("  2. Re-run:                        npm run db:seed");
    console.log("  3. Restart the dev server.\n");
  } else {
    console.log("Some downloads failed — re-run this command; it is safe to repeat.\n");
  }
}

main().catch((error) => {
  console.error("\nfetch-photos failed: " + error.message + "\n");
  process.exit(1);
});
