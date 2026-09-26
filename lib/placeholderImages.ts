/**
 * Curated high-resolution jewellery placeholder images tailored to category types.
 * Avoids blank, gray, or missing images for both categories and products.
 */

export interface CategoryPlaceholderPair {
  categoryCover: string;
  productPlaceholder: string;
}

export const CATEGORY_PLACEHOLDERS: Record<string, CategoryPlaceholderPair> = {
  bridal: {
    categoryCover: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1200&q=80",
    productPlaceholder: "https://images.unsplash.com/photo-1611591475836-e822a969bc74?auto=format&fit=crop&w=1000&q=80",
  },
  diamond: {
    categoryCover: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80",
    productPlaceholder: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=80",
  },
  gold: {
    categoryCover: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=80",
    productPlaceholder: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1000&q=80",
  },
  necklace: {
    categoryCover: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1200&q=80",
    productPlaceholder: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=80",
  },
  necklaces: {
    categoryCover: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1200&q=80",
    productPlaceholder: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1000&q=80",
  },
  earring: {
    categoryCover: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1200&q=80",
    productPlaceholder: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80",
  },
  earrings: {
    categoryCover: "https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=1200&q=80",
    productPlaceholder: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80",
  },
  ring: {
    categoryCover: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=80",
    productPlaceholder: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80",
  },
  rings: {
    categoryCover: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1200&q=80",
    productPlaceholder: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80",
  },
  bracelet: {
    categoryCover: "https://images.unsplash.com/photo-1611591475836-e822a969bc74?auto=format&fit=crop&w=1200&q=80",
    productPlaceholder: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80",
  },
  bracelets: {
    categoryCover: "https://images.unsplash.com/photo-1611591475836-e822a969bc74?auto=format&fit=crop&w=1200&q=80",
    productPlaceholder: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80",
  },
  bangles: {
    categoryCover: "https://images.unsplash.com/photo-1611591475836-e822a969bc74?auto=format&fit=crop&w=1200&q=80",
    productPlaceholder: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80",
  },
  pendant: {
    categoryCover: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80",
    productPlaceholder: "https://images.unsplash.com/photo-1599643477877-530eb83abc8e?auto=format&fit=crop&w=1000&q=80",
  },
  solitaire: {
    categoryCover: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1200&q=80",
    productPlaceholder: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=1000&q=80",
  },
};

const DEFAULT_CATEGORY_COVER = "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80";
const DEFAULT_PRODUCT_PLACEHOLDER = "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1000&q=80";

function matchCategoryKey(categoryIdentifier?: string): CategoryPlaceholderPair | null {
  if (!categoryIdentifier) return null;
  const lower = categoryIdentifier.toLowerCase();

  if (lower.includes("bridal") || lower.includes("wedding") || lower.includes("dulhan")) {
    return CATEGORY_PLACEHOLDERS.bridal;
  }
  if (lower.includes("diamond") || lower.includes("solitaire") || lower.includes("vvs")) {
    return CATEGORY_PLACEHOLDERS.diamond;
  }
  if (lower.includes("gold") || lower.includes("temple") || lower.includes("kundan") || lower.includes("polki")) {
    return CATEGORY_PLACEHOLDERS.gold;
  }
  if (lower.includes("necklace") || lower.includes("choker") || lower.includes("haar") || lower.includes("collar")) {
    return CATEGORY_PLACEHOLDERS.necklaces;
  }
  if (lower.includes("earring") || lower.includes("jhumk") || lower.includes("stud") || lower.includes("drop")) {
    return CATEGORY_PLACEHOLDERS.earrings;
  }
  if (lower.includes("ring") || lower.includes("band")) {
    return CATEGORY_PLACEHOLDERS.rings;
  }
  if (lower.includes("bracelet") || lower.includes("bangle") || lower.includes("kada") || lower.includes("cuff")) {
    return CATEGORY_PLACEHOLDERS.bracelets;
  }
  if (lower.includes("pendant") || lower.includes("chain") || lower.includes("locket")) {
    return CATEGORY_PLACEHOLDERS.pendant;
  }

  return null;
}

/**
 * Returns a high-res cover image for a category if none is provided.
 */
export function getCategoryPlaceholder(categoryNameOrSlug?: string): string {
  const match = matchCategoryKey(categoryNameOrSlug);
  return match?.categoryCover || DEFAULT_CATEGORY_COVER;
}

/**
 * Returns a high-res jewellery product placeholder image tailored to the category or product title.
 */
export function getProductPlaceholder(categoryIdentifier?: string, productName?: string): string {
  // First attempt to match by category
  const matchCat = matchCategoryKey(categoryIdentifier);
  if (matchCat) return matchCat.productPlaceholder;

  // Next attempt to match by product name
  const matchName = matchCategoryKey(productName);
  if (matchName) return matchName.productPlaceholder;

  return DEFAULT_PRODUCT_PLACEHOLDER;
}
