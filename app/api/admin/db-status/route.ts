import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose";

export async function GET() {
  try {
    const conn = await connectToDatabase();
    const isConnected = conn.connection.readyState === 1;
    const dbName = conn.connection.name || "royal_catalogue";
    const host = conn.connection.host || "MongoDB Atlas";

    return NextResponse.json({
      connected: isConnected,
      status: "connected",
      database: dbName,
      host,
      message: `Successfully connected to MongoDB Atlas database "${dbName}"`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      connected: false,
      status: "disconnected",
      error: message,
      mode: "local_disk_persistence",
      message: "MongoDB Atlas unreachable (using local persistent disk database). Check IP whitelist in MongoDB Atlas.",
    });
  }
}
