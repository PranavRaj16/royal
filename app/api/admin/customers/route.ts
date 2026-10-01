import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ItemRequest } from "@/models/ItemRequest";
import { Business } from "@/models";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface CustomerEntry {
  _id: string;
  orderId?: string;
  productName: string;
  productSku?: string;
  productImage?: string;
  price?: number;
  totalPrice?: number;
  quantity: number;
  description?: string;
  status: string;
  createdAt: string;
  type: "order" | "request";
}

export interface CustomerSummary {
  phone: string;
  name: string;
  totalItems: number;
  totalOrders: number;
  totalSpent: number;
  firstOrderAt: string;
  lastOrderAt: string;
  statusBreakdown: Record<string, number>;
  entries: CustomerEntry[];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
      await connectToDatabase();

      const business = await Business.findOne({});
      const matchedIds: mongoose.Types.ObjectId[] = [];
      if (business?._id) matchedIds.push(business._id);
      if (session.businessId && mongoose.Types.ObjectId.isValid(session.businessId)) {
        const sId = new mongoose.Types.ObjectId(session.businessId);
        if (!matchedIds.some((id) => id.equals(sId))) matchedIds.push(sId);
      }

      const query: Record<string, unknown> =
        matchedIds.length > 0
          ? {
              $or: [
                { businessId: { $in: matchedIds } },
                { businessId: null },
                { businessId: { $exists: false } },
              ],
            }
          : {};

      const { Product } = await import("@/models/Product");
      const { getProductPlaceholder } = await import("@/lib/placeholderImages");

      // Fetch all requests with product populated
      const allRaw = await ItemRequest.find(query)
        .populate("productId", "name images sku price discountPrice")
        .sort({ createdAt: -1 })
        .lean() as any[];

      // Count how many DB records share each orderId
      const orderIdCountMap = new Map<string, number>();
      for (const r of allRaw) {
        const oid = r.orderId ? String(r.orderId).trim() : "";
        if (oid) {
          orderIdCountMap.set(oid, (orderIdCountMap.get(oid) || 0) + 1);
        }
      }

      // Batch-resolve missing images/prices by SKU/name
      const missingKeys: string[] = [];
      for (const r of allRaw) {
        const pDoc = r.productId && typeof r.productId === "object" ? r.productId : null;
        const hasImg = r.productImage || pDoc?.images?.[0]?.url;
        if (!hasImg || !pDoc?.price) {
          if (r.productSku) missingKeys.push(r.productSku.toUpperCase());
          if (r.productName) missingKeys.push(r.productName.toLowerCase());
        }
      }

      const productLookupMap = new Map<string, { image?: string; price?: number }>();
      if (missingKeys.length > 0) {
        try {
          const matchedProds = await Product.find({
            $or: [
              { sku: { $in: missingKeys } },
              { name: { $in: missingKeys.map((n) => new RegExp(`^${n}$`, "i")) } },
            ],
          })
            .select("sku name images price discountPrice")
            .lean() as any[];

          for (const p of matchedProds) {
            const firstImg =
              p.images?.find((i: any) => i.isPrimary)?.url || p.images?.[0]?.url;
            const price = Number(p.discountPrice || p.price || 0);
            const entry = { image: firstImg, price };
            if (p.sku) productLookupMap.set(p.sku.toUpperCase(), entry);
            if (p.name) productLookupMap.set(p.name.toLowerCase(), entry);
          }
        } catch {}
      }

      // Build per-customer maps
      const customerMap = new Map<string, CustomerSummary>();

      for (const r of allRaw) {
        const phone = (r.visitorPhone || "").trim();
        const name = (r.visitorName || "Unknown").trim();
        const createdAt = r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt);

        if (!customerMap.has(phone)) {
          customerMap.set(phone, {
            phone,
            name,
            totalItems: 0,
            totalOrders: 0,
            totalSpent: 0,
            firstOrderAt: createdAt,
            lastOrderAt: createdAt,
            statusBreakdown: {},
            entries: [],
          });
        }

        const customer = customerMap.get(phone)!;

        if (new Date(createdAt) > new Date(customer.lastOrderAt)) {
          customer.name = name;
          customer.lastOrderAt = createdAt;
        }
        if (new Date(createdAt) < new Date(customer.firstOrderAt)) {
          customer.firstOrderAt = createdAt;
        }

        const quantity = Number(r.quantity) || 1;
        customer.totalItems += quantity;
        customer.statusBreakdown[r.status] = (customer.statusBreakdown[r.status] || 0) + 1;

        // Resolve image & price
        const pDoc = r.productId && typeof r.productId === "object" ? r.productId : null;
        const pDocImg = pDoc
          ? pDoc.images?.find((i: any) => i.isPrimary)?.url || pDoc.images?.[0]?.url
          : "";
        const skuLookup = r.productSku ? productLookupMap.get(r.productSku.toUpperCase()) : undefined;
        const nameLookup = r.productName ? productLookupMap.get(r.productName.toLowerCase()) : undefined;
        const resolvedImage =
          r.productImage || pDocImg || skuLookup?.image || nameLookup?.image ||
          getProductPlaceholder(undefined, r.productName);

        const unitPrice = Number(pDoc?.discountPrice || pDoc?.price || skuLookup?.price || nameLookup?.price || 0);
        const totalPrice = unitPrice * quantity;

        const rawOrderId = r.orderId ? String(r.orderId).trim() : "";
        const isWhatsApp = r.source === "whatsapp" || r.isWhatsAppEnquiry === true;
        const type: "order" | "request" = isWhatsApp ? "request" : "order";

        if (type === "order") {
          customer.totalSpent += totalPrice;
        }

        customer.entries.push({
          _id: String(r._id),
          orderId: rawOrderId || undefined,
          productName: r.productName,
          productSku: r.productSku || undefined,
          productImage: resolvedImage || undefined,
          price: unitPrice || undefined,
          totalPrice: totalPrice || undefined,
          quantity,
          description: r.description || undefined,
          status: r.status,
          createdAt,
          type,
        });
      }

      // Compute totalOrders for each customer (distinct order IDs for order type)
      for (const customer of customerMap.values()) {
        const seenOrderIds = new Set<string>();
        let standaloneCount = 0;
        for (const entry of customer.entries) {
          if (entry.type === "order") {
            if (entry.orderId) {
              seenOrderIds.add(entry.orderId);
            } else {
              standaloneCount++;
            }
          }
        }
        customer.totalOrders = seenOrderIds.size + standaloneCount;
      }

      const customers = Array.from(customerMap.values()).sort(
        (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime()
      );

      return NextResponse.json(
        { success: true, customers, total: customers.length },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    } catch (dbErr) {
      console.warn("GET /api/admin/customers DB error, serving demo fallback:", dbErr);
      const { DEMO_REQUESTS, DEMO_PRODUCTS } = await import("@/lib/demoData");
      const { getProductPlaceholder } = await import("@/lib/placeholderImages");

      const customerMap = new Map<string, CustomerSummary>();

      for (const r of DEMO_REQUESTS) {
        const phone = (r.visitorPhone || "").trim();
        const name = (r.visitorName || "Unknown").trim();
        const createdAt = String(r.createdAt);

        if (!customerMap.has(phone)) {
          customerMap.set(phone, {
            phone,
            name,
            totalItems: 0,
            totalOrders: 0,
            totalSpent: 0,
            firstOrderAt: createdAt,
            lastOrderAt: createdAt,
            statusBreakdown: {},
            entries: [],
          });
        }

        const customer = customerMap.get(phone)!;
        if (new Date(createdAt) > new Date(customer.lastOrderAt)) {
          customer.name = name;
          customer.lastOrderAt = createdAt;
        }
        if (new Date(createdAt) < new Date(customer.firstOrderAt)) {
          customer.firstOrderAt = createdAt;
        }

        const quantity = Number(r.quantity) || 1;
        customer.totalItems += quantity;
        customer.statusBreakdown[r.status] = (customer.statusBreakdown[r.status] || 0) + 1;

        const matchedDemo = DEMO_PRODUCTS.find(
          (p) =>
            (r.productSku && p.sku && p.sku.toUpperCase() === r.productSku.toUpperCase()) ||
            (r.productName && p.name && p.name.toLowerCase() === r.productName.toLowerCase())
        );
        const demoImg =
          matchedDemo?.images?.find((i) => i.isPrimary)?.url || matchedDemo?.images?.[0]?.url;
        const resolvedImg =
          r.productImage || demoImg || getProductPlaceholder(undefined, r.productName);

        const unitPrice = Number(matchedDemo?.discountPrice || matchedDemo?.price || 0);
        const totalPrice = unitPrice * quantity;

        const rawOrderId = r.orderId ? String(r.orderId).trim() : "";
        const isWhatsApp = r.source === "whatsapp" || r.isWhatsAppEnquiry === true;
        const type: "order" | "request" = isWhatsApp ? "request" : "order";

        if (type === "order") {
          customer.totalSpent += totalPrice;
        }

        customer.entries.push({
          _id: String(r._id),
          orderId: rawOrderId || undefined,
          productName: r.productName,
          productSku: r.productSku || undefined,
          productImage: resolvedImg || undefined,
          price: unitPrice || undefined,
          totalPrice: totalPrice || undefined,
          quantity,
          description: r.description || undefined,
          status: r.status,
          createdAt,
          type,
        });
      }

      for (const customer of customerMap.values()) {
        const seenOrderIds = new Set<string>();
        let standaloneCount = 0;
        for (const entry of customer.entries) {
          if (entry.type === "order") {
            if (entry.orderId) {
              seenOrderIds.add(entry.orderId);
            } else {
              standaloneCount++;
            }
          }
        }
        customer.totalOrders = seenOrderIds.size + standaloneCount;
      }

      const customers = Array.from(customerMap.values()).sort(
        (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime()
      );

      return NextResponse.json(
        { success: true, customers, total: customers.length, isFallback: true },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          },
        }
      );
    }
  } catch (err) {
    console.error("GET /api/admin/customers error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
