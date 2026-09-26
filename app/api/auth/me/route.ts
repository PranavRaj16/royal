import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Business } from "@/models";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let business = null;
    try {
      await connectToDatabase();
      business = await Business.findById(session.businessId);
    } catch (dbErr) {
      console.warn("Database not reachable in /api/auth/me:", dbErr);
    }

    if (!business) {
      business = {
        _id: session.businessId,
        name: "Royal Jewellers",
        slug: "royal-jewellers",
        email: "concierge@royaljewellers.com",
        phone: "+91 98765 43210",
        whatsapp: "+919876543210",
        catalogueStatus: "published",
        branding: {
          primaryColor: "#B4833E",
          secondaryColor: "#141414",
          accentColor: "#D4AF37",
          theme: "luxury",
        },
      };
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.adminId,
        email: session.email,
        name: session.name,
        role: session.role,
        businessId: session.businessId,
      },
      business,
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Failed to fetch user session" }, { status: 500 });
  }
}
