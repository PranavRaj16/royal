import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ItemRequest } from "@/models/ItemRequest";
import mongoose from "mongoose";

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
      if (session.businessId && mongoose.Types.ObjectId.isValid(session.businessId)) {
        query.businessId = new mongoose.Types.ObjectId(session.businessId);
      }

      if (status && status !== "all") {
        query.status = status;
      }

      const [requests, total] = await Promise.all([
        ItemRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        ItemRequest.countDocuments(query),
      ]);

      return NextResponse.json({ success: true, requests, total });
    } catch (dbErr) {
      console.warn("GET /api/admin/requests DB error, serving demo fallback:", dbErr);
      const { DEMO_REQUESTS } = await import("@/lib/demoData");
      let list = [...DEMO_REQUESTS];
      if (status && status !== "all") {
        list = list.filter((r) => r.status === status);
      }
      return NextResponse.json({
        success: true,
        requests: list.slice(skip, skip + limit),
        total: list.length,
        isFallback: true,
      });
    }
  } catch (err) {
    console.error("GET /api/admin/requests error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
