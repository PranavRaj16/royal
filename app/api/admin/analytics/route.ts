import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ItemRequest } from "@/models/ItemRequest";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Business } from "@/models/Business";
import { getProductPlaceholder, getCategoryPlaceholder } from "@/lib/placeholderImages";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface TopProductAnalytics {
  productId: string;
  name: string;
  sku: string;
  price: number;
  discountPrice?: number;
  image: string;
  categoryName: string;
  requestCount: number;
  totalQuantity: number;
  percentage: number;
}

export interface TopCategoryAnalytics {
  categoryId: string;
  name: string;
  slug: string;
  image: string;
  requestCount: number;
  totalQuantity: number;
  percentage: number;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      await connectToDatabase();

      const query: Record<string, unknown> = {};

      const business = await Business.findOne({});
      const matchedIds: mongoose.Types.ObjectId[] = [];
      if (business?._id) matchedIds.push(business._id);
      if (session.businessId && mongoose.Types.ObjectId.isValid(session.businessId)) {
        const sId = new mongoose.Types.ObjectId(session.businessId);
        if (!matchedIds.some((id) => id.equals(sId))) {
          matchedIds.push(sId);
        }
      }

      if (matchedIds.length > 0) {
        query.$or = [
          { businessId: { $in: matchedIds } },
          { businessId: null },
          { businessId: { $exists: false } },
        ];
      }

      const [requests, products, categories] = await Promise.all([
        ItemRequest.find(query).sort({ createdAt: -1 }).lean(),
        Product.find({}).populate("categoryId").lean(),
        Category.find({}).lean(),
      ]);

      const analytics = processAnalytics(requests, products, categories);

      return NextResponse.json(
        { success: true, ...analytics },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    } catch (dbErr) {
      console.warn("GET /api/admin/analytics DB error, using demo fallback:", dbErr);
      const { DEMO_REQUESTS, DEMO_PRODUCTS, DEMO_CATEGORIES } = await import("@/lib/demoData");
      const analytics = processAnalytics(DEMO_REQUESTS, DEMO_PRODUCTS, DEMO_CATEGORIES);

      return NextResponse.json(
        { success: true, ...analytics, isFallback: true },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    }
  } catch (err) {
    console.error("GET /api/admin/analytics error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function processAnalytics(rawRequests: any[], rawProducts: any[], rawCategories: any[]) {
  const requests = rawRequests || [];
  const products = rawProducts || [];
  const categories = rawCategories || [];

  const categoryMap = new Map<string, any>();
  categories.forEach((cat) => {
    const id = String(cat._id);
    categoryMap.set(id, cat);
    if (cat.slug) categoryMap.set(String(cat.slug).toLowerCase(), cat);
    if (cat.name) categoryMap.set(String(cat.name).toLowerCase(), cat);
  });

  const productMap = new Map<string, any>();
  products.forEach((prod) => {
    const id = String(prod._id);
    productMap.set(id, prod);
    if (prod.sku) productMap.set(String(prod.sku).toLowerCase(), prod);
    if (prod.name) productMap.set(String(prod.name).toLowerCase(), prod);
  });

  // Track product stats
  const productStats = new Map<
    string,
    {
      productId: string;
      name: string;
      sku: string;
      price: number;
      discountPrice?: number;
      image: string;
      categoryName: string;
      requestCount: number;
      totalQuantity: number;
    }
  >();

  // Track category stats
  const categoryStats = new Map<
    string,
    {
      categoryId: string;
      name: string;
      slug: string;
      image: string;
      requestCount: number;
      totalQuantity: number;
    }
  >();

  let totalRequests = requests.length;
  let totalUnitsRequested = 0;
  let pendingCount = 0;
  let fulfilledCount = 0;
  const distinctOrders = new Set<string>();

  requests.forEach((req) => {
    const qty = Number(req.quantity) || 1;
    totalUnitsRequested += qty;
    if (req.orderId) distinctOrders.add(req.orderId);
    else distinctOrders.add(String(req._id));

    if (req.status === "pending") pendingCount++;
    if (req.status === "fulfilled") fulfilledCount++;

    // Resolve matching product
    let prod: any = null;
    if (req.productId && productMap.has(String(req.productId))) {
      prod = productMap.get(String(req.productId));
    } else if (req.productSku && productMap.has(String(req.productSku).toLowerCase())) {
      prod = productMap.get(String(req.productSku).toLowerCase());
    } else if (req.productName && productMap.has(String(req.productName).toLowerCase())) {
      prod = productMap.get(String(req.productName).toLowerCase());
    }

    const prodKey = prod ? String(prod._id) : (req.productSku || req.productName || String(req._id));
    const prodName = prod?.name || req.productName || "Custom Piece Request";
    const prodSku = prod?.sku || req.productSku || "CUSTOM";
    const prodPrice = Number(prod?.discountPrice || prod?.price || 0);

    // Resolve category name
    let catObj: any = null;
    if (prod?.categoryId) {
      if (typeof prod.categoryId === "object" && prod.categoryId !== null) {
        catObj = prod.categoryId;
      } else if (categoryMap.has(String(prod.categoryId))) {
        catObj = categoryMap.get(String(prod.categoryId));
      }
    }
    const catName = catObj?.name || "Bespoke Jewellery";
    const catId = catObj ? String(catObj._id) : (catName.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    const catSlug = catObj?.slug || catName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const catImg = catObj?.image || getCategoryPlaceholder(catName);

    // Update Product stats
    if (!productStats.has(prodKey)) {
      const pImg =
        prod?.images?.find((i: any) => i.isPrimary)?.url ||
        prod?.images?.[0]?.url ||
        getProductPlaceholder(catName, prodName);

      productStats.set(prodKey, {
        productId: prod ? String(prod._id) : prodKey,
        name: prodName,
        sku: prodSku,
        price: prodPrice,
        discountPrice: prod?.discountPrice,
        image: pImg,
        categoryName: catName,
        requestCount: 0,
        totalQuantity: 0,
      });
    }
    const curProd = productStats.get(prodKey)!;
    curProd.requestCount += 1;
    curProd.totalQuantity += qty;

    // Update Category stats
    const categoryKey = catId;
    if (!categoryStats.has(categoryKey)) {
      categoryStats.set(categoryKey, {
        categoryId: catId,
        name: catName,
        slug: catSlug,
        image: catImg,
        requestCount: 0,
        totalQuantity: 0,
      });
    }
    const curCat = categoryStats.get(categoryKey)!;
    curCat.requestCount += 1;
    curCat.totalQuantity += qty;
  });

  // Sort & compute Top 5 Products
  const sortedProducts = Array.from(productStats.values()).sort(
    (a, b) => b.requestCount - a.requestCount || b.totalQuantity - a.totalQuantity
  );

  const topProducts: TopProductAnalytics[] = sortedProducts.slice(0, 5).map((p) => ({
    ...p,
    percentage: totalRequests > 0 ? Math.round((p.requestCount / totalRequests) * 100) : 0,
  }));

  // Sort & compute Top 5 Categories
  const sortedCategories = Array.from(categoryStats.values()).sort(
    (a, b) => b.requestCount - a.requestCount || b.totalQuantity - a.totalQuantity
  );

  const topCategories: TopCategoryAnalytics[] = sortedCategories.slice(0, 5).map((c) => ({
    ...c,
    percentage: totalRequests > 0 ? Math.round((c.requestCount / totalRequests) * 100) : 0,
  }));

  return {
    topProducts,
    topCategories,
    summary: {
      totalRequests,
      totalOrders: distinctOrders.size,
      totalUnitsRequested,
      pendingRequests: pendingCount,
      fulfilledRequests: fulfilledCount,
      conversionRate: totalRequests > 0 ? Math.round((fulfilledCount / totalRequests) * 100) : 0,
    },
  };
}
