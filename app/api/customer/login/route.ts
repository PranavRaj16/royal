import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ItemRequest } from "@/models/ItemRequest";
import { SignJWT } from "jose";

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  "royal_jewellers_super_secret_jwt_key_2026_catalogue_platform";
const SECRET_KEY = new TextEncoder().encode(AUTH_SECRET);
export const CUSTOMER_COOKIE = "royal_customer_session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }
    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 }
      );
    }

    const cleanName = name.trim();
    const cleanPhone = phone.trim().replace(/[\s\-()]/g, "");

    // Verify customer has at least one request in the system (optional: allow new users too)
    let hasOrders = false;
    try {
      await connectToDatabase();
      const requestCount = await ItemRequest.countDocuments({
        visitorPhone: { $regex: cleanPhone.replace(/^\+91/, ""), $options: "i" },
      });
      hasOrders = requestCount > 0;
    } catch {
      // If DB is down, allow login anyway — orders page will show empty
      console.warn("DB unavailable during customer login");
    }

    // Create a JWT session token for this customer
    const token = await new SignJWT({
      name: cleanName,
      phone: cleanPhone,
      role: "customer",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(SECRET_KEY);

    const response = NextResponse.json({
      success: true,
      customer: {
        name: cleanName,
        phone: cleanPhone,
        hasOrders,
      },
    });

    response.cookies.set({
      name: CUSTOMER_COOKIE,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Customer login error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
