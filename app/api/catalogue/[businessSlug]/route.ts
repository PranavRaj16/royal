import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Business, Category, Product } from "@/models";

interface RouteParams {
  params: Promise<{ businessSlug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { businessSlug } = await params;
    await connectToDatabase();

    const business = await Business.findOne({ slug: businessSlug.toLowerCase() });
    if (!business) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    // Check if preview mode is requested
    const isPreview = request.nextUrl.searchParams.get("preview") === "true";

    // Active categories
    const categories = await Category.find({
      businessId: business._id,
      isActive: true,
    }).sort({ displayOrder: 1 });

    // Featured products
    const productQuery: Record<string, unknown> = {
      businessId: business._id,
      isFeatured: true,
    };
    if (!isPreview) {
      productQuery.isPublished = true;
    }

    const featuredProducts = await Product.find(productQuery)
      .populate("categoryId", "name slug")
      .limit(8)
      .sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      business,
      categories,
      featuredProducts,
      isPreview,
    });
  } catch (error) {
    console.error("GET /api/catalogue/[businessSlug] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
