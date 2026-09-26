"use client";

import React, { Suspense, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Package,
  Plus,
  Search,
  LayoutGrid,
  List,
  Star,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  FolderPlus,
  ArrowLeft,
  ChevronRight,
  Layers,
  Tag,
  AlertCircle,
} from "lucide-react";
import { IProduct, ICategory } from "@/types";
import { getCategoryPlaceholder, getProductPlaceholder } from "@/lib/placeholderImages";

interface CategoryFormData {
  name: string;
  description: string;
  image: string;
  displayOrder: string;
  isActive: boolean;
}

const EMPTY_CAT_FORM: CategoryFormData = {
  name: "",
  description: "",
  image: "",
  displayOrder: "0",
  isActive: true,
};

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state
  const selectedFolderId = searchParams.get("category") || null; // category id, slug, or 'all'
  const searchQuery = searchParams.get("search") || "";
  const stockFilter = searchParams.get("stock") || "all";
  const statusFilter = searchParams.get("status") || "all";
  const sortBy = searchParams.get("sort") || "newest";
  const viewModeParam = searchParams.get("view") || "list";

  // Data state
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">(
    viewModeParam === "grid" ? "grid" : "list"
  );
  const [folderSearch, setFolderSearch] = useState("");

  // Action states
  const [actionId, setActionId] = useState<string | null>(null);
  const [deleteProductTarget, setDeleteProductTarget] = useState<IProduct | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<ICategory | null>(null);

  // Category Modal State
  const [showCatModal, setShowCatModal] = useState(false);
  const [catEditTarget, setCatEditTarget] = useState<ICategory | null>(null);
  const [catForm, setCatForm] = useState<CategoryFormData>(EMPTY_CAT_FORM);
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const setParam = (key: string, value: string | null) => {
    const p = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      p.set(key, value);
    } else {
      p.delete(key);
    }
    router.push(`/admin/products?${p.toString()}`);
  };

  // Fetch all products
  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  }, []);

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProducts(), fetchCategories()]).finally(() => {
      setLoading(false);
    });
  }, [fetchProducts, fetchCategories]);

  // Helper to determine if a product belongs to a category
  const isProductInCat = useCallback((p: IProduct, cat: ICategory) => {
    const pCatId =
      typeof p.categoryId === "object" && p.categoryId !== null
        ? (p.categoryId as { _id?: string })._id
        : typeof p.categoryId === "string"
        ? p.categoryId
        : p.category?._id;

    const pCatSlug =
      typeof p.categoryId === "object" && p.categoryId !== null
        ? (p.categoryId as { slug?: string }).slug
        : p.category?.slug;

    const pCatName =
      typeof p.categoryId === "object" && p.categoryId !== null
        ? (p.categoryId as { name?: string }).name
        : p.category?.name;

    return (
      pCatId === cat._id ||
      (pCatSlug && cat.slug && pCatSlug === cat.slug) ||
      (pCatName && cat.name && pCatName.toLowerCase() === cat.name.toLowerCase())
    );
  }, []);

  // Active Category Object (if inside a folder)
  const currentCategory = useMemo(() => {
    if (!selectedFolderId || selectedFolderId === "all") return null;
    return (
      categories.find(
        (c) => c._id === selectedFolderId || c.slug === selectedFolderId
      ) || null
    );
  }, [categories, selectedFolderId]);

  // Products belonging to the selected category (or all)
  const productsInCurrentFolder = useMemo(() => {
    if (!selectedFolderId || selectedFolderId === "all") {
      return products;
    }
    if (selectedFolderId === "uncategorized") {
      return products.filter((p) => {
        return !categories.some((c) => isProductInCat(p, c));
      });
    }
    if (!currentCategory) return [];
    return products.filter((p) => isProductInCat(p, currentCategory));
  }, [products, selectedFolderId, currentCategory, categories, isProductInCat]);

  // Filtered and sorted products inside the current folder
  const displayedProducts = useMemo(() => {
    let result = [...productsInCurrentFolder];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Stock Status
    if (stockFilter !== "all") {
      result = result.filter((p) => p.stockStatus === stockFilter);
    }

    // Publish status
    if (statusFilter === "published") {
      result = result.filter((p) => p.isPublished);
    } else if (statusFilter === "draft") {
      result = result.filter((p) => !p.isPublished);
    }

    // Sorting
    if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "price-asc") {
      result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (sortBy === "name-asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-desc") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else {
      // newest
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [productsInCurrentFolder, searchQuery, stockFilter, statusFilter, sortBy]);

  // Product Actions
  const togglePublish = async (p: IProduct) => {
    setActionId(p._id);
    try {
      await fetch(`/api/products/${p._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !p.isPublished }),
      });
      await fetchProducts();
      showToast(`Product set to ${!p.isPublished ? "Live" : "Draft"}`);
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  const toggleFeatured = async (p: IProduct) => {
    setActionId(p._id);
    try {
      await fetch(`/api/products/${p._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !p.isFeatured }),
      });
      await fetchProducts();
      showToast(p.isFeatured ? "Removed from featured" : "Marked as featured");
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  const duplicateProduct = async (p: IProduct) => {
    setActionId(p._id);
    try {
      const res = await fetch(`/api/products/${p._id}/duplicate`, { method: "POST" });
      if (res.ok) {
        await fetchProducts();
        showToast(`Duplicated "${p.name}"`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deleteProductTarget) return;
    try {
      await fetch(`/api/products/${deleteProductTarget._id}`, { method: "DELETE" });
      setDeleteProductTarget(null);
      await fetchProducts();
      showToast("Product deleted successfully");
    } catch (err) {
      console.error(err);
    }
  };

  // Category Modal Handlers
  const openNewCategoryModal = () => {
    setCatEditTarget(null);
    setCatForm({
      ...EMPTY_CAT_FORM,
      displayOrder: String(categories.length + 1),
    });
    setCatError("");
    setShowCatModal(true);
  };

  const openEditCategoryModal = (cat: ICategory, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCatEditTarget(cat);
    setCatForm({
      name: cat.name,
      description: cat.description || "",
      image: cat.image || "",
      displayOrder: String(cat.displayOrder ?? 0),
      isActive: cat.isActive !== false,
    });
    setCatError("");
    setShowCatModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name.trim()) {
      setCatError("Category name is required.");
      return;
    }
    setCatSaving(true);
    setCatError("");

    try {
      const payload = {
        name: catForm.name.trim(),
        description: catForm.description.trim(),
        image: catForm.image.trim(),
        displayOrder: Number(catForm.displayOrder) || 0,
        isActive: catForm.isActive,
      };

      const res = catEditTarget
        ? await fetch(`/api/categories/${catEditTarget._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/categories", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await res.json();
      if (!res.ok) {
        setCatError(data.error || "Failed to save category.");
        return;
      }

      setShowCatModal(false);
      await fetchCategories();
      showToast(catEditTarget ? "Category updated!" : "New Category added!");
    } catch {
      setCatError("Network error. Please try again.");
    } finally {
      setCatSaving(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;
    try {
      await fetch(`/api/categories/${deleteCategoryTarget._id}`, { method: "DELETE" });
      setDeleteCategoryTarget(null);
      await fetchCategories();
      if (selectedFolderId === deleteCategoryTarget._id) {
        setParam("category", null);
      }
      showToast("Category folder deleted");
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered categories for folder view search
  const visibleCategories = useMemo(() => {
    if (!folderSearch.trim()) return categories;
    const q = folderSearch.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.slug?.toLowerCase().includes(q)
    );
  }, [categories, folderSearch]);

  const uncategorizedCount = useMemo(() => {
    return products.filter((p) => !categories.some((c) => isProductInCat(p, c))).length;
  }, [products, categories, isProductInCat]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e1e1e] border border-[#D4AF37] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TOP HEADER
      ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--muted)] mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Package className="w-3.5 h-3.5 text-[#B4833E]" />
              Catalogue Management
            </span>
            {selectedFolderId && (
              <>
                <ChevronRight className="w-3 h-3 text-[var(--muted)]" />
                <button
                  type="button"
                  onClick={() => setParam("category", null)}
                  className="hover:text-white transition cursor-pointer"
                >
                  Collections
                </button>
                <ChevronRight className="w-3 h-3 text-[var(--muted)]" />
                <span className="text-[#D4AF37] font-semibold">
                  {currentCategory ? currentCategory.name : selectedFolderId === "all" ? "All Pieces" : "Uncategorized"}
                </span>
              </>
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {selectedFolderId
              ? currentCategory
                ? currentCategory.name
                : selectedFolderId === "all"
                ? "All Products"
                : "Uncategorized Pieces"
              : "Products"}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
            {selectedFolderId
              ? currentCategory?.description ||
                `Managing pieces segregated in ${currentCategory?.name || "this collection"}.`
              : "Organize products into category folders, edit pieces, or add new categories."}
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add Category Button */}
          <button
            id="add-category-btn"
            type="button"
            onClick={openNewCategoryModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-white hover:border-[#B4833E] hover:text-[#D4AF37] text-xs font-semibold transition shadow-sm"
          >
            <FolderPlus className="w-4 h-4 text-[#B4833E]" />
            <span>Add Category</span>
          </button>

          {/* Add Product Button */}
          <Link
            id="add-product-btn"
            href={
              currentCategory
                ? `/admin/products/new?categoryId=${currentCategory._id}`
                : "/admin/products/new"
            }
            className="btn-primary flex items-center gap-2 text-xs shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>{currentCategory ? `Add to ${currentCategory.name}` : "Add Product"}</span>
          </Link>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          VIEW A: ROOT FOLDER VIEW (When no category is selected)
      ────────────────────────────────────────────────────────────── */}
      {!selectedFolderId ? (
        <div className="space-y-6">
          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#B4833E]" />
                Categories
              </span>
              <span className="text-2xl font-bold text-white mt-2">
                {categories.length}
              </span>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#B4833E]" />
                Total Products
              </span>
              <span className="text-2xl font-bold text-white mt-2">
                {products.length}
              </span>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Live on Store
              </span>
              <span className="text-2xl font-bold text-emerald-400 mt-2">
                {products.filter((p) => p.isPublished).length}
              </span>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]/30" />
                Featured Pieces
              </span>
              <span className="text-2xl font-bold text-[#D4AF37] mt-2">
                {products.filter((p) => p.isFeatured).length}
              </span>
            </div>
          </div>

          {/* Search bar for collections */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-3.5 sm:p-4 shadow-sm">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
              <input
                id="search-folders"
                type="text"
                value={folderSearch}
                onChange={(e) => setFolderSearch(e.target.value)}
                placeholder="Search collection folders by name..."
                className="w-full pl-10 pr-9 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-white placeholder-[#777] focus:outline-none focus:border-[#B4833E] focus:ring-1 focus:ring-[#B4833E]/20 transition"
              />
              {folderSearch && (
                <button
                  type="button"
                  onClick={() => setFolderSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Folders Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#B4833E]" />
              <span className="text-xs text-[var(--muted)]">Loading collections & products...</span>
            </div>
          ) : visibleCategories.length === 0 ? (
            <div className="p-12 text-center bg-[var(--card)] border border-[var(--border)] rounded-3xl space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#B4833E]/10 border border-[#B4833E]/20 text-[#B4833E] flex items-center justify-center mx-auto">
                <FolderPlus className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-lg font-bold text-white">No Category Folders Found</h3>
              <p className="text-xs text-[var(--muted)] max-w-md mx-auto">
                {folderSearch
                  ? `No collection matched "${folderSearch}". Try clearing search.`
                  : "Create your first category folder to start segregating and organizing your luxury jewellery."}
              </p>
              <button
                type="button"
                onClick={openNewCategoryModal}
                className="btn-primary text-xs inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Category</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleCategories.map((cat) => {
                const catProducts = products.filter((p) => isProductInCat(p, cat));
                const liveCount = catProducts.filter((p) => p.isPublished).length;
                // Use category image, or first product image, or category placeholder as cover
                const coverImage =
                  cat.image ||
                  catProducts
                    .map((p) => p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url)
                    .filter(Boolean)[0] ||
                  getCategoryPlaceholder(cat.name || cat.slug);

                return (
                  <div
                    key={cat._id}
                    id={`folder-${cat._id}`}
                    className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-[#B4833E]/15 transition-all duration-400 hover:-translate-y-1.5 border border-[#2a2a2a] hover:border-[#D4AF37]/50"
                    style={{ minHeight: 260 }}
                  >
                    {/* Cover Image / Gradient Background */}
                    <div
                      className="absolute inset-0 transition-transform duration-500 group-hover:scale-105"
                      onClick={() => setParam("category", cat._id)}
                    >
                      {coverImage ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={coverImage}
                          alt={cat.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#1a1512] via-[#1e1a14] to-[#0f0d0a] flex items-center justify-center">
                          <div className="text-center opacity-30">
                            <Tag className="w-16 h-16 mx-auto text-[#D4AF37] mb-2" />
                            <span className="text-[#D4AF37] text-xs font-semibold tracking-widest uppercase">Collection</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dark Gradient Overlay */}
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 transition-opacity duration-300 group-hover:from-black/95"
                      onClick={() => setParam("category", cat._id)}
                    />

                    {/* Top Bar: status badge + action buttons */}
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between z-10">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border backdrop-blur-sm ${
                          cat.isActive !== false
                            ? "bg-emerald-900/70 text-emerald-300 border-emerald-500/30"
                            : "bg-amber-900/70 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {cat.isActive !== false ? "● Active" : "● Hidden"}
                      </span>

                      {/* CRUD Action Buttons */}
                      <div
                        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={(e) => openEditCategoryModal(cat, e)}
                          title="Edit Category"
                          className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] transition flex items-center justify-center shadow-lg"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteCategoryTarget(cat);
                          }}
                          title="Delete Category"
                          className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-red-500 hover:border-red-500 transition flex items-center justify-center shadow-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom Content Overlay */}
                    <div
                      className="absolute bottom-0 left-0 right-0 p-4 z-10"
                      onClick={() => setParam("category", cat._id)}
                    >
                      <h2 className="font-serif text-xl font-bold text-white group-hover:text-[#D4AF37] transition-colors leading-tight mb-1">
                        {cat.name}
                      </h2>
                      {cat.description && (
                        <p className="text-[11px] text-gray-300/70 line-clamp-1 leading-relaxed mb-2">
                          {cat.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-white/10">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white/90">
                            {catProducts.length} {catProducts.length === 1 ? "Piece" : "Pieces"}
                          </span>
                          {catProducts.length > 0 && (
                            <span className="text-[10px] text-emerald-400 font-semibold">
                              {liveCount} Live
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-bold text-[#D4AF37] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          <span>Browse</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Uncategorized Tile */}
              {uncategorizedCount > 0 && (
                <div
                  id="folder-uncategorized"
                  onClick={() => setParam("category", "uncategorized")}
                  className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl border border-dashed border-amber-600/40 hover:border-amber-500 transition-all duration-400 hover:-translate-y-1.5"
                  style={{ minHeight: 260 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1a1200] via-[#1a1000] to-[#0d0900]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <AlertCircle className="w-20 h-20 text-amber-700/20" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  <div className="absolute top-3 left-3">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-900/70 text-amber-300 border border-amber-500/30 backdrop-blur-sm">
                      ● Needs Category
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h2 className="font-serif text-xl font-bold text-amber-300 mb-1">
                      Uncategorized Pieces
                    </h2>
                    <p className="text-[11px] text-gray-300/60 mb-2">
                      Products not assigned to any collection.
                    </p>
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <span className="text-xs font-bold text-amber-400">
                        {uncategorizedCount} Items
                      </span>
                      <span className="text-xs font-bold text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        <span>Organize</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ─────────────────────────────────────────────────────────────
            VIEW B: INSIDE CATEGORY FOLDER VIEW (Drill-Down)
        ────────────────────────────────────────────────────────────── */
        <div className="space-y-6">
          {/* Breadcrumb & Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-3.5">
            <button
              type="button"
              id="back-to-folders-btn"
              onClick={() => setParam("category", null)}
              className="flex items-center gap-2 text-xs font-bold text-[#D4AF37] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Categories</span>
            </button>

            {currentCategory && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditCategoryModal(currentCategory)}
                  className="px-3 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--muted)] hover:text-white transition flex items-center gap-1.5"
                >
                  <Edit className="w-3 h-3 text-[#B4833E]" />
                  <span>Edit Category</span>
                </button>
              </div>
            )}
          </div>

          {/* Filter Toolbar for this category */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search in this category */}
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
                <input
                  id="category-product-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setParam("search", e.target.value)}
                  placeholder={`Search in ${currentCategory?.name || "this collection"}...`}
                  className="w-full pl-10 pr-9 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-white placeholder-[#666] focus:outline-none focus:border-[#B4833E] transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setParam("search", null)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status, Stock, Sort Filters & View Toggle */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Stock Status */}
                <select
                  value={stockFilter}
                  onChange={(e) => setParam("stock", e.target.value)}
                  className="px-3 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-white focus:outline-none focus:border-[#B4833E] transition cursor-pointer min-w-[125px]"
                >
                  <option value="all">All Stock</option>
                  <option value="in_stock">In Stock</option>
                  <option value="made_to_order">Made to Order</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>

                {/* Publish status */}
                <select
                  value={statusFilter}
                  onChange={(e) => setParam("status", e.target.value)}
                  className="px-3 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-white focus:outline-none focus:border-[#B4833E] transition cursor-pointer min-w-[115px]"
                >
                  <option value="all">All Status</option>
                  <option value="published">Live Only</option>
                  <option value="draft">Draft Only</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setParam("sort", e.target.value)}
                  className="px-3 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-white focus:outline-none focus:border-[#B4833E] transition cursor-pointer min-w-[140px]"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="name-asc">Name: A to Z</option>
                </select>

                {/* View toggle */}
                <div className="flex items-center rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === "list"
                        ? "bg-[#B4833E] text-black shadow-xs font-bold"
                        : "text-[var(--muted)] hover:text-white"
                    }`}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === "grid"
                        ? "bg-[#B4833E] text-black shadow-xs font-bold"
                        : "text-[var(--muted)] hover:text-white"
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-1 border-t border-[var(--border)]/40">
              <span>
                Showing <strong className="text-white font-semibold">{displayedProducts.length}</strong> {displayedProducts.length === 1 ? "piece" : "pieces"}
                {currentCategory && <span> in <span className="text-[#D4AF37] font-medium">{currentCategory.name}</span></span>}
              </span>
              {(searchQuery || stockFilter !== "all" || statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    const p = new URLSearchParams();
                    if (selectedFolderId) p.set("category", selectedFolderId);
                    router.push(`/admin/products?${p.toString()}`);
                  }}
                  className="text-xs text-[#D4AF37] hover:underline font-semibold"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Products Empty State */}
          {displayedProducts.length === 0 ? (
            <div className="p-16 text-center bg-[var(--card)] border border-[var(--border)] rounded-3xl space-y-4">
              <Package className="w-12 h-12 text-gray-500 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-white">
                No Products in this Category
              </h3>
              <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
                {searchQuery || stockFilter !== "all" || statusFilter !== "all"
                  ? "No pieces matched the active filters."
                  : `Add your first luxury creation to ${currentCategory?.name || "this collection"}.`}
              </p>
              <Link
                href={
                  currentCategory
                    ? `/admin/products/new?categoryId=${currentCategory._id}`
                    : "/admin/products/new"
                }
                className="btn-primary text-xs inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product to this Category</span>
              </Link>
            </div>
          ) : viewMode === "list" ? (
            /* ── TABLE VIEW ── */
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="bg-[var(--surface-2)]/80 border-b border-[var(--border)] text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      <th className="py-3.5 px-5 w-[34%]">Product</th>
                      <th className="py-3.5 px-4 w-[14%]">SKU</th>
                      <th className="py-3.5 px-4 w-[16%]">Price</th>
                      <th className="py-3.5 px-4 w-[14%]">Stock</th>
                      <th className="py-3.5 px-4 w-[10%]">Status</th>
                      <th className="py-3.5 px-3 w-[6%] text-center">Featured</th>
                      <th className="py-3.5 px-5 w-[6%] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]/50">
                    {displayedProducts.map((p) => {
                      const catName =
                        (typeof p.categoryId === "object" && p.categoryId !== null
                          ? (p.categoryId as { name?: string })?.name
                          : null) ||
                        currentCategory?.name ||
                        "";
                      const img =
                        p.images?.find((i) => i.isPrimary)?.url ||
                        p.images?.[0]?.url ||
                        getProductPlaceholder(catName, p.name);
                      const isLoading = actionId === p._id;

                      return (
                        <tr key={p._id} id={`product-row-${p._id}`} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3.5">
                              <div className="w-13 h-13 shrink-0 rounded-xl overflow-hidden bg-[var(--surface-2)] border border-[#2b2b2b]">
                                {img ? (
                                  /* eslint-disable-next-line @next/next/no-img-element */
                                  <img
                                    src={img}
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-4 h-4 text-[var(--muted)]" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <Link
                                  href={`/admin/products/${p._id}`}
                                  className="font-semibold text-white hover:text-[#D4AF37] transition block truncate text-sm"
                                >
                                  {p.name}
                                </Link>
                                {p.shortDescription && (
                                  <span className="text-[11px] text-[var(--muted)] block truncate mt-0.5">
                                    {p.shortDescription}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span className="font-mono text-xs text-[var(--muted)] bg-[var(--surface-2)] px-2.5 py-1 rounded-lg border border-[var(--border)]">
                              {p.sku}
                            </span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-bold text-white text-sm">
                                ₹{Number(p.discountPrice || p.price).toLocaleString("en-IN")}
                              </span>
                              {p.discountPrice && (
                                <span className="text-[11px] text-gray-500 line-through">
                                  ₹{Number(p.price).toLocaleString("en-IN")}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`text-xs font-semibold inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${
                                p.stockStatus === "in_stock"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                                  : p.stockStatus === "out_of_stock"
                                  ? "bg-red-500/10 text-red-400 border border-red-500/25"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/25"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                p.stockStatus === "in_stock" ? "bg-emerald-400" : p.stockStatus === "out_of_stock" ? "bg-red-400" : "bg-amber-400"
                              }`} />
                              {p.stockStatus === "in_stock"
                                ? `In Stock (${p.quantity ?? 10})`
                                : p.stockStatus === "out_of_stock"
                                ? "Out of Stock"
                                : "Made to Order"}
                            </span>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <button
                              id={`toggle-publish-${p._id}`}
                              type="button"
                              onClick={() => togglePublish(p)}
                              disabled={isLoading}
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition ${
                                p.isPublished
                                  ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                                  : "bg-amber-500/15 text-amber-400 border border-amber-500/30 hover:bg-amber-500/25"
                              }`}
                            >
                              {p.isPublished ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  Live
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3" />
                                  Draft
                                </>
                              )}
                            </button>
                          </td>
                          <td className="py-4 px-3 text-center whitespace-nowrap">
                            <button
                              id={`toggle-featured-${p._id}`}
                              type="button"
                              onClick={() => toggleFeatured(p)}
                              className={`p-1.5 rounded-lg transition ${
                                p.isFeatured
                                  ? "text-[#D4AF37] hover:opacity-80"
                                  : "text-gray-600 hover:text-gray-400"
                              }`}
                              title={p.isFeatured ? "Featured Piece" : "Mark Featured"}
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  p.isFeatured ? "fill-[#D4AF37]" : ""
                                }`}
                              />
                            </button>
                          </td>
                          <td className="py-4 px-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Button */}
                              <Link
                                id={`edit-product-${p._id}`}
                                href={`/admin/products/${p._id}`}
                                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[var(--surface-2)] transition"
                                title="Edit Product Details"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => setDeleteProductTarget(p)}
                                className="p-2 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ── GRID VIEW ── */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayedProducts.map((p) => {
                const catName =
                  (typeof p.categoryId === "object" && p.categoryId !== null
                    ? (p.categoryId as { name?: string })?.name
                    : null) ||
                  currentCategory?.name ||
                  "";
                const img =
                  p.images?.find((i) => i.isPrimary)?.url ||
                  p.images?.[0]?.url ||
                  getProductPlaceholder(catName, p.name);

                return (
                  <div
                    key={p._id}
                    id={`grid-product-${p._id}`}
                    className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden group hover:border-[#B4833E]/40 transition flex flex-col justify-between"
                  >
                    <div className="relative aspect-square bg-[var(--surface-2)] overflow-hidden">
                      {img ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={img}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-10 h-10 text-[var(--border)]" />
                        </div>
                      )}

                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <span
                          className={`badge ${
                            p.isPublished
                              ? "bg-emerald-600/90 text-white"
                              : "bg-amber-600/90 text-white"
                          } backdrop-blur-sm`}
                        >
                          {p.isPublished ? "Live" : "Draft"}
                        </span>
                        {p.isFeatured && (
                          <span className="badge bg-[#D4AF37] text-black">
                            <Star className="w-2.5 h-2.5 mr-1 fill-black" />
                            Featured
                          </span>
                        )}
                      </div>

                      {/* Hover action overlay */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition">
                        <Link
                          href={`/admin/products/${p._id}`}
                          className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-black hover:bg-white transition"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteProductTarget(p)}
                          className="w-7 h-7 bg-red-500/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-white hover:bg-red-500 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 space-y-2">
                      <div>
                        <h3 className="font-semibold text-white text-sm line-clamp-1">
                          {p.name}
                        </h3>
                        <span className="font-mono text-[10px] text-[var(--muted)]">
                          {p.sku}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                        <span className="font-bold text-white text-sm">
                          ₹{Number(p.discountPrice || p.price).toLocaleString("en-IN")}
                        </span>
                        <Link
                          href={`/admin/products/${p._id}`}
                          className="text-xs font-bold text-[#B4833E] hover:text-[#D4AF37] transition"
                        >
                          Edit →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD / EDIT CATEGORY
      ────────────────────────────────────────────────────────────── */}
      {showCatModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowCatModal(false)}
        >
          <div
            className="bg-[#181818] border border-[#333] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#2b2b2b]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-white">
                    {catEditTarget ? "Edit Collection Folder" : "Add New Collection Folder"}
                  </h3>
                  <p className="text-[11px] text-[var(--muted)]">
                    Define a category folder to group jewellery pieces.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCatModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#252525] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {catError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{catError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Category Name *
                </label>
                <input
                  id="cat-name-input"
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="e.g. Diamond Necklaces"
                  className="input text-xs w-full"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Description
                </label>
                <textarea
                  id="cat-desc-input"
                  rows={2}
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  placeholder="Briefly describe the theme, carat purity, or style of this collection..."
                  className="input text-xs w-full resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Cover Image URL
                  <span className="text-[#B4833E] ml-1 font-normal">(shown on category card)</span>
                </label>
                <input
                  id="cat-image-input"
                  type="url"
                  value={catForm.image}
                  onChange={(e) => setCatForm({ ...catForm, image: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="input text-xs w-full"
                />
                {catForm.image ? (
                  <div className="mt-2 rounded-xl overflow-hidden border border-[#333] h-24 bg-[#111]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={catForm.image}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                ) : (
                  <div className="mt-2 rounded-xl overflow-hidden border border-dashed border-[#444] h-24 bg-[#141414] relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getCategoryPlaceholder(catForm.name)}
                      alt="Default category placeholder"
                      className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-[10px] font-semibold text-[#D4AF37] bg-black/70 px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
                        Default Category Placeholder
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Display Order
                  </label>
                  <input
                    id="cat-order-input"
                    type="number"
                    min="0"
                    value={catForm.displayOrder}
                    onChange={(e) => setCatForm({ ...catForm, displayOrder: e.target.value })}
                    className="input text-xs w-full"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] cursor-pointer text-xs font-semibold text-white">
                    <input
                      type="checkbox"
                      checked={catForm.isActive}
                      onChange={(e) => setCatForm({ ...catForm, isActive: e.target.checked })}
                      className="accent-[#B4833E] rounded w-4 h-4"
                    />
                    <span>Active in Store</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#2b2b2b]">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={catSaving}
                  className="btn-primary text-xs flex items-center gap-2"
                >
                  {catSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{catEditTarget ? "Save Changes" : "Create Folder"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: DELETE PRODUCT CONFIRMATION
      ────────────────────────────────────────────────────────────── */}
      {deleteProductTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-sm w-full p-6">
            <h3 className="font-bold text-white text-lg mb-2">Delete Product?</h3>
            <p className="text-xs text-[var(--muted)] mb-6">
              Are you sure you want to permanently delete{" "}
              <strong className="text-white">{deleteProductTarget.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setDeleteProductTarget(null)}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition"
              >
                Delete Piece
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: DELETE CATEGORY CONFIRMATION
      ────────────────────────────────────────────────────────────── */}
      {deleteCategoryTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-sm w-full p-6">
            <h3 className="font-bold text-white text-lg mb-2">Delete Category Folder?</h3>
            <p className="text-xs text-[var(--muted)] mb-6">
              This will delete the category folder{" "}
              <strong className="text-white">{deleteCategoryTarget.name}</strong>. Products previously in this category will not be lost, but will move to Uncategorized.
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => setDeleteCategoryTarget(null)}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition"
              >
                Delete Category
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
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#B4833E]" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
