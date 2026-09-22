/**
 * Brand-level constants for Mysa.
 *
 * Editorial copy that the client is unlikely to change from the admin panel
 * lives here (brand story, philosophy, sourcing). Anything the client *does*
 * change day to day — menu, gallery, hours, address — lives in the database
 * and is edited through /admin.
 */

export const SITE = {
  name: "Mysa",
  /** Used in <title> templates and the footer wordmark. */
  legalName: "Mysa Coffee & Dessert Bar",
  pronunciation: "mee-sah",
  email: "hello@mysa.cafe",
  phone: "+1 (415) 555-0142",
  phoneHref: "+14155550142",
  tagline: "Somewhere to slow down.",
  description:
    "A specialty coffee and dessert bar in Hayes Valley. Single-origin coffee roasted in small lots, desserts made each morning, and a room built for staying a while.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://mysa.cafe",
  founded: 2019,
  social: {
    instagram: "https://instagram.com/mysa.cafe",
    // Kept deliberately short — a premium brand with three good channels
    // reads better than one with eight neglected ones.
    journal: "https://mysa.cafe/journal",
  },
} as const;

export const NAV_LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
] as const;

/**
 * Fallback location + hours. The database is the source of truth once seeded;
 * these keep the site renderable during a cold start or a database blip, so a
 * visitor never sees an empty address block.
 */
export const DEFAULT_LOCATION = {
  addressLine1: "27 Linden Row",
  addressLine2: "Hayes Valley",
  city: "San Francisco",
  region: "CA",
  postalCode: "94102",
  country: "US",
  mapUrl: "https://maps.google.com/?q=Hayes+Valley+San+Francisco",
  latitude: "37.7765",
  longitude: "-122.4241",
  neighbourhoodNote:
    "On the quiet end of Linden, one door down from the old piano works.",
} as const;

export const DEFAULT_HOURS = [
  { day: 1, label: "Monday", opensAt: "07:00", closesAt: "18:00", closed: false },
  { day: 2, label: "Tuesday", opensAt: "07:00", closesAt: "18:00", closed: false },
  { day: 3, label: "Wednesday", opensAt: "07:00", closesAt: "18:00", closed: false },
  { day: 4, label: "Thursday", opensAt: "07:00", closesAt: "18:00", closed: false },
  { day: 5, label: "Friday", opensAt: "07:00", closesAt: "21:00", closed: false },
  { day: 6, label: "Saturday", opensAt: "08:00", closesAt: "21:00", closed: false },
  { day: 0, label: "Sunday", opensAt: "08:00", closesAt: "17:00", closed: false },
] as const;

/** Home page: the short brand story that sits on the linen section. */
export const BRAND_STORY = {
  eyebrow: "Our story",
  heading: "Mysa (mee-sah)",
  definition:
    "Swedish. Roughly: to settle into somewhere warm, and stay there longer than you meant to.",
  body: [
    "We took the lease on Linden Row in 2019 with one stubborn idea — that a café should be somewhere you linger, not somewhere you queue. So we built the room first. Low light, soft seats, tables far enough apart to hold a conversation.",
    "Then we spent a year on the coffee. We buy small lots directly from producers we have met, roast them a few kilos at a time, and change the menu when the season changes rather than when marketing asks us to.",
  ],
  pullQuote:
    "We would rather serve two hundred people well than a thousand people quickly.",
  attribution: "Ines Halvorsen, founder",
} as const;

/** About page copy. */
export const ABOUT = {
  hero: {
    eyebrow: "About",
    heading: "A room built for staying.",
    standfirst:
      "Mysa began as an argument about chairs. Everything since has followed from the same question: what makes someone want to stay?",
  },
  story: {
    heading: "How it started",
    body: [
      "Ines Halvorsen spent eleven years as a green-coffee buyer, flying between washing stations in Ethiopia and cupping tables in Oslo, and came away with a complaint she could not shake: the coffee kept getting better, and the rooms it was served in kept getting worse. Brighter. Louder. Designed to move people through.",
      "In the winter of 2019 she took a lease on a narrow former piano workshop on Linden Row, largely because it had good bones and terrible lighting — which meant nobody else wanted it, and she could afford to fix the part that mattered. The build took nine months. The coffee programme took another year after that.",
      "Mysa opened in November with fourteen seats, one espresso machine, and a single pastry case. It has grown since, but not by much. That is on purpose.",
    ],
  },
  philosophy: {
    heading: "What we believe",
    items: [
      {
        title: "Slow is a feature",
        body: "A cortado takes as long as it takes. We would rather you wait ninety seconds for something made properly than be handed something forgettable in thirty.",
      },
      {
        title: "Short menus, changed often",
        body: "We run four coffees at a time, not twelve. When a lot runs out, it comes off the board. The menu you read in March will not be the menu you read in September.",
      },
      {
        title: "Everything made here",
        body: "Every dessert and pastry is made in our kitchen downstairs, each morning, by people whose names are on the wall. Nothing arrives frozen.",
      },
      {
        title: "The room counts",
        body: "Lighting, acoustics, the distance between tables, the weight of the cup in your hand. These are not details. They are most of the experience.",
      },
    ],
  },
  sourcing: {
    eyebrow: "Sourcing",
    heading: "Four farms, named.",
    body: [
      "We buy directly, in lots small enough that we can tell you whose hands picked the cherry. Prices are agreed with the producer before harvest and paid above the Fairtrade floor — typically between two and three times the C-market price, because that is what it costs to make growing good coffee worth doing.",
      "We roast on a 5kg drum in the back of the shop, usually on Tuesday, and nothing is sold more than sixteen days off roast.",
    ],
    origins: [
      {
        origin: "Guji, Ethiopia",
        producer: "Tadesse Desta · Shakiso",
        altitude: "1,950–2,100 m",
        process: "Washed",
        notes: "Bergamot, white peach, jasmine",
      },
      {
        origin: "Huila, Colombia",
        producer: "Finca La Esperanza · Yolanda Ramírez",
        altitude: "1,700 m",
        process: "Washed",
        notes: "Red apple, panela, milk chocolate",
      },
      {
        origin: "Cerrado, Brazil",
        producer: "Fazenda Santa Inês",
        altitude: "1,150 m",
        process: "Natural",
        notes: "Hazelnut, dark cocoa, malt",
      },
      {
        origin: "Nyeri, Kenya",
        producer: "Gatomboya Factory",
        altitude: "1,800 m",
        process: "Washed",
        notes: "Blackcurrant, tomato leaf, cane sugar",
      },
    ],
  },
  people: {
    heading: "Who is here",
    body: "Eleven of us, most days. Ines roasts and buys. Marek runs the kitchen and is responsible for the Basque cheesecake that people keep writing to us about. Priya heads the bar and trains everyone who works it. If you want to know what is good today, ask whoever is on the machine — they will have opinions.",
  },
} as const;

export type NavLink = (typeof NAV_LINKS)[number];
