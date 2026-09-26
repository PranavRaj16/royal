"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function CategoriesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/products");
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center p-6">
      <Loader2 className="w-8 h-8 animate-spin text-[#B4833E]" />
      <h2 className="font-serif text-lg font-bold text-white mt-2">
        Categories are now unified inside Products
      </h2>
      <p className="text-xs text-[var(--muted)] max-w-sm">
        Categories and collections are now managed directly as interactive folders under Products.
      </p>
      <Link
        href="/admin/products"
        className="text-xs font-bold text-[#D4AF37] hover:underline mt-2"
      >
        Go to Products & Collections →
      </Link>
    </div>
  );
}
