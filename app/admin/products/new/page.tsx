import React, { Suspense } from "react";
import ProductForm from "@/components/admin/ProductForm";
import { Loader2 } from "lucide-react";

export default function NewProductPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#B4833E]" />
        </div>
      }
    >
      <ProductForm isEditMode={false} />
    </Suspense>
  );
}
