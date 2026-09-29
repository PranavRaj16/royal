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
        const catObj =
          typeof p.categoryId === "object" && p.categoryId !== null
            ? (p.categoryId as { _id?: string; slug?: string; name?: string })
            : (p.category as { _id?: string; slug?: string; name?: string } | undefined);
        const catId = typeof p.categoryId === "string" ? p.categoryId : catObj?._id;
        const catSlug = catObj?.slug;
        const catName = catObj?.name?.toLowerCase();

        const match =
          catId === selectedCategory ||
          catSlug === selectedCategory ||
          (activeCat &&
            (catId === activeCat._id ||
              (catSlug && activeCat.slug && catSlug === activeCat.slug) ||
              (catName && activeCat.name && catName === activeCat.name.toLowerCase())));

        if (!match) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesDesc = (p.shortDescription || p.description || "").toLowerCase().includes(q);
        const pCatName =
          (typeof p.categoryId === "object" ? (p.categoryId as { name?: string })?.name : null) ||
          p.category?.name;
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
        : null) ||
      p.category?.name ||
      "";
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

  // Open request modal
  const openRequestModal = (product: IProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    setRequestProduct(product);
    setRequestQty(1);
    setRequestDesc("");
    setRequestSuccess(false);
    setRequestError("");
    if (!visitorInfo) {
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
    <div className="min-h-screen flex flex-col bg-[#FFF8FB] dark:bg-[#0d0d0d] text-[#141414] dark:text-[#f5f5f5] transition-colors duration-300">

      {/* ── VISITOR INFO MODAL ─────────────────────────────────────── */}
      {showVisitorModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#161616] border border-[#D5CEC2] dark:border-[#2e2e2e] rounded-3xl max-w-sm w-full p-7 shadow-2xl relative text-left">
            {/* Skip */}
            <button
              onClick={() => setShowVisitorModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#666] hover:text-black dark:text-[#aaa] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
              title="Skip for now"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#B81862] to-[#d43d8a] flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
                <User className="w-7 h-7" />
              </div>
              <h2 className="font-serif text-xl font-bold text-[#111111] dark:text-white">Welcome to Dwara Collections</h2>
              <p className="text-xs text-[#555047] dark:text-[#aaa] mt-1.5 leading-relaxed">
                Enter your details to browse and request items from our exclusive collection.
              </p>
            </div>

            <form onSubmit={handleSaveVisitor} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#443E36] dark:text-[#ccc] mb-1.5">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={visitorForm.name}
                  onChange={(e) => {
                    setVisitorForm((f) => ({ ...f, name: e.target.value }));
                    setVisitorFormError("");
                  }}
                  placeholder="e.g. Priya Sharma"
                  autoFocus
                  className="w-full px-4 py-2.5 bg-[#FDF0F6] dark:bg-[#1e1e1e] border border-[#D0C7B8] dark:border-[#333] rounded-xl text-sm text-[#111111] dark:text-white placeholder-[#888] dark:placeholder-[#666] focus:outline-none focus:border-[#B81862] dark:focus:border-[#B81862] transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#443E36] dark:text-[#ccc] mb-1.5">
                  Phone Number *
                </label>
                <input
                  ref={phoneRef}
                  type="tel"
                  value={visitorForm.phone}
                  onChange={(e) => {
                    setVisitorForm((f) => ({ ...f, phone: e.target.value }));
                    setVisitorFormError("");
                  }}
                  placeholder="e.g. 9876543210"
                  className="w-full px-4 py-2.5 bg-[#FDF0F6] dark:bg-[#1e1e1e] border border-[#D0C7B8] dark:border-[#333] rounded-xl text-sm text-[#111111] dark:text-white placeholder-[#888] dark:placeholder-[#666] focus:outline-none focus:border-[#B81862] dark:focus:border-[#B81862] transition"
                />
              </div>

              {visitorFormError && (
                <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {visitorFormError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#B81862] to-[#d43d8a] text-black font-bold text-sm shadow-md hover:opacity-90 transition cursor-pointer"
              >
                Continue to Catalogue
              </button>
              <button
                type="button"
                onClick={() => setShowVisitorModal(false)}
                className="w-full py-2 text-xs text-[#666] dark:text-[#aaa] hover:text-black dark:hover:text-white transition cursor-pointer"
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
          className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/50 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => {
            if (!requestSubmitting) setRequestProduct(null);
          }}
        >
          <div
            className="bg-white dark:bg-[#161616] border border-[#D5CEC2] dark:border-[#2e2e2e] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#111111] dark:text-white">Request Item</h2>
                <p className="text-xs text-[#555047] dark:text-[#aaa] mt-0.5">Submit a request and our concierge will contact you</p>
              </div>
              {!requestSubmitting && (
                <button
                  onClick={() => setRequestProduct(null)}
                  className="p-1.5 rounded-full text-[#666] hover:text-black dark:text-[#aaa] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {requestSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#111111] dark:text-white">Request Submitted!</h3>
                <p className="text-xs text-[#555047] dark:text-[#aaa] leading-relaxed">
                  Thank you, <span className="text-[#111111] dark:text-white font-semibold">{visitorInfo.name}</span>! We&apos;ll contact you at{" "}
                  <span className="text-[#B81862] dark:text-[#d43d8a] font-semibold">{visitorInfo.phone}</span> regarding{" "}
                  <span className="text-[#111111] dark:text-white font-semibold">{requestProduct.name}</span>.
                </p>
                <button
                  onClick={() => setRequestProduct(null)}
                  className="px-6 py-2.5 rounded-xl bg-[#FDE8F2] dark:bg-[#1e1e1e] border border-[#D5CEC2] dark:border-[#333] text-sm font-semibold text-[#111111] dark:text-white hover:border-[#B81862] transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                {/* Product Info */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F8F5EE] dark:bg-[#1e1e1e] border border-[#E0D8CC] dark:border-[#2a2a2a]">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#E0D8CC] dark:bg-[#111]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getPrimaryImage(requestProduct)} alt={requestProduct.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#111111] dark:text-white text-sm truncate">{requestProduct.name}</p>
                    <p className="text-xs text-[#555047] dark:text-[#aaa] font-mono">SKU: {requestProduct.sku}</p>
                  </div>
                </div>

                {/* Customer Info (read-only) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#F8F5EE] dark:bg-[#1a1a1a] border border-[#E0D8CC] dark:border-[#262626]">
                    <p className="text-[10px] text-[#665F55] dark:text-[#888] uppercase tracking-wider font-semibold mb-0.5">Your Name</p>
                    <p className="text-sm font-semibold text-[#111111] dark:text-white truncate">{visitorInfo.name}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8F5EE] dark:bg-[#1a1a1a] border border-[#E0D8CC] dark:border-[#262626]">
                    <p className="text-[10px] text-[#665F55] dark:text-[#888] uppercase tracking-wider font-semibold mb-0.5">Phone</p>
                    <p className="text-sm font-semibold text-[#111111] dark:text-white font-mono">{visitorInfo.phone}</p>
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#443E36] dark:text-[#ccc] mb-2">
                    Quantity *
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setRequestQty(Math.max(1, requestQty - 1))}
                      className="w-9 h-9 rounded-xl bg-[#FDE8F2] dark:bg-[#1e1e1e] border border-[#D5CEC2] dark:border-[#333] text-[#111111] dark:text-white flex items-center justify-center hover:border-[#B81862] transition cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-bold text-lg text-[#111111] dark:text-white">{requestQty}</span>
                    <button
                      type="button"
                      onClick={() => setRequestQty(requestQty + 1)}
                      className="w-9 h-9 rounded-xl bg-[#FDE8F2] dark:bg-[#1e1e1e] border border-[#D5CEC2] dark:border-[#333] text-[#111111] dark:text-white flex items-center justify-center hover:border-[#B81862] transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-[#665F55] dark:text-[#aaa]">piece{requestQty > 1 ? "s" : ""}</span>
                  </div>
                </div>

                {/* Description (optional) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#443E36] dark:text-[#ccc] mb-1.5">
                    Note / Special Request <span className="text-[#777] dark:text-[#888] normal-case font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={requestDesc}
                    onChange={(e) => setRequestDesc(e.target.value)}
                    placeholder="Any specific requirements, customisation, or questions..."
                    className="w-full px-4 py-2.5 bg-[#FDF0F6] dark:bg-[#1e1e1e] border border-[#D0C7B8] dark:border-[#333] rounded-xl text-xs text-[#111111] dark:text-white placeholder-[#888] dark:placeholder-[#666] focus:outline-none focus:border-[#B81862] dark:focus:border-[#B81862] transition resize-none"
                  />
                </div>

                {requestError && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {requestError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={requestSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#B81862] to-[#d43d8a] text-black font-bold text-sm shadow-md hover:opacity-90 transition disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {requestSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      Send Request
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── HEADER ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0d0d0d]/95 backdrop-blur-md border-b border-[#E8E2D8] dark:border-[#222] transition-colors duration-300 shadow-xs">
        {/* Top Gold Banner */}
        <div className="bg-[#181512] text-[#FFF8FB] py-1 px-4 text-[10px] sm:text-xs font-medium text-center tracking-widest uppercase flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3 text-[#d43d8a]" />
          <span>Handcrafted Luxury Fine Jewellery • Certified BIS Hallmarked</span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <img
              src="/logo.png"
              alt="Dwara Collections"
              className="h-10 sm:h-12 w-auto object-contain group-hover:opacity-90 transition-opacity"
            />
          </Link>

          {/* Search Bar - Desktop */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666] dark:text-[#888] pointer-events-none" />
              <input
                id="search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products by name or description..."
                className="w-full pl-10 pr-4 py-2 bg-[#FDF0F6] dark:bg-[#1c1c1c] border border-[#D5CEC2] dark:border-[#2e2e2e] rounded-full text-sm text-[#111111] dark:text-white placeholder-[#777] dark:placeholder-[#888] focus:outline-none focus:border-[#B81862] dark:focus:border-[#B81862] shadow-xs transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777] hover:text-black dark:hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Visitor Account Button */}
            {visitorInfo ? (
              <button
                onClick={() => setShowVisitorModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FDF0F6] dark:bg-[#1e1e1e] text-[#B81862] dark:text-[#d43d8a] border border-[#B81862]/30 dark:border-[#B81862]/30 hover:border-[#B81862] shadow-xs transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline max-w-[100px] truncate">{visitorInfo.name}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowVisitorModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FDF0F6] dark:bg-[#1e1e1e] text-[#332E29] dark:text-[#ccc] border border-[#D5CEC2] dark:border-[#2e2e2e] hover:border-[#B81862] hover:text-[#B81862] shadow-xs transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* WhatsApp */}
            <a
              id="whatsapp-header"
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi! I am interested in your jewellery catalogue.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#25D366]/15 text-[#1b9e4b] dark:text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/25 shadow-xs transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">WhatsApp</span>
            </a>

            {/* Admin Portal Link */}
            <Link
              id="admin-login-link"
              href="/admin/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FDF0F6] dark:bg-[#1e1e1e] text-[#332E29] dark:text-[#aaa] border border-[#D5CEC2] dark:border-[#2e2e2e] hover:text-[#B81862] hover:border-[#B81862] shadow-xs transition"
            >
              <Lock className="w-3 h-3 text-[#B81862] dark:text-[#B81862]" />
              <span>Admin</span>
            </Link>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="sm:hidden px-4 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#666] dark:text-[#888] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-8 py-1.5 bg-[#FDF0F6] dark:bg-[#1c1c1c] border border-[#D5CEC2] dark:border-[#2e2e2e] rounded-full text-xs text-[#111111] dark:text-white placeholder-[#777] dark:placeholder-[#888] focus:outline-none focus:border-[#B81862] dark:focus:border-[#B81862]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777] hover:text-black dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO & CATEGORY BAR ────────────────────────────────────── */}
      <section className="border-b border-[#E8E2D8] dark:border-[#222] bg-gradient-to-b from-[#F5EFE6] via-[#FAF7F2] to-[#FFF8FB] dark:from-[#141414] dark:to-[#0d0d0d] py-8 sm:py-10 px-4 text-center transition-colors duration-300">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#B81862]/10 dark:bg-[#B81862]/15 text-[#B81862] dark:text-[#d43d8a] border border-[#B81862]/25 dark:border-[#B81862]/30 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Curated Jewellery Collection
          </span>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#111111] dark:text-white tracking-tight">
            Explore Our Catalogue
          </h1>
          <p className="mt-2 text-sm text-[#555047] dark:text-[#aaa] max-w-xl mx-auto">
            Browse our handcrafted gold, natural solitaires, and heirloom bridal pieces. Each item is BIS hallmarked and certified.
          </p>
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="mt-6 flex items-center justify-center gap-2 overflow-x-auto pb-2 px-2 no-scrollbar">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap shadow-xs cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-[#B81862] dark:bg-[#B81862] text-white dark:text-black font-bold shadow-md"
                  : "bg-white dark:bg-[#1a1a1a] text-[#332E29] dark:text-[#aaa] hover:text-black dark:hover:text-white hover:bg-[#FDE8F2] dark:hover:bg-[#252525] border border-[#D5CEC2] dark:border-[#282828]"
              }`}
            >
              All Products ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap shadow-xs cursor-pointer ${
                  selectedCategory === cat._id
                    ? "bg-[#B81862] dark:bg-[#B81862] text-white dark:text-black font-bold shadow-md"
                    : "bg-white dark:bg-[#1a1a1a] text-[#332E29] dark:text-[#aaa] hover:text-black dark:hover:text-white hover:bg-[#FDE8F2] dark:hover:bg-[#252525] border border-[#D5CEC2] dark:border-[#282828]"
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
          <p className="text-xs font-semibold uppercase tracking-wider text-[#665F55] dark:text-[#aaa]">
            Showing <span className="text-[#111111] dark:text-white font-bold">{filteredProducts.length}</span> items
            {selectedCategory !== "all" && (
              <>
                {" "}
                in <span className="text-[#B81862] dark:text-[#d43d8a] font-bold">{categories.find((c) => c._id === selectedCategory)?.name}</span>
              </>
            )}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white dark:bg-[#161616] rounded-2xl border border-[#E5DFD4] dark:border-[#222] p-4 animate-pulse space-y-3 shadow-xs">
                <div className="w-full aspect-square bg-[#ECE6DC] dark:bg-[#222] rounded-xl" />
                <div className="h-4 bg-[#ECE6DC] dark:bg-[#252525] rounded w-3/4" />
                <div className="h-5 bg-[#ECE6DC] dark:bg-[#252525] rounded w-1/2" />
                <div className="h-3 bg-[#ECE6DC] dark:bg-[#252525] rounded w-1/3" />
                <div className="h-3 bg-[#ECE6DC] dark:bg-[#252525] rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-[#141414] rounded-2xl border border-[#E5DFD4] dark:border-[#222] max-w-md mx-auto p-6 shadow-sm">
            <Package className="w-12 h-12 text-[#888] dark:text-[#555] mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-[#111111] dark:text-white mb-1">No products found</h3>
            <p className="text-xs text-[#555047] dark:text-[#aaa] mb-4">
              {search
                ? `No products matched "${search}". Try searching another name.`
                : "No items available in this category yet."}
            </p>
            {(search || selectedCategory !== "all") && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                }}
                className="px-4 py-2 bg-[#FDE8F2] dark:bg-[#222] hover:bg-[#E2DDD3] dark:hover:bg-[#333] text-xs font-semibold rounded-lg text-[#111111] dark:text-white transition cursor-pointer"
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
                  className="group bg-white dark:bg-[#161616] hover:bg-[#FFF8FB] dark:hover:bg-[#1b1b1b] rounded-2xl border border-[#E5DFD4] dark:border-[#262626] hover:border-[#B81862]/60 dark:hover:border-[#B81862]/60 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_rgba(153,101,21,0.18)]"
                >
                  {/* Image */}
                  <div className="relative w-full aspect-square bg-[#F5F2EC] dark:bg-[#101010] overflow-hidden">
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
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-100 dark:bg-red-900/80 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700/50 backdrop-blur-sm shadow-xs">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/50 backdrop-blur-sm shadow-xs">
                          Only {qty} left!
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50/95 dark:bg-black/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 backdrop-blur-sm shadow-xs">
                          {qty} available
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {/* Category */}
                      {(() => {
                        const catObj =
                          typeof product.categoryId === "object" && product.categoryId !== null
                            ? (product.categoryId as { name?: string })
                            : (product.category as { name?: string } | undefined);
                        const cName =
                          catObj?.name || categories.find((c) => c._id === product.categoryId)?.name;
                        return cName ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B81862] dark:text-[#d43d8a] block mb-1">
                            {cName}
                          </span>
                        ) : null;
                      })()}

                      <h2 className="font-serif font-bold text-base text-[#111111] dark:text-white group-hover:text-[#B81862] dark:group-hover:text-[#d43d8a] transition-colors line-clamp-1">
                        {product.name}
                      </h2>

                      {/* Price */}
                      <div className="mt-1.5 flex items-baseline gap-2">
                        <span className="font-bold text-lg text-[#B81862] dark:text-[#d43d8a]">
                          {formatPrice(product.price)}
                        </span>
                        {product.discountPrice && (
                          <span className="text-xs text-[#777] dark:text-[#888] line-through">
                            {formatPrice(product.discountPrice)}
                          </span>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="mt-2 flex items-center gap-1.5 text-xs">
                        <Package className="w-3.5 h-3.5 text-[#B81862] dark:text-[#B81862]" />
                        <span className="text-[#665F55] dark:text-[#aaa]">Quantity:</span>
                        <span
                          className={`font-semibold ${
                            isOutOfStock
                              ? "text-red-600 dark:text-red-400"
                              : isLowStock
                              ? "text-amber-700 dark:text-amber-400"
                              : "text-emerald-700 dark:text-emerald-400"
                          }`}
                        >
                          {isOutOfStock ? "Out of Stock" : `${qty} units`}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="mt-2.5 text-xs text-[#555047] dark:text-[#aaa] line-clamp-2 leading-relaxed">
                        {product.shortDescription ||
                          product.description ||
                          "Handcrafted luxury fine jewellery design hallmarked to perfection."}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-[#E8E2D8] dark:border-[#222] grid grid-cols-2 gap-2">
                      {/* Request Item Button */}
                      <button
                        onClick={(e) => openRequestModal(product, e)}
                        className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold bg-[#B81862]/10 hover:bg-[#B81862]/20 dark:bg-[#B81862]/10 dark:hover:bg-[#B81862]/20 text-[#B81862] dark:text-[#d43d8a] border border-[#B81862]/25 hover:border-[#B81862]/50 transition cursor-pointer"
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
                        className="flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold bg-[#F5F1EB] hover:bg-[#25D366]/20 dark:bg-[#202020] text-[#332E29] hover:text-[#1b9e4b] dark:text-[#ccc] dark:hover:text-[#25D366] border border-[#D5CEC2] dark:border-[#2d2d2d] hover:border-[#25D366]/40 transition"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedProduct(null)}
        >
          <div
            className="bg-white dark:bg-[#161616] border border-[#D5CEC2] dark:border-[#2e2e2e] rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[90vh] text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-3.5 right-3.5 z-20 p-2 rounded-full bg-white/90 dark:bg-black/70 text-gray-800 dark:text-white hover:bg-white dark:hover:bg-black hover:text-[#B81862] dark:hover:text-[#d43d8a] border border-black/10 dark:border-white/10 transition shadow-md"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Image */}
            <div className="w-full md:w-1/2 aspect-square md:aspect-auto bg-[#F5F2EC] dark:bg-[#101010] relative shrink-0 border-b md:border-b-0 md:border-r border-[#E5DFD4] dark:border-[#262626]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getPrimaryImage(selectedProduct)}
                alt={selectedProduct.name}
                className="w-full h-full object-cover object-center"
              />
              {selectedProduct.isFeatured && (
                <div className="absolute top-3.5 left-3.5">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#B81862] dark:bg-[#d43d8a] text-white dark:text-black shadow-md flex items-center gap-1">
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
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#B81862] dark:text-[#d43d8a]">
                    {(typeof selectedProduct.categoryId === "object" && selectedProduct.categoryId !== null
                      ? (selectedProduct.categoryId as { name?: string })?.name
                      : null) ||
                      selectedProduct.category?.name ||
                      "Fine Jewellery"}
                  </span>
                  <span className="font-mono text-[11px] text-[#665F55] dark:text-[#aaa] bg-[#FDE8F2] dark:bg-[#222] px-2 py-0.5 rounded">
                    SKU: {selectedProduct.sku}
                  </span>
                </div>

                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#111111] dark:text-white leading-snug tracking-tight">
                  {selectedProduct.name}
                </h2>

                {/* Price */}
                <div className="flex items-baseline gap-2.5 pt-1 border-b border-[#E8E2D8] dark:border-[#262626] pb-3">
                  <span className="text-2xl sm:text-3xl font-bold text-[#B81862] dark:text-[#d43d8a]">
                    {formatPrice(selectedProduct.discountPrice || selectedProduct.price)}
                  </span>
                  {selectedProduct.discountPrice && (
                    <span className="text-xs text-[#777] dark:text-[#888] line-through font-medium">
                      {formatPrice(selectedProduct.price)}
                    </span>
                  )}
                </div>

                {/* Stock */}
                <div className="p-3 bg-[#F8F5EE] dark:bg-[#1e1e1e] rounded-xl border border-[#E0D8CC] dark:border-[#2a2a2a] flex items-center justify-between text-xs">
                  <span className="text-[#665F55] dark:text-[#aaa] flex items-center gap-1.5 font-medium">
                    <Package className="w-4 h-4 text-[#B81862] dark:text-[#B81862]" />
                    Available Inventory:
                  </span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {selectedProduct.quantity ?? 10} units in stock
                  </span>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#443E36] dark:text-[#ccc] mb-1">
                    Piece Description
                  </h4>
                  <p className="text-xs sm:text-sm text-[#332E29] dark:text-[#ddd] leading-relaxed">
                    {selectedProduct.description ||
                      selectedProduct.shortDescription ||
                      "Handcrafted luxury jewellery with certified hallmarked gold and natural diamonds."}
                  </p>
                </div>
              </div>

              {/* CTAs */}
              <div className="pt-2 space-y-2">
                {/* Request Item */}
                <button
                  onClick={(e) => {
                    setSelectedProduct(null);
                    openRequestModal(selectedProduct, e);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-[#B81862] to-[#d43d8a] text-black shadow-md hover:opacity-90 transition cursor-pointer"
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
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#1b9e4b] dark:text-[#25D366] border border-[#25D366]/30 transition"
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
      <footer className="border-t border-[#E8E2D8] dark:border-[#222] bg-[#FDE8F2] dark:bg-[#121212] py-6 px-4 text-center text-xs text-[#665F55] dark:text-[#888] transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Dwara Collections. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/login"
              className="text-[#332E29] dark:text-[#aaa] hover:text-[#B81862] dark:hover:text-[#d43d8a] transition flex items-center gap-1 font-medium"
            >
              <Lock className="w-3 h-3 text-[#B81862] dark:text-[#B81862]" />
              Admin Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
