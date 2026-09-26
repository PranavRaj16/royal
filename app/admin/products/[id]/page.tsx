"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { IProduct } from "@/types";
import { Loader2 } from "lucide-react";

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<IProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Product not found");
        return res.json();
      })
      .then((data) => {
        if (data.product) setProduct(data.product);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#B4833E]" />
        <span className="text-sm text-gray-500">Loading product details...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-8 text-center bg-[var(--card)] rounded-2xl border border-[var(--border)] max-w-md mx-auto my-12">
        <h2 className="text-lg font-bold text-white mb-2">Product Not Found</h2>
        <p className="text-xs text-[var(--muted)]">{error || "Unable to locate this product."}</p>
      </div>
    );
  }

  return <ProductForm isEditMode={true} initialProduct={product} />;
}
