import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Category } from "@/models";

// Public categories - no auth required
export async function GET() {
  try {
    await connectToDatabase();

    const categories = await Category.find({ isActive: true })
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    // Deduplicate by slug or normalized name
    const seen = new Set<string>();
    const uniqueCategories = categories.filter((cat) => {
      const key = (cat.slug || cat.name || "").toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return NextResponse.json({ success: true, categories: uniqueCategories });
  } catch (error) {
    console.error("GET /api/public/categories DB error (serving fallback categories):", error);
    const { DEMO_CATEGORIES } = await import("@/lib/demoData");
    return NextResponse.json({ success: true, categories: DEMO_CATEGORIES, isFallback: true });
  }
}
