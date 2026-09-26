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

    const categories = await Category.find({ businessId: session.businessId }).sort({
      displayOrder: 1,
      createdAt: -1,
    });

    if (categories.length > 0) {
      // Compute product counts for each category
      const productCounts = await Product.aggregate([
        { $match: { businessId: categories[0]?.businessId } },
        { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      ]);

      const countMap = new Map(productCounts.map((p) => [p._id.toString(), p.count]));

      const categoriesWithCount = categories.map((cat) => ({
        ...cat.toObject(),
        productCount: countMap.get(cat._id.toString()) || 0,
      }));

      return NextResponse.json({ success: true, categories: categoriesWithCount });
    }

    const { DEMO_CATEGORIES } = await import("@/lib/demoData");
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
