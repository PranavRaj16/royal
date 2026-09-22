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

    await connectToDatabase();
    const business = await Business.findById(session.businessId);

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
