import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ItemRequest } from "@/models/ItemRequest";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ["pending", "contacted", "in-progress", "fulfilled", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Not a Mongo ObjectId");
      }
      await connectToDatabase();

      const existing = await ItemRequest.findById(id);
      if (!existing) {
        throw new Error("Not found in Mongo");
      }

      // Decrement product quantity when and only when in-progress status is selected
      if (status === "in-progress" && !existing.isQuantityDeducted) {
        if (existing.productId) {
          try {
            const Product = (await import("@/models")).Product;
            const p = await Product.findById(existing.productId);
            if (p) {
              const deductQty = Math.max(1, Number(existing.quantity) || 1);
              const newQty = Math.max(0, (p.quantity ?? 10) - deductQty);
              p.quantity = newQty;
              if (newQty <= 0) {
                p.stockStatus = "out_of_stock";
              }
              await p.save();
            }
          } catch (pErr) {
            console.warn("[PATCH requests] Error decreasing product quantity:", pErr);
          }
        }
        existing.isQuantityDeducted = true;
      }

      existing.status = status;
      await existing.save();

      return NextResponse.json({ success: true, request: existing });
    } catch {
      const { updateDemoRequest } = await import("@/lib/demoData");
      const updatedDemo = updateDemoRequest(id, {
        status: status as "pending" | "contacted" | "in-progress" | "fulfilled" | "cancelled",
      });
      if (!updatedDemo) {
        return NextResponse.json({ error: "Request not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, request: updatedDemo, isFallback: true });
    }
  } catch (err) {
    console.error("PATCH /api/admin/requests/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Not a Mongo ObjectId");
      }
      await connectToDatabase();

      const query: Record<string, unknown> = { _id: id };

      await ItemRequest.findOneAndDelete(query);
      return NextResponse.json({ success: true });
    } catch {
      const { deleteDemoRequest } = await import("@/lib/demoData");
      deleteDemoRequest(id);
      return NextResponse.json({ success: true, isFallback: true });
    }
  } catch (err) {
    console.error("DELETE /api/admin/requests/[id] error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
