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

export const DEMO_CATEGORIES: IDemoCategory[] = [];

export const DEMO_PRODUCTS: IDemoProduct[] = [];

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

export const DEMO_REQUESTS: IDemoRequest[] = [];

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

