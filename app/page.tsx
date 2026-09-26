"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Lock,
  MessageCircle,
  Package,
  Sparkles,
  X,
  Phone,
  Check,
  User,
  ShoppingBag,
  Loader2,
  AlertCircle,
  Plus,
  Minus,
} from "lucide-react";
import { IProduct, ICategory } from "@/types";
import { getProductPlaceholder } from "@/lib/placeholderImages";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP || "919876543210";
const VISITOR_KEY = "rj_visitor_info";

interface VisitorInfo {
  name: string;
  phone: string;
}

export default function SimpleCataloguePage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);

  // Visitor info modal
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo | null>(null);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [visitorForm, setVisitorForm] = useState({ name: "", phone: "" });
  const [visitorFormError, setVisitorFormError] = useState("");
  const phoneRef = useRef<HTMLInputElement>(null);

  // Request item modal
  const [requestProduct, setRequestProduct] = useState<IProduct | null>(null);
  const [requestQty, setRequestQty] = useState(1);
  const [requestDesc, setRequestDesc] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState("");

  // Load visitor from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(VISITOR_KEY);
    if (stored) {
      try {
        setVisitorInfo(JSON.parse(stored));
      } catch {
        localStorage.removeItem(VISITOR_KEY);
      }
    } else {
      // Show modal after short delay so page loads first
      const t = setTimeout(() => setShowVisitorModal(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  // Fetch products and categories
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/public/products?sort=newest").then((r) => r.json()),
          fetch("/api/public/categories").then((r) => r.json()),
        ]);

        if (prodRes.success && Array.isArray(prodRes.products)) {
          setProducts(prodRes.products);
        }
        if (catRes.success && Array.isArray(catRes.categories)) {
          setCategories(catRes.categories);
        }
      } catch (err) {
        console.error("Failed to load catalogue:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    const activeCat = categories.find(
      (c) => c._id === selectedCategory || c.slug === selectedCategory
    );

    return products.filter((p) => {
      if (selectedCategory !== "all") {
        const catObj = typeof p.categoryId === "object" && p.categoryId !== null
          ? (p.categoryId as { _id?: string; slug?: string; name?: string })
          : (p.category as { _id?: string; slug?: string; name?: string } | undefined);
        const catId = typeof p.categoryId === "string" ? p.categoryId : catObj?._id;
        const catSlug = catObj?.slug;
        const catName = catObj?.name?.toLowerCase();

        const match =
          catId === selectedCategory ||
          catSlug === selectedCategory ||
          (activeCat && (
            catId === activeCat._id ||
            (catSlug && activeCat.slug && catSlug === activeCat.slug) ||
            (catName && activeCat.name && catName === activeCat.name.toLowerCase())
          ));

        if (!match) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesDesc = (p.shortDescription || p.description || "").toLowerCase().includes(q);
        const pCatName = (typeof p.categoryId === "object" ? (p.categoryId as { name?: string })?.name : null) || p.category?.name;
        const matchesCat = pCatName?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }
      return true;
    });
  }, [products, selectedCategory, search, categories]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

  const getPrimaryImage = (p: IProduct) => {
    if (p.images && p.images.length > 0) {
      const primary = p.images.find((img) => img.isPrimary);
      return primary?.url || p.images[0].url;
    }
    const catName =
      (typeof p.categoryId === "object" && p.categoryId !== null
        ? (p.categoryId as { name?: string })?.name
        : null) || p.category?.name || "";
    return getProductPlaceholder(catName, p.name);
  };

  // Save visitor info
  const handleSaveVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    setVisitorFormError("");
    if (!visitorForm.name.trim()) {
      setVisitorFormError("Please enter your name.");
      return;
    }
    if (!visitorForm.phone.trim() || !/^[0-9+\-\s()]{7,15}$/.test(visitorForm.phone.trim())) {
      setVisitorFormError("Please enter a valid phone number.");
      return;
    }
    const info = { name: visitorForm.name.trim(), phone: visitorForm.phone.trim() };
    localStorage.setItem(VISITOR_KEY, JSON.stringify(info));
    setVisitorInfo(info);
    setShowVisitorModal(false);
  };

  // Open request modal — prompt for visitor info first if missing
  const openRequestModal = (product: IProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    setRequestProduct(product);
    setRequestQty(1);
    setRequestDesc("");
    setRequestSuccess(false);
    setRequestError("");
    if (!visitorInfo) {
      // Will open visitor modal; after saving, reopen request
      setShowVisitorModal(true);
    }
  };

  // Submit request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestProduct || !visitorInfo) return;
    setRequestSubmitting(true);
    setRequestError("");
    try {
      const res = await fetch("/api/public/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: requestProduct._id,
          productName: requestProduct.name,
          productSku: requestProduct.sku,
          visitorName: visitorInfo.name,
          visitorPhone: visitorInfo.phone,
          quantity: requestQty,
          description: requestDesc.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit request.");
      }
      setRequestSuccess(true);
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setRequestSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d0d] text-[#f5f5f5]">

      {/* ── VISITOR INFO MODAL ─────────────────────────────────────── */}
      {showVisitorModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#161616] border border-[#2e2e2e] rounded-3xl max-w-sm w-full p-7 shadow-2xl relative">
            {/* Skip */}
            <button
              onClick={() => setShowVisitorModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#777] hover:text-white hover:bg-white/5 transition"
              title="Skip for now"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#B4833E] to-[#D4AF37] flex items-center justify-center mx-auto mb-4 shadow-lg">
                <User className="w-7 h-7 text-black" />
              </div>
              <h2 className="font-serif text-xl font-bold text-white">Welcome to Royal Jewellers</h2>
              <p className="text-xs text-[#888] mt-1.5 leading-relaxed">
                Enter your details to browse and request items from our exclusive collection.
              </p>
            </div>

            <form onSubmit={handleSaveVisitor} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={visitorForm.name}
                  onChange={(e) => { setVisitorForm(f => ({ ...f, name: e.target.value })); setVisitorFormError(""); }}
                  placeholder="e.g. Priya Sharma"
                  autoFocus
                  className="w-full px-4 py-2.5 bg-[#1e1e1e] border border-[#333] rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#B4833E] transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                  Phone Number *
                </label>
                <input
                  ref={phoneRef}
                  type="tel"
                  value={visitorForm.phone}
                  onChange={(e) => { setVisitorForm(f => ({ ...f, phone: e.target.value })); setVisitorFormError(""); }}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2.5 bg-[#1e1e1e] border border-[#333] rounded-xl text-sm text-white placeholder-[#555] focus:outline-none focus:border-[#B4833E] transition"
                />
              </div>

              {visitorFormError && (
                <p className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {visitorFormError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#B4833E] to-[#D4AF37] text-black font-bold text-sm shadow-md hover:opacity-90 transition"
              >
                Continue to Catalogue
              </button>
              <button
                type="button"
                onClick={() => setShowVisitorModal(false)}
                className="w-full py-2 text-xs text-[#666] hover:text-[#999] transition"
              >
                Skip for now
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── REQUEST ITEM MODAL ─────────────────────────────────────── */}
      {requestProduct && visitorInfo && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => { if (!requestSubmitting) setRequestProduct(null); }}
        >
          <div
            className="bg-[#161616] border border-[#2e2e2e] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="font-serif text-lg font-bold text-white">Request Item</h2>
                <p className="text-xs text-[#888] mt-0.5">Submit a request and we'll contact you</p>
              </div>
              {!requestSubmitting && (
                <button
                  onClick={() => setRequestProduct(null)}
                  className="p-1.5 rounded-full text-[#777] hover:text-white hover:bg-white/5 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {requestSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="font-serif text-lg font-bold text-white">Request Submitted!</h3>
                <p className="text-xs text-[#888] leading-relaxed">
                  Thank you, <span className="text-white font-semibold">{visitorInfo.name}</span>! We&apos;ll contact you at{" "}
                  <span className="text-[#D4AF37] font-semibold">{visitorInfo.phone}</span> regarding{" "}
                  <span className="text-white font-semibold">{requestProduct.name}</span>.
                </p>
                <button
                  onClick={() => setRequestProduct(null)}
                  className="px-6 py-2.5 rounded-xl bg-[#1e1e1e] border border-[#333] text-sm font-semibold text-white hover:border-[#B4833E] transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                {/* Product Info */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#1e1e1e] border border-[#2a2a2a]">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#111]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getPrimaryImage(requestProduct)} alt={requestProduct.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{requestProduct.name}</p>
                    <p className="text-xs text-[#888] font-mono">SKU: {requestProduct.sku}</p>
                  </div>
                </div>

                {/* Customer Info (read-only) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#1a1a1a] border border-[#262626]">
                    <p className="text-[10px] text-[#666] uppercase tracking-wider font-semibold mb-0.5">Your Name</p>
                    <p className="text-sm font-semibold text-white truncate">{visitorInfo.name}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1a1a1a] border border-[#262626]">
                    <p className="text-[10px] text-[#666] uppercase tracking-wider font-semibold mb-0.5">Phone</p>
                    <p className="text-sm font-semibold text-white font-mono">{visitorInfo.phone}</p>
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#888] mb-2">
                    Quantity *
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setRequestQty(Math.max(1, requestQty - 1))}
                      className="w-9 h-9 rounded-xl bg-[#1e1e1e] border border-[#333] text-white flex items-center justify-center hover:border-[#B4833E] transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-bold text-lg text-white">{requestQty}</span>
                    <button
                      type="button"
                      onClick={() => setRequestQty(requestQty + 1)}
                      className="w-9 h-9 rounded-xl bg-[#1e1e1e] border border-[#333] text-white flex items-center justify-center hover:border-[#B4833E] transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-[#666]">piece{requestQty > 1 ? "s" : ""}</span>
                  </div>
                </div>

                {/* Description (optional) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#888] mb-1.5">
                    Note / Special Request <span className="text-[#555] normal-case font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={requestDesc}
                    onChange={(e) => setRequestDesc(e.target.value)}
                    placeholder="Any specific requirements, customisation, or questions..."
                    className="w-full px-4 py-2.5 bg-[#1e1e1e] border border-[#333] rounded-xl text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#B4833E] transition resize-none"
                  />
                </div>

                {requestError && (
                  <p className="flex items-center gap-1.5 text-xs text-red-400">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {requestError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={requestSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#B4833E] to-[#D4AF37] text-black font-bold text-sm shadow-md hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {requestSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      Submit Request
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-[#141414]/90 backdrop-blur-md border-b border-[#262626]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#B4833E] to-[#D4AF37] flex items-center justify-center font-bold text-black text-lg shadow-md">
              R
            </div>
            <div>
              <span className="block font-serif font-bold text-lg text-white leading-tight">Royal Jewellers</span>
              <span className="block text-[11px] text-[#B4833E] font-medium tracking-wider uppercase">Product Catalogue</span>
            </div>
          </a>

          {/* Search Input */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#777] pointer-events-none" />
              <input
                id="search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name or description..."
                className="w-full pl-10 pr-4 py-2 bg-[#1c1c1c] border border-[#2e2e2e] rounded-full text-sm text-white placeholder-[#777] focus:outline-none focus:border-[#B4833E] transition"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777] hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2.5">
            {visitorInfo ? (
              <button
                onClick={() => setShowVisitorModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1e1e1e] text-[#B4833E] border border-[#B4833E]/30 hover:border-[#B4833E] transition"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline max-w-[100px] truncate">{visitorInfo.name}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowVisitorModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1e1e1e] text-[#aaa] border border-[#2e2e2e] hover:border-[#B4833E] hover:text-white transition"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            <a
              id="whatsapp-header"
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi! I am interested in your jewellery catalogue.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/25 transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">WhatsApp</span>
            </a>

            <Link
              id="admin-login-link"
              href="/admin/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#1e1e1e] text-[#a0a0a0] border border-[#2e2e2e] hover:text-white hover:border-[#B4833E] transition"
            >
              <Lock className="w-3 h-3 text-[#B4833E]" />
              <span>Admin</span>
            </Link>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="sm:hidden px-4 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-8 py-1.5 bg-[#1c1c1c] border border-[#2e2e2e] rounded-full text-xs text-white placeholder-[#777] focus:outline-none focus:border-[#B4833E]"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777] hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO & CATEGORY BAR ────────────────────────────────────── */}
      <section className="border-b border-[#222] bg-gradient-to-b from-[#141414] to-[#0d0d0d] py-8 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#B4833E]/15 text-[#D4AF37] border border-[#B4833E]/30 mb-3">
            <Sparkles className="w-3 h-3" />
            Curated Jewellery Collection
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
            Explore Our Catalogue
          </h1>
          <p className="mt-2 text-sm text-[#888] max-w-xl mx-auto">
            Browse our handcrafted gold, natural solitaires, and heirloom bridal pieces. Each item is BIS hallmarked and certified.
          </p>
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-2 overflow-x-auto pb-2 px-2 no-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                selectedCategory === "all"
                  ? "bg-[#B4833E] text-black shadow-md font-bold"
                  : "bg-[#1a1a1a] text-[#aaa] hover:text-white hover:bg-[#252525] border border-[#282828]"
              }`}
            >
              All Products ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                  selectedCategory === cat._id
                    ? "bg-[#B4833E] text-black shadow-md font-bold"
                    : "bg-[#1a1a1a] text-[#aaa] hover:text-white hover:bg-[#252525] border border-[#282828]"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── PRODUCT GRID ──────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#777]">
            Showing <span className="text-white font-bold">{filteredProducts.length}</span> items
            {selectedCategory !== "all" && (
              <> in <span className="text-[#D4AF37]">{categories.find((c) => c._id === selectedCategory)?.name}</span></>
            )}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-[#161616] rounded-2xl border border-[#222] p-4 animate-pulse space-y-3">
                <div className="w-full aspect-square bg-[#222] rounded-xl" />
                <div className="h-4 bg-[#252525] rounded w-3/4" />
                <div className="h-5 bg-[#252525] rounded w-1/2" />
                <div className="h-3 bg-[#252525] rounded w-1/3" />
                <div className="h-3 bg-[#252525] rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-[#141414] rounded-2xl border border-[#222] max-w-md mx-auto p-6">
            <Package className="w-12 h-12 text-[#555] mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-white mb-1">No products found</h3>
            <p className="text-xs text-[#888] mb-4">
              {search ? `No products matched "${search}". Try searching another name.` : "No items available in this category yet."}
            </p>
            {(search || selectedCategory !== "all") && (
              <button
                onClick={() => { setSearch(""); setSelectedCategory("all"); }}
                className="px-4 py-2 bg-[#222] hover:bg-[#333] text-xs font-semibold rounded-lg text-white transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const imageUrl = getPrimaryImage(product);
              const qty = product.quantity ?? 10;
              const isLowStock = qty > 0 && qty <= 3;
              const isOutOfStock = qty <= 0 || product.stockStatus === "out_of_stock";

              return (
                <div
                  key={product._id}
                  onClick={() => setSelectedProduct(product)}
                  className="group bg-[#161616] hover:bg-[#1b1b1b] rounded-2xl border border-[#262626] hover:border-[#B4833E]/50 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(180,131,62,0.15)]"
                >
                  {/* Image */}
                  <div className="relative w-full aspect-square bg-[#101010] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                    {/* Stock badge */}
                    <div className="absolute top-3 right-3">
                      {isOutOfStock ? (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-900/80 text-red-200 border border-red-700/50 backdrop-blur-sm">Out of Stock</span>
                      ) : isLowStock ? (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-900/80 text-amber-200 border border-amber-700/50 backdrop-blur-sm">Only {qty} left!</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-black/60 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">{qty} available</span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Category */}
                      {(() => {
                        const catObj = typeof product.categoryId === "object" && product.categoryId !== null
                          ? (product.categoryId as { name?: string })
                          : (product.category as { name?: string } | undefined);
                        const cName = catObj?.name || categories.find((c) => c._id === product.categoryId)?.name;
                        return cName ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B4833E] block mb-1">{cName}</span>
                        ) : null;
                      })()}

                      <h2 className="font-serif font-bold text-base text-white group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                        {product.name}
                      </h2>

                      {/* Price */}
                      <div className="mt-1.5 flex items-baseline gap-2">
                        <span className="font-bold text-lg text-[#D4AF37]">{formatPrice(product.price)}</span>
                        {product.discountPrice && (
                          <span className="text-xs text-[#777] line-through">{formatPrice(product.discountPrice)}</span>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="mt-2 flex items-center gap-1.5 text-xs">
                        <Package className="w-3.5 h-3.5 text-[#B4833E]" />
                        <span className="text-[#a0a0a0]">Quantity:</span>
                        <span className={`font-semibold ${isOutOfStock ? "text-red-400" : isLowStock ? "text-amber-400" : "text-emerald-400"}`}>
                          {isOutOfStock ? "Out of Stock" : `${qty} units`}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="mt-2.5 text-xs text-[#888] line-clamp-2 leading-relaxed">
                        {product.shortDescription || product.description || "Handcrafted luxury fine jewellery design hallmarked to perfection."}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-[#222] grid grid-cols-2 gap-2">
                      {/* Request Item Button */}
                      <button
                        onClick={(e) => openRequestModal(product, e)}
                        className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold bg-[#B4833E]/10 hover:bg-[#B4833E]/20 text-[#D4AF37] border border-[#B4833E]/25 hover:border-[#B4833E]/50 transition"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Request</span>
                      </button>

                      {/* WhatsApp Enquiry */}
                      <a
                        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                          `Hello, I would like to enquire about: ${product.name} (SKU: ${product.sku || "N/A"}) priced at ${formatPrice(product.price)}.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold bg-[#202020] hover:bg-[#25D366]/20 text-[#ccc] hover:text-[#25D366] border border-[#2d2d2d] hover:border-[#25D366]/40 transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── PRODUCT DETAIL MODAL ──────────────────────────────────── */}
      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-[#161616] border border-[#2e2e2e] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-black/70 text-white hover:bg-black hover:text-[#D4AF37] border border-white/10 transition shadow-md"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Image */}
            <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-[#101010] relative shrink-0 border-b md:border-b-0 md:border-r border-[#262626]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getPrimaryImage(selectedProduct)}
                alt={selectedProduct.name}
                className="w-full h-full object-cover object-center"
              />
              {selectedProduct.isFeatured && (
                <div className="absolute top-3.5 left-3.5">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#D4AF37] text-black shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Featured
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5 sm:p-7 flex-1 flex flex-col justify-between overflow-y-auto space-y-4">
              <div className="space-y-3.5">
                {/* Category & SKU */}
                <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#B4833E]">
                    {(typeof selectedProduct.categoryId === "object" && selectedProduct.categoryId !== null
                      ? (selectedProduct.categoryId as { name?: string })?.name
                      : null) || selectedProduct.category?.name || "Fine Jewellery"}
                  </span>
                  <span className="font-mono text-[11px] text-[#777] bg-[#222] px-2 py-0.5 rounded">
                    SKU: {selectedProduct.sku}
                  </span>
                </div>

                <h2 className="font-serif text-xl sm:text-2xl font-bold text-white leading-snug tracking-tight">
                  {selectedProduct.name}
                </h2>

                {/* Price */}
                <div className="flex items-baseline gap-2.5 pt-1 border-b border-[#262626] pb-3">
                  <span className="text-2xl sm:text-3xl font-bold text-[#D4AF37]">
                    {formatPrice(selectedProduct.discountPrice || selectedProduct.price)}
                  </span>
                  {selectedProduct.discountPrice && (
                    <span className="text-xs text-[#777] line-through font-medium">
                      {formatPrice(selectedProduct.price)}
                    </span>
                  )}
                </div>

                {/* Stock */}
                <div className="p-3 bg-[#1e1e1e] rounded-xl border border-[#2a2a2a] flex items-center justify-between text-xs">
                  <span className="text-[#a0a0a0] flex items-center gap-1.5 font-medium">
                    <Package className="w-4 h-4 text-[#B4833E]" />
                    Available Inventory:
                  </span>
                  <span className="font-bold text-emerald-400">{selectedProduct.quantity ?? 10} units in stock</span>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#888] mb-1">Piece Description</h4>
                  <p className="text-xs sm:text-sm text-[#ccc] leading-relaxed">
                    {selectedProduct.description || selectedProduct.shortDescription || "Handcrafted luxury jewellery with certified hallmarked gold and natural diamonds."}
                  </p>
                </div>
              </div>

              {/* CTAs */}
              <div className="pt-2 space-y-2">
                {/* Request Item */}
                <button
                  onClick={(e) => { setSelectedProduct(null); openRequestModal(selectedProduct, e); }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-[#B4833E] to-[#D4AF37] text-black shadow-md hover:opacity-90 transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Request This Item</span>
                </button>

                {/* WhatsApp CTA */}
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                    `Hello, I would like to purchase/enquire about: ${selectedProduct.name} (SKU: ${selectedProduct.sku || "N/A"}) priced at ${formatPrice(selectedProduct.discountPrice || selectedProduct.price)}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Enquire on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="border-t border-[#222] bg-[#121212] py-6 px-4 text-center text-xs text-[#777]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Royal Jewellers. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/admin/login" className="text-[#aaa] hover:text-[#D4AF37] transition flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#B4833E]" />
              Admin Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
