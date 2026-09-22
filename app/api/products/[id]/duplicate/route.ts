import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    const original = await Product.findOne({
      _id: id,
      businessId: session.businessId,
    });

    if (!original) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const copyCount = await Product.countDocuments({
      businessId: session.businessId,
      name: new RegExp(`^${original.name} \\(Copy`, "i"),
    });

    const copySuffix = copyCount > 0 ? ` (Copy ${copyCount + 1})` : " (Copy)";
    const newName = `${original.name}${copySuffix}`;
    const newSlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;
    const newSku = `${original.sku}-CP${Date.now().toString().slice(-4)}`;

    const duplicated = await Product.create({
      businessId: original.businessId,
      categoryId: original.categoryId,
      name: newName,
      slug: newSlug,
      sku: newSku,
      shortDescription: original.shortDescription,
      description: original.description,
      price: original.price,
      discountPrice: original.discountPrice,
      showPrice: original.showPrice,
      stockStatus: original.stockStatus,
      images: original.images,
      specifications: original.specifications,
      tags: original.tags,
      isFeatured: false,
      isPublished: false, // Default duplicated products to draft
    });

    const populated = await Product.findById(duplicated._id).populate("categoryId", "name slug");

    return NextResponse.json({ success: true, product: populated }, { status: 201 });
  } catch (error) {
    console.error("Duplicate product error:", error);
    return NextResponse.json({ error: "Failed to duplicate product" }, { status: 500 });
  }
}
