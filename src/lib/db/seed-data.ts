/**
 * Mysa's launch content: the menu as it stands, and the gallery.
 *
 * Kept separate from the seed runner so it can be imported without pulling in
 * a database connection — useful for tests, previews and static fallbacks.
 */
import { PHOTOS } from "../images";

export type SeedItem = {
  name: string;
  description: string;
  priceCents: number;
  imageUrl?: string;
  tags?: string[];
  isFeatured?: boolean;
  isSoldOut?: boolean;
};

export const MENU: { slug: string; name: string; description: string; items: SeedItem[] }[] = [
  {
    slug: "espresso",
    name: "Espresso & Milk",
    description:
      "Pulled on the house blend unless you ask otherwise. Any of these can be made on a single origin for a dollar more.",
    items: [
      {
        name: "Espresso Mysa",
        description:
          "The house blend — Huila for body, Guji for lift. Cocoa, dried fig, brown sugar, and a finish that holds.",
        priceCents: 375,
        imageUrl: PHOTOS.espressoMachine.src,
      },
      {
        name: "Ristretto",
        description:
          "The first two-thirds of the shot and nothing after it. Sweeter, thicker, over before you have settled.",
        priceCents: 375,
      },
      {
        name: "Macchiato",
        description: "A double, marked with a spoonful of foam. Three mouthfuls, properly made.",
        priceCents: 395,
      },
      {
        name: "Cortado Blanco",
        description:
          "Two ristretto shots cut with just enough steamed milk to round the edges. Served in glass, drunk hot.",
        priceCents: 425,
        imageUrl: PHOTOS.cortado.src,
      },
      {
        name: "Piccolo",
        description:
          "A ristretto under four ounces of milk. What the bar staff drink on their break, which tells you something.",
        priceCents: 425,
      },
      {
        name: "Flat White",
        description:
          "Whole milk stretched to velvet, poured thin over a double ristretto. No foam, no theatre.",
        priceCents: 475,
        imageUrl: PHOTOS.latteArt.src,
      },
      {
        name: "Cappuccino, Traditional",
        description:
          "Six ounces, a proper dome of foam, dusted with nothing at all. As it is drunk in Trieste.",
        priceCents: 475,
      },
      {
        name: "Café au Lait",
        description: "Batch filter and hot milk in equal measure. Unfashionable and very good.",
        priceCents: 450,
      },
    ],
  },
  {
    slug: "filter",
    name: "Filter & Brew",
    description:
      "Four single origins on the bar at a time, brewed to order. Ask whoever is on the machine what is drinking well today.",
    items: [
      {
        name: "Guji, Ethiopia — V60",
        description:
          "Hand-poured one cup at a time from Tadesse Desta's washed lot in Shakiso. Bergamot, white peach, a long jasmine finish.",
        priceCents: 550,
        imageUrl: PHOTOS.pourOver.src,
        isFeatured: true,
      },
      {
        name: "Gatomboya, Kenya — V60",
        description:
          "From the Gatomboya factory in Nyeri, 1,800 metres. Blackcurrant, tomato leaf, cane sugar, and an acidity that sits up straight.",
        priceCents: 595,
      },
      {
        name: "La Esperanza, Colombia — Chemex for two",
        description:
          "Yolanda Ramírez's washed Caturra, brewed at the table in a litre Chemex. Red apple, panela, milk chocolate. Meant to be shared slowly.",
        priceCents: 1150,
      },
      {
        name: "Santa Inês, Brazil — Batch Brew",
        description:
          "Natural-process Cerrado, brewed by the litre and poured without ceremony. Hazelnut, dark cocoa, malt. Refills free until noon.",
        priceCents: 350,
      },
      {
        name: "Cold Brew, Eighteen Hour",
        description:
          "Coarse-ground Cerrado naturals steeped slow and still overnight. Smooth, low in acid, faintly malted.",
        priceCents: 525,
      },
      {
        name: "Nitro Cold Brew",
        description:
          "The same eighteen-hour brew, pushed through nitrogen. Arrives with a cascading head and a texture closer to stout than coffee.",
        priceCents: 575,
        tags: ["vegan"],
      },
      {
        name: "Espresso Tonic",
        description:
          "A double over Fever-Tree and a wide strip of grapefruit peel. Bitter, bright, and gone quickly.",
        priceCents: 595,
        tags: ["vegan"],
      },
    ],
  },
  {
    slug: "signature",
    name: "Signature Drinks",
    description:
      "Built here, changed with the season, and sweetened lightly — or not at all, if you would rather.",
    items: [
      {
        name: "Honey Cardamom Latte",
        description:
          "Wildflower honey and green cardamom bloomed in hot milk, poured over a double. Warming, barely sweet.",
        priceCents: 625,
        imageUrl: PHOTOS.cupOnTable.src,
        isFeatured: true,
      },
      {
        name: "Saffron Rose Latte",
        description:
          "Kashmiri saffron steeped in milk overnight, a whisper of rosewater, crushed Bronte pistachio over the top.",
        priceCents: 675,
        tags: ["contains nuts"],
      },
      {
        name: "Burnt Caramel Cortado",
        description:
          "Caramel taken right to the edge of bitter, which is where it stops being sweet and starts being interesting.",
        priceCents: 600,
      },
      {
        name: "Vanilla & Tonka Flat White",
        description:
          "Madagascan vanilla and a single grated tonka bean, infused into the milk for an hour before service. Almond, hay, warm marzipan.",
        priceCents: 650,
      },
      {
        name: "Black Sesame Latte",
        description:
          "Toasted black sesame ground to a paste in house, whisked into milk over espresso. Nutty, savoury, faintly smoky.",
        priceCents: 645,
        tags: ["contains sesame"],
      },
      {
        name: "Maple Oat Cortado",
        description:
          "Dark amber maple, barista oat stretched properly, a double underneath. Our most-ordered drink, quietly.",
        priceCents: 575,
        tags: ["vegan"],
      },
      {
        name: "Iced Yuzu Espresso Tonic",
        description:
          "Espresso over tonic and fresh yuzu, built in the glass. Sharp, bracing, gone quickly.",
        priceCents: 650,
        tags: ["vegan"],
      },
      {
        name: "Smoked Maple Cold Brew",
        description:
          "Cold brew stirred with maple smoked over cherry wood in the kitchen. Served over one large cube, no milk.",
        priceCents: 695,
        tags: ["vegan"],
      },
      {
        name: "Spiced Dark Chocolate",
        description:
          "Valrhona 70% melted into milk with cassia bark and a pinch of chilli. Thick enough to stand a spoon in.",
        priceCents: 625,
      },
    ],
  },
  {
    slug: "tea",
    name: "Tea & Botanicals",
    description:
      "Loose leaf, weighed and timed properly. For the back half of the afternoon, when another coffee would be a mistake.",
    items: [
      {
        name: "Ceremonial Matcha",
        description: "First-harvest Uji from Uchida, whisked to order. Served thin, no sugar.",
        priceCents: 650,
        tags: ["vegan"],
      },
      {
        name: "Hojicha Latte",
        description:
          "Roasted Kyoto green tea — toasty, low in caffeine, and the easiest thing on the menu to drink at five o'clock.",
        priceCents: 595,
      },
      {
        name: "Silver Needle White",
        description:
          "Fuding buds picked over two weeks in spring, brewed at eighty degrees. Melon, honeysuckle, almost no tannin.",
        priceCents: 675,
        tags: ["vegan"],
      },
      {
        name: "Masala Chai, Slow-Boiled",
        description:
          "Assam boiled with milk, green cardamom, ginger and black pepper for twenty minutes. Not a syrup, and not quick.",
        priceCents: 575,
      },
      {
        name: "Genmaicha",
        description:
          "Sencha with toasted rice, some of it popped. Savoury, comforting, and very good alongside anything sweet.",
        priceCents: 550,
        tags: ["vegan"],
      },
      {
        name: "Rooibos & Orange Blossom",
        description:
          "Caffeine-free, steeped long with dried orange blossom and a strip of peel. What we give people at nine at night.",
        priceCents: 525,
        tags: ["vegan", "caffeine free"],
      },
    ],
  },
  {
    slug: "desserts",
    name: "Desserts",
    description:
      "Made downstairs each morning by Marek and his kitchen. When a thing is gone for the day, it is gone.",
    items: [
      {
        name: "Burnt Basque Cheesecake",
        description:
          "Baked hot and fast until the top goes almost black and the centre stays loose. One slice, no garnish, nothing to improve.",
        priceCents: 950,
        imageUrl: PHOTOS.cheesecake.src,
        isFeatured: true,
      },
      {
        name: "Valrhona Chocolate Délice",
        description:
          "Guanaja 70% ganache on a hazelnut praline base, finished with sea salt and a sheet of tempered chocolate. Cut to order.",
        priceCents: 1150,
        tags: ["contains nuts"],
      },
      {
        name: "Pistachio & Rose Mille-Feuille",
        description:
          "Three days of puff pastry, caramelised flat under a second tray, layered with pistachio crème légère and rose. Eaten immediately or not at all.",
        priceCents: 1050,
        tags: ["contains nuts"],
      },
      {
        name: "Fig & Almond Frangipane Tart",
        description:
          "Black Mission figs on brown-butter frangipane in a rye shell. Served warm with crème fraîche.",
        priceCents: 895,
        tags: ["contains nuts"],
      },
      {
        name: "Salted Honey Tart",
        description:
          "Buckwheat pastry, set honey custard, grey salt across the top. Sweet, then savoury, then sweet again.",
        priceCents: 875,
        imageUrl: PHOTOS.tart.src,
      },
      {
        name: "Cardamom Crème Brûlée",
        description:
          "Green cardamom infused overnight, cracked to order under a proper iron. Worth the wait.",
        priceCents: 850,
      },
      {
        name: "Dark Chocolate Pot de Crème",
        description:
          "Valrhona Guanaja, crème fraîche, a scrape of orange zest. Served cold in the pot it set in.",
        priceCents: 825,
      },
      {
        name: "Tiramisù Mysa",
        description:
          "Made with our own espresso and a good deal more mascarpone than is strictly sensible.",
        priceCents: 900,
        imageUrl: PHOTOS.cakeSlice.src,
      },
      {
        name: "Affogato, Guji",
        description:
          "Madagascan vanilla ice cream from Mr. Dewie's, drowned at the table in a double of the Ethiopian. Two spoons if you ask.",
        priceCents: 750,
      },
      {
        name: "Olive Oil & Blood Orange Cake",
        description:
          "Koroneiki olive oil, blood orange, ground almond. Dense, damp, and better on the second day.",
        priceCents: 775,
        tags: ["vegetarian", "contains nuts"],
      },
      {
        name: "Miso Caramel Brownie",
        description:
          "White miso in the caramel, which sounds like a gimmick until you have had one.",
        priceCents: 650,
      },
      {
        name: "Pistachio Financier",
        description:
          "Brown butter, Bronte pistachio, baked in the afternoon so there is something warm at four o'clock.",
        priceCents: 550,
        tags: ["contains nuts"],
        isSoldOut: true,
      },
    ],
  },
  {
    slug: "pastries",
    name: "Pastries & Small Plates",
    description:
      "Laminated over three days, baked at six, and honestly best before ten. Small plates run all day.",
    items: [
      {
        name: "Cardamom Morning Bun",
        description:
          "Croissant dough rolled with cardamom sugar and baked in a tin so the edges caramelise. The reason for the queue at eight.",
        priceCents: 525,
        imageUrl: PHOTOS.pastryCase.src,
      },
      {
        name: "Pain au Chocolat",
        description:
          "Three days of lamination with Isigny butter, two batons of Valrhona, and flakes everywhere.",
        priceCents: 475,
        imageUrl: PHOTOS.croissant.src,
      },
      {
        name: "Kouign-Amann",
        description:
          "Breton, brutal, and mostly butter and sugar. Caramelised so hard the base cracks. We make forty a day.",
        priceCents: 575,
      },
      {
        name: "Almond Croissant",
        description:
          "Yesterday's croissant, soaked in orange-blossom syrup and filled with frangipane. Thrift, improved.",
        priceCents: 550,
        tags: ["contains nuts"],
      },
      {
        name: "Gruyère & Thyme Scone",
        description: "Savoury, craggy, aggressively cheesy. Warmed to order.",
        priceCents: 525,
        tags: ["vegetarian"],
      },
      {
        name: "Seasonal Galette",
        description:
          "Whatever the market had. Right now: quince, brown sugar, a little black pepper.",
        priceCents: 675,
        isSoldOut: true,
      },
      {
        name: "Sourdough, Cultured Butter & Sea Salt",
        description:
          "Two thick slices from Josey Baker's levain, cultured butter, Maldon. Deliberately plain.",
        priceCents: 600,
        tags: ["vegetarian"],
      },
      {
        name: "Labneh Toast",
        description:
          "Whipped labneh on toasted sourdough with olive oil, za'atar, and a handful of soft herbs.",
        priceCents: 1100,
        imageUrl: PHOTOS.toast.src,
        tags: ["vegetarian"],
      },
      {
        name: "Truffled Egg Bun",
        description:
          "Soft-scrambled eggs and Comté in a milk bun, with black truffle shaved over at the pass. Until eleven only.",
        priceCents: 1250,
        tags: ["vegetarian"],
      },
      {
        name: "Smoked Salmon Tartine",
        description:
          "Cold-smoked salmon, dill crème fraîche, pickled shallot, rye. Our idea of lunch.",
        priceCents: 1450,
      },
    ],
  },
];

export const GALLERY: { key: keyof typeof PHOTOS; category: "space" | "drinks" | "desserts"; caption?: string }[] = [
  { key: "interiorWide", category: "space", caption: "The main room, late afternoon" },
  { key: "interiorSeats", category: "space", caption: "Window seats on Linden Row" },
  { key: "interiorCorner", category: "space", caption: "The corner table, usually taken" },
  { key: "barista", category: "space", caption: "Priya on the machine" },
  { key: "roasting", category: "space", caption: "Tuesday is roasting day" },
  { key: "cortado", category: "drinks", caption: "Cortado Blanco, in glass" },
  { key: "latteArt", category: "drinks", caption: "Flat white, poured thin" },
  { key: "pourOver", category: "drinks", caption: "Guji, one cup at a time" },
  { key: "espressoMachine", category: "drinks", caption: "A double, going down" },
  { key: "beans", category: "drinks", caption: "Sixteen days off roast, at most" },
  { key: "cupOnTable", category: "drinks", caption: "Honey cardamom, and a long morning" },
  { key: "cheesecake", category: "desserts", caption: "Burnt Basque, no garnish" },
  { key: "tart", category: "desserts", caption: "Salted honey tart" },
  { key: "cakeSlice", category: "desserts", caption: "Tiramis\u00f9 Mysa" },
  { key: "pastryCase", category: "desserts", caption: "The case at seven in the morning" },
  { key: "croissant", category: "desserts", caption: "Pain au chocolat, torn" },
  { key: "toast", category: "desserts", caption: "Labneh toast with za'atar" },
];
