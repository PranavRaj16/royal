"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Package,
  Plus,
  Search,
  LayoutGrid,
  List,
  Star,
  Copy,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Filter,
  ArrowUpDown,
  ExternalLink,
} from "lucide-react";
import { IProduct, ICategory } from "@/types";

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [deleteTarget, setDeleteTarget] = useState<IProduct | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filters read from URL params
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "all";
  const status = searchParams.get("status") || "all";
  const stockStatus = searchParams.get("stockStatus") || "all";
  const featured = searchParams.get("featured") || "all";
  const sort = searchParams.get("sort") || "newest";

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/admin/products?${params.toString()}`);
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const queryString = searchParams.toString();
      const res = await fetch(`/api/products?${queryString}`);
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleTogglePublish = async (product: IProduct) => {
    setActionLoadingId(product._id);
    try {
      const res = await fetch(`/api/products/${product._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !product.isPublished }),
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleFeatured = async (product: IProduct) => {
    setActionLoadingId(product._id);
    try {
      const res = await fetch(`/api/products/${product._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !product.isFeatured }),
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDuplicate = async (product: IProduct) => {
    setActionLoadingId(product._id);
    try {
      const res = await fetch(`/api/products/${product._id}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/products/${deleteTarget._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteTarget(null);
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#141414] tracking-tight">Products</h1>
          <p className="text-sm text-[#666059]">
            Manage, customize, and curate catalogue inventory items.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-white border border-[#D9D2C7] rounded-xl p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "list" ? "bg-[#141414] text-white" : "text-gray-500 hover:text-black"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition ${
                viewMode === "grid" ? "bg-[#141414] text-white" : "text-gray-500 hover:text-black"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141414] text-white text-xs font-semibold hover:bg-[#B4833E] transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
            <input
              type="text"
              defaultValue={search}
              placeholder="Search by title, SKU, tags..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateParam("search", (e.target as HTMLInputElement).value);
                }
              }}
              onBlur={(e) => updateParam("search", e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#B4833E]"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category */}
            <select
              value={categoryId}
              onChange={(e) => updateParam("categoryId", e.target.value)}
              className="px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl font-medium text-gray-700 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Status */}
            <select
              value={status}
              onChange={(e) => updateParam("status", e.target.value)}
              className="px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl font-medium text-gray-700 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>

            {/* Featured */}
            <select
              value={featured}
              onChange={(e) => updateParam("featured", e.target.value)}
              className="px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl font-medium text-gray-700 focus:outline-none"
            >
              <option value="all">All Items</option>
              <option value="true">Featured Only</option>
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl font-medium text-gray-700 focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name: A-Z</option>
              <option value="name-desc">Name: Z-A</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#B4833E]" />
          <span className="text-sm text-gray-500">Loading products...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-12 text-center shadow-xs">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-800">No products found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {search || categoryId !== "all" || status !== "all"
              ? "Try adjusting your search criteria or filter options."
              : "Start building your catalogue by adding your first product with dynamic specifications and images."}
          </p>
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#141414] text-white text-xs font-semibold rounded-xl hover:bg-[#B4833E] transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      ) : viewMode === "list" ? (
        /* LIST VIEW */
        <div className="bg-white border border-[#E8E2D9] rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF8F5] border-b border-[#E8E2D9] text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Featured</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-[#FAF8F5]/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.images?.[0]?.url || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=200&q=80"}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover bg-gray-100 border border-[#E8E2D9] shrink-0"
                        />
                        <div className="max-w-[240px]">
                          <Link
                            href={`/admin/products/${p._id}`}
                            className="font-bold text-gray-900 block hover:text-[#B4833E] transition truncate"
                          >
                            {p.name}
                          </Link>
                          {p.shortDescription && (
                            <span className="text-xs text-gray-500 block truncate">
                              {p.shortDescription}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-gray-600">{p.sku}</td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-gray-700">
                      {p.category?.name || "Uncategorized"}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-bold text-gray-900">
                        ₹{p.price.toLocaleString("en-IN")}
                      </div>
                      {p.discountPrice && (
                        <div className="text-[11px] text-gray-400 line-through">
                          ₹{p.discountPrice.toLocaleString("en-IN")}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-gray-600 font-medium">
                        {p.stockStatus === "in_stock"
                          ? "In Stock"
                          : p.stockStatus === "made_to_order"
                          ? "Made to Order"
                          : "Out of Stock"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(p)}
                        disabled={actionLoadingId === p._id}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                          p.isPublished
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        }`}
                      >
                        {p.isPublished ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Published</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-amber-600" />
                            <span>Draft</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(p)}
                        className={`p-1 rounded-lg transition ${
                          p.isFeatured
                            ? "text-amber-500 hover:text-amber-600"
                            : "text-gray-300 hover:text-gray-400"
                        }`}
                        title="Toggle Featured"
                      >
                        <Star className={`w-4 h-4 ${p.isFeatured ? "fill-amber-400" : ""}`} />
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <Link
                        href={`/admin/products/${p._id}`}
                        className="p-1.5 inline-block text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(p)}
                        disabled={actionLoadingId === p._id}
                        className="p-1.5 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition"
                        title="Duplicate Product"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(p)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <div
              key={p._id}
              className="bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group"
            >
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.images?.[0]?.url || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80"}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />

                {/* Badges on image */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      p.isPublished
                        ? "bg-emerald-600/90 text-white backdrop-blur-xs"
                        : "bg-amber-600/90 text-white backdrop-blur-xs"
                    }`}
                  >
                    {p.isPublished ? "Published" : "Draft"}
                  </span>
                  {p.isFeatured && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF37] text-black flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-black" /> Featured
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-xl shadow-sm opacity-0 group-hover:opacity-100 transition">
                  <Link
                    href={`/admin/products/${p._id}`}
                    className="p-1.5 text-gray-700 hover:text-black"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDuplicate(p)}
                    className="p-1.5 text-gray-700 hover:text-black"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(p)}
                    className="p-1.5 text-red-600 hover:text-red-700"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-4 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-[#B4833E] uppercase tracking-wider block mb-1">
                    {p.category?.name || "General"}
                  </span>
                  <h3 className="font-bold text-sm text-gray-900 line-clamp-1">{p.name}</h3>
                  <span className="font-mono text-[11px] text-gray-400 block mt-0.5">
                    SKU: {p.sku}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E8E2D9] flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-gray-900">
                      ₹{p.price.toLocaleString("en-IN")}
                    </span>
                    {p.discountPrice && (
                      <span className="text-xs text-gray-400 line-through block">
                        ₹{p.discountPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/admin/products/${p._id}`}
                    className="text-xs font-semibold text-[#141414] hover:text-[#B4833E] transition"
                  >
                    Manage →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E8E2D9] shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Product?</h3>
            <p className="text-xs text-gray-500 mb-6">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong> (SKU: {deleteTarget.sku})? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-5 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#B4833E]" />
        </div>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
