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
    const source = searchParams.get("source") || searchParams.get("type") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const skip = (page - 1) * limit;

    try {
      await connectToDatabase();

      const andConditions: any[] = [];

      if (status && status !== "all") {
        andConditions.push({ status });
      }

      if (source === "whatsapp") {
        andConditions.push({
          $or: [
            { source: "whatsapp" },
            { isWhatsAppEnquiry: true },
          ],
        });
      } else if (source === "orders") {
        andConditions.push({
          $and: [
            { source: { $ne: "whatsapp" } },
            { isWhatsAppEnquiry: { $ne: true } },
          ],
        });
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
        andConditions.push({
          $or: [
            { businessId: { $in: matchedIds } },
            { businessId: null },
            { businessId: { $exists: false } },
          ],
        });
      }

      const query: Record<string, unknown> = andConditions.length > 0 ? { $and: andConditions } : {};

      // Query for total matching filter and pending count
      const pendingAnd = [...andConditions, { status: "pending" }];
      const pendingQuery: Record<string, unknown> = { $and: pendingAnd };

      const { Product } = await import("@/models/Product");
      const { getProductPlaceholder } = await import("@/lib/placeholderImages");

      const [rawRequests, orderGroups, pendingGroups] = await Promise.all([
        ItemRequest.find(query)
          .populate("productId", "name images price sku")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
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

      // Collect any missing product SKUs / names to lookup in batch
      const missingSkuOrNames: string[] = [];
      rawRequests.forEach((r: any) => {
        const pDoc = r.productId as any;
        const hasImg = r.productImage || (pDoc && typeof pDoc === "object" && pDoc.images?.[0]?.url);
        if (!hasImg) {
          if (r.productSku) missingSkuOrNames.push(r.productSku.toUpperCase());
          if (r.productName) missingSkuOrNames.push(r.productName.toLowerCase());
        }
      });

      let productLookupMap = new Map<string, string>();
      if (missingSkuOrNames.length > 0) {
        try {
          const matchedProds = await Product.find({
            $or: [
              { sku: { $in: missingSkuOrNames } },
              { name: { $in: missingSkuOrNames.map((n) => new RegExp(`^${n}$`, "i")) } },
            ],
          })
            .select("sku name images")
            .lean();

          matchedProds.forEach((p: any) => {
            const firstImg = p.images?.find((i: any) => i.isPrimary)?.url || p.images?.[0]?.url;
            if (firstImg) {
              if (p.sku) productLookupMap.set(p.sku.toUpperCase(), firstImg);
              if (p.name) productLookupMap.set(p.name.toLowerCase(), firstImg);
            }
          });
        } catch (lookupErr) {
          console.warn("Product lookup error:", lookupErr);
        }
      }

      const total = orderGroups[0]?.totalOrders || 0;
      const pendingCount = pendingGroups[0]?.totalPending || 0;

      const requests = rawRequests.map((r: any) => {
        const pDoc = r.productId as any;
        const pDocImg = pDoc && typeof pDoc === "object" ? (pDoc.images?.find((i: any) => i.isPrimary)?.url || pDoc.images?.[0]?.url) : "";
        const skuLookup = r.productSku ? productLookupMap.get(r.productSku.toUpperCase()) : "";
        const nameLookup = r.productName ? productLookupMap.get(r.productName.toLowerCase()) : "";
        const resolvedImage = r.productImage || pDocImg || skuLookup || nameLookup || getProductPlaceholder(undefined, r.productName);

        return {
          ...r,
          _id: String(r._id),
          productId: pDoc && typeof pDoc === "object" ? String(pDoc._id) : (r.productId ? String(r.productId) : undefined),
          productImage: resolvedImage,
          orderId: r.orderId || `DW-ORD-${String(r._id).slice(-6).toUpperCase()}`,
        };
      });

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
      const { DEMO_REQUESTS, DEMO_PRODUCTS } = await import("@/lib/demoData");
      const { getProductPlaceholder } = await import("@/lib/placeholderImages");

      let list = DEMO_REQUESTS.map((r) => {
        const matchedDemo = DEMO_PRODUCTS.find(
          (p) =>
            (r.productId && (p._id === r.productId || p.slug === r.productId)) ||
            (r.productSku && p.sku && p.sku.toUpperCase() === r.productSku.toUpperCase()) ||
            (r.productName && p.name && p.name.toLowerCase() === r.productName.toLowerCase())
        );
        const demoImg = matchedDemo?.images?.find((i) => i.isPrimary)?.url || matchedDemo?.images?.[0]?.url;
        const resolvedImg = r.productImage || demoImg || getProductPlaceholder(undefined, r.productName);

        return {
          ...r,
          productImage: resolvedImg,
          orderId: r.orderId || `DW-ORD-${r._id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}`,
        };
      });

      if (source === "whatsapp") {
        list = list.filter((r) => r.source === "whatsapp" || r.isWhatsAppEnquiry === true);
      } else if (source === "orders") {
        list = list.filter((r) => r.source !== "whatsapp" && r.isWhatsAppEnquiry !== true);
      }

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
    const idsParam = searchParams.get("ids");

    let bodyIds: string[] = [];
    try {
      const body = await request.json();
      if (Array.isArray(body.ids)) bodyIds = body.ids;
      else if (body.id) bodyIds = [body.id];
    } catch {
      // ignore empty body
    }

    const allIds = [
      ...(idsParam ? idsParam.split(",").map((s) => s.trim()) : []),
      ...(id ? [id.trim()] : []),
      ...bodyIds,
    ].filter(Boolean);

    if (!orderId && allIds.length === 0) {
      return NextResponse.json({ error: "Missing orderId or id parameter" }, { status: 400 });
    }

    try {
      await connectToDatabase();

      const orConditions: Record<string, unknown>[] = [];
      if (orderId) {
        orConditions.push({ orderId });
      }

      const validObjectIds = allIds
        .filter((i) => mongoose.Types.ObjectId.isValid(i))
        .map((i) => new mongoose.Types.ObjectId(i));

      if (validObjectIds.length > 0) {
        orConditions.push({ _id: { $in: validObjectIds } });
      }

      if (orConditions.length > 0) {
        await ItemRequest.deleteMany({ $or: orConditions });
      }

      return NextResponse.json({ success: true });
    } catch (dbErr) {
      console.warn("DELETE /api/admin/requests DB error, fallback:", dbErr);
      const { deleteDemoRequest } = await import("@/lib/demoData");
      allIds.forEach((i) => deleteDemoRequest(i));
      return NextResponse.json({ success: true, isFallback: true });
    }
  } catch (err) {
    console.error("DELETE /api/admin/requests error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
