import fs from "fs";
import path from "path";

export interface IDemoCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  displayOrder: number;
  isActive: boolean;
}

export interface IDemoProduct {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: { _id: string; name: string; slug: string } | string;
  shortDescription: string;
  description: string;
  price: number;
  discountPrice?: number | null;
  showPrice: boolean;
  showQuantity?: boolean;
  quantity: number;
  stockStatus: "in_stock" | "out_of_stock" | "made_to_order";
  location?: string;
  isFeatured: boolean;
  isPublished: boolean;
  tags: string[];
  images: { url: string; alt?: string; isPrimary?: boolean; order?: number }[];
  specifications: { key: string; value: string }[];
  createdAt?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "local_db.json");

let isInitialized = false;

export function ensureLoaded(force: boolean = false) {
  if (isInitialized && !force) return;
  isInitialized = true;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.categories)) {
        DEMO_CATEGORIES.length = 0;
        DEMO_CATEGORIES.push(...parsed.categories);
      }
      if (Array.isArray(parsed.products)) {
        DEMO_PRODUCTS.length = 0;
        DEMO_PRODUCTS.push(...parsed.products);
      }
      if (Array.isArray(parsed.requests)) {
        DEMO_REQUESTS.length = 0;
        DEMO_REQUESTS.push(...parsed.requests);
      }
    }
  } catch (err) {
    console.warn("[local_db] Failed to load local_db.json:", err);
  }
}

export function getDemoCategories(): IDemoCategory[] {
  ensureLoaded(true);
  return DEMO_CATEGORIES;
}

export function getDemoProducts(): IDemoProduct[] {
  ensureLoaded(true);
  return DEMO_PRODUCTS;
}

export function savePersistedData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(
        {
          categories: DEMO_CATEGORIES,
          products: DEMO_PRODUCTS,
          requests: DEMO_REQUESTS,
        },
        null,
        2
      ),
      "utf-8"
    );
  } catch (err) {
    console.warn("[local_db] Failed to write local_db.json:", err);
  }
}

export const DEMO_CATEGORIES: IDemoCategory[] = [
  {
    _id: "650000000000000000000011",
    name: "Bridal Collection",
    slug: "bridal-collection",
    description: "Heirloom bridal necklaces, mathapattis, and royal adornments for the magnificent bride.",
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=800&q=80",
    displayOrder: 1,
    isActive: true,
  },
  {
    _id: "650000000000000000000012",
    name: "Diamond Jewellery",
    slug: "diamond-jewellery",
    description: "Certified GIA natural solitaires and brilliant cut diamond fine jewels.",
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
    displayOrder: 2,
    isActive: true,
  },
  {
    _id: "650000000000000000000013",
    name: "Gold Jewellery",
    slug: "gold-jewellery",
    description: "22-karat BIS hallmarked temple and antique gold designs crafted by master artisans.",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
    displayOrder: 3,
    isActive: true,
  },
  {
    _id: "650000000000000000000014",
    name: "Necklaces",
    slug: "necklaces",
    description: "From delicate layered chokers to cascading multi-tier rani haars.",
    image: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=800&q=80",
    displayOrder: 4,
    isActive: true,
  },
  {
    _id: "650000000000000000000015",
    name: "Earrings",
    slug: "earrings",
    description: "Chandelier jhumkis, diamond studs, and modern drop earrings.",
    image: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80",
    displayOrder: 5,
    isActive: true,
  },
  {
    _id: "650000000000000000000016",
    name: "Rings",
    slug: "rings",
    description: "Solitaire engagement rings, eternal bands, and cocktail gemstone rings.",
    image: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=800&q=80",
    displayOrder: 6,
    isActive: true,
  },
  {
    _id: "650000000000000000000017",
    name: "Bracelets & Bangles",
    slug: "bracelets-bangles",
    description: "Flexible tennis bracelets, jadau kadas, and openable gold cuffs.",
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
    displayOrder: 7,
    isActive: true,
  },
];

export const DEMO_PRODUCTS: IDemoProduct[] = [
  {
    _id: "prod-1",
    name: "The Imperial Nizam Emerald & Solitaire Necklace",
    slug: "imperial-nizam-emerald-solitaire-necklace",
    sku: "RJ-NC-001",
    categoryId: { _id: "650000000000000000000014", name: "Necklaces", slug: "necklaces" },
    shortDescription: "A breathtaking regal collar set with Zambian emeralds and brilliant cut solitaires.",
    description:
      "Crafted over 180 hours of meticulous hand-setting, the Imperial Nizam necklace features 14.8 carats of natural untreated Zambian emeralds framed by VVS-E clarity diamonds set in 18K white gold.",
    price: 1450000,
    discountPrice: 1320000,
    showPrice: true,
    quantity: 4,
    stockStatus: "in_stock",
    isFeatured: true,
    isPublished: true,
    tags: ["High Jewellery", "Emerald", "Diamond", "Necklace", "Red Carpet"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1200&q=80",
        alt: "Imperial Nizam Emerald Necklace Front View",
        isPrimary: true,
        order: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80",
        alt: "Necklace craftsmanship closeup",
        isPrimary: false,
        order: 1,
      },
    ],
    specifications: [
      { key: "Metal", value: "18K White Gold" },
      { key: "Gross Weight", value: "68.4 grams" },
      { key: "Diamond Weight", value: "9.20 cts" },
      { key: "Diamond Quality", value: "VVS-VS / E-F Color" },
      { key: "Center Gemstone", value: "Natural Zambian Emerald (14.80 cts)" },
      { key: "Certification", value: "IGI & Gubelin Certified" },
    ],
  },
  {
    _id: "prod-2",
    name: "Eternity Cushion Cut Solitaire Diamond Ring",
    slug: "eternity-cushion-cut-solitaire-diamond-ring",
    sku: "RJ-RG-104",
    categoryId: { _id: "650000000000000000000016", name: "Rings", slug: "rings" },
    shortDescription: "A rare 2.50ct cushion modified brilliant solitaire with micro-pave split shank.",
    description:
      "An eternal declaration of love. Features a GIA certified 2.50 carat cushion cut diamond graded D Color and Flawless clarity, elevated upon a platinum cathedral setting lined with French pave diamonds.",
    price: 890000,
    discountPrice: 840000,
    showPrice: true,
    quantity: 6,
    stockStatus: "in_stock",
    isFeatured: true,
    isPublished: true,
    tags: ["Solitaire", "Engagement Ring", "GIA Certified", "Platinum"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80",
        alt: "Cushion Cut Solitaire Ring",
        isPrimary: true,
        order: 0,
      },
      {
        url: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=80",
        alt: "Side view of split shank setting",
        isPrimary: false,
        order: 1,
      },
    ],
    specifications: [
      { key: "Metal", value: "950 Platinum" },
      { key: "Center Solitaire", value: "2.50 Carats" },
      { key: "Cut / Polish / Symmetry", value: "Triple Excellent" },
      { key: "Color & Clarity", value: "D Color / IF (Internally Flawless)" },
      { key: "Side Stones", value: "0.65 cts French Pave" },
      { key: "Lab Certificate", value: "GIA Laser Inscribed" },
    ],
  },
  {
    _id: "prod-3",
    name: "Maharani Royal Jadau Polki Bridal Choker Set",
    slug: "maharani-royal-jadau-polki-bridal-choker-set",
    sku: "RJ-BD-201",
    categoryId: { _id: "650000000000000000000011", name: "Bridal Collection", slug: "bridal-collection" },
    shortDescription: "Traditional uncut diamond polki choker accented with south sea pearls and Burmese rubies.",
    description:
      "Fit for royalty, this bridal masterpiece revives centuries-old Bikaner meenakari on the reverse with syndicate uncut polki diamonds and glowing crimson rubies on the front. Accompanied by matching oversized chandbalis.",
    price: 2450000,
    discountPrice: 2280000,
    showPrice: true,
    quantity: 2,
    stockStatus: "made_to_order",
    isFeatured: true,
    isPublished: true,
    tags: ["Bridal", "Polki", "Heritage", "22K Gold", "Uncut Diamonds"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80",
        alt: "Maharani Bridal Choker and Earrings",
        isPrimary: true,
        order: 0,
      },
    ],
    specifications: [
      { key: "Metal", value: "22K Yellow Gold (Hallmarked 916)" },
      { key: "Gross Weight", value: "142.5 grams" },
      { key: "Polki Weight", value: "32.40 carats (Syndicate Grade)" },
      { key: "Gemstones", value: "Natural Burmese Rubies & Basra Cultured Pearls" },
      { key: "Artistry", value: "Hand-painted Gulabi Meenakari Enameling" },
    ],
  },
  {
    _id: "prod-4",
    name: "Constellation Cascade Diamond Jhumkis",
    slug: "constellation-cascade-diamond-jhumkis",
    sku: "RJ-ER-303",
    categoryId: { _id: "650000000000000000000015", name: "Earrings", slug: "earrings" },
    shortDescription: "Dramatic tiered diamond drop jhumkis with detachable floral studs.",
    description:
      "Designed to shimmer with every turn of the head, these chandelier jhumkis merge the traditional bell silhouette with 320 micro-pave and baguette diamonds.",
    price: 520000,
    discountPrice: 480000,
    showPrice: true,
    quantity: 12,
    stockStatus: "in_stock",
    isFeatured: true,
    isPublished: true,
    tags: ["Earrings", "Jhumki", "Diamond", "Occasion Wear"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1200&q=80",
        alt: "Constellation Diamond Jhumkis",
        isPrimary: true,
        order: 0,
      },
    ],
    specifications: [
      { key: "Metal", value: "18K Rose Gold" },
      { key: "Gross Weight", value: "28.6 grams" },
      { key: "Diamond Weight", value: "5.80 carats" },
      { key: "Clarity / Color", value: "VS-GH" },
      { key: "Lock Type", value: "South Indian Screw with Safety Clip" },
    ],
  },
  {
    _id: "prod-5",
    name: "Majestic Heritage Peacock Gold Kadas (Pair)",
    slug: "majestic-heritage-peacock-gold-kadas",
    sku: "RJ-GL-401",
    categoryId: { _id: "650000000000000000000013", name: "Gold Jewellery", slug: "gold-jewellery" },
    shortDescription: "Heirloom 22K antique finish temple bangles sculpted with peacock and floral motifs.",
    description:
      "Hand-beaten and carved using the ancient Nakshi repousse technique. Pair of openable kadas with ruby eyes and filigree screw clasps.",
    price: 680000,
    discountPrice: null,
    showPrice: true,
    quantity: 5,
    stockStatus: "in_stock",
    isFeatured: false,
    isPublished: true,
    tags: ["Gold", "22K Gold", "Bangles", "Temple Jewellery"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=80",
        alt: "Antique Gold Kadas",
        isPrimary: true,
        order: 0,
      },
    ],
    specifications: [
      { key: "Purity", value: "22 Karat (BIS Hallmarked 916)" },
      { key: "Gross Weight", value: "84.20 grams (Pair)" },
      { key: "Craft", value: "Nakshi Temple Sculpture" },
      { key: "Accent Stones", value: "Natural Pink Tourmalines" },
      { key: "Clasp", value: "Screw Closure" },
    ],
  },
  {
    _id: "prod-6",
    name: "Starlight Flexible Diamond Tennis Bracelet",
    slug: "starlight-flexible-diamond-tennis-bracelet",
    sku: "RJ-BR-502",
    categoryId: { _id: "650000000000000000000017", name: "Bracelets & Bangles", slug: "bracelets-bangles" },
    shortDescription: "Fluid continuous line of 55 matching round brilliant ideal-cut diamonds.",
    description:
      "The quintessential luxury statement. Each stone is individually four-prong set in 18K white gold with a double safety box catch.",
    price: 495000,
    discountPrice: 450000,
    showPrice: true,
    quantity: 8,
    stockStatus: "in_stock",
    isFeatured: true,
    isPublished: true,
    tags: ["Diamond", "Tennis Bracelet", "Classic", "18K Gold"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=80",
        alt: "Diamond Tennis Bracelet",
        isPrimary: true,
        order: 0,
      },
    ],
    specifications: [
      { key: "Metal", value: "18K White Gold" },
      { key: "Total Diamond Weight", value: "6.50 cts" },
      { key: "Diamond Cut", value: "Hearts & Arrows Round Brilliant" },
      { key: "Diamond Quality", value: "VVS-VS / F-G" },
      { key: "Length", value: "7.0 inches" },
    ],
  },
  {
    _id: "prod-7",
    name: "Aura Tanzanite & Pear Diamond Halo Ring",
    slug: "aura-tanzanite-pear-diamond-halo-ring",
    sku: "RJ-RG-605",
    categoryId: { _id: "650000000000000000000016", name: "Rings", slug: "rings" },
    shortDescription: "Vibrant royal violet-blue tanzanite encompassed by scintillating pear cut diamonds.",
    description:
      "Centering an intense 4.20 carat cushion tanzanite sourced from the foothills of Mount Kilimanjaro, embraced by a constellation of pear-shaped solitaire halos.",
    price: 380000,
    discountPrice: 350000,
    showPrice: true,
    quantity: 3,
    stockStatus: "in_stock",
    isFeatured: false,
    isPublished: true,
    tags: ["Tanzanite", "Gemstone Ring", "Diamond", "Cocktail Ring"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=80",
        alt: "Tanzanite and Diamond Ring",
        isPrimary: true,
        order: 0,
      },
    ],
    specifications: [
      { key: "Metal", value: "18K Yellow & White Gold" },
      { key: "Center Gemstone", value: "Natural Tanzanite (4.20 carats)" },
      { key: "Color Grade", value: "Vivid Violetish Blue (AAA)" },
      { key: "Diamond Accent", value: "1.45 cts Pear & Round" },
      { key: "Size", value: "54 EU / 7 US (Resizable)" },
    ],
  },
  {
    _id: "prod-8",
    name: "Serenade Marquise Floral Diamond Necklace",
    slug: "serenade-marquise-floral-diamond-necklace",
    sku: "RJ-NC-707",
    categoryId: { _id: "650000000000000000000014", name: "Necklaces", slug: "necklaces" },
    shortDescription: "Delicate garland of marquise and round diamonds designed like blooming jasmine petals.",
    description:
      "Crafted for modern brides and black-tie galas. Graceful floral clusters gracefully graduate around the neckline, casting supreme fire and scintillation.",
    price: 1150000,
    discountPrice: null,
    showPrice: true,
    quantity: 5,
    stockStatus: "in_stock",
    isFeatured: true,
    isPublished: true,
    tags: ["Diamond", "Necklace", "Marquise", "Contemporary Bridal"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1200&q=80",
        alt: "Marquise Floral Diamond Necklace",
        isPrimary: true,
        order: 0,
      },
    ],
    specifications: [
      { key: "Metal", value: "18K White Gold" },
      { key: "Diamond Weight", value: "11.25 cts" },
      { key: "Gross Weight", value: "52.8 grams" },
      { key: "Stone Shapes", value: "Marquise & Round Brilliant" },
      { key: "Clarity", value: "VVS-VS" },
    ],
  },
  {
    _id: "prod-9",
    name: "Sovereign Solitaire Emerald Cut Studs",
    slug: "sovereign-solitaire-emerald-cut-studs",
    sku: "RJ-ER-909",
    categoryId: { _id: "650000000000000000000012", name: "Diamond Jewellery", slug: "diamond-jewellery" },
    shortDescription: "Matched pair of 1.00ct emerald cut natural diamond earrings in platinum.",
    description:
      "The epitome of understated elegance. Two matched emerald cut diamonds (2.02 carats total) displaying hall-of-mirrors reflection in four-corner prongs.",
    price: 430000,
    discountPrice: 395000,
    showPrice: true,
    quantity: 10,
    stockStatus: "in_stock",
    isFeatured: false,
    isPublished: true,
    tags: ["Solitaire", "Emerald Cut", "Diamond Studs", "Platinum"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1200&q=80",
        alt: "Emerald Cut Diamond Studs",
        isPrimary: true,
        order: 0,
      },
    ],
    specifications: [
      { key: "Metal", value: "950 Platinum" },
      { key: "Total Carats", value: "2.02 cts (1.01 ct each)" },
      { key: "Color", value: "E Color" },
      { key: "Clarity", value: "VVS1" },
      { key: "Certificate", value: "Dual GIA Dossiers" },
    ],
  },
];

export function addDemoProduct(product: Partial<IDemoProduct>): IDemoProduct {
  const { getProductPlaceholder } = require("@/lib/placeholderImages");
  const catIdentifier =
    typeof product.categoryId === "object" && product.categoryId !== null
      ? (product.categoryId as { name?: string; slug?: string })?.name || (product.categoryId as { name?: string; slug?: string })?.slug
      : typeof product.categoryId === "string"
      ? product.categoryId
      : "";

  const defaultImg = getProductPlaceholder(catIdentifier, product.name);

  const newProd: IDemoProduct = {
    _id: "65" + Math.random().toString(16).substring(2, 10).padEnd(22, "0"),
    name: product.name || "Untitled Product",
    slug: (product.name || "untitled").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    sku: product.sku || `RJ-${Date.now().toString().slice(-4)}`,
    categoryId: product.categoryId || DEMO_CATEGORIES[0]._id,
    shortDescription: product.shortDescription || "",
    description: product.description || "",
    price: product.price || 0,
    discountPrice: product.discountPrice ?? null,
    showPrice: product.showPrice ?? true,
    showQuantity: product.showQuantity ?? true,
    quantity: product.quantity ?? 5,
    stockStatus: product.stockStatus || "in_stock",
    location: product.location?.trim() || "",
    isFeatured: !!product.isFeatured,
    isPublished: product.isPublished !== false,
    tags: product.tags || [],
    images: product.images?.length
      ? product.images
      : [
          {
            url: defaultImg,
            alt: product.name || "Product image",
            isPrimary: true,
            order: 0,
          },
        ],
    specifications: product.specifications || [],
    createdAt: new Date().toISOString(),
  };

  ensureLoaded();
  DEMO_PRODUCTS.unshift(newProd);
  savePersistedData();
  return newProd;
}

export function addDemoCategory(category: Partial<IDemoCategory>): IDemoCategory {
  ensureLoaded();
  const { getCategoryPlaceholder } = require("@/lib/placeholderImages");
  const defaultCover = getCategoryPlaceholder(category.name || category.slug);

  const existingIndex = DEMO_CATEGORIES.findIndex(
    (c) =>
      (category._id && c._id === category._id) ||
      (category.slug && c.slug.toLowerCase() === category.slug.toLowerCase()) ||
      (category.name && c.name.toLowerCase() === category.name.toLowerCase())
  );

  if (existingIndex !== -1) {
    DEMO_CATEGORIES[existingIndex] = {
      ...DEMO_CATEGORIES[existingIndex],
      ...category,
      _id: category._id || DEMO_CATEGORIES[existingIndex]._id,
    };
    savePersistedData();
    return DEMO_CATEGORIES[existingIndex];
  }

  const newCat: IDemoCategory = {
    _id: category._id || ("65" + Math.random().toString(16).substring(2, 10).padEnd(22, "0")),
    name: category.name || "New Category",
    slug: (category.slug || category.name || "new-category").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: category.description || "",
    image: category.image || defaultCover,
    displayOrder: category.displayOrder || DEMO_CATEGORIES.length + 1,
    isActive: category.isActive !== false,
  };

  DEMO_CATEGORIES.push(newCat);
  savePersistedData();
  return newCat;
}

export function getDemoProductById(id: string): IDemoProduct | null {
  ensureLoaded();
  return DEMO_PRODUCTS.find((p) => p._id === id || p.slug === id) || null;
}

export function updateDemoProduct(id: string, updates: Partial<IDemoProduct>): IDemoProduct | null {
  ensureLoaded();
  const index = DEMO_PRODUCTS.findIndex((p) => p._id === id || p.slug === id);
  if (index === -1) return null;
  DEMO_PRODUCTS[index] = {
    ...DEMO_PRODUCTS[index],
    ...updates,
    _id: DEMO_PRODUCTS[index]._id,
  };
  savePersistedData();
  return DEMO_PRODUCTS[index];
}

export function deleteDemoProduct(id: string): boolean {
  ensureLoaded();
  const index = DEMO_PRODUCTS.findIndex((p) => p._id === id || p.slug === id);
  if (index === -1) return false;
  DEMO_PRODUCTS.splice(index, 1);
  savePersistedData();
  return true;
}

export function updateDemoCategory(id: string, updates: Partial<IDemoCategory>): IDemoCategory | null {
  ensureLoaded();
  const index = DEMO_CATEGORIES.findIndex((c) => c._id === id || c.slug === id);
  if (index === -1) return null;
  DEMO_CATEGORIES[index] = {
    ...DEMO_CATEGORIES[index],
    ...updates,
    _id: DEMO_CATEGORIES[index]._id,
  };
  savePersistedData();
  return DEMO_CATEGORIES[index];
}

export function deleteDemoCategory(id: string): boolean {
  ensureLoaded(true);
  const rawId = String(id).trim();
  let decoded = rawId;
  try {
    decoded = decodeURIComponent(rawId).trim();
  } catch {}
  const rawLower = rawId.toLowerCase();
  const decodedLower = decoded.toLowerCase();
  const rawAlpha = rawLower.replace(/[^a-z0-9]/g, "");
  const decodedAlpha = decodedLower.replace(/[^a-z0-9]/g, "");

  const initialLen = DEMO_CATEGORIES.length;
  const filtered = DEMO_CATEGORIES.filter((c) => {
    const cId = String(c._id || "").trim();
    const cSlug = String(c.slug || "").trim().toLowerCase();
    const cName = String(c.name || "").trim().toLowerCase();
    const cSlugAlpha = cSlug.replace(/[^a-z0-9]/g, "");
    const cNameAlpha = cName.replace(/[^a-z0-9]/g, "");

    const isMatch =
      cId === rawId ||
      cId === decoded ||
      cSlug === rawLower ||
      cSlug === decodedLower ||
      cName === rawLower ||
      cName === decodedLower ||
      (rawAlpha.length > 2 && (cSlugAlpha === rawAlpha || cNameAlpha === rawAlpha)) ||
      (decodedAlpha.length > 2 && (cSlugAlpha === decodedAlpha || cNameAlpha === decodedAlpha));

    return !isMatch;
  });

  if (filtered.length === initialLen) return false;

  DEMO_CATEGORIES.length = 0;
  DEMO_CATEGORIES.push(...filtered);
  DEMO_CATEGORIES.forEach((cat, idx) => {
    cat.displayOrder = idx + 1;
  });
  savePersistedData();
  return true;
}

export interface IDemoRequest {
  _id: string;
  orderId?: string;
  businessId?: string;
  productId?: string;
  productName: string;
  productSku?: string;
  productImage?: string;
  visitorName: string;
  visitorPhone: string;
  quantity: number;
  description?: string;
  status: "pending" | "contacted" | "in-progress" | "fulfilled" | "cancelled";
  isQuantityDeducted?: boolean;
  source?: "whatsapp" | "order" | "quick-request" | "cart";
  isWhatsAppEnquiry?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const DEMO_REQUESTS: IDemoRequest[] = [
  {
    _id: "req-wa-1",
    orderId: "DW-WA-901001",
    productName: "The Imperial Nizam Emerald & Solitaire Necklace",
    productSku: "RJ-NC-001",
    productImage: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=800&q=80",
    visitorName: "Pranav Raj",
    visitorPhone: "+91 95813 35925",
    quantity: 1,
    description: "Can you provide customization for matching earrings? Also would love to see a live video on WhatsApp.",
    status: "pending",
    source: "whatsapp",
    isWhatsAppEnquiry: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    _id: "req-wa-2",
    orderId: "DW-WA-901002",
    productName: "Eternity Cushion Cut Solitaire Diamond Ring",
    productSku: "RJ-RG-104",
    productImage: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
    visitorName: "Pranav Raj",
    visitorPhone: "+91 95813 35925",
    quantity: 1,
    description: "What is the certified ring size available for immediate dispatch? Need it for an engagement next week.",
    status: "contacted",
    source: "whatsapp",
    isWhatsAppEnquiry: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    _id: "req-wa-3",
    orderId: "DW-WA-901003",
    productName: "Maharani Royal Jadau Polki Bridal Choker Set",
    productSku: "RJ-BD-201",
    productImage: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=800&q=80",
    visitorName: "Pranav Raj",
    visitorPhone: "+91 95813 35925",
    quantity: 1,
    description: "Please share hallmarking certificate details and final negotiable price for bridal set.",
    status: "in-progress",
    source: "whatsapp",
    isWhatsAppEnquiry: true,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    _id: "req-wa-4",
    orderId: "DW-WA-901004",
    productName: "Solitaire Rose Cut Diamond Studs",
    productSku: "RJ-ER-302",
    productImage: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=800&q=80",
    visitorName: "Radhika Mehra",
    visitorPhone: "+91 98450 11223",
    quantity: 1,
    description: "Are these available in 22K yellow gold instead of white gold?",
    status: "pending",
    source: "whatsapp",
    isWhatsAppEnquiry: true,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    _id: "req-wa-5",
    orderId: "DW-WA-901005",
    productName: "Heritage Temple Nakshi Peacock Kada",
    productSku: "RJ-BG-401",
    productImage: "https://images.unsplash.com/photo-1611591475102-468ae7048a1d?auto=format&fit=crop&w=800&q=80",
    visitorName: "Deepak Sharma",
    visitorPhone: "+91 98200 44556",
    quantity: 2,
    description: "Looking for size 2.6 in 24K gold foil antique finish. Please reply with availability.",
    status: "fulfilled",
    source: "whatsapp",
    isWhatsAppEnquiry: true,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    _id: "req-1",
    orderId: "DW-ORD-881204",
    productName: "The Imperial Nizam Emerald & Solitaire Necklace",
    productSku: "RJ-NC-001",
    productImage: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=800&q=80",
    visitorName: "Ananya Deshmukh",
    visitorPhone: "+91 98201 12345",
    quantity: 1,
    description: "Interested in matching earrings as well. Please call between 3 PM and 6 PM.",
    status: "pending",
    source: "cart",
    isWhatsAppEnquiry: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    _id: "req-2",
    orderId: "DW-ORD-881205",
    productName: "Royal Jaipur Navratna Choker",
    productSku: "RJ-NC-002",
    productImage: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=800&q=80",
    visitorName: "Vikram Singhania",
    visitorPhone: "+91 98110 54321",
    quantity: 2,
    description: "Need for a wedding next month. Please share customization options in rose gold.",
    status: "contacted",
    source: "quick-request",
    isWhatsAppEnquiry: false,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

function extractDemoCategoryCode(catName?: string, fallbackText?: string): string {
  const text = catName || fallbackText || "";
  const cleaned = text.replace(/[^a-zA-Z\s]/g, " ").trim();
  if (!cleaned) return "GN";

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    const w = words[0].toUpperCase();
    if (w.startsWith("EARRING")) return "ER";
    if (w.startsWith("RING")) return "RG";
    if (w.startsWith("NECKLACE")) return "NC";
    if (w.startsWith("CHAIN")) return "CH";
    if (w.startsWith("BANGLE")) return "BG";
    if (w.startsWith("BRACELET")) return "BR";
    if (w.startsWith("PENDANT")) return "PD";
    if (w.startsWith("MANGALSUTRA")) return "MS";
    if (w.startsWith("HARAM") || w.startsWith("HAARAM")) return "HM";
    if (w.startsWith("CHOKER")) return "CK";
    return w.slice(0, 2).padEnd(2, "X").toUpperCase();
  }
  return "GN";
}

function getDemoFormattedDate(d = new Date()): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
}

export function createDemoRequest(data: Omit<IDemoRequest, "_id" | "createdAt" | "updatedAt">): IDemoRequest {
  ensureLoaded();
  const dateStr = getDemoFormattedDate();
  const catCode = extractDemoCategoryCode(undefined, data.productName);

  let generatedOrderId = data.orderId;
  if (!generatedOrderId) {
    const prefix = `DW-${catCode}-${dateStr}`;
    const distinctOrders = new Set(
      DEMO_REQUESTS.filter((r) => r.orderId && r.orderId.includes(`-${dateStr}`)).map((r) => r.orderId)
    );
    const seq = String(distinctOrders.size + 1).padStart(3, "0");
    generatedOrderId = `${prefix}${seq}`;
  }

  const newReq: IDemoRequest = {
    _id: "req-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    ...data,
    orderId: generatedOrderId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  DEMO_REQUESTS.unshift(newReq);
  savePersistedData();
  return newReq;
}

export function updateDemoRequest(id: string, updates: Partial<IDemoRequest>): IDemoRequest | null {
  ensureLoaded();
  const index = DEMO_REQUESTS.findIndex((r) => r._id === id);
  if (index === -1) return null;
  const existing = DEMO_REQUESTS[index];

  if (updates.status === "in-progress" && !existing.isQuantityDeducted) {
    if (existing.productId) {
      decrementDemoProductQuantity(existing.productId, existing.quantity || 1);
    }
    updates.isQuantityDeducted = true;
  }

  DEMO_REQUESTS[index] = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  savePersistedData();
  return DEMO_REQUESTS[index];
}

export function deleteDemoRequest(id: string): boolean {
  ensureLoaded();
  const index = DEMO_REQUESTS.findIndex((r) => r._id === id);
  if (index === -1) return false;
  DEMO_REQUESTS.splice(index, 1);
  savePersistedData();
  return true;
}

export function decrementDemoProductQuantity(productId?: string, quantityToDecrement: number = 1): IDemoProduct | null {
  if (!productId) return null;
  ensureLoaded();
  const index = DEMO_PRODUCTS.findIndex((p) => p._id === productId || p.slug === productId);
  if (index === -1) return null;
  const current = DEMO_PRODUCTS[index].quantity ?? 10;
  const newQty = Math.max(0, current - quantityToDecrement);
  DEMO_PRODUCTS[index] = {
    ...DEMO_PRODUCTS[index],
    quantity: newQty,
    stockStatus: newQty <= 0 ? "out_of_stock" : DEMO_PRODUCTS[index].stockStatus,
  };
  savePersistedData();
  return DEMO_PRODUCTS[index];
}

// Initial load if file exists
ensureLoaded();

