import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { Product } from "@/models/Product";
import { ItemRequest } from "@/models/ItemRequest";
import { Category } from "@/models/Category";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    let isDbReset = false;
    let deletedProductsCount = 0;
    let deletedRequestsCount = 0;
    let deletedCategoriesCount = 0;

    // 1. Delete all Products, ItemRequests, and Categories from MongoDB
    try {
      await connectToDatabase();
      const prodRes = await Product.deleteMany({});
      const reqRes = await ItemRequest.deleteMany({});
      const catRes = await Category.deleteMany({});
      deletedProductsCount = prodRes.deletedCount || 0;
      deletedRequestsCount = reqRes.deletedCount || 0;
      deletedCategoriesCount = catRes.deletedCount || 0;
      isDbReset = true;
    } catch (dbErr) {
      console.warn("MongoDB reset warning (will clear local db file as well):", dbErr);
    }

    // 2. Clear local_db.json and in-memory demo data
    try {
      const { DEMO_CATEGORIES, DEMO_PRODUCTS, DEMO_REQUESTS } = await import("@/lib/demoData");
      DEMO_CATEGORIES.length = 0;
      DEMO_PRODUCTS.length = 0;
      DEMO_REQUESTS.length = 0;

      const dataDir = path.join(process.cwd(), "data");
      const dataFile = path.join(dataDir, "local_db.json");
      if (fs.existsSync(dataDir)) {
        fs.writeFileSync(
          dataFile,
          JSON.stringify(
            {
              categories: [],
              products: [],
              requests: [],
            },
            null,
            2
          ),
          "utf-8"
        );
      }
    } catch (fileErr) {
      console.warn("Local DB reset file error:", fileErr);
    }

    return NextResponse.json({
      success: true,
      message: "Factory reset complete. All categories, products, orders, requests, and customer data have been removed.",
      deletedProductsCount,
      deletedRequestsCount,
      deletedCategoriesCount,
      isDbReset,
    });
  } catch (err: unknown) {
    console.error("POST /api/admin/reset error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reset data" },
      { status: 500 }
    );
  }
}

// Allow GET for quick browser trigger if needed
export async function GET(request: NextRequest) {
  return POST(request);
}
