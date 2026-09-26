import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { Admin, Business } from "@/models";
import { verifyPassword, createSessionToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const isDefaultAdmin =
      normalizedEmail === "admin@royaljewellers.com" && password === "RoyalAdmin@2026";

    let adminDoc: {
      _id: string;
      name: string;
      email: string;
      role: string;
      businessId: string;
    } | null = null;
    let businessName = "Royal Jewellers";
    let businessSlug = "royal-jewellers";

    try {
      await connectToDatabase();
      const admin = await Admin.findOne({ email: normalizedEmail });

      if (admin) {
        const isMatch = await verifyPassword(password, admin.password);
        if (isMatch) {
          adminDoc = {
            _id: admin._id.toString(),
            name: admin.name,
            email: admin.email,
            role: admin.role,
            businessId: admin.businessId.toString(),
          };
          const business = await Business.findById(admin.businessId);
          if (business) {
            businessName = business.name;
            businessSlug = business.slug;
          }
        } else if (!isDefaultAdmin) {
          return NextResponse.json(
            { error: "Invalid email or password." },
            { status: 401 }
          );
        }
      } else if (!isDefaultAdmin) {
        return NextResponse.json(
          { error: "Invalid email or password." },
          { status: 401 }
        );
      }
    } catch (dbErr) {
      console.warn("Database not reachable during login, checking default credentials:", dbErr);
      if (!isDefaultAdmin) {
        return NextResponse.json(
          { error: "Database unavailable. Please use the demo credentials to log in." },
          { status: 503 }
        );
      }
    }

    // If default admin and no adminDoc retrieved from DB yet, use standard fallback admin
    if (!adminDoc && isDefaultAdmin) {
      adminDoc = {
        _id: "650000000000000000000001",
        name: "Royal Concierge",
        email: "admin@royaljewellers.com",
        role: "admin",
        businessId: "650000000000000000000002",
      };
    }

    if (!adminDoc) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await createSessionToken({
      adminId: adminDoc._id,
      email: adminDoc.email,
      name: adminDoc.name,
      businessId: adminDoc.businessId,
      role: adminDoc.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: adminDoc._id,
        name: adminDoc.name,
        email: adminDoc.email,
        role: adminDoc.role,
        businessId: adminDoc.businessId,
        businessName,
        businessSlug,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
