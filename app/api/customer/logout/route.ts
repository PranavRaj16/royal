import { NextResponse } from "next/server";

const CUSTOMER_COOKIE = "royal_customer_session";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: CUSTOMER_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
