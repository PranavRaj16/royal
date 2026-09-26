import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ItemRequest } from "@/models/ItemRequest";
import mongoose from "mongoose";

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

    const validStatuses = ["pending", "contacted", "fulfilled", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Not a Mongo ObjectId");
      }
      await connectToDatabase();

      const query: Record<string, unknown> = { _id: id };
      if (session.businessId && mongoose.Types.ObjectId.isValid(session.businessId)) {
        query.businessId = new mongoose.Types.ObjectId(session.businessId);
      }

      const updated = await ItemRequest.findOneAndUpdate(
        query,
        { status },
        { new: true }
      );

      if (!updated) {
        throw new Error("Not found in Mongo");
      }

      return NextResponse.json({ success: true, request: updated });
    } catch {
      const { updateDemoRequest } = await import("@/lib/demoData");
      const updatedDemo = updateDemoRequest(id, { status: status as "pending" | "contacted" | "fulfilled" | "cancelled" });
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
      if (session.businessId && mongoose.Types.ObjectId.isValid(session.businessId)) {
        query.businessId = new mongoose.Types.ObjectId(session.businessId);
      }

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
