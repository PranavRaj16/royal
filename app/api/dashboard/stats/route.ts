import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Business, Category, Product } from "@/models";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const bId = new mongoose.Types.ObjectId(session.businessId);

    const [business, totalProducts, publishedProducts, draftProducts, totalCategories, recentProducts, featuredProducts] =
      await Promise.all([
        Business.findById(bId),
        Product.countDocuments({ businessId: bId }),
        Product.countDocuments({ businessId: bId, isPublished: true }),
        Product.countDocuments({ businessId: bId, isPublished: false }),
        Category.countDocuments({ businessId: bId }),
        Product.find({ businessId: bId })
          .populate("categoryId", "name")
          .sort({ createdAt: -1 })
          .limit(5),
        Product.find({ businessId: bId, isFeatured: true })
          .populate("categoryId", "name")
          .sort({ updatedAt: -1 })
          .limit(5),
      ]);

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalProducts,
        publishedProducts,
        draftProducts,
        totalCategories,
        catalogueStatus: business.catalogueStatus,
        businessName: business.name,
        businessSlug: business.slug,
        lastUpdated: business.updatedAt,
      },
      recentProducts,
      featuredProducts,
      business,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
