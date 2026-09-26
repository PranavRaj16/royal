import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId") || "";
    const status = searchParams.get("status") || ""; // 'published' | 'draft'
    const stockStatus = searchParams.get("stockStatus") || "";
    const featured = searchParams.get("featured") || "";
    const sort = searchParams.get("sort") || "newest";

    const query: Record<string, unknown> = {
      businessId: new mongoose.Types.ObjectId(session.businessId),
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    if (categoryId && categoryId !== "all") {
      if (mongoose.Types.ObjectId.isValid(categoryId)) {
        query.categoryId = new mongoose.Types.ObjectId(categoryId);
      } else {
        const CategoryModel = mongoose.models.Category || (await import("@/models")).Category;
        const foundCat = await CategoryModel.findOne({
          businessId: new mongoose.Types.ObjectId(session.businessId),
          $or: [{ slug: categoryId }, { name: categoryId }],
        });
        if (foundCat) {
          query.categoryId = foundCat._id;
        }
      }
    }

    if (status === "published") {
      query.isPublished = true;
    } else if (status === "draft") {
      query.isPublished = false;
    }

    if (stockStatus && stockStatus !== "all") {
      query.stockStatus = stockStatus;
    }

    if (featured === "true") {
      query.isFeatured = true;
    }

    // Sort order
    let sortObj: Record<string, 1 | -1> = { createdAt: -1 };
    if (sort === "oldest") sortObj = { createdAt: 1 };
    else if (sort === "name-asc") sortObj = { name: 1 };
    else if (sort === "name-desc") sortObj = { name: -1 };
    else if (sort === "price-asc") sortObj = { price: 1 };
    else if (sort === "price-desc") sortObj = { price: -1 };

    const products = await Product.find(query)
      .populate("categoryId", "name slug")
      .sort(sortObj);

    if (products.length > 0) {
      return NextResponse.json({ success: true, products });
    }

    // If DB has no products or is offline, return demo products
    const { DEMO_PRODUCTS } = await import("@/lib/demoData");
    let fallback = [...DEMO_PRODUCTS];
    if (search) {
      fallback = fallback.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase()) ||
          p.shortDescription.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (categoryId && categoryId !== "all") {
      fallback = fallback.filter((p) => {
        const cObj = typeof p.categoryId === "object" ? p.categoryId : null;
        const cId = cObj ? cObj._id : p.categoryId;
        const cSlug = cObj ? cObj.slug : null;
        return cId === categoryId || cSlug === categoryId;
      });
    }
    if (status === "published") fallback = fallback.filter((p) => p.isPublished);
    if (status === "draft") fallback = fallback.filter((p) => !p.isPublished);

    return NextResponse.json({ success: true, products: fallback, isFallback: true });
  } catch (error) {
    console.error("GET /api/products error (serving fallback):", error);
    const { DEMO_PRODUCTS } = await import("@/lib/demoData");
    return NextResponse.json({ success: true, products: DEMO_PRODUCTS, isFallback: true });
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, any> = {};
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const {
      name,
      categoryId,
      sku,
      price,
      discountPrice,
      showPrice = true,
      quantity = 10,
      stockStatus = "in_stock",
      shortDescription = "",
      description = "",
      images = [],
      specifications = [],
      tags = [],
      isFeatured = false,
      isPublished = true,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    if (price === undefined || price === null || isNaN(Number(price))) {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }

    // Attempt MongoDB save if configured
    try {
      await connectToDatabase();

      // Generate SKU if missing
      const generatedSku = sku?.trim()
        ? sku.trim().toUpperCase()
        : `PRD-${Date.now().toString().slice(-6)}`;

      // Generate unique slug
      let slug = body.slug?.trim()
        ? body.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")
        : name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");

      const resolvedCatId =
        typeof categoryId === "object" && categoryId !== null ? categoryId._id : categoryId;

      const businessObjectId = mongoose.Types.ObjectId.isValid(session.businessId)
        ? new mongoose.Types.ObjectId(session.businessId)
        : new mongoose.Types.ObjectId("650000000000000000000001");

      const categoryObjectId = mongoose.Types.ObjectId.isValid(resolvedCatId)
        ? new mongoose.Types.ObjectId(resolvedCatId)
        : new mongoose.Types.ObjectId("650000000000000000000014");

      const existingSlug = await Product.findOne({
        businessId: businessObjectId,
        slug,
      });
      if (existingSlug) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }

      const newProduct = await Product.create({
        businessId: businessObjectId,
        categoryId: categoryObjectId,
        name: name.trim(),
        slug,
        sku: generatedSku,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : undefined,
        showPrice: Boolean(showPrice),
        quantity: Number(quantity) || 0,
        stockStatus,
        shortDescription,
        description,
        images,
        specifications,
        tags: Array.isArray(tags) ? tags : [],
        isFeatured: Boolean(isFeatured),
        isPublished: Boolean(isPublished),
      });

      const populated = await Product.findById((newProduct as { _id: unknown })._id).populate("categoryId", "name slug");

      return NextResponse.json({ success: true, product: populated }, { status: 201 });
    } catch (dbError) {
      console.warn("POST /api/products DB write failed (saving to memory store):", dbError);
      const { addDemoProduct, DEMO_CATEGORIES } = await import("@/lib/demoData");
      const targetCatId = typeof categoryId === "object" && categoryId !== null ? categoryId._id : categoryId;
      const matchedCat = DEMO_CATEGORIES.find((c) => c._id === targetCatId || c.slug === targetCatId) || DEMO_CATEGORIES[0];
      const created = addDemoProduct({
        name: name.trim(),
        categoryId: matchedCat ? { _id: matchedCat._id, name: matchedCat.name, slug: matchedCat.slug } : targetCatId,
        sku: sku?.trim() || `PRD-${Date.now().toString().slice(-6)}`,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        showPrice: body.showPrice ?? true,
        stockStatus: stockStatus || "in_stock",
        shortDescription: shortDescription || "",
        description: description || "",
        images: images && images.length > 0 ? images : [],
        specifications: specifications || [],
        tags: tags || [],
        isFeatured: Boolean(isFeatured),
        isPublished: isPublished !== false,
      });
      return NextResponse.json({ success: true, product: created, isFallback: true }, { status: 201 });
    }
  } catch (error) {
    console.error("POST /api/products fatal error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
