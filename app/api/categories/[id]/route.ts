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

    try {
      await connectToDatabase();
      const mongoose = (await import("mongoose")).default;
      const category = mongoose.Types.ObjectId.isValid(id) ? await Category.findById(id) : null;
      if (category) return NextResponse.json({ success: true, category });
    } catch {}

    const { DEMO_CATEGORIES } = await import("@/lib/demoData");
    const found = DEMO_CATEGORIES.find((c) => c._id === id || c.slug === id);
    if (!found) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    return NextResponse.json({ success: true, category: found });
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

    try {
      await connectToDatabase();
      const mongoose = (await import("mongoose")).default;
      const BusinessModel = mongoose.models.Business || (await import("@/models")).Business;
      const primaryBiz = await BusinessModel.findOne();
      const resolvedBizId = (session.businessId && mongoose.Types.ObjectId.isValid(session.businessId) && await BusinessModel.findById(session.businessId))
        ? new mongoose.Types.ObjectId(session.businessId)
        : (primaryBiz ? primaryBiz._id : new mongoose.Types.ObjectId("6abba6356acf3c610a779dcf"));

      if (body.slug) {
        body.slug = body.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
        const existing = await Category.findOne({
          $or: [
            { businessId: resolvedBizId, slug: body.slug, _id: { $ne: id } },
            ...(primaryBiz ? [{ businessId: primaryBiz._id, slug: body.slug, _id: { $ne: id } }] : []),
          ],
        });
        if (existing) {
          return NextResponse.json(
            { error: "Category slug is already used in your store." },
            { status: 400 }
          );
        }
      }

      const isObjectId = mongoose.Types.ObjectId.isValid(id);
      const existingDoc = isObjectId
        ? await Category.findById(id)
        : await Category.findOne({ $or: [{ slug: id }, { name: id }] });

      if (body.displayOrder !== undefined) {
        const desiredOrder = Math.max(1, Math.floor(Number(body.displayOrder) || 1));
        const { handleCategoryDisplayOrder } = await import("@/lib/categoryOrder");
        await handleCategoryDisplayOrder({
          categoryId: existingDoc?._id ? String(existingDoc._id) : id,
          targetOrder: desiredOrder,
          businessId: resolvedBizId,
        });
        body.displayOrder = desiredOrder;
      }

      let updated = null;
      if (isObjectId) {
        updated = await Category.findByIdAndUpdate(
          id,
          { $set: body },
          { new: true, runValidators: true }
        );
      } else if (existingDoc?._id) {
        updated = await Category.findByIdAndUpdate(
          existingDoc._id,
          { $set: body },
          { new: true, runValidators: true }
        );
      }

      // Also update in memory store
      const { updateDemoCategory } = await import("@/lib/demoData");
      const localUpdated = updateDemoCategory(id, body);

      if (!updated && !localUpdated) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, category: updated || localUpdated });
    } catch (dbError) {
      console.warn("PUT /api/categories/[id] DB error (fallback to memory store):", dbError);
      const { updateDemoCategory } = await import("@/lib/demoData");
      const localUpdated = updateDemoCategory(id, body);
      if (!localUpdated) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, category: localUpdated });
    }
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
    const rawId = String(id || "").trim();
    let decodedId = rawId;
    try {
      decodedId = decodeURIComponent(rawId).trim();
    } catch {}

    const { deleteDemoCategory } = await import("@/lib/demoData");
    const { normalizeCategoryDisplayOrders } = await import("@/lib/categoryOrder");

    try {
      await connectToDatabase();
      const mongoose = (await import("mongoose")).default;

      const isObjectId = mongoose.Types.ObjectId.isValid(decodedId) || mongoose.Types.ObjectId.isValid(rawId);
      const orConditions: any[] = [
        { slug: rawId },
        { slug: decodedId },
        { slug: decodedId.toLowerCase() },
        { name: rawId },
        { name: decodedId },
        { name: new RegExp(`^${decodedId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      ];

      if (mongoose.Types.ObjectId.isValid(decodedId)) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(decodedId) });
      }
      if (mongoose.Types.ObjectId.isValid(rawId) && rawId !== decodedId) {
        orConditions.push({ _id: new mongoose.Types.ObjectId(rawId) });
      }

      const query = { $or: orConditions };

      const targetCat = await Category.findOne(query);
      const bizId = targetCat?.businessId || (session.businessId && mongoose.Types.ObjectId.isValid(session.businessId) ? new mongoose.Types.ObjectId(session.businessId) : undefined);

      if (targetCat) {
        // Uncategorize linked products — wrap in its own try/catch so a cast error
        // (categoryId is ObjectId in schema) cannot abort the category deletion
        try {
          await Product.updateMany(
            { categoryId: targetCat._id },
            { $unset: { categoryId: 1 } }
          );
        } catch (productErr) {
          console.warn("Product.updateMany during category delete (non-fatal):", productErr);
        }
        await Category.findByIdAndDelete(targetCat._id);
      }

      await Category.deleteMany(query);

      // Delete from demo / persistent local storage
      deleteDemoCategory(rawId);
      deleteDemoCategory(decodedId);
      if (targetCat?._id) deleteDemoCategory(String(targetCat._id));
      if (targetCat?.slug) deleteDemoCategory(targetCat.slug);
      if (targetCat?.name) deleteDemoCategory(targetCat.name);

      // Re-normalize all remaining categories so they shift and occupy continuous 1..N order
      await normalizeCategoryDisplayOrders(bizId);

      return NextResponse.json(
        { success: true, message: "Category deleted and remaining categories shifted successfully" },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        }
      );
    } catch (dbError) {
      console.warn("DELETE /api/categories/[id] DB error (fallback to memory store):", dbError);
      deleteDemoCategory(rawId);
      deleteDemoCategory(decodedId);
      await normalizeCategoryDisplayOrders();
      return NextResponse.json({ success: true, message: "Category deleted successfully" });
    }
  } catch (error) {
    console.error("DELETE /api/categories/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
