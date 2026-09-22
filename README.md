# Mysa

A production website for **Mysa**, a specialty coffee and dessert bar — public
site plus a password-protected admin panel, built on Next.js and Neon Postgres.

---

## Getting it running

You need Node 20.9+ and a Neon project.

```bash
npm install
cp .env.example .env.local     # then fill in the values below
npm run db:setup               # create the tables, then load the content
npm run db:create-admin        # create your login (prompts for email + password)
npm run dev                    # http://localhost:3000
```

`db:setup` is `db:migrate` followed by `db:seed`; run them separately if you
prefer.

Sign in at `/admin/login`.

### Environment

| Variable | Required | What it is |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon **pooled** connection string (Neon Console → Connection Details → Pooled connection) |
| `AUTH_SECRET` | yes | 32+ characters, used to sign admin session cookies. Generate with `openssl rand -base64 48` |
| `NEXT_PUBLIC_SITE_URL` | yes in production | Public origin, used for canonical URLs, sitemap and OG tags |
| `STORAGE_PROVIDER` | no | `blob` (default) or `local` |
| `BLOB_READ_WRITE_TOKEN` | in production | Vercel Blob token; injected automatically when a Blob store is connected on Vercel |

Configuration is validated at boot in `src/lib/env.ts` — a missing or malformed
value fails immediately with a readable message rather than at the first query.

---

## Deploying

Built for Vercel.

1. Import the repository; the framework preset is detected automatically.
2. Add the environment variables above in **Project → Settings → Environment Variables**.
3. Connect a **Blob** store under **Storage** — this injects `BLOB_READ_WRITE_TOKEN`
   and makes admin image uploads work.
4. Run `npm run db:migrate`, `npm run db:seed` and `npm run db:create-admin`
   locally against the production `DATABASE_URL` once, before or just after the
   first deploy.

It runs anywhere Next.js runs. If you move off Vercel, replace the Vercel Blob
branch in `src/lib/storage.ts` with an S3 client — that file is the only place
storage is touched, and the interface is three functions wide.

---

## How it is put together

```
src/
  app/
    (site)/          public pages — home, menu, about, gallery, contact
    (admin)/admin/   login, then the dashboard behind (dashboard)/
    api/admin/upload image upload endpoint
    reserve-actions.ts  the reservation server action
  components/
    hero/            the R3F cup and its capability detection
    reserve/         the booking dialog, and the provider that opens it
    home/ menu/ gallery/ contact/ site/ ui/   marketing components
    admin/           dashboard components
  lib/
    db/              Drizzle schema, queries, seed data, migrations runner
    auth/            jwt.ts is edge-safe; index.ts is Node-only
    site.ts          brand copy that is not database-managed
    images.ts        every photograph on the site, in one file
```

**Route groups** give the two halves different chrome: `(site)` wraps pages in
the dark header and footer, `(admin)` renders the light panel. Neither layout
leaks into the other.

**Data.** Drizzle over Neon's HTTP driver — one round trip per query, no pool to
exhaust on serverless. Money is stored as integer cents (`price_cents`), never
floats. Public pages are statically rendered and revalidated every five minutes;
saving anything in the admin panel calls `revalidatePath` so changes appear
within seconds rather than waiting for the window.

**Public reads fail soft.** `safe()` in `src/lib/db/queries.ts` catches database
errors on public pages, logs them, and returns a sensible fallback — the address
and hours in `src/lib/site.ts`, or an empty list. A café website should not
return a 500, or fail a production build, because the database blinked. Admin
reads deliberately do *not* do this: there, a failure must surface.

**Auth.** bcrypt (cost 12) password hashes, a signed JWT in an httpOnly, secure,
sameSite cookie, seven-day expiry. `src/middleware.ts` verifies at the edge
before any admin route renders; every admin page and action re-checks with
`requireAdmin()`. Login is rate limited to five attempts per fifteen minutes per
address, and always runs a bcrypt comparison — even for unknown emails — so
response timing cannot be used to enumerate accounts. There is no default
account and no seeded password: `db:create-admin` is the only way in.

**Contact form.** A server action, validated with Zod, rate limited to three
messages per ten minutes, with a hidden honeypot field. Sender IPs are stored
hashed, never raw.

**Reservations.** The Reserve button opens a booking dialog (focus-trapped,
Escape to close) that writes to the `reservations` table. Party size, date and
time are validated server-side — the date is bounded to today plus sixty days
regardless of what the browser sends — rate limited to four requests per half
hour, and honeypotted. Requests land in `/admin/reservations`, where they can be
confirmed, declined or deleted; pending ones show a badge in the sidebar and a
count on the overview. Confirming does **not** send an email: reply from your own
inbox, then mark it confirmed. Wiring an email provider is a single call in
`submitReservation`.

---

## The 3D hero

One WebGL element, on the home page only, built from lathe geometry and
primitives in `src/components/hero/CupScene.tsx` — no GLTF to download and no
drei `<Environment>`, which would fetch an HDR from a CDN.

`Hero3D.tsx` decides whether a device gets it at all. It falls back to a static
photograph when any of these is true: reduced motion is preferred, the viewport
is 900px or narrower, the pointer is coarse, Save-Data is on, the connection is
2G, `deviceMemory` is under 4GB, `hardwareConcurrency` is under 4, or a WebGL
context cannot be created. When it does load, it loads on idle via
`next/dynamic` and cross-fades in over the photograph, so it never competes with
first paint.

Photographs never depend on their entrance animation to become visible.
`<Figure>` drives its wipe from a plain IntersectionObserver with a timeout that
forces the visible state, because an animation that silently fails to fire
should cost you a flourish, not the picture.

Everywhere else the motion is Framer Motion only. Three primitives carry it:
`Reveal` (content rises into view), `TextReveal` (display headings arrive line by
line out of a mask — the site's signature) and `Marquee` (slow bands of text
between sections). `Figure` wipes photographs in with a clip-path rather than
fading them. All four render their final state immediately under
`prefers-reduced-motion`.

**If the hero shows the photograph and you expected the cup**, the device failed
one of the checks above. The most common cause on a laptop is
`navigator.hardwareConcurrency` reporting fewer than four cores, which some
virtualised and headless browsers do.

---

## Design tokens

Defined once in `src/app/globals.css` under `@theme`.

| Token | Value | Use |
| --- | --- | --- |
| `espresso` | `#14100d` | Page base — brown-black, so it reads lamplit rather than technological |
| `roast` | `#1e1814` | Raised surfaces |
| `linen` | `#f4efe7` | Contrast sections, admin panel |
| `gold` | `#c8a165` | The single accent. Desaturated to read as brass, not metallic gold |
| `terracotta` | `#b2674a` | Semantic only — sold out, destructive actions. Never decorative |
| `cream` / `ink` | `#eae3d9` / `#1a1512` | Type on dark / on linen |

Type is **Fraunces** for display and **Inter** for everything else, self-hosted
by `next/font` so there is no render-blocking request and no layout shift.

---

## Photography

Every photograph is declared in `src/lib/photo-sources.json` — id, alt text and
which texture backs it — and `src/lib/images.ts` turns that into the `PHOTOS`
map the components use. One file to edit for the whole set.

There are two modes. **Remote** (the default) serves from Unsplash, which is
free for commercial use and fine while you build. **Local** serves from
`/public/images/photos`, and is what should ship — hotlinking someone else's CDN
makes your site's appearance depend on a third party staying up and keeping a
photo online, which is how a slot goes blank on the day you show a client.

To switch to local:

```bash
npm run photos:fetch          # downloads all 17 into public/images/photos
# add NEXT_PUBLIC_LOCAL_PHOTOS=1 to .env.local
npm run db:seed               # menu and gallery rows store image URLs too
```

`photos:fetch` downloads one at a time with retries, so a flaky connection does
not defeat it, and it is safe to re-run.

Whichever mode you are in, a dead URL never looks broken: `<Figure>` keeps a
warm on-palette texture behind every image and swaps to it on error, so the slot
shows a designed panel rather than a broken-image icon.

The hero fallback (`public/images/hero-fallback.jpg`) and the three textures are
generated assets committed to the repo.

---

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `start` | Production build and server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run photos:fetch` | Download the photographs into `/public` for local serving |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate a migration after changing `schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:setup` | Migrate, then seed — the usual first run |
| `npm run db:push` | Push schema directly (development only) |
| `npm run db:studio` | Drizzle Studio |
| `npm run db:seed` | Reload menu, gallery and hours — safe to re-run, leaves admins, messages and reservations alone |
| `npm run db:create-admin` | Create or reset an admin password |

---

## Also included

SEO metadata per page, a generated OG image (`opengraph-image.tsx`),
`sitemap.xml`, `robots.txt` (admin and API disallowed), and
`CafeOrCoffeeShop` JSON-LD with address and opening hours.

Accessibility: skip link, visible focus rings throughout, a keyboard-navigable
gallery lightbox with a focus trap and Escape/arrow support, labelled form
fields with `aria-invalid` and error associations, and reduced-motion support
across every animation.

Security headers (HSTS, `X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy`) are set in `next.config.ts`.


---

## Troubleshooting

**The menu page is empty, or the admin login errors.** The database has no data,
or cannot be reached. Run the bundled diagnostic from the project root:

```bash
node --env-file=.env.local diagnose.mjs
```

It reports the connection, every table and row count, and which photograph URLs
resolve. Nothing secret is printed. The usual fixes it points to are
`npm run db:migrate` (no tables) and `npm run db:seed` (no rows).

**A photograph slot shows a warm brown panel.** That image URL is dead, or has
not loaded yet. Every photograph is declared in `src/lib/photo-sources.json`;
`diagnose.mjs` names any that fail. The panel is the intended fallback, not a
rendering bug — but if *every* slot shows it while the diagnostic reports all
photographs loading, that is a rendering bug, so say so.

**`fetch failed` from any database command.** The machine could not reach Neon.
Every database call already retries five times with exponential backoff
(`src/lib/db/resilient-fetch.ts`), so seeing this means it failed repeatedly.
Diagnose it with:

```bash
node --env-file=.env.local netcheck.mjs
```

That separates a DNS or firewall problem from a credentials problem. A stale
Windows DNS cache is the usual cause — `ipconfig /flushdns` and retry. A VPN is
the next most likely.

**Admin uploads fail.** In development set `STORAGE_PROVIDER="local"` and they
write to `public/uploads`. In production connect a Vercel Blob store so
`BLOB_READ_WRITE_TOKEN` is set, and use `STORAGE_PROVIDER="blob"`.
