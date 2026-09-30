import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_SECRET =
  process.env.AUTH_SECRET ||
  "royal_jewellers_super_secret_jwt_key_2026_catalogue_platform";
const SECRET_KEY = new TextEncoder().encode(AUTH_SECRET);
export const CUSTOMER_COOKIE = "royal_customer_session";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(CUSTOMER_COOKIE)?.value;
    if (!token) {
      return NextResponse.json({ customer: null }, { status: 200 });
    }

    const { payload } = await jwtVerify(token, SECRET_KEY);
    const { name, phone, role } = payload as {
      name: string;
      phone: string;
      role: string;
    };

    if (role !== "customer") {
      return NextResponse.json({ customer: null }, { status: 200 });
    }

    return NextResponse.json({
      customer: { name, phone },
    });
  } catch {
    return NextResponse.json({ customer: null }, { status: 200 });
  }
}
