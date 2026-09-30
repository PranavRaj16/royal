import { NextRequest, NextResponse } from "next/server";
import { sendAdminOrderNotification } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const result = await sendAdminOrderNotification({
      orderId: `TEST-${Math.floor(100000 + Math.random() * 900000)}`,
      visitorName: "Test Customer (Admin Preview)",
      visitorPhone: "+91 7981935590",
      description: "This is a test notification to verify your email configuration.",
      items: [
        {
          productName: "Royal Kundan Antique Choker",
          productSku: "DW-KUN-001",
          quantity: 1,
        },
        {
          productName: "22K Traditional Temple Bangles",
          productSku: "DW-BAN-008",
          quantity: 2,
        },
      ],
      createdAt: new Date(),
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to send test email. Please check GMAIL_APP_PASSWORD.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully to Eshmagold@gmail.com!",
      messageId: result.messageId,
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
