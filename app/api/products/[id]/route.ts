import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models";
import mongoose from "mongoose";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
      await connectToDatabase();
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      let product = null;

      if (isObjectId) {
        product = await Product.findById(id).populate("categoryId", "name slug");
      }
      if (!product) {
        product = await Product.findOne({
          $or: [{ slug: id }, { sku: id }],
        }).populate("categoryId", "name slug");
      }

      if (product) {
        return NextResponse.json({ success: true, product });
      }
    } catch (dbErr) {
      console.warn("GET /api/products/[id] DB error:", dbErr);
    }

    const { getDemoProductById } = await import("@/lib/demoData");
    const demo = getDemoProductById(id);
    if (!demo) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ success: true, product: demo, isFallback: true });
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();

    if (body.slug) {
      body.slug = body.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    }

    if (body.price !== undefined) {
      body.price = Number(body.price);
    }
    if (body.discountPrice !== undefined) {
      body.discountPrice = body.discountPrice ? Number(body.discountPrice) : null;
    }

    let categoryIdToSet = body.categoryId;
    if (categoryIdToSet) {
      categoryIdToSet =
        typeof categoryIdToSet === "object" && categoryIdToSet !== null
          ? (categoryIdToSet._id || categoryIdToSet.slug || categoryIdToSet)
          : categoryIdToSet;
    }

    try {
      await connectToDatabase();

      const isObjectId = mongoose.Types.ObjectId.isValid(id);

      if (body.slug) {
        const existing = await Product.findOne({
          slug: body.slug,
          _id: isObjectId ? { $ne: new mongoose.Types.ObjectId(id) } : { $ne: id },
        });
        if (existing) {
          return NextResponse.json(
            { error: "Product slug is already in use by another product." },
            { status: 400 }
          );
        }
      }

      const updateData = { ...body };
      if (categoryIdToSet) {
        if (mongoose.Types.ObjectId.isValid(String(categoryIdToSet))) {
          updateData.categoryId = new mongoose.Types.ObjectId(String(categoryIdToSet));
        } else {
          const CategoryModel = mongoose.models.Category || (await import("@/models")).Category;
          const foundCat = await CategoryModel.findOne({
            $or: [{ slug: categoryIdToSet }, { name: categoryIdToSet }],
          });
          if (foundCat) {
            updateData.categoryId = foundCat._id;
          }
        }
      }

      const query = isObjectId
        ? { _id: new mongoose.Types.ObjectId(id) }
        : { $or: [{ slug: id }, { sku: id }] };

      const updated = await Product.findOneAndUpdate(
        query,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate("categoryId", "name slug");

      if (updated) {
        return NextResponse.json({ success: true, product: updated });
      }
    } catch (dbErr) {
      console.warn("PUT /api/products/[id] DB error:", dbErr);
    }

    const { updateDemoProduct, DEMO_CATEGORIES } = await import("@/lib/demoData");
    const demoUpdateData = { ...body };
    if (categoryIdToSet) {
      const targetCatStr = String(categoryIdToSet).trim();
      const matchedCat = DEMO_CATEGORIES.find(
        (c) =>
          c._id === targetCatStr ||
          c.slug === targetCatStr ||
          c.name.toLowerCase() === targetCatStr.toLowerCase()
      );
      if (matchedCat) {
        demoUpdateData.categoryId = { _id: matchedCat._id, name: matchedCat.name, slug: matchedCat.slug };
      }
    }

    const updatedDemo = updateDemoProduct(id, demoUpdateData);
    if (!updatedDemo) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    return NextResponse.json({ success: true, product: updatedDemo, isFallback: true });
  } catch (error) {
    console.error("PUT /api/products/[id] error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
      await connectToDatabase();
      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      let deleted = null;

      if (isObjectId) {
        deleted = await Product.findByIdAndDelete(id);
      }
      if (!deleted) {
        deleted = await Product.findOneAndDelete({
          $or: [{ slug: id }, { sku: id }],
        });
      }

      if (deleted) {
        return NextResponse.json({ success: true, message: "Product deleted successfully" });
      }
    } catch (dbErr) {
      console.warn("DELETE /api/products/[id] DB error:", dbErr);
    }

    const { deleteDemoProduct } = await import("@/lib/demoData");
    const success = deleteDemoProduct(id);
    if (!success) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
