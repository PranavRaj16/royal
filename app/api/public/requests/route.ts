import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ItemRequest } from "@/models/ItemRequest";
import { Business } from "@/models";
import mongoose from "mongoose";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  const { productId, productName, productSku, visitorName, visitorPhone, quantity, description, items } = body;

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

  if (!isBatch && !productName) {
    return NextResponse.json(
      { success: false, error: "Product name is required for single item request." },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

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
      const orderId = crypto.randomUUID();
      const itemsToCreate = (items as Array<Record<string, unknown>>).map((it) => {
        const pId = it.productId && mongoose.Types.ObjectId.isValid(String(it.productId)) && String(it.productId).length === 24
          ? new mongoose.Types.ObjectId(String(it.productId))
          : undefined;
        return {
          businessId: business?._id || undefined,
          productId: pId,
          productName: String(it.productName || "Jewellery Item").trim(),
          productSku: it.productSku ? String(it.productSku).trim() : "",
          visitorName: cleanVisitorName,
          visitorPhone: cleanVisitorPhone,
          quantity: Math.max(1, Number(it.quantity) || 1),
          description: cleanDescription,
          status: "pending" as const,
          orderId,
        };
      });

      const createdList = await ItemRequest.insertMany(itemsToCreate);
      return NextResponse.json({ success: true, count: createdList.length, orderId, requests: createdList }, { status: 201 });
    }

    // Single item request
    const cleanProductName = String(productName).trim();
    const cleanProductSku = productSku ? String(productSku).trim() : "";
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
      visitorName: cleanVisitorName,
      visitorPhone: cleanVisitorPhone,
      quantity: cleanQuantity,
      description: cleanDescription,
      status: "pending",
    });

    return NextResponse.json({ success: true, request: itemRequest }, { status: 201 });
  } catch (dbErr) {
    console.warn("[public/requests POST] MongoDB write error, saving to demo fallback:", dbErr);
    const { createDemoRequest } = await import("@/lib/demoData");

    if (isBatch) {
      const createdFallback = (items as Array<Record<string, unknown>>).map((it) =>
        createDemoRequest({
          productId: it.productId ? String(it.productId) : undefined,
          productName: String(it.productName || "Jewellery Item").trim(),
          productSku: it.productSku ? String(it.productSku).trim() : "",
          visitorName: cleanVisitorName,
          visitorPhone: cleanVisitorPhone,
          quantity: Math.max(1, Number(it.quantity) || 1),
          description: cleanDescription,
          status: "pending",
        })
      );
      return NextResponse.json({ success: true, count: createdFallback.length, requests: createdFallback, isFallback: true }, { status: 201 });
    }

    const demoReq = createDemoRequest({
      productId: productId ? String(productId) : undefined,
      productName: String(productName).trim(),
      productSku: productSku ? String(productSku).trim() : "",
      visitorName: cleanVisitorName,
      visitorPhone: cleanVisitorPhone,
      quantity: Math.max(1, Number(quantity) || 1),
      description: cleanDescription,
      status: "pending",
    });
    return NextResponse.json({ success: true, request: demoReq, isFallback: true }, { status: 201 });
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
