"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
  Star,
  Loader2,
  Sparkles,
  Check,
  Tag,
  Sliders,
  Image as ImageIcon,
  DollarSign,
  Info,
} from "lucide-react";
import { IProduct, ICategory, IProductImage, IProductSpecification } from "@/types";

interface ProductFormProps {
  initialProduct?: IProduct;
  isEditMode?: boolean;
}

export default function ProductForm({ initialProduct, isEditMode = false }: ProductFormProps) {
  const router = useRouter();

  // Basic Info
  const [name, setName] = useState(initialProduct?.name || "");
  const [slug, setSlug] = useState(initialProduct?.slug || "");
  const [sku, setSku] = useState(initialProduct?.sku || "");
  const [categoryId, setCategoryId] = useState(initialProduct?.categoryId || "");
  const [shortDescription, setShortDescription] = useState(initialProduct?.shortDescription || "");
  const [description, setDescription] = useState(initialProduct?.description || "");

  // Pricing
  const [price, setPrice] = useState<number | string>(initialProduct?.price ?? "");
  const [discountPrice, setDiscountPrice] = useState<number | string>(initialProduct?.discountPrice ?? "");
  const [showPrice, setShowPrice] = useState(initialProduct?.showPrice ?? true);
  const [stockStatus, setStockStatus] = useState<"in_stock" | "out_of_stock" | "made_to_order">(
    initialProduct?.stockStatus || "in_stock"
  );

  // Images
  const [images, setImages] = useState<IProductImage[]>(initialProduct?.images || []);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Dynamic Specifications
  const [specifications, setSpecifications] = useState<IProductSpecification[]>(
    initialProduct?.specifications?.length
      ? initialProduct.specifications
      : [
          { key: "Metal", value: "18K Gold" },
          { key: "Gross Weight", value: "12.5g" },
        ]
  );

  // Tags
  const [tags, setTags] = useState<string[]>(initialProduct?.tags || []);
  const [tagInput, setTagInput] = useState("");

  // Visibility
  const [isFeatured, setIsFeatured] = useState(initialProduct?.isFeatured || false);
  const [isPublished, setIsPublished] = useState(initialProduct?.isPublished ?? true);

  // Categories list
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories);
          if (!categoryId && data.categories.length > 0) {
            setCategoryId(data.categories[0]._id);
          }
        }
      })
      .catch((err) => console.error(err));
  }, [categoryId]);

  // Handle SKU auto-generation if creating
  useEffect(() => {
    if (!isEditMode && !sku && name) {
      const initials = name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 3);
      setSku(`RJ-${initials}-${Date.now().toString().slice(-4)}`);
    }
  }, [name, isEditMode, sku]);

  // Image Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setImages((prev) => [
            ...prev,
            {
              url: data.url,
              alt: files[i].name,
              isPrimary: prev.length === 0 && i === 0,
              order: prev.length + i,
            },
          ]);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading image");
    } finally {
      setUploadingImage(false);
    }
  };

  const addImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setImages((prev) => [
      ...prev,
      {
        url: imageUrlInput.trim(),
        alt: name || "Product image",
        isPrimary: prev.length === 0,
        order: prev.length,
      },
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
    setImages((prev) =>
      prev.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }))
    );
  };

  // Specifications Handlers
  const addSpecification = () => {
    setSpecifications([...specifications, { key: "", value: "" }]);
  };

  const updateSpecification = (index: number, field: "key" | "value", val: string) => {
    const updated = [...specifications];
    updated[index][field] = val;
    setSpecifications(updated);
  };

  const removeSpecification = (index: number) => {
    setSpecifications(specifications.filter((_, i) => i !== index));
  };

  // Tags Handlers
  const addTag = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const cleaned = tagInput.trim().replace(/,/g, "");
      if (!tags.includes(cleaned)) {
        setTags([...tags, cleaned]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!name.trim()) {
      setError("Product name is required.");
      setSubmitting(false);
      return;
    }
    if (!categoryId) {
      setError("Please select a category.");
      setSubmitting(false);
      return;
    }
    if (!price || isNaN(Number(price))) {
      setError("Valid price is required.");
      setSubmitting(false);
      return;
    }

    const payload = {
      name: name.trim(),
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      sku: sku.trim() || `SKU-${Date.now().toString().slice(-4)}`,
      categoryId,
      shortDescription,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : null,
      showPrice,
      stockStatus,
      images,
      specifications: specifications.filter((s) => s.key.trim() && s.value.trim()),
      tags,
      isFeatured,
      isPublished,
    };

    try {
      const url = isEditMode ? `/api/products/${initialProduct?._id}` : "/api/products";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save product.");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save product.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="p-2 rounded-xl bg-white border border-[#E8E2D9] text-gray-600 hover:text-black transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#141414] tracking-tight">
              {isEditMode ? "Edit Product" : "Add New Product"}
            </h1>
            <p className="text-xs text-[#666059]">
              Configure product details, dynamic specifications, images, and pricing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || uploadingImage}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#141414] text-white text-xs font-semibold hover:bg-[#B4833E] transition shadow-xs disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Product...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isEditMode ? "Update Product" : "Publish to Catalogue"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Basic Info, Specifications, Images */}
        <div className="lg:col-span-2 space-y-8">
          {/* Section 1: Basic Information */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-[#141414] flex items-center gap-2">
              <Info className="w-4 h-4 text-[#B4833E]" />
              Basic Information
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!isEditMode) {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                  }
                }}
                placeholder="e.g. Imperial Emerald & Solitaire Necklace"
                className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  SKU / Product Code *
                </label>
                <input
                  type="text"
                  required
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="RJ-NC-001"
                  className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm font-mono focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm font-medium text-gray-800 focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Short Summary (Card Preview)
              </label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="A breathtaking collar set with natural Zambian emeralds."
                className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Full Description & Story
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the craftsmanship, origin of gemstones, certification, styling notes..."
                className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
              />
            </div>
          </div>

          {/* Section 2: Dynamic Specifications */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#141414] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#B4833E]" />
                  Dynamic Specifications
                </h2>
                <p className="text-xs text-[#666059]">
                  Add custom key-value pairs suitable for any business (Metal, Carats, Dimensions, Material, Storage, etc.).
                </p>
              </div>
              <button
                type="button"
                onClick={addSpecification}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#D9D2C7] text-xs font-semibold text-[#141414] hover:bg-[#F3EFEA] transition"
              >
                <Plus className="w-3.5 h-3.5 text-[#B4833E]" />
                <span>Add Specification</span>
              </button>
            </div>

            <div className="space-y-3">
              {specifications.map((spec, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="e.g. Metal / RAM / Material"
                    value={spec.key}
                    onChange={(e) => updateSpecification(index, "key", e.target.value)}
                    className="w-1/3 px-3 py-2 border border-[#D9D2C7] rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#B4833E]"
                  />
                  <input
                    type="text"
                    placeholder="e.g. 18K Yellow Gold / 16GB / Teak"
                    value={spec.value}
                    onChange={(e) => updateSpecification(index, "value", e.target.value)}
                    className="flex-1 px-3 py-2 border border-[#D9D2C7] rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#B4833E]"
                  />
                  <button
                    type="button"
                    onClick={() => removeSpecification(index)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Product Images */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#141414] flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#B4833E]" />
                Product Imagery
              </h2>
              <p className="text-xs text-[#666059]">
                Upload multiple high-resolution photos. Star an image to designate it as the primary cover photo.
              </p>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {images.map((img, idx) => (
                <div
                  key={idx}
                  className={`relative aspect-square rounded-xl overflow-hidden border-2 transition group ${
                    img.isPrimary ? "border-[#B4833E] ring-2 ring-[#B4833E]/30" : "border-[#E8E2D9]"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.alt || "Product"} className="w-full h-full object-cover" />

                  {/* Star Badge */}
                  <button
                    type="button"
                    onClick={() => setPrimaryImage(idx)}
                    className={`absolute top-2 left-2 p-1 rounded-lg backdrop-blur-xs transition ${
                      img.isPrimary
                        ? "bg-[#B4833E] text-white"
                        : "bg-black/50 text-white hover:bg-black/80"
                    }`}
                    title={img.isPrimary ? "Primary Image" : "Set as Primary"}
                  >
                    <Star className={`w-3.5 h-3.5 ${img.isPrimary ? "fill-white" : ""}`} />
                  </button>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 p-1 rounded-lg bg-black/50 text-white hover:bg-red-600 backdrop-blur-xs transition"
                    title="Delete Image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {img.isPrimary && (
                    <div className="absolute bottom-0 inset-x-0 bg-[#B4833E] text-white text-[10px] font-bold uppercase text-center py-0.5">
                      Cover Photo
                    </div>
                  )}
                </div>
              ))}

              {/* Upload Dropzone Tile */}
              <label className="aspect-square rounded-xl border-2 border-dashed border-[#D9D2C7] hover:border-[#B4833E] bg-[#FAF8F5] flex flex-col items-center justify-center cursor-pointer transition p-4 text-center">
                <Upload className="w-6 h-6 text-[#B4833E] mb-2" />
                <span className="text-xs font-semibold text-gray-700">
                  {uploadingImage ? "Uploading..." : "Upload Photos"}
                </span>
                <span className="text-[10px] text-gray-400 mt-1">PNG, JPG, WebP</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
            </div>

            {/* Quick URL Input */}
            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Or paste external image URL (e.g. Unsplash, Cloudinary)..."
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="flex-1 px-3 py-2 border border-[#D9D2C7] rounded-xl text-xs focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
              />
              <button
                type="button"
                onClick={addImageUrl}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition"
              >
                Add URL
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Pricing, Tags, Visibility */}
        <div className="space-y-8">
          {/* Pricing Card */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#141414] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#B4833E]" />
              Pricing & Inventory
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Regular Price (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="125000"
                className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Discount Price (₹) Optional
              </label>
              <input
                type="number"
                min="0"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value)}
                placeholder="115000"
                className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Stock Status
              </label>
              <select
                value={stockStatus}
                onChange={(e) =>
                  setStockStatus(e.target.value as "in_stock" | "out_of_stock" | "made_to_order")
                }
                className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm font-medium text-gray-800 focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
              >
                <option value="in_stock">Available (In Stock)</option>
                <option value="made_to_order">Made to Order / Bespoke</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            <div className="pt-2 border-t border-[#E8E2D9]">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="w-4 h-4 text-[#B4833E] rounded border-gray-300 focus:ring-[#B4833E]"
                />
                <span>Show Price to Public Visitors</span>
              </label>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-[#141414] flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#B4833E]" />
              Search Tags
            </h2>
            <p className="text-xs text-gray-500">Press enter or comma to append tag</p>

            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Add tag (e.g. Bridal, Solitaire)..."
              className="w-full px-3 py-2 border border-[#D9D2C7] rounded-xl text-xs focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
            />

            <div className="flex flex-wrap gap-1.5 pt-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#E8E2D9] text-xs font-medium text-gray-700"
                >
                  <span>{t}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(t)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Visibility & Curation */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#141414] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B4833E]" />
              Catalogue Visibility
            </h2>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Published</span>
                  <span className="text-[11px] text-gray-500 block">Visible to public store visitors</span>
                </div>
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 text-[#B4833E] rounded border-gray-300 focus:ring-[#B4833E]"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Featured in Showcase</span>
                  <span className="text-[11px] text-gray-500 block">Pinned on store homepage</span>
                </div>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 text-[#B4833E] rounded border-gray-300 focus:ring-[#B4833E]"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
