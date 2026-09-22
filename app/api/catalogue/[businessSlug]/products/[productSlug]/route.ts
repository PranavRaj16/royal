import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Business, Product } from "@/models";

interface RouteParams {
  params: Promise<{ businessSlug: string; productSlug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { businessSlug, productSlug } = await params;
    const isPreview = request.nextUrl.searchParams.get("preview") === "true";

    await connectToDatabase();

    const business = await Business.findOne({ slug: businessSlug.toLowerCase() });
    if (!business) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const productQuery: Record<string, unknown> = {
      businessId: business._id,
      slug: productSlug.toLowerCase(),
    };

    if (!isPreview) {
      productQuery.isPublished = true;
    }

    const product = await Product.findOne(productQuery).populate("categoryId", "name slug");
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Related products in the same category
    const related = await Product.find({
      businessId: business._id,
      categoryId: product.categoryId._id,
      _id: { $ne: product._id },
      isPublished: true,
    })
      .limit(4)
      .populate("categoryId", "name slug");

    return NextResponse.json({
      success: true,
      business,
      product,
      relatedProducts: related,
    });
  } catch (error) {
    console.error("GET /api/catalogue/.../product error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
