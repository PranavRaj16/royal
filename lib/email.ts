import nodemailer from "nodemailer";

export interface OrderItemDetails {
  productName: string;
  productSku?: string;
  quantity: number;
  productId?: string;
}

export interface AdminOrderNotificationPayload {
  orderId: string;
  visitorName: string;
  visitorPhone: string;
  description?: string;
  items: OrderItemDetails[];
  createdAt?: Date | string;
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "Eshmagold@gmail.com";
const ADMIN_PHONE = process.env.ADMIN_PHONE || "7981935590";

/**
 * Creates Nodemailer transporter using Gmail SMTP or custom SMTP
 */
function getTransporter() {
  const user = process.env.EMAIL_USER || process.env.GMAIL_USER || "Eshmagold@gmail.com";
  const pass = process.env.EMAIL_PASS || process.env.GMAIL_APP_PASSWORD;

  if (!pass) {
    console.warn("[Email Notification] GMAIL_APP_PASSWORD / EMAIL_PASS is not configured in environment variables.");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: user,
      pass: pass,
    },
  });
}

/**
 * Sends a rich, luxury-styled email notification to admin upon receiving a new order request
 */
export async function sendAdminOrderNotification(payload: AdminOrderNotificationPayload) {
  try {
    const transporter = getTransporter();
    const { orderId, visitorName, visitorPhone, description, items, createdAt } = payload;

    const formattedDate = createdAt
      ? new Date(createdAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })
      : new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" });

    const totalQty = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cleanPhoneDigits = visitorPhone.replace(/\D/g, "");
    const waLink = `https://wa.me/${cleanPhoneDigits.startsWith("91") ? cleanPhoneDigits : `91${cleanPhoneDigits}`}?text=${encodeURIComponent(
      `Hello ${visitorName}, thank you for your order inquiry (#${orderId}) at Dwara Collections. We are pleased to assist you!`
    )}`;

    const itemsRowsHtml = items
      .map(
        (it, idx) => `
        <tr style="border-bottom: 1px solid #f3e8d6;">
          <td style="padding: 12px 16px; font-weight: 600; color: #1f2937;">${idx + 1}. ${it.productName}</td>
          <td style="padding: 12px 16px; color: #6b7280; font-family: monospace; font-size: 13px;">${it.productSku || "—"}</td>
          <td style="padding: 12px 16px; text-align: center; font-weight: 700; color: #92400e;">${it.quantity || 1}</td>
        </tr>
      `
      )
      .join("");

    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Order Request - #${orderId}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #faf8f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #faf8f5; padding: 30px 10px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #fae8c8;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #18181b 0%, #27272a 100%); padding: 32px 24px; text-align: center; border-bottom: 3px solid #d97706;">
                  <h1 style="margin: 0; color: #fbbf24; font-size: 24px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">
                    👑 Dwara Collections
                  </h1>
                  <p style="margin: 6px 0 0 0; color: #d4d4d8; font-size: 14px; letter-spacing: 0.5px;">
                    Royal Jewellers Admin Alert
                  </p>
                  <div style="display: inline-block; margin-top: 14px; background: rgba(217, 119, 6, 0.2); border: 1px solid #d97706; padding: 6px 14px; border-radius: 20px;">
                    <span style="color: #fef3c7; font-size: 13px; font-weight: 600;">✨ New Order Request Received</span>
                  </div>
                </td>
              </tr>

              <!-- Order Summary Box -->
              <tr>
                <td style="padding: 24px 24px 12px 24px;">
                  <table width="100%" style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 16px;">
                    <tr>
                      <td>
                        <span style="font-size: 12px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">Order Reference ID</span>
                        <div style="font-size: 18px; font-weight: 800; color: #78350f; font-family: monospace; margin-top: 2px;">
                          ${orderId}
                        </div>
                      </td>
                      <td align="right" style="vertical-align: top;">
                        <span style="font-size: 12px; color: #92400e;">${formattedDate}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Customer Details -->
              <tr>
                <td style="padding: 12px 24px;">
                  <h3 style="margin: 0 0 12px 0; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; color: #4b5563; border-bottom: 2px solid #f3f4f6; padding-bottom: 6px;">
                    👤 Customer Information
                  </h3>
                  <table width="100%" style="font-size: 14px;">
                    <tr>
                      <td style="padding: 6px 0; color: #6b7280; width: 120px; font-weight: 500;">Customer Name:</td>
                      <td style="padding: 6px 0; color: #111827; font-weight: 700;">${visitorName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; color: #6b7280; font-weight: 500;">Phone Number:</td>
                      <td style="padding: 6px 0;">
                        <a href="tel:${visitorPhone}" style="color: #d97706; font-weight: 700; text-decoration: none;">
                          📞 ${visitorPhone}
                        </a>
                      </td>
                    </tr>
                    ${
                      description
                        ? `<tr>
                        <td style="padding: 6px 0; color: #6b7280; font-weight: 500; vertical-align: top;">Customer Note:</td>
                        <td style="padding: 6px 0; color: #374151; font-style: italic; background-color: #f9fafb; border-radius: 6px; padding: 8px;">
                          "${description}"
                        </td>
                      </tr>`
                        : ""
                    }
                  </table>
                </td>
              </tr>

              <!-- Items Table -->
              <tr>
                <td style="padding: 12px 24px;">
                  <h3 style="margin: 0 0 12px 0; font-size: 15px; text-transform: uppercase; letter-spacing: 0.5px; color: #4b5563; border-bottom: 2px solid #f3f4f6; padding-bottom: 6px;">
                    🛍️ Requested Items (${totalQty} total)
                  </h3>
                  <table width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #f3e8d6; border-radius: 8px; overflow: hidden; font-size: 14px; text-align: left;">
                    <thead>
                      <tr style="background-color: #fef3c7; color: #92400e;">
                        <th style="padding: 10px 16px; font-size: 12px; text-transform: uppercase;">Product</th>
                        <th style="padding: 10px 16px; font-size: 12px; text-transform: uppercase;">SKU</th>
                        <th style="padding: 10px 16px; font-size: 12px; text-transform: uppercase; text-align: center;">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsRowsHtml}
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Action Buttons -->
              <tr>
                <td style="padding: 24px; text-align: center;">
                  <a href="${waLink}" style="display: inline-block; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-weight: 700; font-size: 14px; margin: 4px; box-shadow: 0 4px 10px rgba(37, 211, 102, 0.25);">
                    💬 Message on WhatsApp
                  </a>
                  <a href="tel:${cleanPhoneDigits}" style="display: inline-block; background-color: #1f2937; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-weight: 700; font-size: 14px; margin: 4px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);">
                    📞 Call Customer
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #f9fafb; padding: 20px 24px; border-top: 1px solid #f3f4f6; text-align: center; color: #6b7280; font-size: 12px;">
                  <p style="margin: 0 0 6px 0; font-weight: 600; color: #374151;">
                    Admin Notifications • Dwara Collections
                  </p>
                  <p style="margin: 0; color: #9ca3af;">
                    Recipient: <strong style="color: #4b5563;">${ADMIN_EMAIL}</strong> | Phone: <strong style="color: #4b5563;">+91 ${ADMIN_PHONE}</strong>
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `;

    const mailOptions = {
      from: `"Dwara Collections Alert" <${process.env.EMAIL_USER || process.env.GMAIL_USER || "Eshmagold@gmail.com"}>`,
      to: ADMIN_EMAIL,
      subject: `👑 New Order Request #${orderId} - from ${visitorName} (${items.length} item${items.length > 1 ? "s" : ""})`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Notification] Email sent successfully to ${ADMIN_EMAIL}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Email Notification] Failed to send email to admin:", errorMsg);
    return { success: false, error: errorMsg };
  }
}
