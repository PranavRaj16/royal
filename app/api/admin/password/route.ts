import { NextRequest, NextResponse } from "next/server";
import { getSession, verifyPassword, hashPassword } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Admin } from "@/models";

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current and new password are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const admin = await Admin.findById(session.adminId);
    if (!admin) {
      return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
    }

    const isMatch = await verifyPassword(currentPassword, admin.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    admin.password = await hashPassword(newPassword);
    await admin.save();

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Password update error:", error);
    return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
  }
}
