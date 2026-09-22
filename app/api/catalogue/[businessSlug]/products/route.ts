import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Business, Category, Product } from "@/models";
import mongoose from "mongoose";

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

    const searchParams = request.nextUrl.searchParams;
    const isPreview = searchParams.get("preview") === "true";
    const search = searchParams.get("search")?.trim() || "";
    const categorySlug = searchParams.get("category") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const stockStatus = searchParams.get("stockStatus");
    const tag = searchParams.get("tag");
    const featured = searchParams.get("featured");
    const sort = searchParams.get("sort") || "featured";

    const query: Record<string, unknown> = {
      businessId: business._id,
    };

    if (!isPreview) {
      query.isPublished = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    if (categorySlug && categorySlug !== "all") {
      const cat = await Category.findOne({
        businessId: business._id,
        slug: categorySlug.toLowerCase(),
      });
      if (cat) {
        query.categoryId = cat._id;
      } else if (mongoose.Types.ObjectId.isValid(categorySlug)) {
        query.categoryId = new mongoose.Types.ObjectId(categorySlug);
      }
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice && !isNaN(Number(minPrice))) {
        (query.price as Record<string, number>).$gte = Number(minPrice);
      }
      if (maxPrice && !isNaN(Number(maxPrice))) {
        (query.price as Record<string, number>).$lte = Number(maxPrice);
      }
    }

    if (stockStatus && stockStatus !== "all") {
      query.stockStatus = stockStatus;
    }

    if (tag) {
      query.tags = { $in: [tag] };
    }

    if (featured === "true") {
      query.isFeatured = true;
    }

    // Sorting
    let sortObj: Record<string, 1 | -1> = { isFeatured: -1, createdAt: -1 };
    if (sort === "price-low") sortObj = { price: 1 };
    else if (sort === "price-high") sortObj = { price: -1 };
    else if (sort === "newest") sortObj = { createdAt: -1 };
    else if (sort === "oldest") sortObj = { createdAt: 1 };
    else if (sort === "name-asc") sortObj = { name: 1 };
    else if (sort === "name-desc") sortObj = { name: -1 };

    const products = await Product.find(query)
      .populate("categoryId", "name slug")
      .sort(sortObj);

    return NextResponse.json({
      success: true,
      total: products.length,
      products,
    });
  } catch (error) {
    console.error("GET /api/catalogue/[businessSlug]/products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}
