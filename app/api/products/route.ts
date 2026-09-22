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

    const query: Record<string, unknown> = {
      businessId: new mongoose.Types.ObjectId(session.businessId),
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    if (categoryId && categoryId !== "all") {
      query.categoryId = new mongoose.Types.ObjectId(categoryId);
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

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const {
      name,
      categoryId,
      sku,
      price,
      discountPrice,
      showPrice = true,
      stockStatus = "in_stock",
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

    await connectToDatabase();

    // Generate SKU if missing
    const generatedSku = sku?.trim()
      ? sku.trim().toUpperCase()
      : `PRD-${Date.now().toString().slice(-6)}`;

    // Generate unique slug
    let slug = body.slug?.trim()
      ? body.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")
      : name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");

    const existingSlug = await Product.findOne({
      businessId: session.businessId,
      slug,
    });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const newProduct = await Product.create({
      businessId: session.businessId,
      categoryId,
      name: name.trim(),
      slug,
      sku: generatedSku,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      showPrice: Boolean(showPrice),
      stockStatus,
      shortDescription,
      description,
      images,
      specifications,
      tags: Array.isArray(tags) ? tags : [],
      isFeatured: Boolean(isFeatured),
      isPublished: Boolean(isPublished),
    });

    const populated = await Product.findById((newProduct as { _id: unknown })._id).populate("categoryId", "name slug");

    return NextResponse.json({ success: true, product: populated }, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
