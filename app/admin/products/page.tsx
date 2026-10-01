"use client";

import React, { Suspense, useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Upload,
  ImageIcon,
  MapPin,
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
  const [productDeleting, setProductDeleting] = useState(false);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<ICategory | null>(null);
  const [categoryDeleting, setCategoryDeleting] = useState(false);

  // Category Modal State
  const [showCatModal, setShowCatModal] = useState(false);
  const [catEditTarget, setCatEditTarget] = useState<ICategory | null>(null);
  const [catForm, setCatForm] = useState<CategoryFormData>(EMPTY_CAT_FORM);
  const [catSaving, setCatSaving] = useState(false);
  const [catUploading, setCatUploading] = useState(false);
  const [catError, setCatError] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const catFileInputRef = useRef<HTMLInputElement>(null);

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
      const res = await fetch("/api/products", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error("Failed to load products:", err);
    }
  }, []);

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/categories", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
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
    if (!p || !cat) return false;

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

    const pCatIdStr = pCatId ? String(pCatId).trim().toLowerCase() : "";
    const catIdStr = cat._id ? String(cat._id).trim().toLowerCase() : "";
    const catSlugStr = cat.slug ? String(cat.slug).trim().toLowerCase() : "";
    const pCatSlugStr = pCatSlug ? String(pCatSlug).trim().toLowerCase() : "";
    const catNameStr = cat.name ? String(cat.name).trim().toLowerCase() : "";
    const pCatNameStr = pCatName ? String(pCatName).trim().toLowerCase() : "";

    // 1. Direct match on ID, Slug, or Name
    if (
      (pCatIdStr && catIdStr && pCatIdStr === catIdStr) ||
      (pCatIdStr && catSlugStr && pCatIdStr === catSlugStr) ||
      (pCatSlugStr && catSlugStr && pCatSlugStr === catSlugStr) ||
      (pCatNameStr && catNameStr && pCatNameStr === catNameStr) ||
      (pCatIdStr && catNameStr && pCatIdStr === catNameStr) ||
      (pCatNameStr && catSlugStr && pCatNameStr.replace(/[^a-z0-9]/g, "") === catSlugStr.replace(/[^a-z0-9]/g, ""))
    ) {
      return true;
    }

    // 2. Match by SKU prefix / format (DW-(Category letter)-01 or legacy RJ-...)
    const sku = String(p.sku || "").toUpperCase().trim();
    if (sku) {
      // Necklaces
      if (
        (sku.startsWith("DW-N-") || sku.startsWith("RJ-NC-") || sku.startsWith("NC-") || sku.startsWith("DW-NC-")) &&
        (catSlugStr.includes("neck") || catNameStr.includes("neck"))
      ) return true;

      // Rings
      if (
        (sku.startsWith("DW-R-") || sku.startsWith("RJ-RG-") || sku.startsWith("RG-") || sku.startsWith("DW-RG-")) &&
        (catSlugStr.includes("ring") || catNameStr.includes("ring"))
      ) return true;

      // Earrings
      if (
        (sku.startsWith("DW-E-") || sku.startsWith("RJ-ER-") || sku.startsWith("ER-") || sku.startsWith("DW-ER-")) &&
        (catSlugStr.includes("ear") || catNameStr.includes("ear"))
      ) return true;

      // Bracelets & Bangles
      if (
        (sku.startsWith("DW-B-") || sku.startsWith("RJ-BR-") || sku.startsWith("DW-BR-") || sku.startsWith("DW-BG-") || sku.startsWith("RJ-BG-") || sku.startsWith("BR-") || sku.startsWith("BG-")) &&
        (catSlugStr.includes("bang") || catSlugStr.includes("brac") || catNameStr.includes("bang") || catNameStr.includes("brac"))
      ) return true;

      // Pendants
      if (
        (sku.startsWith("DW-P-") || sku.startsWith("RJ-PD-") || sku.startsWith("PD-")) &&
        (catSlugStr.includes("pend") || catNameStr.includes("pend"))
      ) return true;

      // Mangalsutra
      if (
        (sku.startsWith("DW-M-") || sku.startsWith("RJ-MG-") || sku.startsWith("MG-")) &&
        (catSlugStr.includes("mang") || catNameStr.includes("mang"))
      ) return true;

      // Gold Jewellery
      if (
        (sku.startsWith("DW-GL-") || sku.startsWith("DW-G-") || sku.startsWith("RJ-GL-") || sku.startsWith("GL-")) &&
        (catSlugStr.includes("gold") || catNameStr.includes("gold"))
      ) return true;

      // Diamond Jewellery
      if (
        (sku.startsWith("DW-DM-") || sku.startsWith("DW-D-") || sku.startsWith("RJ-DM-") || sku.startsWith("DM-")) &&
        (catSlugStr.includes("diam") || catNameStr.includes("diam"))
      ) return true;

      // Bridal Collection
      if (
        (sku.startsWith("DW-BD-") || sku.startsWith("RJ-BD-") || sku.startsWith("BD-")) &&
        (catSlugStr.includes("brid") || catNameStr.includes("brid"))
      ) return true;

      // Generic DW-[Letter]- match against category starting letter
      const dwMatch = sku.match(/^DW-([A-Z]{1,2})-/);
      if (dwMatch) {
        const letter = dwMatch[1];
        const catFirstLetter = cat.name?.trim().charAt(0).toUpperCase();
        if (letter === catFirstLetter) {
          return true;
        }
      }
    }

    // 3. Fallback: Product Name keyword matching if categoryId was missing
    const prodName = String(p.name || "").toLowerCase();
    if (prodName) {
      if (catNameStr.includes("neck") && (prodName.includes("necklace") || prodName.includes("choker") || prodName.includes("rani haar") || prodName.includes("haar"))) return true;
      if (catNameStr.includes("ring") && (prodName.includes("ring") || prodName.includes("band") || prodName.includes("solitaire ring"))) return true;
      if (catNameStr.includes("ear") && (prodName.includes("earring") || prodName.includes("jhumki") || prodName.includes("stud") || prodName.includes("chandelier"))) return true;
      if ((catNameStr.includes("bang") || catNameStr.includes("brac")) && (prodName.includes("bangle") || prodName.includes("bracelet") || prodName.includes("kada") || prodName.includes("cuff"))) return true;
      if (catNameStr.includes("brid") && (prodName.includes("bridal") || prodName.includes("mathapatti") || prodName.includes("nath") || prodName.includes("dulhan"))) return true;
      if (catNameStr.includes("diam") && (prodName.includes("diamond") || prodName.includes("solitaire") || prodName.includes("eternity"))) return true;
      if (catNameStr.includes("gold") && (prodName.includes("gold") || prodName.includes("temple") || prodName.includes("antique"))) return true;
    }

    return false;
  }, []);

  // Active Category Object (if inside a folder)
  const currentCategory = useMemo(() => {
    if (!selectedFolderId || selectedFolderId === "all" || selectedFolderId === "uncategorized") return null;
    const target = String(selectedFolderId).toLowerCase().trim();
    const targetClean = target.replace(/[^a-z0-9]/g, "");

    return (
      categories.find((c) => {
        const cId = String(c._id || "").toLowerCase().trim();
        const cSlug = String(c.slug || "").toLowerCase().trim();
        const cName = String(c.name || "").toLowerCase().trim();
        const cSlugClean = cSlug.replace(/[^a-z0-9]/g, "");
        const cNameClean = cName.replace(/[^a-z0-9]/g, "");

        return (
          cId === target ||
          cSlug === target ||
          cName === target ||
          (cSlugClean && targetClean && cSlugClean === targetClean) ||
          (cNameClean && targetClean && cNameClean === targetClean) ||
          (cNameClean && targetClean && (cNameClean.includes(targetClean) || targetClean.includes(cNameClean)))
        );
      }) || null
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
    } else if (sortBy === "qty-desc") {
      result.sort((a, b) => (b.quantity ?? 0) - (a.quantity ?? 0));
    } else if (sortBy === "qty-asc") {
      result.sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0));
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
    setProductDeleting(true);
    try {
      const res = await fetch(`/api/products/${deleteProductTarget._id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setDeleteProductTarget(null);
        await fetchProducts();
        showToast("Product deleted successfully");
      } else {
        showToast(data.error || "Failed to delete product");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting product");
    } finally {
      setProductDeleting(false);
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

  const handleCatImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      setCatError("Image file size exceeds 10MB limit.");
      return;
    }

    setCatUploading(true);
    setCatError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setCatError(data.error || "Failed to upload image. Please try again.");
        return;
      }
      setCatForm((prev) => ({ ...prev, image: data.url }));
    } catch {
      setCatError("Network error while uploading category image.");
    } finally {
      setCatUploading(false);
      if (e.target) {
        e.target.value = "";
      }
    }
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
      setCatForm(EMPTY_CAT_FORM);
      if (data.category) {
        setCategories((prev) => {
          const catId = data.category._id || data.category.id;
          const exists = prev.some((c) => c._id === catId || c.slug === data.category.slug);
          if (exists) {
            return prev.map((c) => (c._id === catId || c.slug === data.category.slug ? { ...c, ...data.category } : c));
          }
          return [...prev, data.category];
        });
      }
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
    const target = deleteCategoryTarget;
    const targetId = target._id || target.slug;
    setCategoryDeleting(true);

    // Optimistically remove from state immediately
    setCategories((prev) =>
      prev.filter((c) => c._id !== target._id && c.slug !== target.slug && c.name !== target.name)
    );

    try {
      const res = await fetch(`/api/categories/${encodeURIComponent(targetId)}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setDeleteCategoryTarget(null);
        if (selectedFolderId === target._id || selectedFolderId === target.slug) {
          setParam("category", null);
        }
        await fetchCategories();
        await fetchProducts();
        showToast("Category folder deleted");
      } else {
        showToast(data.error || "Failed to delete category");
        await fetchCategories();
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting category");
      await fetchCategories();
    } finally {
      setCategoryDeleting(false);
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
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e1e1e] border border-[#d43d8a] text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-[#d43d8a]" />
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
              <Package className="w-3.5 h-3.5 text-[#B81862]" />
              Catalogue Management
            </span>
            {selectedFolderId && (
              <>
                <ChevronRight className="w-3 h-3 text-[var(--muted)]" />
                <button
                  type="button"
                  onClick={() => setParam("category", null)}
                  className="hover:text-[var(--foreground)] transition cursor-pointer"
                >
                  Collections
                </button>
                <ChevronRight className="w-3 h-3 text-[var(--muted)]" />
                <span className="text-[#d43d8a] font-semibold">
                  {currentCategory ? currentCategory.name : selectedFolderId === "all" ? "All Pieces" : "Uncategorized"}
                </span>
              </>
            )}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--foreground)] tracking-tight">
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
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--foreground)] hover:border-[#B81862] hover:text-[#d43d8a] text-xs font-semibold transition shadow-sm"
          >
            <FolderPlus className="w-4 h-4 text-[#B81862]" />
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
                <Tag className="w-3.5 h-3.5 text-[#B81862]" />
                Categories
              </span>
              <span className="text-2xl font-bold text-[var(--foreground)] mt-2">
                {categories.length}
              </span>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#B81862]" />
                Total Products
              </span>
              <span className="text-2xl font-bold text-[var(--foreground)] mt-2">
                {products.length}
              </span>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Live on Store
              </span>
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                {products.filter((p) => p.isPublished).length}
              </span>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-[#d43d8a] fill-[#d43d8a]/30" />
                Featured Pieces
              </span>
              <span className="text-2xl font-bold text-[#B81862] dark:text-[#d43d8a] mt-2">
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
                className="w-full pl-10 pr-9 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[#B81862] focus:ring-1 focus:ring-[#B81862]/20 transition"
              />
              {folderSearch && (
                <button
                  type="button"
                  onClick={() => setFolderSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Folders Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#B81862]" />
              <span className="text-xs text-[var(--muted)]">Loading collections & products...</span>
            </div>
          ) : visibleCategories.length === 0 ? (
            <div className="p-12 text-center bg-[var(--card)] border border-[var(--border)] rounded-3xl space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#B81862]/10 border border-[#B81862]/20 text-[#B81862] flex items-center justify-center mx-auto">
                <FolderPlus className="w-7 h-7" />
              </div>
              <h3 className="font-serif text-lg font-bold text-[var(--foreground)]">No Category Folders Found</h3>
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
                    className="group relative rounded-3xl overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-[#B81862]/15 transition-all duration-400 hover:-translate-y-1.5 border border-[#2a2a2a] hover:border-[#d43d8a]/50"
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
                            <Tag className="w-16 h-16 mx-auto text-[#d43d8a] mb-2" />
                            <span className="text-[#d43d8a] text-xs font-semibold tracking-widest uppercase">Collection</span>
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
                        <Link
                          href={`/admin/products/new?categoryId=${cat._id}`}
                          title={`Add new piece to ${cat.name}`}
                          className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-[#B81862] hover:text-white transition flex items-center justify-center shadow-lg"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => openEditCategoryModal(cat, e)}
                          title="Edit Category"
                          className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-[#d43d8a] hover:text-black hover:border-[#d43d8a] transition flex items-center justify-center shadow-lg"
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
                      <h2 className="font-serif text-xl font-bold text-white group-hover:text-[#d43d8a] transition-colors leading-tight mb-1">
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
                        <span className="text-xs font-bold text-[#d43d8a] group-hover:translate-x-1 transition-transform flex items-center gap-1">
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
                      ● Needs Category
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
              className="flex items-center gap-2 text-xs font-bold text-[#d43d8a] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to All Categories</span>
            </button>

            {currentCategory && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditCategoryModal(currentCategory)}
                  className="px-3 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit className="w-3 h-3 text-[#B81862]" />
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
                  className="w-full pl-10 pr-9 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[#B81862] transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setParam("search", null)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] p-1"
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
                  className="px-3 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] focus:outline-none focus:border-[#B81862] transition cursor-pointer min-w-[125px]"
                >
                  <option value="all" className="bg-[var(--surface)] text-[var(--foreground)]">All Stock</option>
                  <option value="in_stock" className="bg-[var(--surface)] text-[var(--foreground)]">In Stock</option>
                  <option value="made_to_order" className="bg-[var(--surface)] text-[var(--foreground)]">Made to Order</option>
                </select>

                {/* Publish status */}
                <select
                  value={statusFilter}
                  onChange={(e) => setParam("status", e.target.value)}
                  className="px-3 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] focus:outline-none focus:border-[#B81862] transition cursor-pointer min-w-[115px]"
                >
                  <option value="all" className="bg-[var(--surface)] text-[var(--foreground)]">All Status</option>
                  <option value="published" className="bg-[var(--surface)] text-[var(--foreground)]">Live Only</option>
                  <option value="draft" className="bg-[var(--surface)] text-[var(--foreground)]">Draft Only</option>
                </select>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setParam("sort", e.target.value)}
                  className="px-3 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] focus:outline-none focus:border-[#B81862] transition cursor-pointer min-w-[140px]"
                >
                  <option value="newest" className="bg-[var(--surface)] text-[var(--foreground)]">Newest First</option>
                  <option value="oldest" className="bg-[var(--surface)] text-[var(--foreground)]">Oldest First</option>
                  <option value="price-desc" className="bg-[var(--surface)] text-[var(--foreground)]">Price: High to Low</option>
                  <option value="price-asc" className="bg-[var(--surface)] text-[var(--foreground)]">Price: Low to High</option>
                  <option value="qty-desc" className="bg-[var(--surface)] text-[var(--foreground)]">Quantity: High to Low</option>
                  <option value="qty-asc" className="bg-[var(--surface)] text-[var(--foreground)]">Quantity: Low to High</option>
                  <option value="name-asc" className="bg-[var(--surface)] text-[var(--foreground)]">Name: A to Z</option>
                </select>

                {/* View toggle */}
                <div className="flex items-center rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === "list"
                        ? "bg-[#B81862] text-white shadow-xs font-bold"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                    title="Table View"
                  >
                    <List className="w-4 h-4 text-current" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-lg transition ${
                      viewMode === "grid"
                        ? "bg-[#B81862] text-white shadow-xs font-bold"
                        : "text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4 text-current" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[var(--muted)] pt-1 border-t border-[var(--border)]/40">
              <span>
                Showing <strong className="text-[var(--foreground)] font-semibold">{displayedProducts.length}</strong> {displayedProducts.length === 1 ? "piece" : "pieces"}
                {currentCategory && <span> in <span className="text-[#B81862] dark:text-[#d43d8a] font-medium">{currentCategory.name}</span></span>}
              </span>
              {(searchQuery || stockFilter !== "all" || statusFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    const p = new URLSearchParams();
                    if (selectedFolderId) p.set("category", selectedFolderId);
                    router.push(`/admin/products?${p.toString()}`);
                  }}
                  className="text-xs text-[#d43d8a] hover:underline font-semibold"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Products Empty State */}
          {displayedProducts.length === 0 ? (
            <div className="p-16 text-center bg-[var(--card)] border border-[var(--border)] rounded-3xl space-y-4">
              <Package className="w-12 h-12 text-[#B81862]/60 mx-auto" />
              <h3 className="font-serif text-lg font-bold text-[var(--foreground)]">
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
                      <th className="py-3.5 px-4 w-[14%]">Product ID</th>
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
                                  className="font-semibold text-[var(--foreground)] hover:text-[#B81862] dark:hover:text-[#d43d8a] transition block truncate text-sm"
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
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-xs text-[var(--muted)] bg-[var(--surface-2)] px-2.5 py-1 rounded-lg border border-[var(--border)] inline-block w-fit">
                                {p.sku}
                              </span>
                              {p.location && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-[#B81862] dark:text-[#d43d8a] font-medium truncate max-w-[140px]" title={`Location: ${p.location}`}>
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span>{p.location}</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-bold text-[var(--foreground)] text-sm">
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
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25"
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                p.stockStatus === "in_stock" ? "bg-emerald-500" : "bg-amber-500"
                              }`} />
                              {p.stockStatus === "in_stock"
                                ? `In Stock (${p.quantity ?? 0})`
                                : `Made to Order (${p.quantity ?? 0})`}
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
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25"
                                  : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/25"
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
                                  ? "text-[#d43d8a] hover:opacity-80"
                                  : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              }`}
                              title={p.isFeatured ? "Featured Piece" : "Mark Featured"}
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  p.isFeatured ? "fill-[#d43d8a]" : ""
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
                                className="p-2 rounded-xl text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition"
                                title="Edit Product Details"
                              >
                                <Edit className="w-4 h-4" />
                              </Link>

                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() => setDeleteProductTarget(p)}
                                className="p-2 rounded-xl text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
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
                    className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden group hover:border-[#B81862]/40 transition flex flex-col justify-between"
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

                      {/* Top-left Badges */}
                      <div className="absolute top-2.5 left-2.5 flex flex-wrap items-center gap-1.5 z-10">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide backdrop-blur-md shadow-md border ${
                            p.isPublished
                              ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40"
                              : "bg-amber-950/80 text-amber-300 border-amber-500/40"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.isPublished ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                            }`}
                          />
                          {p.isPublished ? "Live" : "Draft"}
                        </span>
                        {p.isFeatured && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-[#B81862] text-white border border-pink-300/30 shadow-md backdrop-blur-md">
                            <Star className="w-2.5 h-2.5 fill-white" />
                            Featured
                          </span>
                        )}
                      </div>

                      {/* Hover action overlay */}
                      <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition duration-200 z-10">
                        <Link
                          href={`/admin/products/${p._id}`}
                          className="w-8 h-8 bg-black/60 hover:bg-[#B81862] backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center text-white transition shadow-md"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteProductTarget(p)}
                          className="w-8 h-8 bg-black/60 hover:bg-red-600 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center text-white transition shadow-md cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3.5 space-y-2.5">
                      <div>
                        <h3 className="font-semibold text-[var(--foreground)] text-sm line-clamp-1" title={p.name}>
                          {p.name}
                        </h3>
                        <div className="flex items-center justify-between mt-1 gap-2">
                          <span className="font-mono text-[10px] text-[var(--muted)] truncate">
                            {p.sku}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 inline-flex items-center gap-1 ${
                              (p.quantity ?? 0) > 5
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                : (p.quantity ?? 0) > 0
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                            }`}
                          >
                            Qty: <strong className="font-bold">{p.quantity ?? 0}</strong>
                          </span>
                        </div>
                        {p.location && (
                          <div className="flex items-center gap-1 text-[10px] text-[#B81862] dark:text-[#d43d8a] font-medium mt-1 truncate" title={`Location: ${p.location}`}>
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{p.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
                        <div>
                          <span className="font-bold text-[var(--foreground)] text-sm">
                            ₹{Number(p.discountPrice || p.price).toLocaleString("en-IN")}
                          </span>
                          {p.discountPrice && (
                            <span className="block text-[10px] text-[var(--muted)] line-through">
                              ₹{Number(p.price).toLocaleString("en-IN")}
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/admin/products/${p._id}`}
                          className="text-xs font-bold text-[#B81862] dark:text-[#d43d8a] hover:underline transition"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowCatModal(false)}
        >
          <div
            className="bg-[var(--surface)] border border-[var(--border)] rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#d43d8a]/10 border border-[#d43d8a]/20 flex items-center justify-center text-[#d43d8a]">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[var(--foreground)]">
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
                className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {catError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{catError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[var(--foreground)] block mb-1">
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

              {/* Category Cover Image Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#B81862]" />
                    <span>Category Cover Image</span>
                  </label>
                  <span className="text-[10px] text-[var(--muted)] font-medium">
                    Upload image or paste URL
                  </span>
                </div>

                {catForm.image ? (
                  <div className="relative rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)] group shadow-sm">
                    <div className="h-32 w-full relative bg-[#111]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={catForm.image}
                        alt="Category Cover"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getCategoryPlaceholder(catForm.name);
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => catFileInputRef.current?.click()}
                          disabled={catUploading}
                          className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-bold shadow-lg hover:bg-gray-100 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setCatForm((prev) => ({ ...prev, image: "" }))}
                          disabled={catUploading}
                          className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold shadow-lg hover:bg-red-700 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      </div>
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-white text-[10px] font-semibold border border-white/10">
                        Cover Photo
                      </div>
                    </div>
                    <div className="p-2.5 bg-[var(--surface)] border-t border-[var(--border)] flex items-center justify-between gap-2 text-xs">
                      <span className="text-[11px] text-[var(--muted)] truncate font-mono max-w-[240px]">
                        {catForm.image}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCatForm((prev) => ({ ...prev, image: "" }))}
                        className="text-xs text-red-500 hover:text-red-600 font-semibold cursor-pointer shrink-0"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label
                      className={`relative rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[#B81862] bg-[var(--surface-2)]/60 hover:bg-[#B81862]/5 p-4 sm:p-5 flex flex-col items-center justify-center text-center cursor-pointer transition group ${
                        catUploading ? "opacity-75 pointer-events-none" : ""
                      }`}
                    >
                      {catUploading ? (
                        <div className="py-2 flex flex-col items-center">
                          <Loader2 className="w-7 h-7 text-[#B81862] animate-spin mb-2" />
                          <span className="text-xs font-semibold text-[var(--foreground)]">
                            Uploading image to Cloudinary...
                          </span>
                          <span className="text-[10px] text-[var(--muted)] mt-0.5">Please wait</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-2xl bg-[#B81862]/10 border border-[#B81862]/20 flex items-center justify-center text-[#B81862] mb-2 group-hover:scale-110 transition">
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-[var(--foreground)]">
                            Click to upload category cover
                          </span>
                          <span className="text-[10px] text-[var(--muted)] mt-1">
                            PNG, JPG, WEBP up to 10MB
                          </span>
                        </>
                      )}
                      <input
                        ref={catFileInputRef}
                        id="cat-image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleCatImageUpload}
                        disabled={catUploading}
                        className="hidden"
                      />
                    </label>

                    {/* Direct Image URL input */}
                    <div className="relative">
                      <input
                        id="cat-image-input"
                        type="url"
                        value={catForm.image}
                        onChange={(e) => setCatForm({ ...catForm, image: e.target.value })}
                        placeholder="Or paste direct image URL (https://...)"
                        className="input text-xs w-full"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--foreground)] block mb-1">
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
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] cursor-pointer text-xs font-semibold text-[var(--foreground)]">
                    <input
                      type="checkbox"
                      checked={catForm.isActive}
                      onChange={(e) => setCatForm({ ...catForm, isActive: e.target.checked })}
                      className="accent-[#B81862] rounded w-4 h-4"
                    />
                    <span>Active in Store</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={catSaving || catUploading}
                  className="btn-primary text-xs flex items-center gap-2"
                >
                  {(catSaving || catUploading) && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{catSaving ? "Saving..." : catUploading ? "Uploading..." : catEditTarget ? "Save Changes" : "Create Folder"}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-sm w-full p-6">
            <h3 className="font-bold text-[var(--foreground)] text-lg mb-2">Delete Product?</h3>
            <p className="text-xs text-[var(--muted)] mb-6">
              Are you sure you want to permanently delete{" "}
              <strong className="text-[var(--foreground)]">{deleteProductTarget.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                disabled={productDeleting}
                onClick={() => setDeleteProductTarget(null)}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={productDeleting}
                onClick={confirmDeleteProduct}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
              >
                {productDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{productDeleting ? "Deleting..." : "Delete Piece"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: DELETE CATEGORY CONFIRMATION
      ────────────────────────────────────────────────────────────── */}
      {deleteCategoryTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl max-w-sm w-full p-6">
            <h3 className="font-bold text-[var(--foreground)] text-lg mb-2">Delete Category Folder?</h3>
            <p className="text-xs text-[var(--muted)] mb-6">
              This will delete the category folder{" "}
              <strong className="text-[var(--foreground)]">{deleteCategoryTarget.name}</strong>. Products previously in this category will not be lost, but will move to Uncategorized.
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                disabled={categoryDeleting}
                onClick={() => setDeleteCategoryTarget(null)}
                className="btn-ghost text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={categoryDeleting}
                onClick={confirmDeleteCategory}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
              >
                {categoryDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{categoryDeleting ? "Deleting..." : "Delete Category"}</span>
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
          <Loader2 className="w-8 h-8 animate-spin text-[#B81862]" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
