import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models";
import mongoose from "mongoose";

// Public catalogue API - no auth required
// Returns all published products for the catalogue page
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId") || "";
    const sort = searchParams.get("sort") || "newest";
    const featured = searchParams.get("featured") || "";

    const query: Record<string, unknown> = {
      isPublished: true,
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { shortDescription: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    if (categoryId && categoryId !== "all") {
      if (mongoose.Types.ObjectId.isValid(categoryId)) {
        query.categoryId = new mongoose.Types.ObjectId(categoryId);
      } else {
        const CategoryModel = mongoose.models.Category || (await import("@/models")).Category;
        const foundCat = await CategoryModel.findOne({
          $or: [{ slug: categoryId }, { name: categoryId }],
        });
        if (foundCat) {
          query.categoryId = foundCat._id;
        }
      }
    }

    if (featured === "true") {
      query.isFeatured = true;
    }

    let sortObj: Record<string, 1 | -1> = { isFeatured: -1, createdAt: -1 };
    if (sort === "oldest") sortObj = { createdAt: 1 };
    else if (sort === "price-asc") sortObj = { price: 1 };
    else if (sort === "price-desc") sortObj = { price: -1 };
    else if (sort === "name-asc") sortObj = { name: 1 };

    const products = await Product.find(query)
      .populate("categoryId", "name slug")
      .sort(sortObj)
      .lean();

    return NextResponse.json({ success: true, products });
  } catch (error) {
    console.error("GET /api/public/products DB error (serving fallback catalogue):", error);
    
    // Graceful fallback to demo luxury catalogue so the website is never blank or broken
    const { DEMO_PRODUCTS } = await import("@/lib/demoData");
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const categoryId = searchParams.get("categoryId") || "";
    const sort = searchParams.get("sort") || "newest";

    let filtered = [...DEMO_PRODUCTS];

    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search) ||
          p.shortDescription.toLowerCase().includes(search) ||
          p.tags.some((t) => t.toLowerCase().includes(search))
      );
    }

    if (categoryId && categoryId !== "all") {
      filtered = filtered.filter((p) => {
        const cObj = typeof p.categoryId === "object" ? p.categoryId : null;
        const cId = cObj ? cObj._id : p.categoryId;
        const cSlug = cObj ? cObj.slug : null;
        return cId === categoryId || cSlug === categoryId;
      });
    }

    if (sort === "price-asc") {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sort === "name-asc") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return NextResponse.json({ success: true, products: filtered, isFallback: true });
  }
}
