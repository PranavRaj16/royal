import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Business, Product, ItemRequest } from "@/models";
import mongoose from "mongoose";
import crypto from "crypto";
import { sendAdminOrderNotification } from "@/lib/email";

function extractCategoryCode(catName?: string, fallbackText?: string): string {
  const text = catName || fallbackText || "";
  const cleaned = text.replace(/[^a-zA-Z\s]/g, " ").trim();
  if (!cleaned) return "GN";

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  } else if (words.length === 1) {
    const w = words[0].toUpperCase();
    if (w.startsWith("EARRING")) return "ER";
    if (w.startsWith("RING")) return "RG";
    if (w.startsWith("NECKLACE")) return "NC";
    if (w.startsWith("CHAIN")) return "CH";
    if (w.startsWith("BANGLE")) return "BG";
    if (w.startsWith("BRACELET")) return "BR";
    if (w.startsWith("PENDANT")) return "PD";
    if (w.startsWith("MANGALSUTRA")) return "MS";
    if (w.startsWith("HARAM") || w.startsWith("HAARAM")) return "HM";
    if (w.startsWith("CHOKER")) return "CK";
    return w.slice(0, 2).padEnd(2, "X").toUpperCase();
  }
  return "GN";
}

function getFormattedDate(d = new Date()): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
}

async function createNewOrderId(catCode: string): Promise<string> {
  const dateStr = getFormattedDate();
  const prefix = `DW-${catCode}-${dateStr}`;

  try {
    const existing = await ItemRequest.find({
      orderId: { $regex: `^DW-.*-${dateStr}` },
    })
      .select("orderId")
      .lean();

    const distinct = new Set<string>();
    existing.forEach((r: any) => {
      if (r.orderId) distinct.add(r.orderId);
    });

    const seq = String(distinct.size + 1).padStart(3, "0");
    return `${prefix}${seq}`;
  } catch {
    const randSeq = Math.floor(1 + Math.random() * 9);
    return `${prefix}00${randSeq}`;
  }
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  const { productId, productName, productSku, productImage, visitorName, visitorPhone, quantity, description, items } = body;

  const cleanVisitorName = visitorName ? String(visitorName).trim() : "";
  const cleanVisitorPhone = visitorPhone ? String(visitorPhone).trim() : "";
  const cleanDescription = description ? String(description).trim() : "";

  if (!cleanVisitorName || !cleanVisitorPhone) {
    return NextResponse.json(
      { success: false, error: "Your name and phone number are required." },
      { status: 400 }
    );
  }

  // Relaxed phone validation — just must be at least 7 digits
  const digitsOnly = cleanVisitorPhone.replace(/\D/g, "");
  if (digitsOnly.length < 7) {
    return NextResponse.json(
      { success: false, error: "Please provide a valid phone number (at least 7 digits)." },
      { status: 400 }
    );
  }

  // Check if this is a multi-item batch request (Cart)
  const isBatch = Array.isArray(items) && items.length > 0;

  const reqSource = (
    body.source === "whatsapp" || body.isWhatsAppEnquiry
      ? "whatsapp"
      : (body.source as "whatsapp" | "order" | "quick-request" | "cart") || (isBatch ? "cart" : "quick-request")
  ) as "whatsapp" | "order" | "quick-request" | "cart";
  const isWhatsApp = reqSource === "whatsapp";

  if (!isBatch && !productName) {
    return NextResponse.json(
      { success: false, error: "Product name is required for single item request." },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    // Determine category code & generate Order ID (e.g. DW-PC-011026001)
    let catCode = "GN";
    if (isBatch) {
      const firstItem = (items as Array<Record<string, unknown>>)[0];
      const firstPId = firstItem?.productId;
      const firstPName = String(firstItem?.productName || "");
      if (firstPId && mongoose.Types.ObjectId.isValid(String(firstPId))) {
        try {
          const p = (await Product.findById(firstPId).populate("categoryId").lean()) as any;
          const catName = p?.categoryId?.name || p?.category?.name || "";
          catCode = extractCategoryCode(catName, firstPName);
        } catch {
          catCode = extractCategoryCode(undefined, firstPName);
        }
      } else {
        catCode = extractCategoryCode(undefined, firstPName);
      }
    } else {
      const cleanProductName = String(productName).trim();
      const validProductId =
        productId && mongoose.Types.ObjectId.isValid(String(productId)) && String(productId).length === 24
          ? new mongoose.Types.ObjectId(String(productId))
          : undefined;
      if (validProductId) {
        try {
          const p = (await Product.findById(validProductId).populate("categoryId").lean()) as any;
          const catName = p?.categoryId?.name || p?.category?.name || "";
          catCode = extractCategoryCode(catName, cleanProductName);
        } catch {
          catCode = extractCategoryCode(undefined, cleanProductName);
        }
      } else {
        catCode = extractCategoryCode(undefined, cleanProductName);
      }
    }

    const orderId = body.orderId ? String(body.orderId).trim() : await createNewOrderId(catCode);

    // Get or create default business
    let business = await Business.findOne({});
    if (!business) {
      business = await Business.create({
        name: "Dwara Collections",
        slug: "royal-jewellers",
        email: "contact@dwaracollections.com",
        phone: "+91 98765 43210",
        whatsapp: "+919876543210",
        address: {
          street: "123 Jewellery Market",
          city: "Mumbai",
          state: "Maharashtra",
          country: "India",
        },
        description: "Exquisite handcrafted gold and diamond jewellery for every memorable occasion.",
      }).catch(() => null);
    }

    if (isBatch) {
      const itemsToCreate = (items as Array<Record<string, unknown>>).map((it) => {
        const pId = it.productId && mongoose.Types.ObjectId.isValid(String(it.productId)) && String(it.productId).length === 24
          ? new mongoose.Types.ObjectId(String(it.productId))
          : undefined;
        return {
          businessId: business?._id || undefined,
          productId: pId,
          productName: String(it.productName || "Jewellery Item").trim(),
          productSku: it.productSku ? String(it.productSku).trim() : "",
          productImage: it.productImage ? String(it.productImage).trim() : (it.image ? String(it.image).trim() : ""),
          visitorName: cleanVisitorName,
          visitorPhone: cleanVisitorPhone,
          quantity: Math.max(1, Number(it.quantity) || 1),
          description: cleanDescription,
          status: "pending" as const,
          orderId,
          source: reqSource,
          isWhatsAppEnquiry: isWhatsApp,
        };
      });

      const createdList = await ItemRequest.insertMany(itemsToCreate);

      // Trigger admin email notification asynchronously
      sendAdminOrderNotification({
        orderId,
        visitorName: cleanVisitorName,
        visitorPhone: cleanVisitorPhone,
        description: cleanDescription,
        items: itemsToCreate.map((it) => ({
          productName: it.productName,
          productSku: it.productSku,
          productImage: it.productImage,
          quantity: it.quantity,
          productId: it.productId ? String(it.productId) : undefined,
        })),
        createdAt: new Date(),
      }).catch((err) => console.error("[sendAdminOrderNotification batch error]", err));

      return NextResponse.json({ success: true, count: createdList.length, orderId, requests: createdList }, { status: 201 });
    }

    // Single item request
    const cleanProductName = String(productName).trim();
    const cleanProductSku = productSku ? String(productSku).trim() : "";
    const cleanProductImage = productImage ? String(productImage).trim() : (body.image ? String(body.image).trim() : "");
    const cleanQuantity = Math.max(1, Number(quantity) || 1);

    const validProductId =
      productId && mongoose.Types.ObjectId.isValid(String(productId)) && String(productId).length === 24
        ? new mongoose.Types.ObjectId(String(productId))
        : undefined;

    const itemRequest = await ItemRequest.create({
      businessId: business?._id || undefined,
      productId: validProductId,
      productName: cleanProductName,
      productSku: cleanProductSku,
      productImage: cleanProductImage,
      visitorName: cleanVisitorName,
      visitorPhone: cleanVisitorPhone,
      quantity: cleanQuantity,
      description: cleanDescription,
      status: "pending",
      orderId,
      source: reqSource,
      isWhatsAppEnquiry: isWhatsApp,
    });

    // Trigger admin email notification asynchronously
    sendAdminOrderNotification({
      orderId,
      visitorName: cleanVisitorName,
      visitorPhone: cleanVisitorPhone,
      description: cleanDescription,
      items: [
        {
          productName: cleanProductName,
          productSku: cleanProductSku,
          quantity: cleanQuantity,
          productId: validProductId ? String(validProductId) : undefined,
        },
      ],
      createdAt: new Date(),
    }).catch((err) => console.error("[sendAdminOrderNotification single error]", err));

    return NextResponse.json({ success: true, request: itemRequest, orderId }, { status: 201 });
  } catch (dbErr) {
    console.warn("[public/requests POST] MongoDB write error, saving to demo fallback:", dbErr);
    const { createDemoRequest } = await import("@/lib/demoData");

    const dateStr = getFormattedDate();
    const fallbackCatCode = isBatch
      ? extractCategoryCode(undefined, String((items as any)[0]?.productName || ""))
      : extractCategoryCode(undefined, String(productName || ""));
    const orderId = body.orderId
      ? String(body.orderId).trim()
      : `DW-${fallbackCatCode}-${dateStr}001`;

    if (isBatch) {
      const createdFallback = (items as Array<Record<string, unknown>>).map((it) => {
        const pIdStr = it.productId ? String(it.productId) : undefined;
        const qty = Math.max(1, Number(it.quantity) || 1);
        const pImg = it.productImage ? String(it.productImage).trim() : (it.image ? String(it.image).trim() : "");
        return createDemoRequest({
          productId: pIdStr,
          productName: String(it.productName || "Jewellery Item").trim(),
          productSku: it.productSku ? String(it.productSku).trim() : "",
          productImage: pImg,
          visitorName: cleanVisitorName,
          visitorPhone: cleanVisitorPhone,
          quantity: qty,
          description: cleanDescription,
          status: "pending",
          orderId,
          source: reqSource,
          isWhatsAppEnquiry: isWhatsApp,
        });
      });

      // Trigger admin email notification asynchronously
      sendAdminOrderNotification({
        orderId,
        visitorName: cleanVisitorName,
        visitorPhone: cleanVisitorPhone,
        description: cleanDescription,
        items: (items as Array<Record<string, unknown>>).map((it) => ({
          productName: String(it.productName || "Jewellery Item").trim(),
          productSku: it.productSku ? String(it.productSku).trim() : "",
          productImage: it.productImage ? String(it.productImage).trim() : undefined,
          quantity: Math.max(1, Number(it.quantity) || 1),
          productId: it.productId ? String(it.productId) : undefined,
        })),
        createdAt: new Date(),
      }).catch((err) => console.error("[sendAdminOrderNotification fallback batch error]", err));

      return NextResponse.json({ success: true, count: createdFallback.length, orderId, requests: createdFallback, isFallback: true }, { status: 201 });
    }

    const cleanSingleQty = Math.max(1, Number(quantity) || 1);
    const cleanSingleImg = productImage ? String(productImage).trim() : (body.image ? String(body.image).trim() : "");

    const demoReq = createDemoRequest({
      productId: productId ? String(productId) : undefined,
      productName: String(productName).trim(),
      productSku: productSku ? String(productSku).trim() : "",
      productImage: cleanSingleImg,
      visitorName: cleanVisitorName,
      visitorPhone: cleanVisitorPhone,
      quantity: cleanSingleQty,
      description: cleanDescription,
      status: "pending",
      orderId,
      source: reqSource,
      isWhatsAppEnquiry: isWhatsApp,
    });

    // Trigger admin email notification asynchronously
    sendAdminOrderNotification({
      orderId,
      visitorName: cleanVisitorName,
      visitorPhone: cleanVisitorPhone,
      description: cleanDescription,
      items: [
        {
          productName: String(productName).trim(),
          productSku: productSku ? String(productSku).trim() : "",
          quantity: Math.max(1, Number(quantity) || 1),
          productId: productId ? String(productId) : undefined,
        },
      ],
      createdAt: new Date(),
    }).catch((err) => console.error("[sendAdminOrderNotification fallback single error]", err));

    return NextResponse.json({ success: true, request: demoReq, orderId, isFallback: true }, { status: 201 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const countParam = request.nextUrl.searchParams.get("count");
    if (countParam !== "true") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();
    const business = await Business.findOne({});
    const query: Record<string, unknown> = { status: "pending" };
    if (business?._id) {
      query.businessId = business._id;
    }
    const count = await ItemRequest.countDocuments(query);
    return NextResponse.json({ success: true, count });
  } catch (err) {
    console.warn("[public/requests GET] Error (serving fallback count):", err);
    const { DEMO_REQUESTS } = await import("@/lib/demoData");
    const count = DEMO_REQUESTS.filter((r) => r.status === "pending").length;
    return NextResponse.json({ success: true, count, isFallback: true });
  }
}
