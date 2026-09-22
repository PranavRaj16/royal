import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Category, Product } from "@/models";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    const category = await Category.findOne({ _id: id, businessId: session.businessId });
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    return NextResponse.json({ success: true, category });
  } catch (error) {
    console.error("GET /api/categories/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    await connectToDatabase();

    if (body.slug) {
      body.slug = body.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
      const existing = await Category.findOne({
        businessId: session.businessId,
        slug: body.slug,
        _id: { $ne: id },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Category slug is already used in your store." },
          { status: 400 }
        );
      }
    }

    const updated = await Category.findOneAndUpdate(
      { _id: id, businessId: session.businessId },
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updated) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    return NextResponse.json({ success: true, category: updated });
  } catch (error) {
    console.error("PUT /api/categories/[id] error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    // Check if products are assigned to this category
    const productCount = await Product.countDocuments({
      businessId: session.businessId,
      categoryId: id,
    });

    if (productCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category. There are ${productCount} product(s) linked to it. Please reassign or delete the products first.`,
          productCount,
        },
        { status: 409 }
      );
    }

    const deleted = await Category.findOneAndDelete({
      _id: id,
      businessId: session.businessId,
    });

    if (!deleted) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/categories/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
