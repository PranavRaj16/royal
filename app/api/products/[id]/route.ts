import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models";

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
      const product = await Product.findOne({
        _id: id,
        businessId: session.businessId,
      }).populate("categoryId", "name slug");

      if (product) {
        return NextResponse.json({ success: true, product });
      }
    } catch {
      // Fall through to memory store
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

    if (body.categoryId) {
      body.categoryId =
        typeof body.categoryId === "object" && body.categoryId !== null
          ? body.categoryId._id
          : body.categoryId;
    }

    try {
      await connectToDatabase();

      if (body.slug) {
        const existing = await Product.findOne({
          businessId: session.businessId,
          slug: body.slug,
          _id: { $ne: id },
        });
        if (existing) {
          return NextResponse.json(
            { error: "Product slug is already in use by another product." },
            { status: 400 }
          );
        }
      }

      const updated = await Product.findOneAndUpdate(
        { _id: id, businessId: session.businessId },
        { $set: body },
        { new: true, runValidators: true }
      ).populate("categoryId", "name slug");

      if (updated) {
        return NextResponse.json({ success: true, product: updated });
      }
    } catch {
      // Fall through to memory store
    }

    const { updateDemoProduct } = await import("@/lib/demoData");
    const updatedDemo = updateDemoProduct(id, body);
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
      const deleted = await Product.findOneAndDelete({
        _id: id,
        businessId: session.businessId,
      });

      if (deleted) {
        return NextResponse.json({ success: true, message: "Product deleted successfully" });
      }
    } catch {
      // Fall through to memory store
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
