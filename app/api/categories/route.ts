import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Category, Product } from "@/models";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { getDemoCategories } = await import("@/lib/demoData");
    const demoCategories = getDemoCategories();

    try {
      await connectToDatabase();

      const mongoose = (await import("mongoose")).default;
      const BusinessModel = mongoose.models.Business || (await import("@/models")).Business;
      const primaryBiz = await BusinessModel.findOne();
      const resolvedBizId = (session.businessId && mongoose.Types.ObjectId.isValid(session.businessId) && await BusinessModel.findById(session.businessId))
        ? new mongoose.Types.ObjectId(session.businessId)
        : (primaryBiz ? primaryBiz._id : new mongoose.Types.ObjectId("6abba6356acf3c610a779dcf"));

      const { normalizeCategoryDisplayOrders } = await import("@/lib/categoryOrder");
      await normalizeCategoryDisplayOrders(resolvedBizId);

      const dbCategories = await Category.find({
        $or: [
          { businessId: resolvedBizId },
          ...(primaryBiz ? [{ businessId: primaryBiz._id }] : []),
        ],
      }).sort({
        displayOrder: 1,
        name: 1,
        createdAt: 1,
      });

      // Compute product counts for each category
      const productCounts = await Product.aggregate([
        {
          $match: {
            $or: [
              { businessId: resolvedBizId },
              ...(primaryBiz ? [{ businessId: primaryBiz._id }] : []),
              { businessId: { $exists: false } },
            ],
          },
        },
        { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      ]);

      const countMap = new Map(productCounts.map((p) => [p._id ? p._id.toString() : "", p.count]));

      const list = dbCategories.map((cat) => {
        const catObj = cat.toObject ? cat.toObject() : cat;
        return {
          ...catObj,
          _id: String(catObj._id),
          productCount: countMap.get(String(catObj._id)) || 0,
        };
      });

      return NextResponse.json({ success: true, categories: list });
    } catch (dbError) {
      console.warn("GET /api/categories DB error (serving demo store):", dbError);
      return NextResponse.json({ success: true, categories: demoCategories, isFallback: true });
    }
  } catch (error) {
    console.error("GET /api/categories error (serving fallback):", error);
    const { getDemoCategories } = await import("@/lib/demoData");
    return NextResponse.json({ success: true, categories: getDemoCategories(), isFallback: true });
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, any> = {};
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const { name, description, image, displayOrder, isActive } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    let slug = body.slug?.trim()
      ? body.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")
      : name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");

    try {
      await connectToDatabase();
      const mongoose = (await import("mongoose")).default;
      const BusinessModel = mongoose.models.Business || (await import("@/models")).Business;
      const primaryBiz = await BusinessModel.findOne();
      const resolvedBizId = (session.businessId && mongoose.Types.ObjectId.isValid(session.businessId) && await BusinessModel.findById(session.businessId))
        ? new mongoose.Types.ObjectId(session.businessId)
        : (primaryBiz ? primaryBiz._id : new mongoose.Types.ObjectId("6abba6356acf3c610a779dcf"));

      // Check slug uniqueness within business
      const existing = await Category.findOne({
        $or: [
          { businessId: resolvedBizId, slug },
          ...(primaryBiz ? [{ businessId: primaryBiz._id, slug }] : []),
        ],
      });
      if (existing) {
        slug = `${slug}-${Date.now().toString().slice(-4)}`;
      }

      const desiredOrder = displayOrder !== undefined ? Math.max(1, Math.floor(Number(displayOrder) || 1)) : 1;
      const { handleCategoryDisplayOrder } = await import("@/lib/categoryOrder");
      await handleCategoryDisplayOrder({
        categoryId: null,
        targetOrder: desiredOrder,
        businessId: resolvedBizId,
      });

      const newCategory = await Category.create({
        businessId: resolvedBizId,
        name: name.trim(),
        slug,
        description: description || "",
        image: image || "",
        displayOrder: desiredOrder,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      });

      // Also ensure it is present in memory / local store for instant sync
      try {
        const { addDemoCategory } = await import("@/lib/demoData");
        addDemoCategory({
          _id: String(newCategory._id),
          name: newCategory.name,
          slug: newCategory.slug,
          description: newCategory.description,
          image: newCategory.image,
          displayOrder: newCategory.displayOrder,
          isActive: newCategory.isActive,
        });
      } catch {}

      return NextResponse.json({ success: true, category: newCategory }, { status: 201 });
    } catch (dbErr) {
      console.warn("POST /api/categories DB error (falling back to memory store):", dbErr);
      const { addDemoCategory } = await import("@/lib/demoData");
      const fallbackCat = addDemoCategory({
        name: name.trim(),
        slug,
        description: description || "",
        image: image || "",
        displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      });
      return NextResponse.json({ success: true, category: fallbackCat }, { status: 201 });
    }
  } catch (error) {
    console.error("POST /api/categories fatal error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
