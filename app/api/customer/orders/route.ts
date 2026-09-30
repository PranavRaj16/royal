import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { connectToDatabase } from "@/lib/mongodb";
import { ItemRequest } from "@/models/ItemRequest";
import { DEMO_REQUESTS, ensureLoaded } from "@/lib/demoData";

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  "royal_jewellers_super_secret_jwt_key_2026_catalogue_platform";
const SECRET_KEY = new TextEncoder().encode(AUTH_SECRET);
const CUSTOMER_COOKIE = "royal_customer_session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(CUSTOMER_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
    }

    let customerPhone = "";
    let customerName = "";
    try {
      const { payload } = await jwtVerify(token, SECRET_KEY);
      const { phone, name, role } = payload as { phone: string; name?: string; role: string };
      if (role !== "customer") {
        return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
      }
      customerPhone = phone || "";
      customerName = name || "";
    } catch {
      return NextResponse.json({ error: "Invalid session." }, { status: 401 });
    }

    const cleanDigits = customerPhone.replace(/\D/g, "");
    const matchDigits = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

    // Pattern that allows spaces, dashes, parentheses between digits, with optional +91 or 0 prefix
    const flexiblePattern = matchDigits.length > 0 ? matchDigits.split("").join("[\\s\\-()]*") : "";
    const phoneRegex = flexiblePattern ? new RegExp(flexiblePattern, "i") : null;

    const allOrdersMap = new Map<string, Record<string, unknown>>();

    // 1. Try fetching from MongoDB
    try {
      await connectToDatabase();

      const queryConditions: any[] = [];
      if (phoneRegex) {
        queryConditions.push({ visitorPhone: { $regex: phoneRegex } });
      }
      if (matchDigits) {
        queryConditions.push({ visitorPhone: { $regex: matchDigits, $options: "i" } });
      }
      if (customerName.trim().length > 2) {
        queryConditions.push({ visitorName: { $regex: `^${customerName.trim()}$`, $options: "i" } });
      }

      const query = queryConditions.length > 0 ? { $or: queryConditions } : {};

      const dbOrders = await ItemRequest.find(query)
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      for (const o of dbOrders) {
        const idStr = o._id ? String(o._id) : `ord-${Math.random()}`;
        allOrdersMap.set(idStr, {
          _id: idStr,
          orderId: o.orderId || `DW-ORD-${idStr.slice(-6).toUpperCase()}`,
          productName: o.productName,
          productSku: o.productSku || "",
          quantity: o.quantity || 1,
          description: o.description || "",
          status: o.status || "pending",
          createdAt: o.createdAt || new Date().toISOString(),
          updatedAt: o.updatedAt || new Date().toISOString(),
        });
      }
    } catch (dbErr) {
      console.warn("Customer orders MongoDB fetch fallback:", dbErr);
    }

    // 2. Also check DEMO_REQUESTS / local_db.json
    try {
      ensureLoaded(true);
      for (const r of DEMO_REQUESTS) {
        const rDigits = (r.visitorPhone || "").replace(/\D/g, "");
        const matchesDigits =
          matchDigits &&
          (rDigits.includes(matchDigits) ||
            matchDigits.includes(rDigits) ||
            rDigits.slice(-10) === matchDigits);

        const matchesName =
          customerName &&
          r.visitorName &&
          r.visitorName.toLowerCase().trim() === customerName.toLowerCase().trim();

        if (matchesDigits || matchesName) {
          const idStr = r._id || `demo-${Math.random()}`;
          if (!allOrdersMap.has(idStr)) {
            allOrdersMap.set(idStr, {
              _id: idStr,
              orderId: r.orderId || `DW-ORD-${idStr.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}`,
              productName: r.productName,
              productSku: r.productSku || "",
              quantity: r.quantity || 1,
              description: r.description || "",
              status: r.status || "pending",
              createdAt: r.createdAt || new Date().toISOString(),
              updatedAt: r.updatedAt || new Date().toISOString(),
            });
          }
        }
      }
    } catch (demoErr) {
      console.warn("Demo requests check error:", demoErr);
    }

    const orderList = Array.from(allOrdersMap.values()).sort((a, b) => {
      const dateA = new Date(String(a.createdAt)).getTime();
      const dateB = new Date(String(b.createdAt)).getTime();
      return dateB - dateA;
    });

    return NextResponse.json(
      {
        success: true,
        orders: orderList,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Customer orders API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders." },
      { status: 500 }
    );
  }
}
