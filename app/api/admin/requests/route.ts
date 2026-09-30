import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ItemRequest } from "@/models/ItemRequest";
import { Business } from "@/models";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    try {
      await connectToDatabase();

      const query: Record<string, unknown> = {};

      if (status && status !== "all") {
        query.status = status;
      }

      // If businessId filter is needed, find current business or match session business / unassigned
      const business = await Business.findOne({});
      const matchedIds: mongoose.Types.ObjectId[] = [];
      if (business?._id) matchedIds.push(business._id);
      if (session.businessId && mongoose.Types.ObjectId.isValid(session.businessId)) {
        const sId = new mongoose.Types.ObjectId(session.businessId);
        if (!matchedIds.some((id) => id.equals(sId))) {
          matchedIds.push(sId);
        }
      }

      if (matchedIds.length > 0) {
        query.$or = [
          { businessId: { $in: matchedIds } },
          { businessId: null },
          { businessId: { $exists: false } },
        ];
      }

      // Query for total matching filter and pending count
      const pendingQuery: Record<string, unknown> = { ...query, status: "pending" };

      const [rawRequests, orderGroups, pendingGroups] = await Promise.all([
        ItemRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        ItemRequest.aggregate([
          { $match: query },
          {
            $group: {
              _id: {
                $cond: [
                  { $gt: [{ $strLenCP: { $ifNull: ["$orderId", ""] } }, 0] },
                  "$orderId",
                  "$_id",
                ],
              },
            },
          },
          { $count: "totalOrders" },
        ]),
        ItemRequest.aggregate([
          { $match: pendingQuery },
          {
            $group: {
              _id: {
                $cond: [
                  { $gt: [{ $strLenCP: { $ifNull: ["$orderId", ""] } }, 0] },
                  "$orderId",
                  "$_id",
                ],
              },
            },
          },
          { $count: "totalPending" },
        ]),
      ]);

      const total = orderGroups[0]?.totalOrders || 0;
      const pendingCount = pendingGroups[0]?.totalPending || 0;

      const requests = rawRequests.map((r: any) => ({
        ...r,
        _id: String(r._id),
        orderId: r.orderId || `DW-ORD-${String(r._id).slice(-6).toUpperCase()}`,
      }));

      return NextResponse.json(
        { success: true, requests, total, pendingCount },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    } catch (dbErr) {
      console.warn("GET /api/admin/requests DB error, serving demo fallback:", dbErr);
      const { DEMO_REQUESTS } = await import("@/lib/demoData");
      let list = DEMO_REQUESTS.map((r) => ({
        ...r,
        orderId: r.orderId || `DW-ORD-${r._id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}`,
      }));

      const pendingList = list.filter((r) => r.status === "pending");
      const pendingSeen = new Set<string>();
      for (const r of pendingList) {
        pendingSeen.add(r.orderId || r._id);
      }
      const pendingCount = pendingSeen.size;

      if (status && status !== "all") {
        list = list.filter((r) => r.status === status);
      }
      const seenOrderIds = new Set<string>();
      for (const r of list) {
        seenOrderIds.add(r.orderId || r._id);
      }
      return NextResponse.json(
        {
          success: true,
          requests: list.slice(skip, skip + limit),
          total: seenOrderIds.size,
          pendingCount,
          isFallback: true,
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    }
  } catch (err) {
    console.error("GET /api/admin/requests error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get("orderId");
    const id = searchParams.get("id");

    if (!orderId && !id) {
      return NextResponse.json({ error: "Missing orderId or id parameter" }, { status: 400 });
    }

    try {
      await connectToDatabase();
      if (orderId) {
        await ItemRequest.deleteMany({ orderId });
      } else if (id && mongoose.Types.ObjectId.isValid(id)) {
        await ItemRequest.findByIdAndDelete(id);
      }
      return NextResponse.json({ success: true });
    } catch (dbErr) {
      console.warn("DELETE /api/admin/requests DB error, fallback:", dbErr);
      const { deleteDemoRequest } = await import("@/lib/demoData");
      if (id) deleteDemoRequest(id);
      return NextResponse.json({ success: true, isFallback: true });
    }
  } catch (err) {
    console.error("DELETE /api/admin/requests error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
