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

    const BusinessModel = mongoose.models.Business || (await import("@/models")).Business;
    const primaryBiz = await BusinessModel.findOne();
    const resolvedBizId = (session.businessId && mongoose.Types.ObjectId.isValid(session.businessId) && await BusinessModel.findById(session.businessId))
      ? new mongoose.Types.ObjectId(session.businessId)
      : (primaryBiz ? primaryBiz._id : new mongoose.Types.ObjectId("6abba6356acf3c610a779dcf"));

    const query: Record<string, unknown> = {};

    if (primaryBiz) {
      query.$or = [
        { businessId: resolvedBizId },
        { businessId: primaryBiz._id },
        ...(session.businessId && mongoose.Types.ObjectId.isValid(session.businessId) ? [{ businessId: new mongoose.Types.ObjectId(session.businessId) }] : []),
        { businessId: { $exists: false } },
      ];
    }

    if (search) {
      const searchOr = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchOr }];
        delete query.$or;
      } else {
        query.$or = searchOr;
      }
    }

    if (categoryId && categoryId !== "all") {
      if (mongoose.Types.ObjectId.isValid(categoryId)) {
        query.categoryId = new mongoose.Types.ObjectId(categoryId);
      } else {
        const CategoryModel = mongoose.models.Category || (await import("@/models")).Category;
        const foundCat = await CategoryModel.findOne({
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
      const CategoryModel = mongoose.models.Category || (await import("@/models")).Category;
      const allDbCats = await CategoryModel.find({}).lean();
      const { DEMO_CATEGORIES } = await import("@/lib/demoData");
      const combinedCats = [...allDbCats, ...DEMO_CATEGORIES];

      const cleanedProducts = products.map((prod) => {
        const pObj: any = prod.toObject ? prod.toObject() : { ...prod };
        if (!pObj.categoryId && prod.categoryId) {
          const rawId = String(prod.categoryId);
          const matched = combinedCats.find(
            (c: any) => String(c._id) === rawId || String(c.slug) === rawId || String(c.name) === rawId
          );
          if (matched) {
            pObj.categoryId = {
              _id: String(matched._id),
              name: matched.name,
              slug: matched.slug,
            };
          }
        }
        return pObj;
      });

      return NextResponse.json({ success: true, products: cleanedProducts });
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
        const cName = cObj ? cObj.name : null;
        return (
          cId === categoryId ||
          cSlug === categoryId ||
          (cName && cName.toLowerCase() === categoryId.toLowerCase())
        );
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
      showQuantity = true,
      quantity = 10,
      stockStatus = "in_stock",
      location = "",
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

    // Generate SKU if missing
    const finalSku = sku?.trim()
      ? sku.trim().toUpperCase()
      : `PRD-${Date.now().toString().slice(-6)}`;

    // Attempt MongoDB save if configured
    try {
      await connectToDatabase();

      // Generate unique slug
      let slug = body.slug?.trim()
        ? body.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")
        : name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");

      const resolvedCatId =
        typeof categoryId === "object" && categoryId !== null ? (categoryId._id || categoryId.slug || categoryId.name || categoryId) : categoryId;

      const BusinessModel = mongoose.models.Business || (await import("@/models")).Business;
      const primaryBiz = await BusinessModel.findOne();
      const businessObjectId = primaryBiz
        ? primaryBiz._id
        : (mongoose.Types.ObjectId.isValid(session.businessId)
          ? new mongoose.Types.ObjectId(session.businessId)
          : new mongoose.Types.ObjectId("6abba6356acf3c610a779dcf"));

      const CategoryModel = mongoose.models.Category || (await import("@/models")).Category;
      const { DEMO_CATEGORIES } = await import("@/lib/demoData");

      let categoryObjectId: mongoose.Types.ObjectId | null = null;
      let matchedCatDoc = null;

      // 1. Try finding category in DB by ObjectId, slug, or exact name
      if (mongoose.Types.ObjectId.isValid(String(resolvedCatId))) {
        categoryObjectId = new mongoose.Types.ObjectId(String(resolvedCatId));
        matchedCatDoc = await CategoryModel.findOne({ _id: categoryObjectId });
      }

      if (!matchedCatDoc) {
        matchedCatDoc = await CategoryModel.findOne({
          $or: [
            { slug: String(resolvedCatId).toLowerCase() },
            { name: String(resolvedCatId) },
          ],
        });
        if (matchedCatDoc) {
          categoryObjectId = matchedCatDoc._id;
        }
      }

      // 2. If not in DB, check if it matches a demo category exactly
      const targetCatInfo = DEMO_CATEGORIES.find(
        (c) =>
          c._id === String(resolvedCatId) ||
          c.slug === String(resolvedCatId).toLowerCase() ||
          c.name.toLowerCase() === String(resolvedCatId).toLowerCase()
      );

      // If category document still does not exist in MongoDB, create/upsert it from targetCatInfo or create a new one
      if (!matchedCatDoc) {
        const catName = targetCatInfo?.name || String(resolvedCatId);
        const catSlug = targetCatInfo?.slug || String(resolvedCatId).toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const catIdToUse = targetCatInfo && mongoose.Types.ObjectId.isValid(targetCatInfo._id)
          ? new mongoose.Types.ObjectId(targetCatInfo._id)
          : new mongoose.Types.ObjectId();
        
        matchedCatDoc = await CategoryModel.findOneAndUpdate(
          { _id: catIdToUse },
          {
            $set: {
              _id: catIdToUse,
              businessId: businessObjectId,
              name: catName,
              slug: catSlug,
              description: targetCatInfo?.description || "",
              image: targetCatInfo?.image || "",
              displayOrder: targetCatInfo?.displayOrder || 0,
              isActive: targetCatInfo?.isActive !== false,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        categoryObjectId = matchedCatDoc._id;
      }

      const finalCatObjectId: mongoose.Types.ObjectId = categoryObjectId || matchedCatDoc._id;

      const existingSlug = await Product.findOne({
        businessId: businessObjectId,
        slug,
      });
      if (existingSlug) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }

      const newProduct = await Product.create({
        businessId: businessObjectId,
        categoryId: finalCatObjectId,
        name: name.trim(),
        slug,
        sku: finalSku,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : undefined,
        showPrice: Boolean(showPrice),
        showQuantity: Boolean(showQuantity),
        quantity: Number(quantity) || 0,
        stockStatus,
        location: typeof location === "string" ? location.trim() : "",
        shortDescription,
        description,
        images,
        specifications,
        tags: Array.isArray(tags) ? tags : [],
        isFeatured: Boolean(isFeatured),
        isPublished: Boolean(isPublished),
      });

      let populated = await Product.findById((newProduct as { _id: unknown })._id).populate("categoryId", "name slug");
      let popObj: any = populated ? (populated.toObject ? populated.toObject() : { ...populated }) : newProduct;

      if (!popObj.categoryId || typeof popObj.categoryId !== "object") {
        const fallbackName = matchedCatDoc?.name || targetCatInfo?.name || "Jewellery";
        const fallbackSlug = matchedCatDoc?.slug || targetCatInfo?.slug || "jewellery";
        popObj.categoryId = {
          _id: String(finalCatObjectId),
          name: fallbackName,
          slug: fallbackSlug,
        };
      }

      return NextResponse.json({ success: true, product: popObj }, { status: 201 });
    } catch (dbError) {
      console.warn("POST /api/products DB write failed (saving to memory store):", dbError);
      const { addDemoProduct, DEMO_CATEGORIES } = await import("@/lib/demoData");
      const targetCatId = typeof categoryId === "object" && categoryId !== null ? (categoryId._id || categoryId.slug || categoryId.name) : categoryId;
      const targetCatStr = String(targetCatId || "").trim();
      const matchedCat = DEMO_CATEGORIES.find(
        (c) =>
          c._id === targetCatStr ||
          c.slug === targetCatStr ||
          c.name.toLowerCase() === targetCatStr.toLowerCase()
      );
      const finalCatObj = matchedCat
        ? { _id: matchedCat._id, name: matchedCat.name, slug: matchedCat.slug }
        : typeof categoryId === "object" && categoryId !== null && categoryId.name
        ? categoryId
        : DEMO_CATEGORIES[0];

      const created = addDemoProduct({
        name: name.trim(),
        categoryId: finalCatObj,
        sku: finalSku,
        price: Number(price),
        discountPrice: discountPrice ? Number(discountPrice) : null,
        showPrice: body.showPrice ?? true,
        showQuantity: body.showQuantity ?? true,
        stockStatus: stockStatus || "in_stock",
        location: typeof location === "string" ? location.trim() : "",
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
