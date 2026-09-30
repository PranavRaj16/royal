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

    await connectToDatabase();

    const mongoose = (await import("mongoose")).default;
    const BusinessModel = mongoose.models.Business || (await import("@/models")).Business;
    const primaryBiz = await BusinessModel.findOne();
    const resolvedBizId = (session.businessId && mongoose.Types.ObjectId.isValid(session.businessId) && await BusinessModel.findById(session.businessId))
      ? new mongoose.Types.ObjectId(session.businessId)
      : (primaryBiz ? primaryBiz._id : new mongoose.Types.ObjectId("6abba6356acf3c610a779dcf"));

    let categories = await Category.find({
      $or: [
        { businessId: resolvedBizId },
        ...(primaryBiz ? [{ businessId: primaryBiz._id }] : []),
        { businessId: { $exists: false } },
      ],
    }).sort({
      displayOrder: 1,
      createdAt: -1,
    });

    const { DEMO_CATEGORIES } = await import("@/lib/demoData");

    // If MongoDB has no categories for this business, seed them from DEMO_CATEGORIES
    if (categories.length === 0 && DEMO_CATEGORIES.length > 0) {
      try {
        const seeded = await Promise.all(
          DEMO_CATEGORIES.map(async (cat) => {
            const catDoc = {
              _id: new mongoose.Types.ObjectId(cat._id),
              businessId: resolvedBizId,
              name: cat.name,
              slug: cat.slug,
              description: cat.description || "",
              image: cat.image || "",
              displayOrder: cat.displayOrder || 0,
              isActive: cat.isActive !== false,
            };
            return await Category.findOneAndUpdate(
              { _id: catDoc._id },
              { $set: catDoc },
              { upsert: true, new: true, setDefaultsOnInsert: true }
            );
          })
        );
        categories = seeded.filter(Boolean) as any;
      } catch (seedErr) {
        console.warn("Category auto-seed failed:", seedErr);
      }
    }

    if (categories.length > 0) {
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

      const categoriesWithCount = categories.map((cat) => ({
        ...(cat.toObject ? cat.toObject() : cat),
        productCount: countMap.get(cat._id.toString()) || 0,
      }));

      // Deduplicate by slug or normalized name
      const seen = new Set<string>();
      const uniqueCategories = categoriesWithCount.filter((cat) => {
        const key = (cat.slug || cat.name || "").toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return NextResponse.json({ success: true, categories: uniqueCategories });
    }

    return NextResponse.json({ success: true, categories: DEMO_CATEGORIES, isFallback: true });
  } catch (error) {
    console.error("GET /api/categories error (serving fallback):", error);
    const { DEMO_CATEGORIES } = await import("@/lib/demoData");
    return NextResponse.json({ success: true, categories: DEMO_CATEGORIES, isFallback: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, image, displayOrder, isActive } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    await connectToDatabase();

    let slug = body.slug?.trim()
      ? body.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")
      : name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");

    // Check slug uniqueness within business
    const existing = await Category.findOne({ businessId: session.businessId, slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const newCategory = await Category.create({
      businessId: session.businessId,
      name: name.trim(),
      slug,
      description: description || "",
      image: image || "",
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return NextResponse.json({ success: true, category: newCategory }, { status: 201 });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
