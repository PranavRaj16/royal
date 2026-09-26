"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Star,
  Loader2,
  Sparkles,
  Check,
  Image as ImageIcon,
  DollarSign,
  Info,
  X,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { IProduct, ICategory, IProductImage } from "@/types";

interface ProductFormProps {
  initialProduct?: IProduct;
  isEditMode?: boolean;
}

export default function ProductForm({ initialProduct, isEditMode = false }: ProductFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCatId = searchParams?.get("categoryId") || "";

  // Core Product Information
  const [name, setName] = useState(initialProduct?.name || "");
  const [slug, setSlug] = useState(initialProduct?.slug || "");
  const [sku, setSku] = useState(initialProduct?.sku || "");

  const initialCatId =
    (typeof initialProduct?.categoryId === "object" && initialProduct?.categoryId !== null
      ? (initialProduct.categoryId as { _id?: string })?._id || ""
      : typeof initialProduct?.categoryId === "string"
      ? initialProduct.categoryId
      : "") || queryCatId;
  const [categoryId, setCategoryId] = useState(initialCatId);
  const [description, setDescription] = useState(initialProduct?.description || initialProduct?.shortDescription || "");

  // Pricing & Stock
  const [price, setPrice] = useState<number | string>(initialProduct?.price ?? "");
  const [discountPrice, setDiscountPrice] = useState<number | string>(initialProduct?.discountPrice ?? "");
  const [showPrice, setShowPrice] = useState(initialProduct?.showPrice ?? true);
  const [stockStatus, setStockStatus] = useState<"in_stock" | "out_of_stock" | "made_to_order">(
    initialProduct?.stockStatus || "in_stock"
  );
  const [quantity, setQuantity] = useState<number | string>(initialProduct?.quantity ?? 10);

  // Images
  const [images, setImages] = useState<IProductImage[]>(initialProduct?.images || []);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Promotion & Status
  const [isFeatured, setIsFeatured] = useState(initialProduct?.isFeatured || false);
  const [isPublished, setIsPublished] = useState(initialProduct?.isPublished ?? true);

  // UI States
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Validation and Feedback States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setLoadingCategories(true);
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories && data.categories.length > 0) {
          setCategories(data.categories);
          if (!categoryId) {
            const matched = queryCatId
              ? data.categories.find((c: ICategory) => c._id === queryCatId || c.slug === queryCatId)
              : null;
            setCategoryId(matched ? matched._id : data.categories[0]._id);
          }
        }
      })
      .catch((err) => console.error("Failed to load categories:", err))
      .finally(() => setLoadingCategories(false));
  }, [queryCatId, categoryId]);

  useEffect(() => {
    if (!sku) {
      const initials = name
        ? name
            .split(" ")
            .map((w: string) => w[0])
            .filter(Boolean)
            .join("")
            .toUpperCase()
            .slice(0, 3)
        : "PRD";
      setSku(`RJ-${initials || "PRD"}-${Date.now().toString().slice(-4)}`);
    }
  }, [name, sku]);

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (errorMessage) setErrorMessage(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    setErrorMessage(null);
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok && data.url) {
          setImages((prev) => [
            ...prev,
            { url: data.url, alt: files[i].name, isPrimary: prev.length === 0 && i === 0, order: prev.length + i },
          ]);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to upload image. You can also paste an image URL directly.");
    } finally {
      setUploadingImage(false);
    }
  };

  const addImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("/")) {
      setFieldErrors((prev) => ({ ...prev, imageUrl: "Please enter a valid URL starting with https://" }));
      return;
    }

    clearFieldError("imageUrl");
    setImages((prev) => [
      ...prev,
      { url: trimmed, alt: name || "Product image", isPrimary: prev.length === 0, order: prev.length },
    ]);
    setImageUrlInput("");
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((img) => img.isPrimary)) {
        next[0].isPrimary = true;
      }
      return next;
    });
  };

  const setPrimaryImage = (index: number) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, isPrimary: i === index })));
  };

  // Client-side comprehensive validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = "Product name is required.";
    } else if (name.trim().length < 2) {
      errors.name = "Product name must be at least 2 characters.";
    }

    const cleanCategoryId =
      typeof categoryId === "object" && categoryId !== null
        ? (categoryId as { _id?: string })?._id || ""
        : categoryId;

    if (!cleanCategoryId) {
      errors.categoryId = "Please select a category.";
    }

    if (price === "" || price === undefined || price === null) {
      errors.price = "Price is required.";
    } else {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice <= 0) {
        errors.price = "Price must be a valid positive number.";
      }
    }

    if (discountPrice !== "" && discountPrice !== undefined && discountPrice !== null) {
      const numDiscount = Number(discountPrice);
      const numPrice = Number(price);
      if (isNaN(numDiscount) || numDiscount <= 0) {
        errors.discountPrice = "Discount price must be a valid positive number.";
      } else if (!isNaN(numPrice) && numDiscount >= numPrice) {
        errors.discountPrice = `Discount price (₹${numDiscount.toLocaleString()}) must be less than regular price (₹${numPrice.toLocaleString()}).`;
      }
    }

    if (quantity === "" || quantity === undefined || quantity === null) {
      errors.quantity = "Quantity is required.";
    } else {
      const numQty = Number(quantity);
      if (isNaN(numQty) || numQty < 0 || !Number.isInteger(numQty)) {
        errors.quantity = "Quantity must be a non-negative whole number.";
      }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      setErrorMessage(firstError);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);

    const cleanCategoryId =
      typeof categoryId === "object" && categoryId !== null
        ? (categoryId as { _id?: string })?._id || ""
        : categoryId;

    const payload = {
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"),
      sku: sku.trim() || `RJ-${Date.now().toString().slice(-6)}`,
      categoryId: cleanCategoryId,
      shortDescription: description.trim().slice(0, 150),
      description: description.trim(),
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      showPrice,
      quantity: Number(quantity) || 0,
      stockStatus,
      images,
      specifications: initialProduct?.specifications || [],
      tags: initialProduct?.tags || [],
      isFeatured,
      isPublished,
    };

    try {
      const url = isEditMode ? `/api/products/${initialProduct?._id}` : "/api/products";
      const res = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save product.");
      }

      setSuccessMessage(isEditMode ? "Product updated successfully!" : "Product created successfully!");

      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 600);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save product. Please try again.";
      setErrorMessage(msg);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setSubmitting(false);
    }
  };

  const getInputClass = (fieldName?: string) => {
    const hasError = fieldName && fieldErrors[fieldName];
    return `w-full px-3.5 py-2.5 bg-[var(--background)] border ${
      hasError
        ? "border-red-500/80 ring-2 ring-red-500/20 focus:border-red-500"
        : "border-[var(--border)] focus:border-[#B4833E] focus:ring-2 focus:ring-[#B4833E]/20"
    } rounded-xl text-sm text-white placeholder-[#666] focus:outline-none transition`;
  };

  const labelClass = "block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
              {isEditMode ? "Edit Product" : "Add Product"}
            </h1>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Manage product images, details, category, quantity, and pricing
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="btn-ghost text-xs sm:text-sm px-4 py-2.5"
          >
            Cancel
          </Link>
          <button
            id="save-product-btn"
            type="submit"
            disabled={submitting || uploadingImage}
            className="btn-primary text-xs sm:text-sm flex items-center gap-2 px-6 py-2.5 shadow-lg disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isEditMode ? "Save Changes" : "Create Product"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Global Validation Alert Banner */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/50 text-red-200 flex items-start gap-3 shadow-xl animate-in fade-in duration-300">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm">
            <span className="font-semibold text-white block mb-0.5">Validation Error</span>
            <p className="text-red-300">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-white p-1 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Success Alert Banner */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-200 flex items-center gap-3 shadow-xl animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="flex-1 text-xs sm:text-sm font-semibold text-white">
            {successMessage} Redirecting to products catalogue...
          </div>
        </div>
      )}

      {/* 1. Image Upload Section */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#B4833E]" />
              Product Images
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Upload product photos or paste image links. Click ★ to select the primary cover image.
            </p>
          </div>
          <span className="text-xs text-[var(--muted)] font-mono">
            {images.length} {images.length === 1 ? "image" : "images"}
          </span>
        </div>

        {images.length === 0 && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>No images uploaded yet. Add an image for the best showcase.</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition group ${
                img.isPrimary ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/30" : "border-[var(--border)]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt || "Product photo"} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setPrimaryImage(idx)}
                className={`absolute top-1.5 left-1.5 p-1 rounded-lg backdrop-blur-md transition ${
                  img.isPrimary ? "bg-[#D4AF37] text-black font-bold" : "bg-black/60 text-white hover:bg-black"
                }`}
                title={img.isPrimary ? "Primary cover photo" : "Set as primary cover"}
              >
                <Star className={`w-3.5 h-3.5 ${img.isPrimary ? "fill-black" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-white hover:bg-red-600 backdrop-blur-md transition"
                title="Delete image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              {img.isPrimary && (
                <div className="absolute bottom-0 inset-x-0 bg-[#D4AF37] text-black text-[9px] font-bold uppercase tracking-wider text-center py-0.5">
                  Cover Photo
                </div>
              )}
            </div>
          ))}

          {/* Upload Button Box */}
          <label className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[#B4833E] bg-[var(--surface-2)] flex flex-col items-center justify-center cursor-pointer transition p-3 text-center group">
            {uploadingImage ? (
              <Loader2 className="w-6 h-6 text-[#B4833E] animate-spin" />
            ) : (
              <>
                <Upload className="w-6 h-6 text-[#B4833E] mb-1 group-hover:scale-110 transition" />
                <span className="text-[11px] font-semibold text-white">Upload Image</span>
                <span className="text-[9px] text-[var(--muted)] mt-0.5">PNG, JPG, WebP</span>
              </>
            )}
            <input
              id="image-upload"
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploadingImage}
              className="hidden"
            />
          </label>
        </div>

        {/* Paste URL */}
        <div className="space-y-1">
          <div className="flex gap-2">
            <input
              id="image-url-input"
              type="text"
              placeholder="Or paste direct image URL (https://...)"
              value={imageUrlInput}
              onChange={(e) => {
                setImageUrlInput(e.target.value);
                clearFieldError("imageUrl");
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImageUrl())}
              className={`${getInputClass("imageUrl")} flex-1 text-xs`}
            />
            <button
              id="add-url-btn"
              type="button"
              onClick={addImageUrl}
              className="px-4 py-2 bg-[var(--surface-2)] hover:bg-[var(--border)] text-white text-xs font-semibold rounded-xl border border-[var(--border)] hover:border-[#B4833E] transition whitespace-nowrap"
            >
              Add URL
            </button>
          </div>
          {fieldErrors.imageUrl && (
            <p className="text-[11px] text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {fieldErrors.imageUrl}
            </p>
          )}
        </div>
      </div>

      {/* 2. Product Information (Name, Category, Description) */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Info className="w-4 h-4 text-[#B4833E]" />
          Product Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Product Name *</label>
            <input
              id="product-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearFieldError("name");
                if (!isEditMode) {
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                }
              }}
              placeholder="e.g. Royal Emerald Pendant Necklace"
              className={getInputClass("name")}
            />
            {fieldErrors.name && (
              <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Category *</label>
            <select
              id="product-category"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                clearFieldError("categoryId");
              }}
              className={getInputClass("categoryId")}
              disabled={loadingCategories}
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {fieldErrors.categoryId && (
              <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.categoryId}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className={labelClass}>Product Description</label>
          <textarea
            id="product-desc"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the piece, craftsmanship, and design..."
            className={`${getInputClass()} resize-none`}
          />
        </div>
      </div>

      {/* 3. Pricing, Quantity & Stock */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#B4833E]" />
          Pricing &amp; Inventory
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>Price (₹) *</label>
            <input
              id="product-price"
              type="number"
              min="0"
              step="any"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                clearFieldError("price");
                clearFieldError("discountPrice");
              }}
              placeholder="125000"
              className={`${getInputClass("price")} font-semibold`}
            />
            {fieldErrors.price && (
              <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.price}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Discount Price (₹)</label>
            <input
              id="product-discount-price"
              type="number"
              min="0"
              step="any"
              value={discountPrice}
              onChange={(e) => {
                setDiscountPrice(e.target.value);
                clearFieldError("discountPrice");
              }}
              placeholder="Optional"
              className={getInputClass("discountPrice")}
            />
            {fieldErrors.discountPrice && (
              <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.discountPrice}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Quantity *</label>
            <input
              id="product-quantity"
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                clearFieldError("quantity");
              }}
              placeholder="10"
              className={getInputClass("quantity")}
            />
            {fieldErrors.quantity && (
              <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.quantity}
              </p>
            )}
          </div>

          <div>
            <label className={labelClass}>Stock Status</label>
            <select
              id="product-stock"
              value={stockStatus}
              onChange={(e) =>
                setStockStatus(e.target.value as "in_stock" | "out_of_stock" | "made_to_order")
              }
              className={getInputClass()}
            >
              <option value="in_stock">In Stock</option>
              <option value="made_to_order">Made to Order</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        <label className="flex items-center gap-3 pt-2 cursor-pointer">
          <input
            id="show-price-checkbox"
            type="checkbox"
            checked={showPrice}
            onChange={(e) => setShowPrice(e.target.checked)}
            className="w-4 h-4 rounded accent-[#D4AF37]"
          />
          <span className="text-xs text-white">Show price publicly in store</span>
        </label>
      </div>

      {/* 4. Visibility & Status */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#B4833E]" />
          Store Visibility
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] cursor-pointer hover:border-[#B4833E]/50 transition">
            <div>
              <span className="text-xs font-bold text-white block">Published</span>
              <span className="text-[11px] text-[var(--muted)] block">Live and visible in catalogue</span>
            </div>
            <input
              id="is-published-checkbox"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded accent-[#D4AF37]"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] cursor-pointer hover:border-[#B4833E]/50 transition">
            <div>
              <span className="text-xs font-bold text-white block">Featured Piece</span>
              <span className="text-[11px] text-[var(--muted)] block">Highlight on store home page</span>
            </div>
            <input
              id="is-featured-checkbox"
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 rounded accent-[#D4AF37]"
            />
          </label>
        </div>
      </div>
    </form>
  );
}
