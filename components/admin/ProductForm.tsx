"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  RefreshCw,
  Tag,
} from "lucide-react";
import { IProduct, ICategory, IProductImage } from "@/types";

const MAX_IMAGES = 3;

interface ProductFormProps {
  initialProduct?: IProduct;
  isEditMode?: boolean;
}

// Helper to determine the category code letter(s)
function getCategoryLetter(catName?: string): string {
  if (!catName) return "P";
  const clean = catName.trim();
  const lower = clean.toLowerCase();
  if (lower.startsWith("neck")) return "N";
  if (lower.startsWith("ring")) return "R";
  if (lower.startsWith("ear")) return "E";
  if (lower.startsWith("bang") || lower.startsWith("brac")) return "B";
  if (lower.startsWith("pend")) return "P";
  if (lower.startsWith("mang")) return "M";
  if (lower.startsWith("chain")) return "C";
  if (lower.startsWith("coin")) return "CO";
  if (lower.startsWith("solit")) return "S";
  const match = clean.match(/[a-zA-Z]/);
  return match ? match[0].toUpperCase() : "P";
}

// Helper to compute the next SKU in DW-(Category letter)-01 format
function generateSkuForCategory(
  targetCatId: string,
  catList: ICategory[],
  prodList: IProduct[]
): string {
  const cat = catList.find((c) => c._id === targetCatId || c.slug === targetCatId);
  const letter = getCategoryLetter(cat?.name);
  const prefix = `DW-${letter}-`;

  let maxNum = 0;
  prodList.forEach((p) => {
    if (p.sku) {
      const upper = p.sku.toUpperCase().trim();
      if (upper.startsWith(prefix)) {
        const suffix = upper.slice(prefix.length);
        const num = parseInt(suffix, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  });

  const nextNum = maxNum + 1;
  const formattedNum = String(nextNum).padStart(2, "0");
  return `${prefix}${formattedNum}`;
}

export default function ProductForm({ initialProduct, isEditMode = false }: ProductFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryCatId = searchParams?.get("categoryId") || "";

  // Core Product Information
  const [name, setName] = useState(initialProduct?.name || "");
  const [slug, setSlug] = useState(initialProduct?.slug || "");
  const [sku, setSku] = useState(initialProduct?.sku || "");
  const [skuManuallyEdited, setSkuManuallyEdited] = useState(Boolean(initialProduct?.sku));

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

  // Images (Max 3)
  const [images, setImages] = useState<IProductImage[]>(
    (initialProduct?.images || []).slice(0, MAX_IMAGES)
  );
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Promotion & Status
  const [isFeatured, setIsFeatured] = useState(initialProduct?.isFeatured || false);
  const [isPublished, setIsPublished] = useState(initialProduct?.isPublished ?? true);

  // Data collections
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [existingProducts, setExistingProducts] = useState<IProduct[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Validation and Feedback States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch Categories and Existing Products
  useEffect(() => {
    let isMounted = true;
    setLoadingCategories(true);

    Promise.all([
      fetch("/api/categories").then((res) => res.json()),
      fetch("/api/products").then((res) => res.json()).catch(() => ({ products: [] })),
    ])
      .then(([catData, prodData]) => {
        if (!isMounted) return;
        const loadedCats: ICategory[] = catData.categories || [];
        const loadedProds: IProduct[] = prodData.products || [];
        setCategories(loadedCats);
        setExistingProducts(loadedProds);

        // Find the exact matching category
        const target = queryCatId || initialCatId || categoryId;
        const matched = loadedCats.find(
          (c) =>
            (c._id && target && String(c._id) === String(target)) ||
            (c.slug && target && c.slug.toLowerCase() === String(target).toLowerCase()) ||
            (c.name && target && c.name.toLowerCase() === String(target).toLowerCase())
        );

        const activeCatId = matched ? matched._id : (loadedCats[0]?._id || "");
        if (activeCatId) {
          setCategoryId(activeCatId);
        }

        // If creating a new product and SKU is not set or not manually edited, generate DW-(Category Letter)-01
        if (!isEditMode && (!sku || !skuManuallyEdited) && activeCatId) {
          const generated = generateSkuForCategory(activeCatId, loadedCats, loadedProds);
          setSku(generated);
        }
      })
      .catch((err) => console.error("Failed to load categories/products:", err))
      .finally(() => {
        if (isMounted) setLoadingCategories(false);
      });

    return () => {
      isMounted = false;
    };
  }, [queryCatId, initialCatId, isEditMode]);

  // Handle Category Change
  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    clearFieldError("categoryId");
    if (!isEditMode || !skuManuallyEdited) {
      const generated = generateSkuForCategory(newCatId, categories, existingProducts);
      setSku(generated);
    }
  };

  // Re-generate SKU manually
  const handleRegenerateSku = () => {
    if (!categoryId && categories.length > 0) {
      const firstCat = categories[0]._id;
      setCategoryId(firstCat);
      const generated = generateSkuForCategory(firstCat, categories, existingProducts);
      setSku(generated);
    } else if (categoryId) {
      const generated = generateSkuForCategory(categoryId, categories, existingProducts);
      setSku(generated);
    }
    setSkuManuallyEdited(false);
    clearFieldError("sku");
  };

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

  // Handle Image File Upload (Strict Max 3 Images)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) {
      setErrorMessage(`Maximum limit of ${MAX_IMAGES} images reached for this product.`);
      return;
    }

    if (files.length > remainingSlots) {
      setErrorMessage(
        `Only ${remainingSlots} more image${remainingSlots === 1 ? "" : "s"} could be added (max ${MAX_IMAGES} images limit).`
      );
    } else {
      setErrorMessage(null);
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploadingImage(true);

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const formData = new FormData();
        formData.append("file", filesToUpload[i]);
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();
        if (res.ok && data.url) {
          setImages((prev) => {
            if (prev.length >= MAX_IMAGES) return prev;
            return [
              ...prev,
              {
                url: data.url,
                alt: filesToUpload[i].name,
                isPrimary: prev.length === 0 && i === 0,
                order: prev.length + i,
              },
            ];
          });
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to upload image. You can also paste an image URL directly.");
    } finally {
      setUploadingImage(false);
      // Reset the file input value so user can upload again if slots open up
      e.target.value = "";
    }
  };

  // Add Image via URL (Strict Max 3 Images)
  const addImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;

    if (images.length >= MAX_IMAGES) {
      setFieldErrors((prev) => ({
        ...prev,
        imageUrl: `Maximum of ${MAX_IMAGES} images allowed per product.`,
      }));
      return;
    }

    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://") && !trimmed.startsWith("/")) {
      setFieldErrors((prev) => ({
        ...prev,
        imageUrl: "Please enter a valid URL starting with https://",
      }));
      return;
    }

    clearFieldError("imageUrl");
    setImages((prev) => {
      if (prev.length >= MAX_IMAGES) return prev;
      return [
        ...prev,
        { url: trimmed, alt: name || "Product image", isPrimary: prev.length === 0, order: prev.length },
      ];
    });
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

  // Client-side validation
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

    if (!sku.trim()) {
      errors.sku = "Product ID / SKU is required (e.g. DW-N-01).";
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

    const selectedCatObj = categories.find(
      (c) =>
        (c._id && categoryId && String(c._id) === String(categoryId)) ||
        (c.slug && categoryId && c.slug.toLowerCase() === String(categoryId).toLowerCase()) ||
        (c.name && categoryId && c.name.toLowerCase() === String(categoryId).toLowerCase())
    );

    const cleanCategoryId = selectedCatObj ? selectedCatObj._id : (typeof categoryId === "object" && categoryId !== null ? (categoryId as { _id?: string })?._id || "" : categoryId);

    const payload = {
      name: name.trim(),
      slug: slug.trim() || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"),
      sku: sku.trim().toUpperCase(),
      categoryId: cleanCategoryId,
      shortDescription: description.trim().slice(0, 150),
      description: description.trim(),
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      showPrice,
      quantity: Number(quantity) || 0,
      stockStatus,
      images: images.slice(0, MAX_IMAGES),
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
        if (cleanCategoryId) {
          router.push(`/admin/products?category=${cleanCategoryId}`);
        } else {
          router.push("/admin/products");
        }
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
        : "border-[var(--border)] focus:border-[#B81862] focus:ring-2 focus:ring-[#B81862]/20"
    } rounded-xl text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none transition`;
  };

  const labelClass = "block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-[var(--foreground)] tracking-tight">
              {isEditMode ? "Edit Product" : "Add Product"}
            </h1>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Manage product images (max 3), details, category, Product ID, and pricing
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
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 flex items-start gap-3 shadow-sm animate-in fade-in duration-300">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs sm:text-sm">
            <span className="font-semibold text-red-800 dark:text-white block mb-0.5">Notification</span>
            <p className="text-red-700 dark:text-red-300">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-700 dark:hover:text-white p-1 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Success Alert Banner */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 shadow-sm animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <div className="flex-1 text-xs sm:text-sm font-semibold text-emerald-800 dark:text-white">
            {successMessage} Redirecting to products catalogue...
          </div>
        </div>
      )}

      {/* 1. Image Upload Section (Strict Limit: Max 3 Images) */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#B81862]" />
              <span>Product Images</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#B81862]/10 text-[#B81862] border border-[#B81862]/20">
                Max {MAX_IMAGES} Images
              </span>
            </h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              Upload up to 3 photos for this jewellery piece. Click ★ to select the cover photo.
            </p>
          </div>
          <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg ${
            images.length >= MAX_IMAGES
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
              : "bg-[var(--surface-2)] text-[var(--muted)]"
          }`}>
            {images.length} / {MAX_IMAGES} uploaded {images.length >= MAX_IMAGES && "(Limit Reached)"}
          </span>
        </div>

        {images.length === 0 && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>No images uploaded yet. You can upload up to 3 high-resolution images.</span>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
          {images.map((img, idx) => (
            <div
              key={idx}
              className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition group ${
                img.isPrimary ? "border-[#B81862] ring-2 ring-[#B81862]/30" : "border-[var(--border)]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.alt || `Photo ${idx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setPrimaryImage(idx)}
                className={`absolute top-2 left-2 p-1.5 rounded-lg backdrop-blur-md transition cursor-pointer ${
                  img.isPrimary ? "bg-[#B81862] text-white font-bold shadow-md" : "bg-black/60 text-white hover:bg-black"
                }`}
                title={img.isPrimary ? "Primary cover photo" : "Set as cover photo"}
              >
                <Star className={`w-3.5 h-3.5 ${img.isPrimary ? "fill-white" : ""}`} />
              </button>
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-red-600 backdrop-blur-md transition cursor-pointer"
                title="Delete image"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-mono">
                {idx + 1} / {images.length}
              </div>
              {img.isPrimary && (
                <div className="absolute bottom-0 inset-x-0 bg-[#B81862] text-white text-[9px] font-bold uppercase tracking-wider text-center py-0.5">
                  Cover Photo
                </div>
              )}
            </div>
          ))}

          {/* Upload Button Box (Disabled when 3 images reached) */}
          {images.length < MAX_IMAGES ? (
            <label className="aspect-square rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[#B81862] bg-[var(--surface-2)] flex flex-col items-center justify-center cursor-pointer transition p-3 text-center group hover:bg-[#B81862]/5">
              {uploadingImage ? (
                <Loader2 className="w-6 h-6 text-[#B81862] animate-spin" />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-[#B81862] mb-1 group-hover:scale-110 transition" />
                  <span className="text-[11px] font-semibold text-[var(--foreground)]">Upload Image</span>
                  <span className="text-[9px] text-[var(--muted)] mt-0.5">
                    {MAX_IMAGES - images.length} slot{MAX_IMAGES - images.length === 1 ? "" : "s"} left
                  </span>
                </>
              )}
              <input
                id="image-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploadingImage || images.length >= MAX_IMAGES}
                className="hidden"
              />
            </label>
          ) : (
            <div className="aspect-square rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-2)]/60 flex flex-col items-center justify-center p-3 text-center opacity-60">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-1" />
              <span className="text-[11px] font-semibold text-[var(--foreground)]">Max 3 Images</span>
              <span className="text-[9px] text-[var(--muted)] mt-0.5">Limit reached</span>
            </div>
          )}
        </div>

        {/* Paste URL */}
        <div className="space-y-1 pt-1">
          <div className="flex gap-2">
            <input
              id="image-url-input"
              type="text"
              placeholder={images.length >= MAX_IMAGES ? "Maximum 3 images limit reached" : "Or paste direct image URL (https://...)"}
              value={imageUrlInput}
              disabled={images.length >= MAX_IMAGES}
              onChange={(e) => {
                setImageUrlInput(e.target.value);
                clearFieldError("imageUrl");
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImageUrl())}
              className={`${getInputClass("imageUrl")} flex-1 text-xs disabled:opacity-50`}
            />
            <button
              id="add-url-btn"
              type="button"
              onClick={addImageUrl}
              disabled={images.length >= MAX_IMAGES || !imageUrlInput.trim()}
              className="px-4 py-2 bg-[var(--surface-2)] hover:bg-[var(--border)] text-[var(--foreground)] text-xs font-semibold rounded-xl border border-[var(--border)] hover:border-[#B81862] transition whitespace-nowrap disabled:opacity-50 cursor-pointer"
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

      {/* 2. Product Information (Name, Category, Product ID / SKU, Description) */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
          <Info className="w-4 h-4 text-[#B81862]" />
          Product Information
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Product Name */}
          <div className="sm:col-span-1">
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
              placeholder="e.g. Serenade Marquise Floral Diamond Necklace"
              className={getInputClass("name")}
            />
            {fieldErrors.name && (
              <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.name}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="sm:col-span-1">
            <label className={labelClass}>Category *</label>
            <select
              id="product-category"
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
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

          {/* Product ID / SKU in DW-(Category letter)-01 format */}
          <div className="sm:col-span-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                Product ID (SKU) *
              </label>
              <button
                type="button"
                onClick={handleRegenerateSku}
                className="text-[10px] text-[#B81862] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                title="Auto-generate ID based on selected category"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-Generate</span>
              </button>
            </div>
            <div className="relative">
              <input
                id="product-sku"
                type="text"
                value={sku}
                onChange={(e) => {
                  setSku(e.target.value.toUpperCase());
                  setSkuManuallyEdited(true);
                  clearFieldError("sku");
                }}
                placeholder="e.g. DW-N-01"
                className={`${getInputClass("sku")} font-mono font-semibold tracking-wide pr-8 uppercase`}
              />
              <button
                type="button"
                onClick={handleRegenerateSku}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[#B81862] transition cursor-pointer p-1"
                title="Refresh ID"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-[var(--muted)] mt-1">
              Format: <span className="font-mono font-semibold text-[#B81862]">DW-(Category Letter)-01</span> (Editable)
            </p>
            {fieldErrors.sku && (
              <p className="text-[11px] text-red-400 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {fieldErrors.sku}
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
            placeholder="Describe the piece, craftsmanship, diamonds, and design..."
            className={`${getInputClass()} resize-none`}
          />
        </div>
      </div>

      {/* 3. Pricing, Quantity & Stock */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#B81862]" />
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
            className="w-4 h-4 rounded accent-[#B81862]"
          />
          <span className="text-xs text-[var(--foreground)]">Show price publicly in store</span>
        </label>
      </div>

      {/* 4. Visibility & Status */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#B81862]" />
          Store Visibility
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] cursor-pointer hover:border-[#B81862]/50 transition">
            <div>
              <span className="text-xs font-bold text-[var(--foreground)] block">Published</span>
              <span className="text-[11px] text-[var(--muted)] block">Live and visible in catalogue</span>
            </div>
            <input
              id="is-published-checkbox"
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 rounded accent-[#B81862]"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] cursor-pointer hover:border-[#B81862]/50 transition">
            <div>
              <span className="text-xs font-bold text-[var(--foreground)] block">Featured Piece</span>
              <span className="text-[11px] text-[var(--muted)] block">Highlight on store home page</span>
            </div>
            <input
              id="is-featured-checkbox"
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="w-4 h-4 rounded accent-[#B81862]"
            />
          </label>
        </div>
      </div>
    </form>
  );
}
