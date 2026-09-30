"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Search,
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
  Trash2,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  Star,
  Percent,
  RotateCcw,
} from "lucide-react";
import { IProduct, ICategory } from "@/types";
import { getProductPlaceholder, getCategoryPlaceholder } from "@/lib/placeholderImages";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP || "919876543210";
const VISITOR_KEY = "rj_visitor_info";
const CART_KEY = "rj_cart_items";

interface VisitorInfo {
  name: string;
  phone: string;
}

interface CartItem {
  product: IProduct;
  quantity: number;
}

export default function SimpleCataloguePage() {
  const [products, setProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStock, setSelectedStock] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [sortBy, setSortBy] = useState<string>("featured");
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [productModalImageIndex, setProductModalImageIndex] = useState(0);

  // Category stories scroll ref & navigation buttons state
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkCategoryScroll = useCallback(() => {
    const el = categoryScrollRef.current;
    if (el) {
      const hasOverflow = el.scrollWidth > el.clientWidth + 4;
      setCanScrollLeft(el.scrollLeft > 6);
      setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
    }
  }, []);

  const scrollCategories = (direction: "left" | "right") => {
    const el = categoryScrollRef.current;
    if (el) {
      const scrollAmount = Math.max(220, Math.floor(el.clientWidth * 0.65));
      el.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Cart state
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [showCartModal, setShowCartModal] = useState(false);
  const [cartNote, setCartNote] = useState("");
  const [cartSubmitting, setCartSubmitting] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [cartSuccessItems, setCartSuccessItems] = useState<CartItem[]>([]);
  const [cartError, setCartError] = useState("");

  // Product card temporary selection quantities
  const [cardQuantities, setCardQuantities] = useState<Record<string, number>>({});
  const [addedAnimationId, setAddedAnimationId] = useState<string | null>(null);

  // Visitor info modal
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo | null>(null);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [visitorForm, setVisitorForm] = useState({ name: "", phone: "" });
  const [visitorFormError, setVisitorFormError] = useState("");
  const [visitorSaving, setVisitorSaving] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const phoneRef = useRef<HTMLInputElement>(null);

  // Single request item modal (direct request)
  const [requestProduct, setRequestProduct] = useState<IProduct | null>(null);
  const [requestQty, setRequestQty] = useState(1);
  const [requestDesc, setRequestDesc] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [lastSubmittedOrderId, setLastSubmittedOrderId] = useState<string>("");
  const [showMobileFilterDrawer, setShowMobileFilterDrawer] = useState(false);

  // Load visitor & cart from localStorage
  useEffect(() => {
    const storedVisitor = localStorage.getItem(VISITOR_KEY);
    if (storedVisitor) {
      try {
        const parsed = JSON.parse(storedVisitor);
        setVisitorInfo(parsed);
        setVisitorForm(parsed);
      } catch {
        localStorage.removeItem(VISITOR_KEY);
      }
    } else {
      // Show modal after short delay so page loads first
      const t = setTimeout(() => setShowVisitorModal(true), 800);
      return () => clearTimeout(t);
    }

    const storedCart = localStorage.getItem(CART_KEY);
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch {
        localStorage.removeItem(CART_KEY);
      }
    }
  }, []);

  // Sync cart to localStorage
  const updateCartState = (newCart: Record<string, CartItem>) => {
    setCart(newCart);
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(newCart));
    } catch {}
  };

  // Re-fetch products from server to keep stock in sync
  const refreshProducts = useCallback(async () => {
    try {
      const prodRes = await fetch(`/api/public/products?sort=newest&t=${Date.now()}`).then((r) => r.json());
      if (prodRes.success && Array.isArray(prodRes.products)) {
        setProducts(prodRes.products);
      }
    } catch (err) {
      console.warn("Failed to refresh products:", err);
    }
  }, []);

  // Fetch products and categories
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          fetch(`/api/public/products?sort=newest&t=${Date.now()}`).then((r) => r.json()),
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

  // Deduplicate categories by slug / name
  const dedupedCategories = useMemo(() => {
    const seen = new Set<string>();
    return categories.filter((cat) => {
      const key = (cat.slug || cat.name || "").toLowerCase().trim();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [categories]);

  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;
    const timer = setTimeout(checkCategoryScroll, 100);
    el.addEventListener("scroll", checkCategoryScroll, { passive: true });
    window.addEventListener("resize", checkCategoryScroll);
    return () => {
      clearTimeout(timer);
      el.removeEventListener("scroll", checkCategoryScroll);
      window.removeEventListener("resize", checkCategoryScroll);
    };
  }, [checkCategoryScroll, dedupedCategories]);

  // Active Filter Count & Reset helper
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (selectedCategory !== "all") count++;
    if (selectedStock !== "all") count++;
    if (priceRange !== "all") count++;
    if (onlyFeatured) count++;
    if (onlyDiscounted) count++;
    if (sortBy !== "featured") count++;
    return count;
  }, [search, selectedCategory, selectedStock, priceRange, onlyFeatured, onlyDiscounted, sortBy]);

  const resetAllFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedStock("all");
    setPriceRange("all");
    setOnlyFeatured(false);
    setOnlyDiscounted(false);
    setSortBy("featured");
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const activeCat = dedupedCategories.find(
      (c) =>
        c._id === selectedCategory ||
        c.slug?.toLowerCase() === selectedCategory?.toLowerCase() ||
        c.name?.toLowerCase() === selectedCategory?.toLowerCase()
    );

    const result = products.filter((p) => {
      // 1. Category Filter
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

      // 2. Search Query (Name, SKU, Description, Category, Tags)
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesName = (p.name || "").toLowerCase().includes(q);
        const matchesSku = (p.sku || "").toLowerCase().includes(q);
        const matchesDesc = (p.shortDescription || p.description || "").toLowerCase().includes(q);
        const pCatName =
          (typeof p.categoryId === "object" ? (p.categoryId as { name?: string })?.name : null) ||
          p.category?.name ||
          "";
        const matchesCat = pCatName.toLowerCase().includes(q);
        const matchesTags = (p.tags || []).some((t) => t.toLowerCase().includes(q));

        if (!matchesName && !matchesSku && !matchesDesc && !matchesCat && !matchesTags) return false;
      }

      // 3. Stock Status Filter
      if (selectedStock !== "all") {
        if (selectedStock === "in_stock" && p.stockStatus !== "in_stock") return false;
        if (selectedStock === "made_to_order" && p.stockStatus !== "made_to_order") return false;
      }

      // 4. Price Range Filter
      const effectivePrice = Number(p.discountPrice || p.price || 0);
      if (priceRange === "under_1l" && effectivePrice >= 100000) return false;
      if (priceRange === "1l_5l" && (effectivePrice < 100000 || effectivePrice > 500000)) return false;
      if (priceRange === "above_5l" && effectivePrice <= 500000) return false;

      // 5. Featured Only
      if (onlyFeatured && !p.isFeatured) return false;

      // 6. Discounted / Offers Only
      if (onlyDiscounted && (!p.discountPrice || p.discountPrice >= p.price)) return false;

      return true;
    });

    // Sort Products
    result.sort((a, b) => {
      const priceA = Number(a.discountPrice || a.price || 0);
      const priceB = Number(b.discountPrice || b.price || 0);
      const qtyA = Number(a.quantity ?? 0);
      const qtyB = Number(b.quantity ?? 0);

      switch (sortBy) {
        case "featured":
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "oldest":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "price-asc":
          return priceA - priceB;
        case "price-desc":
          return priceB - priceA;
        case "qty-desc":
          return qtyB - qtyA;
        case "name-asc":
          return (a.name || "").localeCompare(b.name || "");
        default:
          return 0;
      }
    });

    return result;
  }, [
    products,
    selectedCategory,
    search,
    selectedStock,
    priceRange,
    onlyFeatured,
    onlyDiscounted,
    sortBy,
    dedupedCategories,
  ]);

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

  const getProductImages = (p: IProduct): string[] => {
    const list: string[] = [];
    if (p.images && p.images.length > 0) {
      p.images.forEach((img) => {
        const u = typeof img === "string" ? img : img?.url;
        if (u) list.push(u);
      });
    }
    if (list.length === 0) {
      list.push(getPrimaryImage(p));
    }
    return list;
  };

  const openProductModal = (product: IProduct) => {
    setProductModalImageIndex(0);
    setSelectedProduct(product);
  };

  const getCategoryImageUrl = (cat: ICategory) => {
    if (cat.image) return cat.image;
    const catProd = products.find((p) => {
      const catObj =
        typeof p.categoryId === "object" && p.categoryId !== null
          ? (p.categoryId as { _id?: string; slug?: string })
          : (p.category as { _id?: string; slug?: string } | undefined);
      const catId = typeof p.categoryId === "string" ? p.categoryId : catObj?._id;
      return catId === cat._id || catObj?.slug === cat.slug;
    });
    if (catProd) {
      const pImg = catProd.images?.find((i) => i.isPrimary)?.url || catProd.images?.[0]?.url;
      if (pImg) return pImg;
    }
    return getCategoryPlaceholder(cat.name || cat.slug);
  };

  // Cart calculations
  const cartItemList = useMemo(() => Object.values(cart), [cart]);
  const totalCartCount = useMemo(
    () => cartItemList.reduce((sum, item) => sum + item.quantity, 0),
    [cartItemList]
  );
  const totalCartPrice = useMemo(
    () =>
      cartItemList.reduce((sum, item) => {
        const price = item.product.discountPrice || item.product.price || 0;
        return sum + price * item.quantity;
      }, 0),
    [cartItemList]
  );

  // Card quantity helpers
  const getCardSelectedQty = (productId: string) => {
    return cardQuantities[productId] ?? 1;
  };

  const handleCardQtyChange = (product: IProduct, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const current = getCardSelectedQty(product._id);
    const maxLimit = product.showQuantity === false ? 9999 : (product.quantity ?? 10);
    const next = Math.max(1, Math.min(maxLimit, current + delta));
    setCardQuantities((prev) => ({ ...prev, [product._id]: next }));
  };

  // Add to cart from product card
  const handleAddToCart = (product: IProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    const qtyToAdd = getCardSelectedQty(product._id);
    const existing = cart[product._id]?.quantity || 0;
    const newCart = {
      ...cart,
      [product._id]: {
        product,
        quantity: existing + qtyToAdd,
      },
    };
    updateCartState(newCart);
    setAddedAnimationId(product._id);
    setTimeout(() => setAddedAnimationId(null), 1500);
  };

  // Update cart item quantity inside Cart Modal
  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    const existing = cart[productId];
    if (!existing) return;
    const maxLimit = existing.product.showQuantity === false ? 9999 : (existing.product.quantity ?? 10);
    const newQty = Math.min(maxLimit, existing.quantity + delta);
    if (newQty <= 0) {
      const newCart = { ...cart };
      delete newCart[productId];
      updateCartState(newCart);
    } else {
      updateCartState({
        ...cart,
        [productId]: {
          ...existing,
          quantity: newQty,
        },
      });
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    const newCart = { ...cart };
    delete newCart[productId];
    updateCartState(newCart);
  };

  const handleClearCart = () => {
    updateCartState({});
  };

  // Save visitor info + set server session cookie
  const handleSaveVisitor = async (e: React.FormEvent) => {
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
    setVisitorSaving(true);
    // Also set server-side session so customer dashboard works
    try {
      await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: info.name, phone: info.phone }),
      });
    } catch { /* non-critical */ }
    setVisitorSaving(false);
    setShowVisitorModal(false);
  };

  // Direct single item request modal
  const openRequestModal = (product: IProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    setRequestProduct(product);
    setRequestQty(getCardSelectedQty(product._id));
    setRequestDesc("");
    setRequestSuccess(false);
    setRequestError("");
    if (!visitorInfo) {
      setShowVisitorModal(true);
    }
  };

  // Submit single request
  const handleSubmitSingleRequest = async (e: React.FormEvent) => {
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
      setLastSubmittedOrderId(data.orderId || data.request?.orderId || "");
      setRequestSuccess(true);

      // Immediately decrement stock in client state without requiring page reload
      const orderedProdId = requestProduct._id;
      const orderedCount = requestQty;
      setProducts((prev) =>
        prev.map((p) => {
          if (p._id === orderedProdId) {
            const newQty = Math.max(0, (p.quantity ?? 10) - orderedCount);
            return {
              ...p,
              quantity: newQty,
              stockStatus: newQty <= 0 ? "out_of_stock" : p.stockStatus,
            };
          }
          return p;
        })
      );

      // Re-fetch products from server to ensure perfect sync
      refreshProducts();

      // Ensure customer session cookie is refreshed
      try {
        fetch("/api/customer/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: visitorInfo.name, phone: visitorInfo.phone }),
        }).catch(() => {});
      } catch {}
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setRequestSubmitting(false);
    }
  };

  // Submit Cart batch request
  const handleSubmitCartRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItemList.length === 0) return;

    if (!visitorInfo) {
      setShowVisitorModal(true);
      return;
    }

    setCartSubmitting(true);
    setCartError("");
    try {
      const batchItems = cartItemList.map((it) => ({
        productId: it.product._id,
        productName: it.product.name,
        productSku: it.product.sku,
        quantity: it.quantity,
      }));

      const res = await fetch("/api/public/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: batchItems,
          visitorName: visitorInfo.name,
          visitorPhone: visitorInfo.phone,
          description: cartNote.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit cart request.");
      }

      setLastSubmittedOrderId(data.orderId || data.requests?.[0]?.orderId || "");
      setCartSuccessItems([...cartItemList]);
      setCartSuccess(true);

      // Immediately decrement stock for all cart items in client state
      const qtyMap: Record<string, number> = {};
      cartItemList.forEach((it) => {
        qtyMap[it.product._id] = (qtyMap[it.product._id] || 0) + it.quantity;
      });
      setProducts((prev) =>
        prev.map((p) => {
          const ordered = qtyMap[p._id];
          if (!ordered) return p;
          const newQty = Math.max(0, (p.quantity ?? 10) - ordered);
          return {
            ...p,
            quantity: newQty,
            stockStatus: newQty <= 0 ? "out_of_stock" : p.stockStatus,
          };
        })
      );

      // Re-fetch products from server to ensure perfect sync
      refreshProducts();

      handleClearCart();
      setCartNote("");
      // Ensure customer session cookie is refreshed
      try {
        fetch("/api/customer/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: visitorInfo.name, phone: visitorInfo.phone }),
        }).catch(() => {});
      } catch {}
    } catch (err) {
      setCartError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setCartSubmitting(false);
    }
  };

  // WhatsApp enquiry for Cart
  const getCartWhatsAppUrl = () => {
    if (cartItemList.length === 0 && !lastSubmittedOrderId) return `https://wa.me/${WHATSAPP_NUMBER}`;
    let message = `Hello Dwara Collections, I would like to request/enquire about the following items from my cart:\n\n`;
    if (lastSubmittedOrderId) {
      message = `Hello Dwara Collections, regarding my Order Reference: *${lastSubmittedOrderId}*:\n\n`;
    }
    const itemsToFormat = cartItemList.length > 0 ? cartItemList : cartSuccessItems;
    itemsToFormat.forEach((item, index) => {
      const price = item.product.discountPrice || item.product.price;
      message += `${index + 1}. *${item.product.name}*\n   SKU: ${item.product.sku || "N/A"} | Qty: ${item.quantity} | Price: ${formatPrice(price * item.quantity)}\n`;
    });
    if (totalCartPrice > 0) {
      message += `\n*Total Estimated:* ${formatPrice(totalCartPrice)}`;
    }
    if (visitorInfo) {
      message += `\n*Customer:* ${visitorInfo.name} (${visitorInfo.phone})`;
    }
    if (cartNote.trim()) {
      message += `\n*Note:* ${cartNote.trim()}`;
    }
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FFF8FB] text-[#141414] transition-colors duration-300">

      {/* ── VISITOR INFO MODAL ─────────────────────────────────────── */}
      {showVisitorModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white border border-[#F0D6E8] rounded-3xl max-w-sm w-full p-7 shadow-2xl relative text-left">
            <button
              onClick={() => setShowVisitorModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#666] hover:text-black hover:bg-black/5 transition"
              title="Skip for now"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#B81862] to-[#d43d8a] flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
                <User className="w-7 h-7" />
              </div>
              <h2 className="font-serif text-xl font-bold text-[#111111]">Welcome to Dwara Collections</h2>
              <p className="text-xs text-[#555047] mt-1.5 leading-relaxed">
                Enter your details to browse and request items from our exclusive collection.
              </p>
            </div>

            <form onSubmit={handleSaveVisitor} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#443E36] mb-1.5">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={visitorForm.name}
                  onChange={(e) => setVisitorForm({ ...visitorForm, name: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-4 py-2.5 bg-[#FFF8FB] border border-[#F0D6E8] rounded-xl text-xs text-[#111111] placeholder-[#888] focus:outline-none focus:border-[#B81862] transition"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#443E36] mb-1.5">
                  Phone / WhatsApp Number *
                </label>
                <input
                  ref={phoneRef}
                  type="tel"
                  required
                  value={visitorForm.phone}
                  onChange={(e) => setVisitorForm({ ...visitorForm, phone: e.target.value })}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-4 py-2.5 bg-[#FFF8FB] border border-[#F0D6E8] rounded-xl text-xs text-[#111111] placeholder-[#888] focus:outline-none focus:border-[#B81862] transition font-mono"
                />
              </div>

              {visitorFormError && (
                <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {visitorFormError}
                </p>
              )}

              <button
                type="submit"
                disabled={visitorSaving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#B81862] to-[#d43d8a] text-white font-bold text-sm shadow-md hover:opacity-95 transition cursor-pointer disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {visitorSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Save Details & Continue"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── CART MODAL / DRAWER ────────────────────────────────────── */}
      {showCartModal && (
        <div
          className="fixed inset-0 z-[65] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => {
            if (!cartSubmitting) setShowCartModal(false);
          }}
        >
          <div
            className="bg-white border border-[#F0D6E8] rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[90vh] sm:max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#F0D6E8] flex items-center justify-between bg-[#FFF8FB] shrink-0 gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#B81862] text-white flex items-center justify-center shadow-xs shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-serif text-base sm:text-lg font-bold text-[#111111] truncate">Your Selected Items</h2>
                  <p className="text-[11px] text-[#7A5E6A] truncate">
                    {totalCartCount} {totalCartCount === 1 ? "piece" : "pieces"} selected for request
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {cartItemList.length > 0 && !cartSuccess && (
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="text-[11px] text-[#B81862] hover:underline font-semibold px-2 py-1"
                  >
                    Clear All
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowCartModal(false)}
                  className="p-1.5 rounded-full text-[#666] hover:text-black hover:bg-black/5 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
              {cartSuccess ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#111111]">Cart Request Submitted!</h3>
                  <p className="text-xs text-[#555047] max-w-sm mx-auto leading-relaxed">
                    Thank you, <span className="font-semibold text-[#111111]">{visitorInfo?.name}</span>! We have received your request for{" "}
                    <span className="font-semibold text-[#B81862]">{cartSuccessItems.length} jewellery item(s)</span>. Our luxury concierge will contact you at{" "}
                    <span className="font-semibold text-[#111111]">{visitorInfo?.phone}</span> shortly.
                  </p>

                  {lastSubmittedOrderId && (
                    <div className="p-3.5 bg-[#FFF8FB] rounded-2xl border border-[#F0D6E8] flex items-center justify-between text-xs max-w-sm mx-auto shadow-xs">
                      <span className="text-[#7A5E6A] font-semibold">Order Reference ID:</span>
                      <span className="font-mono font-bold text-[#B81862] text-xs bg-white px-2.5 py-1 rounded-lg border border-[#F0D6E8]">
                        {lastSubmittedOrderId}
                      </span>
                    </div>
                  )}

                  {/* Summary of submitted items */}
                  <div className="mt-4 p-4 bg-[#FFF8FB] rounded-2xl border border-[#F0D6E8] text-left space-y-2 max-h-48 overflow-y-auto">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5E6A] block mb-1">
                      Requested Pieces
                    </span>
                    {cartSuccessItems.map((it) => (
                      <div key={it.product._id} className="flex items-center justify-between text-xs py-1 border-b border-[#F0D6E8]/60 last:border-none">
                        <span className="font-medium text-[#111111] truncate max-w-[200px]">{it.product.name}</span>
                        <span className="font-mono text-[11px] text-[#B81862] font-semibold">Qty: {it.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        setCartSuccess(false);
                        setShowCartModal(false);
                      }}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#B81862] text-white font-bold text-xs shadow-md hover:opacity-90 transition cursor-pointer"
                    >
                      Continue Browsing
                    </button>
                    <Link
                      href="/my-orders"
                      onClick={() => { setCartSuccess(false); setShowCartModal(false); }}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#FFF8FB] border border-[#F0D6E8] text-[#B81862] font-bold text-xs hover:bg-[#FFF0F7] transition flex items-center justify-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      View My Orders
                    </Link>
                    <a
                      href={getCartWhatsAppUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-xs shadow-md hover:bg-[#20ba59] transition flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Chat on WhatsApp</span>
                    </a>
                  </div>
                </div>
              ) : cartItemList.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#FFF8FB] border border-[#F0D6E8] flex items-center justify-center mx-auto text-[#B81862]">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <h3 className="font-serif text-base font-bold text-[#111111]">Your cart is currently empty</h3>
                  <p className="text-xs text-[#7A5E6A] max-w-xs mx-auto">
                    Browse our catalogue and use the <span className="font-bold text-[#B81862]">+</span> and <span className="font-bold text-[#B81862]">-</span> buttons to add items to your selection.
                  </p>
                  <button
                    onClick={() => setShowCartModal(false)}
                    className="mt-2 px-5 py-2 rounded-xl bg-[#B81862] text-white text-xs font-bold hover:opacity-90 transition cursor-pointer"
                  >
                    Explore Jewellery
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Items List */}
                  <div className="space-y-3">
                    {cartItemList.map((item) => {
                      const p = item.product;
                      const price = p.discountPrice || p.price;
                      const lineTotal = price * item.quantity;

                      return (
                        <div
                          key={p._id}
                          className="p-3 sm:p-3.5 bg-[#FFF8FB] rounded-2xl border border-[#F0D6E8] hover:border-[#B81862]/40 transition space-y-2.5"
                        >
                          {/* Top Row: Thumbnail + Details + Trash */}
                          <div className="flex items-start gap-3">
                            {/* Thumbnail */}
                            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 bg-white border border-[#F0D6E8]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getPrimaryImage(p)}
                                alt={p.name}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-serif font-bold text-xs sm:text-sm text-[#111111] line-clamp-2 leading-snug">
                                {p.name}
                              </h4>
                              <p className="text-[10px] text-[#7A5E6A] font-mono mt-0.5">
                                SKU: {p.sku || "N/A"}
                              </p>
                              <div className="text-xs font-bold text-[#B81862] mt-0.5">
                                {formatPrice(price)}
                              </div>
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(p._id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 transition shrink-0"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Bottom Row: Quantity Controls & Subtotal */}
                          <div className="flex items-center justify-between pt-2 border-t border-[#F0D6E8]/70">
                            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#F0D6E8] shadow-xs">
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQuantity(p._id, -1)}
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#FFF8FB] hover:bg-[#FDF0F6] text-[#B81862] flex items-center justify-center transition cursor-pointer"
                                title="Decrease"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-bold text-xs text-[#141414]">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateCartQuantity(p._id, 1)}
                                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-r from-[#B81862] to-[#d43d8a] text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer"
                                title="Increase"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-[#7A5E6A] block">Subtotal</span>
                              <span className="font-bold text-xs text-[#111111] font-mono">
                                {formatPrice(lineTotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Customer Information Preview / Quick Edit */}
                  <div className="p-3.5 bg-[#FFF8FB] rounded-2xl border border-[#F0D6E8] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5E6A]">
                        Customer Details
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowVisitorModal(true)}
                        className="text-[11px] text-[#B81862] font-semibold hover:underline"
                      >
                        {visitorInfo ? "Edit Details" : "Add Details"}
                      </button>
                    </div>

                    {visitorInfo ? (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-2 rounded-xl border border-[#F0D6E8]">
                          <span className="text-[10px] text-[#7A5E6A] block">Name</span>
                          <span className="font-semibold text-[#111111] truncate block">{visitorInfo.name}</span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-[#F0D6E8]">
                          <span className="text-[10px] text-[#7A5E6A] block">Phone</span>
                          <span className="font-semibold text-[#111111] font-mono truncate block">{visitorInfo.phone}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                        Please provide your name and phone number so our concierge can reach you.
                      </p>
                    )}
                  </div>

                  {/* Special Note */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#443E36] mb-1">
                      Special Notes / Customisation Requests <span className="text-[#888] font-normal normal-case">(optional)</span>
                    </label>
                    <textarea
                      rows={2}
                      value={cartNote}
                      onChange={(e) => setCartNote(e.target.value)}
                      placeholder="e.g. Ring size preferences, custom engraving, or bridal timeline..."
                      className="w-full px-3.5 py-2 bg-[#FFF8FB] border border-[#F0D6E8] rounded-xl text-xs text-[#111111] placeholder-[#888] focus:outline-none focus:border-[#B81862] transition resize-none"
                    />
                  </div>

                  {cartError && (
                    <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {cartError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer / Actions */}
            {cartItemList.length > 0 && !cartSuccess && (
              <div className="p-5 border-t border-[#F0D6E8] bg-[#FFF8FB] space-y-3 shrink-0">
                {/* Order Summary */}
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-xs text-[#7A5E6A] block font-medium">Estimated Total ({totalCartCount} items)</span>
                    <span className="font-serif text-xl font-bold text-[#B81862]">{formatPrice(totalCartPrice)}</span>
                  </div>
                  <span className="text-[10px] text-[#7A5E6A] bg-white px-2.5 py-1 rounded-full border border-[#F0D6E8]">
                    No immediate payment
                  </span>
                </div>

                {/* Main Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Submit Official Request */}
                  <button
                    type="button"
                    onClick={handleSubmitCartRequest}
                    disabled={cartSubmitting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#B81862] to-[#d43d8a] text-white font-bold text-xs shadow-md hover:opacity-95 transition disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {cartSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Request...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        <span>Request All Items ({totalCartCount})</span>
                      </>
                    )}
                  </button>

                  {/* Send via WhatsApp */}
                  <a
                    href={getCartWhatsAppUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl bg-[#25D366] text-white font-bold text-xs shadow-md hover:bg-[#20ba59] transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>WhatsApp Enquire</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SINGLE DIRECT REQUEST ITEM MODAL ───────────────────────── */}
      {requestProduct && visitorInfo && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => {
            if (!requestSubmitting) setRequestProduct(null);
          }}
        >
          <div
            className="bg-white border border-[#F0D6E8] rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#111111]">Direct Item Request</h2>
                <p className="text-xs text-[#555047] mt-0.5">Submit a request and our concierge will contact you</p>
              </div>
              {!requestSubmitting && (
                <button
                  onClick={() => setRequestProduct(null)}
                  className="p-1.5 rounded-full text-[#666] hover:text-black hover:bg-black/5 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {requestSuccess ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="font-serif text-lg font-bold text-[#111111]">Request Submitted!</h3>
                <p className="text-xs text-[#555047] leading-relaxed">
                  Thank you, <span className="text-[#111111] font-semibold">{visitorInfo.name}</span>! We&apos;ll contact you at{" "}
                  <span className="text-[#B81862] font-semibold">{visitorInfo.phone}</span> regarding{" "}
                  <span className="text-[#111111] font-semibold">{requestProduct.name}</span>.
                </p>

                {lastSubmittedOrderId && (
                  <div className="p-3 bg-[#FFF8FB] rounded-xl border border-[#F0D6E8] flex items-center justify-between text-xs max-w-xs mx-auto shadow-xs">
                    <span className="text-[#7A5E6A] font-semibold">Order Reference ID:</span>
                    <span className="font-mono font-bold text-[#B81862] text-xs bg-white px-2.5 py-1 rounded-md border border-[#F0D6E8]">
                      {lastSubmittedOrderId}
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                  <button
                    onClick={() => setRequestProduct(null)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#FDE8F2] border border-[#F0D6E8] text-xs font-semibold text-[#111111] hover:border-[#B81862] transition cursor-pointer"
                  >
                    Close
                  </button>
                  <Link
                    href="/my-orders"
                    onClick={() => setRequestProduct(null)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#B81862]/10 border border-[#B81862]/30 text-[#B81862] font-bold text-xs hover:bg-[#B81862]/20 transition flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    View My Orders
                  </Link>
                  <a
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                      `Hello Dwara Collections, I submitted a request for ${requestProduct.name} (SKU: ${requestProduct.sku || "N/A"})${
                        lastSubmittedOrderId ? ` with Order Reference ID: *${lastSubmittedOrderId}*` : ""
                      }. Customer: ${visitorInfo.name} (${visitorInfo.phone}).`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-xs shadow-md hover:bg-[#20ba59] transition flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4 fill-white" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitSingleRequest} className="space-y-4">
                {/* Product Info */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FFF8FB] border border-[#F0D6E8]">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-white border border-[#F0D6E8]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getPrimaryImage(requestProduct)} alt={requestProduct.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#111111] text-sm truncate">{requestProduct.name}</p>
                    <p className="text-xs text-[#7A5E6A] font-mono">SKU: {requestProduct.sku || "N/A"}</p>
                  </div>
                </div>

                {/* Customer Info (read-only) */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#FFF8FB] border border-[#F0D6E8]">
                    <p className="text-[10px] text-[#7A5E6A] uppercase tracking-wider font-semibold mb-0.5">Your Name</p>
                    <p className="text-sm font-semibold text-[#111111] truncate">{visitorInfo.name}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#FFF8FB] border border-[#F0D6E8]">
                    <p className="text-[10px] text-[#7A5E6A] uppercase tracking-wider font-semibold mb-0.5">Phone</p>
                    <p className="text-sm font-semibold text-[#111111] font-mono">{visitorInfo.phone}</p>
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#443E36]">
                      Quantity *
                    </label>
                    {requestProduct.showQuantity === false ? (
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        Any quantity available
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#7A5E6A] font-medium">
                        {requestProduct.quantity ?? 10} available
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setRequestQty(Math.max(1, requestQty - 1))}
                      className="w-9 h-9 rounded-xl bg-[#FFF8FB] border border-[#F0D6E8] text-[#111111] flex items-center justify-center hover:border-[#B81862] transition cursor-pointer font-bold"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-bold text-lg text-[#111111]">{requestQty}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const maxLimit = requestProduct.showQuantity === false ? 9999 : (requestProduct.quantity ?? 10);
                        setRequestQty(Math.min(maxLimit, requestQty + 1));
                      }}
                      className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#B81862] to-[#d43d8a] text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer font-bold"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-[#7A5E6A]">piece{requestQty > 1 ? "s" : ""}</span>
                  </div>
                </div>

                {/* Description (optional) */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#443E36] mb-1.5">
                    Note / Special Request <span className="text-[#888] normal-case font-normal">(optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={requestDesc}
                    onChange={(e) => setRequestDesc(e.target.value)}
                    placeholder="Any specific requirements, customisation, or questions..."
                    className="w-full px-4 py-2.5 bg-[#FFF8FB] border border-[#F0D6E8] rounded-xl text-xs text-[#111111] placeholder-[#888] focus:outline-none focus:border-[#B81862] transition resize-none"
                  />
                </div>

                {requestError && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {requestError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={requestSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#B81862] to-[#d43d8a] text-white font-bold text-sm shadow-md hover:opacity-95 transition disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#F0D6E8] shadow-xs">
        {/* Top Gold Banner */}
        <div className="bg-[#181512] text-[#FFF8FB] py-1 px-3 text-[10px] sm:text-xs font-medium text-center tracking-wider sm:tracking-widest uppercase flex items-center justify-center gap-1.5 sm:gap-2 truncate">
          <Sparkles className="w-3 h-3 text-[#d43d8a] shrink-0" />
          <span className="truncate">Handcrafted Luxury Fine Jewellery • Certified BIS Hallmarked</span>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <img
              src="/logo.png"
              alt="Dwara Collections"
              className="h-9 sm:h-11 md:h-12 w-auto object-contain group-hover:opacity-90 transition-opacity max-w-[120px] sm:max-w-none"
            />
          </Link>

          {/* Search Bar - Desktop */}
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A5E6A] pointer-events-none" />
              <input
                id="search-input"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jewellery by name or collection..."
                className="w-full pl-10 pr-4 py-2 bg-[#FFF8FB] border border-[#F0D6E8] rounded-full text-sm text-[#111111] placeholder-[#7A5E6A] focus:outline-none focus:border-[#B81862] shadow-xs transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A5E6A] hover:text-black"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Header Cart Button with Badge */}
            <button
              id="header-cart-btn"
              onClick={() => setShowCartModal(true)}
              className="relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#B81862] text-white shadow-sm hover:opacity-95 transition cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden min-[400px]:inline">Cart</span>
              {totalCartCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-white text-[#B81862] text-[10px] sm:text-[11px] font-extrabold rounded-full shadow-xs">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Visitor Account Button + Dropdown */}
            <div className="relative">
              {visitorInfo ? (
                <button
                  onClick={() => setShowUserDropdown((p) => !p)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold bg-[#B81862]/10 text-[#B81862] border border-[#B81862]/30 hover:bg-[#B81862]/20 shadow-xs transition cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline max-w-[90px] truncate">{visitorInfo.name.split(" ")[0]}</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowVisitorModal(true)}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FFF8FB] text-[#332E29] border border-[#F0D6E8] hover:border-[#B81862] hover:text-[#B81862] shadow-xs transition cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}
              {/* User dropdown */}
              {showUserDropdown && visitorInfo && (
                <>
                  <div className="fixed inset-0 z-[35]" onClick={() => setShowUserDropdown(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#F0D6E8] rounded-2xl shadow-2xl z-[36] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-3 border-b border-[#F0D6E8] bg-[#FFF8FB]">
                      <p className="text-xs font-bold text-[#111111] truncate">{visitorInfo.name}</p>
                      <p className="text-[11px] text-[#7A5E6A] font-mono truncate">{visitorInfo.phone}</p>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <Link
                        href="/my-orders"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#111111] hover:bg-[#FFF0F7] hover:text-[#B81862] transition"
                      >
                        <ShoppingBag className="w-4 h-4 text-[#B81862]" />
                        My Orders
                      </Link>
                      <button
                        onClick={() => { setShowUserDropdown(false); setShowVisitorModal(true); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#7A5E6A] hover:bg-[#F5F5F5] transition"
                      >
                        <User className="w-4 h-4" />
                        Edit Details
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* WhatsApp */}
            <a
              id="whatsapp-header"
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi! I am interested in your jewellery catalogue.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold bg-[#25D366]/15 text-[#1b9e4b] border border-[#25D366]/30 hover:bg-[#25D366]/25 shadow-xs transition"
            >
              <MessageCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="sm:hidden px-3 pb-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7A5E6A] pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jewellery..."
              className="w-full pl-9 pr-8 py-1.5 bg-[#FFF8FB] border border-[#F0D6E8] rounded-full text-xs text-[#111111] placeholder-[#7A5E6A] focus:outline-none focus:border-[#B81862]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7A5E6A] hover:text-black"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO & CATEGORY BAR ────────────────────────────────────── */}
      <section className="border-b border-[#F0D6E8] bg-gradient-to-b from-[#FDF0F6] via-[#FFF8FB] to-[#FFF8FB] pt-4 sm:pt-6 pb-2.5 sm:pb-3 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-[#B81862]/10 text-[#B81862] border border-[#B81862]/25 mb-1.5 sm:mb-2">
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            Curated Jewellery Collection
          </span>
          <h1 className="font-serif text-xl sm:text-3xl lg:text-4xl font-bold text-[#111111] tracking-tight">
            Explore Our Catalogue
          </h1>
          <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-[#555047] max-w-xl mx-auto leading-relaxed">
            Browse our handcrafted gold, natural solitaires, and heirloom bridal pieces. Each item is BIS hallmarked and certified.
          </p>
        </div>

        {/* Circular Category Story Navigation Carousel */}
        {dedupedCategories.length > 0 && (
          <div className="relative mt-3 sm:mt-4 max-w-6xl mx-auto px-2 sm:px-6">
            {/* Left Scroll Navigation Button */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollCategories("left")}
                aria-label="Scroll left categories"
                className="absolute left-0 sm:left-1 top-[28px] sm:top-[36px] z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 border border-[#F0D6E8] text-[#B81862] shadow-md flex items-center justify-center hover:bg-[#B81862] hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer backdrop-blur-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}

            {/* Right Scroll Navigation Button */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollCategories("right")}
                aria-label="Scroll right categories"
                className="absolute right-0 sm:right-1 top-[28px] sm:top-[36px] z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/95 border border-[#F0D6E8] text-[#B81862] shadow-md flex items-center justify-center hover:bg-[#B81862] hover:text-white hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer backdrop-blur-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}

            {/* Left/Right Subtle Fade Gradients when scrollable */}
            {canScrollLeft && (
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-r from-[#FFF8FB] to-transparent z-10" />
            )}
            {canScrollRight && (
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-12 bg-gradient-to-l from-[#FFF8FB] to-transparent z-10" />
            )}

            <div
              ref={categoryScrollRef}
              className="flex items-start justify-start gap-3 sm:gap-5 md:gap-6 overflow-x-auto pt-2 pb-2 px-3 sm:px-6 no-scrollbar scroll-smooth"
            >
              {/* All Items Avatar */}
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className="flex flex-col items-center gap-1.5 sm:gap-2 group cursor-pointer shrink-0 transition-transform duration-200 hover:scale-105 focus:outline-none"
              >
                <div
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 sm:p-1 transition-all duration-300 ${
                    selectedCategory === "all"
                      ? "ring-2 sm:ring-[2.5px] ring-[#B81862] ring-offset-2 ring-offset-[#FFF8FB] bg-gradient-to-tr from-[#B81862] to-[#e0398a] shadow-md"
                      : "border-2 border-[#F0D6E8] group-hover:border-[#B81862]/60 shadow-xs"
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-[#FDF0F6] relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=300&q=80"
                      alt="All Jewellery"
                      className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md" />
                    </div>
                  </div>
                </div>
                <div className="text-center w-[84px] sm:w-[96px] min-h-[34px] flex flex-col items-center">
                  <span
                    className={`block text-[11px] sm:text-xs font-bold leading-tight line-clamp-2 transition-colors ${
                      selectedCategory === "all"
                        ? "text-[#B81862] font-extrabold"
                        : "text-[#332E29] group-hover:text-[#B81862]"
                    }`}
                  >
                    All Pieces
                  </span>
                  {selectedCategory === "all" && (
                    <span className="text-[10px] text-[#B81862] font-semibold block mt-0.5 animate-in fade-in duration-200">
                      ({products.length})
                    </span>
                  )}
                </div>
              </button>

              {/* Individual Category Avatars */}
              {dedupedCategories.map((cat) => {
                const isSelected =
                  selectedCategory === cat._id ||
                  (cat.slug && selectedCategory?.toLowerCase() === cat.slug.toLowerCase()) ||
                  (cat.name && selectedCategory?.toLowerCase() === cat.name.toLowerCase());
                const catImg = getCategoryImageUrl(cat);
                const catProductCount = products.filter((p) => {
                  const catObj =
                    typeof p.categoryId === "object" && p.categoryId !== null
                      ? (p.categoryId as { _id?: string; slug?: string; name?: string })
                      : (p.category as { _id?: string; slug?: string; name?: string } | undefined);
                  const catId = typeof p.categoryId === "string" ? p.categoryId : catObj?._id;
                  const catSlug = catObj?.slug?.toLowerCase();
                  const catName = catObj?.name?.toLowerCase();
                  const targetSlug = cat.slug?.toLowerCase();
                  const targetName = cat.name?.toLowerCase();

                  return (
                    catId === cat._id ||
                    (catSlug && targetSlug && catSlug === targetSlug) ||
                    (catName && targetName && catName === targetName) ||
                    (catName && targetSlug && catName.replace(/[^a-z0-9]/g, "") === targetSlug.replace(/[^a-z0-9]/g, ""))
                  );
                }).length;

                return (
                  <button
                    key={cat._id}
                    type="button"
                    onClick={() => setSelectedCategory(cat._id)}
                    className="flex flex-col items-center gap-1.5 sm:gap-2 group cursor-pointer shrink-0 transition-transform duration-200 hover:scale-105 focus:outline-none"
                  >
                    <div
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 sm:p-1 transition-all duration-300 ${
                        isSelected
                          ? "ring-2 sm:ring-[2.5px] ring-[#B81862] ring-offset-2 ring-offset-[#FFF8FB] bg-gradient-to-tr from-[#B81862] to-[#e0398a] shadow-md"
                          : "border-2 border-[#F0D6E8] group-hover:border-[#B81862]/60 shadow-xs"
                      }`}
                    >
                      <div className="w-full h-full rounded-full overflow-hidden bg-[#FDF0F6] relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={catImg}
                          alt={cat.name}
                          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = getCategoryPlaceholder(cat.name);
                          }}
                        />
                      </div>
                    </div>
                    <div className="text-center w-[84px] sm:w-[96px] min-h-[34px] flex flex-col items-center">
                      <span
                        className={`block text-[11px] sm:text-xs font-bold leading-tight line-clamp-2 transition-colors ${
                          isSelected
                            ? "text-[#B81862] font-extrabold"
                            : "text-[#332E29] group-hover:text-[#B81862]"
                        }`}
                        title={cat.name}
                      >
                        {cat.name}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] text-[#B81862] font-semibold block mt-0.5 animate-in fade-in duration-200">
                          ({catProductCount})
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ── PRODUCT GRID ──────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 pt-2 sm:pt-4 pb-28">
        {/* ── RESPONSIVE SEARCH & FILTERS TOOLBAR ──────────────────────── */}
        <div className="mb-4 sm:mb-6 space-y-2.5">
          {/* ── MOBILE FILTER STRIP (< md) ── */}
          <div className="md:hidden bg-white/95 backdrop-blur-md rounded-2xl border border-[#F0D6E8] p-2.5 shadow-[0_2px_12px_rgba(184,24,98,0.04)] space-y-2">
            {/* Action Strip: Filter Drawer Button + Scrollable Quick Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {/* Primary Filter & Sort Trigger */}
              <button
                type="button"
                onClick={() => setShowMobileFilterDrawer(true)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                  activeFilterCount > 0
                    ? "bg-gradient-to-r from-[#B81862] to-[#d43d8a] text-white shadow-sm"
                    : "bg-[#FFF8FB] text-[#B81862] border border-[#B81862]/30 hover:bg-[#FFF0F7]"
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters & Sort</span>
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 w-4 h-4 rounded-full bg-white text-[#B81862] text-[10px] font-extrabold flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="w-[1px] h-6 bg-[#F0D6E8] shrink-0" />

              {/* Quick Filter: Featured */}
              <button
                type="button"
                onClick={() => setOnlyFeatured(!onlyFeatured)}
                className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
                  onlyFeatured
                    ? "bg-[#B81862] text-white shadow-xs"
                    : "bg-[#FFF8FB] border border-[#F0D6E8] text-[#555047]"
                }`}
              >
                <Star className={`w-3 h-3 ${onlyFeatured ? "fill-white text-white" : "text-[#B81862]"}`} />
                <span>Featured</span>
              </button>

              {/* Quick Filter: Offers */}
              <button
                type="button"
                onClick={() => setOnlyDiscounted(!onlyDiscounted)}
                className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
                  onlyDiscounted
                    ? "bg-[#B81862] text-white shadow-xs"
                    : "bg-[#FFF8FB] border border-[#F0D6E8] text-[#555047]"
                }`}
              >
                <Percent className={`w-3 h-3 ${onlyDiscounted ? "text-white" : "text-[#B81862]"}`} />
                <span>Offers</span>
              </button>

              {/* Quick Filter: In Stock */}
              <button
                type="button"
                onClick={() => setSelectedStock(selectedStock === "in_stock" ? "all" : "in_stock")}
                className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
                  selectedStock === "in_stock"
                    ? "bg-[#B81862] text-white shadow-xs"
                    : "bg-[#FFF8FB] border border-[#F0D6E8] text-[#555047]"
                }`}
              >
                <Package className={`w-3 h-3 ${selectedStock === "in_stock" ? "text-white" : "text-[#B81862]"}`} />
                <span>In Stock</span>
              </button>

              {/* Quick Filter: Under 1L */}
              <button
                type="button"
                onClick={() => setPriceRange(priceRange === "under_1l" ? "all" : "under_1l")}
                className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition cursor-pointer ${
                  priceRange === "under_1l"
                    ? "bg-[#B81862] text-white shadow-xs"
                    : "bg-[#FFF8FB] border border-[#F0D6E8] text-[#555047]"
                }`}
              >
                <span>&lt; ₹1 Lakh</span>
              </button>

              {/* Quick Reset Button if any filter is active */}
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-[#B81862] bg-[#FDE8F2] hover:bg-[#fbd0e4] transition cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Mobile Subline: Piece Count & Active Tags */}
            <div className="flex items-center justify-between text-[11px] text-[#7A5E6A] pt-1 border-t border-[#F0D6E8]/50">
              <span>
                Showing <strong className="text-[#111111] font-bold">{filteredProducts.length}</strong> of{" "}
                <span>{products.length}</span> pieces
              </span>

              {sortBy !== "featured" && (
                <span className="text-[10px] text-[#B81862] font-semibold truncate max-w-[140px]">
                  Sort: {sortBy === "newest" ? "Newest" : sortBy === "price-asc" ? "Price Low-High" : sortBy === "price-desc" ? "Price High-Low" : sortBy === "name-asc" ? "Name A-Z" : "Custom"}
                </span>
              )}
            </div>
          </div>

          {/* ── DESKTOP FILTER TOOLBAR (>= md) ── */}
          <div className="hidden md:block bg-white/80 backdrop-blur-md rounded-2xl border border-[#F0D6E8] p-4 shadow-[0_4px_20px_rgba(184,24,98,0.04)] space-y-3">
            {/* Top row: Search Bar + Filter Dropdowns */}
            <div className="flex flex-row items-center gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#B81862] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="homepage-search-input"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search jewellery, SKU, gemstones, diamonds, gold..."
                  className="w-full pl-9 pr-9 py-2.5 bg-[#FFF8FB] border border-[#F0D6E8] rounded-xl text-xs sm:text-sm text-[#111111] placeholder:text-[#998E84] focus:outline-none focus:border-[#B81862] focus:ring-1 focus:ring-[#B81862] transition"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#888] hover:text-[#111] hover:bg-[#F0D6E8]/50 transition cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Category Dropdown */}
                <select
                  id="homepage-category-filter"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2.5 bg-[#FFF8FB] border border-[#F0D6E8] rounded-xl text-xs font-medium text-[#111111] focus:outline-none focus:border-[#B81862] transition cursor-pointer min-w-[130px]"
                >
                  <option value="all">All Collections</option>
                  {dedupedCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Stock Status Dropdown */}
                <select
                  id="homepage-stock-filter"
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                  className="px-3 py-2.5 bg-[#FFF8FB] border border-[#F0D6E8] rounded-xl text-xs font-medium text-[#111111] focus:outline-none focus:border-[#B81862] transition cursor-pointer min-w-[115px]"
                >
                  <option value="all">All Stock</option>
                  <option value="in_stock">In Stock</option>
                  <option value="made_to_order">Made to Order</option>
                </select>

                {/* Price Range Dropdown */}
                <select
                  id="homepage-price-filter"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="px-3 py-2.5 bg-[#FFF8FB] border border-[#F0D6E8] rounded-xl text-xs font-medium text-[#111111] focus:outline-none focus:border-[#B81862] transition cursor-pointer min-w-[130px]"
                >
                  <option value="all">All Prices</option>
                  <option value="under_1l">Under ₹1,00,000</option>
                  <option value="1l_5l">₹1L – ₹5 Lakh</option>
                  <option value="above_5l">Above ₹5,00,000</option>
                </select>

                {/* Sort By Dropdown */}
                <select
                  id="homepage-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2.5 bg-[#FFF8FB] border border-[#F0D6E8] rounded-xl text-xs font-medium text-[#111111] focus:outline-none focus:border-[#B81862] transition cursor-pointer min-w-[135px]"
                >
                  <option value="featured">Featured First</option>
                  <option value="newest">Newest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="qty-desc">Quantity: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                </select>
              </div>
            </div>

            {/* Quick Toggle Pills: Featured & Discounted Offers */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#F0D6E8]/60 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-bold text-[#7A5E6A] uppercase tracking-wider hidden sm:inline mr-1">
                  Quick Filters:
                </span>
                <button
                  type="button"
                  onClick={() => setOnlyFeatured(!onlyFeatured)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                    onlyFeatured
                      ? "bg-[#B81862] text-white shadow-xs"
                      : "bg-[#FFF8FB] border border-[#F0D6E8] text-[#555047] hover:border-[#B81862]/40"
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${onlyFeatured ? "fill-white text-white" : "text-[#B81862]"}`} />
                  <span>Featured Pieces</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOnlyDiscounted(!onlyDiscounted)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                    onlyDiscounted
                      ? "bg-[#B81862] text-white shadow-xs"
                      : "bg-[#FFF8FB] border border-[#F0D6E8] text-[#555047] hover:border-[#B81862]/40"
                  }`}
                >
                  <Percent className={`w-3.5 h-3.5 ${onlyDiscounted ? "text-white" : "text-[#B81862]"}`} />
                  <span>Special Offers</span>
                </button>

                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-semibold text-xs text-[#B81862] hover:bg-[#FDE8F2] transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset All ({activeFilterCount})</span>
                  </button>
                )}
              </div>

              <div className="text-[11px] text-[#7A5E6A] font-medium">
                Showing <strong className="text-[#111111] font-bold">{filteredProducts.length}</strong> of{" "}
                <span>{products.length}</span> pieces
              </div>
            </div>
          </div>

          {/* Active Filter Badges (Shared) */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#FDE8F2] text-[#B81862] border border-[#F0D6E8]">
                  Search: &ldquo;{search}&rdquo;
                  <button onClick={() => setSearch("")} className="hover:text-black cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedCategory !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#FDE8F2] text-[#B81862] border border-[#F0D6E8]">
                  Collection: {categories.find((c) => c._id === selectedCategory)?.name || selectedCategory}
                  <button onClick={() => setSelectedCategory("all")} className="hover:text-black cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedStock !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#FDE8F2] text-[#B81862] border border-[#F0D6E8]">
                  Stock: {selectedStock === "in_stock" ? "In Stock" : "Made to Order"}
                  <button onClick={() => setSelectedStock("all")} className="hover:text-black cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {priceRange !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#FDE8F2] text-[#B81862] border border-[#F0D6E8]">
                  Price:{" "}
                  {priceRange === "under_1l"
                    ? "Under ₹1 Lakh"
                    : priceRange === "1l_5l"
                    ? "₹1L – ₹5L"
                    : "Above ₹5 Lakh"}
                  <button onClick={() => setPriceRange("all")} className="hover:text-black cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {onlyFeatured && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#FDE8F2] text-[#B81862] border border-[#F0D6E8]">
                  ★ Featured
                  <button onClick={() => setOnlyFeatured(false)} className="hover:text-black cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {onlyDiscounted && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#FDE8F2] text-[#B81862] border border-[#F0D6E8]">
                  % Special Offers
                  <button onClick={() => setOnlyDiscounted(false)} className="hover:text-black cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── MOBILE FILTER & SORT BOTTOM DRAWER MODAL ────────────────── */}
        {showMobileFilterDrawer && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowMobileFilterDrawer(false)}
          >
            <div
              className="bg-white border-t sm:border border-[#F0D6E8] rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-8 duration-300 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Drag Handle & Header */}
              <div className="p-4 border-b border-[#F0D6E8] bg-[#FFF8FB] shrink-0">
                <div className="w-10 h-1 bg-[#E8D0E0] rounded-full mx-auto mb-3 sm:hidden" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#B81862] to-[#d43d8a] flex items-center justify-center text-white shadow-xs">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-bold text-[#111111]">Filter & Sort</h3>
                      <p className="text-[11px] text-[#7A5E6A]">Refine jewellery catalogue</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={resetAllFilters}
                        className="text-xs font-bold text-[#B81862] hover:underline px-2 py-1 cursor-pointer"
                      >
                        Reset All
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowMobileFilterDrawer(false)}
                      className="p-1.5 rounded-full text-[#666] hover:bg-black/5 transition cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawer Body - Scrollable Sections */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* 1. Sort By */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#443E36] mb-2.5">
                    Sort Order
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "featured", label: "Featured First" },
                      { id: "newest", label: "Newest Arrivals" },
                      { id: "price-asc", label: "Price: Low to High" },
                      { id: "price-desc", label: "Price: High to Low" },
                      { id: "qty-desc", label: "Quantity: High to Low" },
                      { id: "name-asc", label: "Name: A to Z" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSortBy(opt.id)}
                        className={`p-2.5 rounded-xl text-xs font-medium text-left border transition flex items-center justify-between cursor-pointer ${
                          sortBy === opt.id
                            ? "bg-[#FFF0F7] border-[#B81862] text-[#B81862] font-bold"
                            : "bg-[#FFF8FB] border-[#F0D6E8] text-[#332E29]"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-[#B81862]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Collections / Categories */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#443E36] mb-2.5">
                    Jewellery Collection
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory("all")}
                      className={`px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                        selectedCategory === "all"
                          ? "bg-[#B81862] text-white border-[#B81862] font-bold shadow-xs"
                          : "bg-[#FFF8FB] text-[#332E29] border-[#F0D6E8]"
                      }`}
                    >
                      All Collections ({products.length})
                    </button>
                    {dedupedCategories.map((c) => {
                      const isSelected = selectedCategory === c._id;
                      return (
                        <button
                          key={c._id}
                          type="button"
                          onClick={() => setSelectedCategory(c._id)}
                          className={`px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                            isSelected
                              ? "bg-[#B81862] text-white border-[#B81862] font-bold shadow-xs"
                              : "bg-[#FFF8FB] text-[#332E29] border-[#F0D6E8]"
                          }`}
                        >
                          {c.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Price Range */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#443E36] mb-2.5">
                    Price Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "all", label: "All Prices" },
                      { id: "under_1l", label: "Under ₹1,00,000" },
                      { id: "1l_5l", label: "₹1L – ₹5 Lakh" },
                      { id: "above_5l", label: "Above ₹5,00,000" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPriceRange(opt.id)}
                        className={`p-2.5 rounded-xl text-xs font-medium text-left border transition flex items-center justify-between cursor-pointer ${
                          priceRange === opt.id
                            ? "bg-[#FFF0F7] border-[#B81862] text-[#B81862] font-bold"
                            : "bg-[#FFF8FB] border-[#F0D6E8] text-[#332E29]"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {priceRange === opt.id && <Check className="w-3.5 h-3.5 text-[#B81862]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Stock Status */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#443E36] mb-2.5">
                    Availability
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "all", label: "All Items" },
                      { id: "in_stock", label: "In Stock" },
                      { id: "made_to_order", label: "Made to Order" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setSelectedStock(opt.id)}
                        className={`p-2 rounded-xl text-xs font-medium text-center border transition cursor-pointer ${
                          selectedStock === opt.id
                            ? "bg-[#FFF0F7] border-[#B81862] text-[#B81862] font-bold"
                            : "bg-[#FFF8FB] border-[#F0D6E8] text-[#332E29]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Special Highlights */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#443E36] mb-2.5">
                    Highlights
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOnlyFeatured(!onlyFeatured)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition flex items-center justify-between cursor-pointer ${
                        onlyFeatured
                          ? "bg-[#FFF0F7] border-[#B81862] text-[#B81862]"
                          : "bg-[#FFF8FB] border-[#F0D6E8] text-[#555047]"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Star className={`w-3.5 h-3.5 ${onlyFeatured ? "fill-[#B81862] text-[#B81862]" : "text-gray-400"}`} />
                        Featured Pieces
                      </span>
                      {onlyFeatured && <Check className="w-3.5 h-3.5 text-[#B81862]" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setOnlyDiscounted(!onlyDiscounted)}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition flex items-center justify-between cursor-pointer ${
                        onlyDiscounted
                          ? "bg-[#FFF0F7] border-[#B81862] text-[#B81862]"
                          : "bg-[#FFF8FB] border-[#F0D6E8] text-[#555047]"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Percent className={`w-3.5 h-3.5 ${onlyDiscounted ? "text-[#B81862]" : "text-gray-400"}`} />
                        Special Offers
                      </span>
                      {onlyDiscounted && <Check className="w-3.5 h-3.5 text-[#B81862]" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawer Sticky Footer */}
              <div className="p-4 border-t border-[#F0D6E8] bg-[#FFF8FB] shrink-0">
                <button
                  type="button"
                  onClick={() => setShowMobileFilterDrawer(false)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B81862] to-[#d43d8a] text-white font-bold text-sm shadow-md hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Show {filteredProducts.length} Jewellery Pieces</span>
                </button>
              </div>
            </div>
          </div>
        )}


        {loading ? (
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#F0D6E8] p-4 animate-pulse space-y-3 shadow-xs">
                <div className="w-full aspect-square bg-[#FDF0F6] rounded-xl" />
                <div className="h-4 bg-[#FDF0F6] rounded w-3/4" />
                <div className="h-5 bg-[#FDF0F6] rounded w-1/2" />
                <div className="h-3 bg-[#FDF0F6] rounded w-1/3" />
                <div className="h-3 bg-[#FDF0F6] rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-[#F0D6E8] max-w-md mx-auto p-6 shadow-sm">
            <Package className="w-12 h-12 text-[#888] mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-[#111111] mb-1">No products found</h3>
            <p className="text-xs text-[#555047] mb-4">
              {search
                ? `No products matched "${search}". Try adjusting your filters.`
                : "No items match the selected filter criteria."}
            </p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-4 py-2 bg-[#FDE8F2] hover:bg-[#FDF0F6] text-xs font-semibold rounded-lg text-[#B81862] border border-[#F0D6E8] transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => {
              const imageUrl = getPrimaryImage(product);
              const stockQty = product.quantity ?? 10;
              const isLowStock = stockQty > 0 && stockQty <= 3;
              const isOutOfStock = stockQty <= 0 || product.stockStatus === "out_of_stock";

              const cardSelectedQty = getCardSelectedQty(product._id);
              const inCartQty = cart[product._id]?.quantity || 0;
              const wasJustAdded = addedAnimationId === product._id;

              return (
                <div
                  key={product._id}
                  onClick={() => openProductModal(product)}
                  className="group bg-white hover:bg-[#FFF8FB] rounded-2xl border border-[#F0D6E8] hover:border-[#B81862]/60 transition-all duration-300 overflow-hidden flex flex-col cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_30px_rgba(184,24,98,0.12)]"
                >
                  {/* Image Stage */}
                  <div className="relative w-full aspect-square bg-[#FDF0F6] overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt={product.name}
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* In-cart badge */}
                    {inCartQty > 0 && (
                      <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3">
                        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-[#B81862] text-white shadow-md flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          {inCartQty} in cart
                        </span>
                      </div>
                    )}

                    {/* Stock badge */}
                    <div className="absolute top-2.5 sm:top-3 right-2.5 sm:top-3 right-3">
                      {isOutOfStock ? (
                        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-bold bg-red-100 text-red-800 border border-red-300 backdrop-blur-sm shadow-xs">
                          Out of Stock
                        </span>
                      ) : product.showQuantity === false ? (
                        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 backdrop-blur-sm shadow-xs">
                          In Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 backdrop-blur-sm shadow-xs">
                          Only {stockQty} left!
                        </span>
                      ) : (
                        <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 backdrop-blur-sm shadow-xs">
                          {stockQty} available
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5 sm:space-y-3">
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
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B81862] block mb-0.5 sm:mb-1">
                            {cName}
                          </span>
                        ) : null;
                      })()}

                      <h2 className="font-serif font-bold text-sm sm:text-base text-[#111111] group-hover:text-[#B81862] transition-colors line-clamp-1">
                        {product.name}
                      </h2>

                      {/* Price */}
                      <div className="mt-1 sm:mt-1.5 flex items-baseline gap-2">
                        <span className="font-bold text-base sm:text-lg text-[#B81862]">
                          {formatPrice(product.discountPrice || product.price)}
                        </span>
                        {product.discountPrice && (
                          <span className="text-xs text-[#777] line-through">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>

                      {/* Quantity & SKU */}
                      <div className="mt-1 flex items-center justify-between text-[11px] sm:text-xs text-[#7A5E6A]">
                        <span className="font-mono text-[10px] sm:text-[11px] truncate max-w-[130px]">SKU: {product.sku || "N/A"}</span>
                        {product.showQuantity !== false ? (
                          <span className="shrink-0">{stockQty} in stock</span>
                        ) : (
                          <span className="shrink-0 text-emerald-700 font-semibold">Available</span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="mt-1.5 sm:mt-2 text-xs text-[#555047] line-clamp-2 leading-relaxed">
                        {product.shortDescription ||
                          product.description ||
                          "Handcrafted luxury fine jewellery design hallmarked to perfection."}
                      </p>
                    </div>

                    {/* Cart Interactive Controls */}
                    <div className="pt-2 border-t border-[#F0D6E8] space-y-2">
                      {/* Quantity Selector + Add to Cart Row */}
                      <div
                        className="flex items-center gap-1.5 sm:gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Minus / Qty / Plus Controller */}
                        <div className="flex items-center bg-[#FFF8FB] rounded-xl border border-[#F0D6E8] p-0.5 sm:p-1 shrink-0 shadow-xs">
                          <button
                            type="button"
                            onClick={(e) => handleCardQtyChange(product, -1, e)}
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white hover:bg-[#FDF0F6] text-[#B81862] flex items-center justify-center transition cursor-pointer font-bold border border-[#F0D6E8]"
                            title="Decrease Quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 sm:w-7 text-center font-bold text-xs text-[#111111]">
                            {cardSelectedQty}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCardQtyChange(product, 1, e)}
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-r from-[#B81862] to-[#d43d8a] text-white flex items-center justify-center hover:opacity-90 transition cursor-pointer font-bold"
                            title="Increase Quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Add to Cart Button */}
                        <button
                          type="button"
                          onClick={(e) => handleAddToCart(product, e)}
                          className={`flex-1 py-1.5 sm:py-2 px-2.5 sm:px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                            wasJustAdded
                              ? "bg-emerald-600 text-white shadow-md scale-98"
                              : inCartQty > 0
                              ? "bg-[#B81862] text-white hover:opacity-90"
                              : "bg-[#B81862]/10 hover:bg-[#B81862]/20 text-[#B81862] border border-[#B81862]/30"
                          }`}
                        >
                          {wasJustAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              <span>Added!</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                              <span>Add ({cardSelectedQty})</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Direct Request & WhatsApp Buttons */}
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                        {/* Direct Single Request */}
                        <button
                          type="button"
                          onClick={(e) => openRequestModal(product, e)}
                          className="py-1.5 px-1.5 sm:px-2 rounded-xl text-[10px] sm:text-[11px] font-semibold bg-[#FFF8FB] text-[#332E29] hover:text-[#B81862] border border-[#F0D6E8] hover:border-[#B81862] transition cursor-pointer text-center truncate"
                        >
                          Quick Request
                        </button>

                        {/* WhatsApp Direct Enquiry */}
                        <a
                          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                            `Hello Dwara Collections, I would like to enquire about: ${product.name} (SKU: ${product.sku || "N/A"}) priced at ${formatPrice(product.discountPrice || product.price)}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="py-1.5 px-1.5 sm:px-2 rounded-xl text-[10px] sm:text-[11px] font-semibold bg-[#F5F1EB] hover:bg-[#25D366]/20 text-[#332E29] hover:text-[#1b9e4b] border border-[#F0D6E8] hover:border-[#25D366]/40 transition flex items-center justify-center gap-1 text-center truncate"
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── FLOATING BOTTOM CART ACTION BAR ────────────────────────── */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-lg px-2 sm:px-4 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-[#141414]/95 text-white backdrop-blur-md border border-white/20 rounded-2xl p-2.5 sm:p-3.5 shadow-2xl flex items-center justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#B81862] to-[#d43d8a] flex items-center justify-center text-white shrink-0 shadow-sm">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <span className="font-bold text-xs sm:text-sm text-white truncate">
                    {totalCartCount} {totalCartCount === 1 ? "Item" : "Items"}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-[#FDF0F6] font-semibold bg-[#B81862] px-1.5 sm:px-2 py-0.5 rounded-full">
                    {formatPrice(totalCartPrice)}
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] text-gray-300 hidden min-[360px]:block truncate">Review and request</span>
              </div>
            </div>

            <button
              id="floating-view-cart-btn"
              onClick={() => setShowCartModal(true)}
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#B81862] to-[#d43d8a] text-white font-bold text-xs shadow-md hover:opacity-95 transition cursor-pointer shrink-0 flex items-center gap-1 sm:gap-1.5"
            >
              <span>View Cart</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── PRODUCT DETAIL MODAL ──────────────────────────────────── */}
      {selectedProduct && (() => {
        const modalProductImages = getProductImages(selectedProduct);
        const currentActiveIdx = Math.min(productModalImageIndex, Math.max(0, modalProductImages.length - 1));
        const activeImageUrl = modalProductImages[currentActiveIdx] || modalProductImages[0];

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setSelectedProduct(null)}
          >
            <div
              className="bg-white border border-[#F0D6E8] rounded-2xl sm:rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl relative flex flex-col md:flex-row max-h-[92vh] md:max-h-[90vh] text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 z-30 p-2 rounded-full bg-white/90 text-gray-800 hover:bg-white hover:text-[#B81862] border border-black/10 transition shadow-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Image Column */}
              <div className="w-full md:w-1/2 h-52 sm:h-64 md:h-auto max-h-[35vh] md:max-h-none bg-[#FDF0F6] relative shrink-0 border-b md:border-b-0 md:border-r border-[#F0D6E8] flex items-center justify-center overflow-hidden group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeImageUrl}
                  alt={`${selectedProduct.name} - Photo ${currentActiveIdx + 1}`}
                  className="w-full h-full object-cover object-center transition-all duration-300"
                />

                {/* Left navigation arrow */}
                {modalProductImages.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProductModalImageIndex((prev) =>
                        prev > 0 ? prev - 1 : modalProductImages.length - 1
                      );
                    }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black backdrop-blur-md flex items-center justify-center transition shadow-lg z-20 cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}

                {/* Right navigation arrow */}
                {modalProductImages.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProductModalImageIndex((prev) =>
                        prev < modalProductImages.length - 1 ? prev + 1 : 0
                      );
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white hover:bg-black backdrop-blur-md flex items-center justify-center transition shadow-lg z-20 cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}

                {/* Dot navigation */}
                {modalProductImages.length > 1 && (
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
                    {modalProductImages.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProductModalImageIndex(idx);
                        }}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          currentActiveIdx === idx
                            ? "bg-[#B81862] w-4"
                            : "bg-white/70 hover:bg-white w-2"
                        }`}
                        aria-label={`View photo ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Counter Tag */}
                {modalProductImages.length > 1 && (
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-black/60 text-white backdrop-blur-md z-20">
                    {currentActiveIdx + 1} / {modalProductImages.length}
                  </div>
                )}

                {/* Featured Badge */}
                {selectedProduct.isFeatured && (
                  <div className="absolute top-3 left-3 z-20">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#B81862] text-white shadow-md flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Featured
                    </span>
                  </div>
                )}
              </div>

              {/* Content Column */}
              <div className="p-4 sm:p-6 md:p-7 flex-1 flex flex-col justify-between overflow-y-auto space-y-3.5 sm:space-y-4">
                <div className="space-y-2.5 sm:space-y-3.5">
                  {/* Category & SKU */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#B81862]">
                      {(typeof selectedProduct.categoryId === "object" && selectedProduct.categoryId !== null
                        ? (selectedProduct.categoryId as { name?: string })?.name
                        : null) ||
                        selectedProduct.category?.name ||
                        "Fine Jewellery"}
                    </span>
                    <span className="font-mono text-[10px] sm:text-[11px] text-[#7A5E6A] bg-[#FFF8FB] px-2 py-0.5 rounded border border-[#F0D6E8]">
                      SKU: {selectedProduct.sku}
                    </span>
                  </div>

                  <h2 className="font-serif text-lg sm:text-2xl font-bold text-[#111111] leading-snug tracking-tight">
                    {selectedProduct.name}
                  </h2>

                  {/* Thumbnail Selector Strip (if > 1 image) */}
                  {modalProductImages.length > 1 && (
                    <div className="flex items-center gap-2 py-1 overflow-x-auto">
                      {modalProductImages.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setProductModalImageIndex(idx)}
                          className={`w-12 h-12 rounded-xl overflow-hidden border-2 transition cursor-pointer shrink-0 bg-[#FFF8FB] ${
                            currentActiveIdx === idx
                              ? "border-[#B81862] ring-2 ring-[#B81862]/30 scale-105"
                              : "border-[#F0D6E8] opacity-60 hover:opacity-100"
                          }`}
                          title={`View photo ${idx + 1}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={imgUrl}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-2.5 pt-0.5 border-b border-[#F0D6E8] pb-2.5 sm:pb-3">
                    <span className="text-xl sm:text-3xl font-bold text-[#B81862]">
                      {formatPrice(selectedProduct.discountPrice || selectedProduct.price)}
                    </span>
                    {selectedProduct.discountPrice && (
                      <span className="text-xs text-[#777] line-through font-medium">
                        {formatPrice(selectedProduct.price)}
                      </span>
                    )}
                  </div>

                  {/* Stock Info */}
                  <div className="p-2.5 sm:p-3 bg-[#FFF8FB] rounded-xl border border-[#F0D6E8] flex items-center justify-between text-xs">
                    <span className="text-[#7A5E6A] font-medium">Stock Status:</span>
                    <span className="font-bold text-emerald-700">
                      {selectedProduct.showQuantity === false
                        ? "In Stock"
                        : selectedProduct.quantity
                        ? `${selectedProduct.quantity} units available`
                        : "In Stock"}
                    </span>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7A5E6A] mb-1">About This Piece</h4>
                    <p className="text-xs text-[#555047] leading-relaxed">
                      {selectedProduct.description || selectedProduct.shortDescription || "No detailed description available."}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-3 sm:pt-4 border-t border-[#F0D6E8] space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        handleAddToCart(selectedProduct, e);
                        setShowCartModal(true);
                        setSelectedProduct(null);
                      }}
                      className="flex-1 py-2.5 sm:py-3 px-4 rounded-xl bg-gradient-to-r from-[#B81862] to-[#d43d8a] text-white font-bold text-xs shadow-md hover:opacity-95 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart &amp; Request</span>
                    </button>

                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                        `Hello Dwara Collections, I am interested in: ${selectedProduct.name} (SKU: ${selectedProduct.sku || "N/A"}).`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 sm:p-3 rounded-xl bg-[#25D366] text-white hover:bg-[#20ba59] transition flex items-center justify-center shadow-md shrink-0"
                      title="Enquire on WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── FOOTER ────────────────────────────────────────────────── */}
      <footer className="border-t border-[#F0D6E8] bg-[#FDE8F2] py-6 px-4 text-center text-xs text-[#665F55]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Dwara Collections. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
