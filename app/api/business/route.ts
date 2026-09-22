import { NextRequest, NextResponse } from "next/server";
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
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, business });
  } catch (error) {
    console.error("GET /api/business error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    await connectToDatabase();

    // If slug is being updated, verify it's unique
    if (body.slug) {
      const existing = await Business.findOne({
        slug: body.slug.toLowerCase().trim(),
        _id: { $ne: session.businessId },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Business slug is already taken by another store." },
          { status: 400 }
        );
      }
      body.slug = body.slug.toLowerCase().trim();
    }

    const updatedBusiness = await Business.findByIdAndUpdate(
      session.businessId,
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updatedBusiness) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, business: updatedBusiness });
  } catch (error) {
    console.error("PUT /api/business error:", error);
    return NextResponse.json({ error: "Failed to update business profile" }, { status: 500 });
  }
}
