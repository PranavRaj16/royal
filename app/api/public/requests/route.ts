import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ItemRequest } from "@/models/ItemRequest";
import { Business } from "@/models";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON payload" }, { status: 400 });
  }

  const { productId, productName, productSku, visitorName, visitorPhone, quantity, description } = body;

  if (!productName || !visitorName || !visitorPhone) {
    return NextResponse.json(
      { success: false, error: "Product name, your name and phone number are required." },
      { status: 400 }
    );
  }

  // Relaxed phone validation — just must be at least 7 digits
  const digitsOnly = String(visitorPhone).replace(/\D/g, "");
  if (digitsOnly.length < 7) {
    return NextResponse.json(
      { success: false, error: "Please provide a valid phone number (at least 7 digits)." },
      { status: 400 }
    );
  }

  const cleanProductName = String(productName).trim();
  const cleanProductSku = productSku ? String(productSku).trim() : "";
  const cleanVisitorName = String(visitorName).trim();
  const cleanVisitorPhone = String(visitorPhone).trim();
  const cleanQuantity = Math.max(1, Number(quantity) || 1);
  const cleanDescription = description ? String(description).trim() : "";

  // Check if productId is a valid 24-hex ObjectId
  const validProductId =
    productId && mongoose.Types.ObjectId.isValid(String(productId)) && String(productId).length === 24
      ? new mongoose.Types.ObjectId(String(productId))
      : undefined;

  try {
    await connectToDatabase();

    // Get or create default business
    let business = await Business.findOne({});
    if (!business) {
      business = await Business.create({
        name: "Royal Jewellers",
        slug: "royal-jewellers",
        email: "contact@royaljewellers.com",
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
    const demoReq = createDemoRequest({
      productId: productId ? String(productId) : undefined,
      productName: cleanProductName,
      productSku: cleanProductSku,
      visitorName: cleanVisitorName,
      visitorPhone: cleanVisitorPhone,
      quantity: cleanQuantity,
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
