import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Category } from "@/models";

// Public categories - no auth required
export async function GET() {
  const { DEMO_CATEGORIES } = await import("@/lib/demoData");
  try {
    await connectToDatabase();

    const dbCategories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    if (dbCategories && dbCategories.length > 0) {
      const list = dbCategories.map((cat: any) => ({
        ...cat,
        _id: String(cat._id),
      }));
      return NextResponse.json({ success: true, categories: list });
    }

    // Fallback only if MongoDB has no categories
    return NextResponse.json({
      success: true,
      categories: DEMO_CATEGORIES.filter((c) => c.isActive !== false),
      isFallback: true,
    });
  } catch (error) {
    console.error("GET /api/public/categories DB error (serving fallback categories):", error);
    return NextResponse.json({ success: true, categories: DEMO_CATEGORIES, isFallback: true });
  }
}
