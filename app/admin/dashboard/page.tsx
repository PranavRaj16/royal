"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Tag,
  LayoutDashboard,
  Plus,
  ArrowRight,
  TrendingUp,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  ShoppingBag,
  Layers,
  Award,
  Flame,
  ArrowUpRight,
  InboxIcon,
} from "lucide-react";
import { IProduct, ICategory } from "@/types";
import { getProductPlaceholder, getCategoryPlaceholder } from "@/lib/placeholderImages";

interface Stats {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  featuredProducts: number;
  totalCategories: number;
}

interface TopProduct {
  productId: string;
  name: string;
  sku: string;
  price: number;
  discountPrice?: number;
  image: string;
  categoryName: string;
  requestCount: number;
  totalQuantity: number;
  percentage: number;
}

interface TopCategory {
  categoryId: string;
  name: string;
  slug: string;
  image: string;
  requestCount: number;
  totalQuantity: number;
  percentage: number;
}

interface AnalyticsData {
  topProducts: TopProduct[];
  topCategories: TopCategory[];
  summary: {
    totalRequests: number;
    totalOrders: number;
    totalUnitsRequested: number;
    pendingRequests: number;
    fulfilledRequests: number;
    conversionRate: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentProducts, setRecentProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/products?sort=newest").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/admin/analytics").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([productsData, catsData, analyticsData]) => {
        const products: IProduct[] = productsData?.products || [];
        const cats: ICategory[] = catsData?.categories || [];
        setCategories(cats);
        setRecentProducts(products.slice(0, 5));
        setStats({
          totalProducts: products.length,
          publishedProducts: products.filter((p) => p.isPublished).length,
          draftProducts: products.filter((p) => !p.isPublished).length,
          featuredProducts: products.filter((p) => p.isFeatured).length,
          totalCategories: cats.length,
        });
        if (analyticsData?.success) {
          setAnalytics(analyticsData);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalRequestsCount = analytics?.summary?.totalRequests ?? 0;

  const statCards = [
    {
      id: "stat-total",
      label: "Total Products",
      value: stats?.totalProducts ?? "—",
      icon: Package,
      color: "#B81862",
      href: "/admin/products",
    },
    {
      id: "stat-requests",
      label: "Customer Inquiries / Orders",
      value: totalRequestsCount,
      icon: ShoppingBag,
      color: "#ec4899",
      href: "/admin/requests",
    },
    {
      id: "stat-published",
      label: "Published",
      value: stats?.publishedProducts ?? "—",
      icon: Eye,
      color: "#22c55e",
      href: "/admin/products?status=published",
    },
    {
      id: "stat-categories",
      label: "Categories",
      value: stats?.totalCategories ?? "—",
      icon: Tag,
      color: "#8b5cf6",
      href: "/admin/products",
    },
  ];

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-400 text-black font-black text-xs flex items-center justify-center shadow-md shadow-amber-400/30 border border-amber-300 shrink-0">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 font-bold text-xs flex items-center justify-center shadow-md shadow-slate-300/20 border border-slate-200 shrink-0">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-6 h-6 rounded-full bg-amber-700 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-amber-700/20 border border-amber-600 shrink-0">
          3
        </span>
      );
    }
    return (
      <span className="w-6 h-6 rounded-full bg-[var(--surface-2)] text-[var(--muted)] font-semibold text-xs flex items-center justify-center border border-[var(--border)] shrink-0">
        {rank}
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="w-5 h-5 text-[#B81862]" />
            <h1 className="font-serif text-2xl font-bold text-[var(--foreground)]">
              Dashboard
            </h1>
          </div>
          <p className="text-sm text-[var(--muted)]">
            Welcome back. Here&apos;s an overview of your catalogue, top performing pieces, and customer demand.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            id="view-requests-btn"
            href="/admin/requests"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--surface-2)] border border-[var(--border)] text-[var(--foreground)] hover:border-[#B81862]/40 transition flex items-center gap-2"
          >
            <InboxIcon className="w-4 h-4 text-[#B81862]" />
            View Orders ({totalRequestsCount})
          </Link>
          <Link
            id="add-product-btn"
            href="/admin/products/new"
            className="btn-primary self-start sm:self-auto text-xs"
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.id}
              id={card.id}
              href={card.href}
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 hover:border-[#B81862]/40 transition product-card group"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${card.color}20` }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <ArrowRight
                  className="w-4 h-4 text-[var(--muted)] opacity-0 group-hover:opacity-100 transition"
                />
              </div>
              {loading ? (
                <div className="h-8 w-12 bg-[var(--surface-2)] rounded animate-pulse mb-1" />
              ) : (
                <span className="block text-3xl font-bold text-[var(--foreground)] mb-1">
                  {card.value}
                </span>
              )}
              <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                {card.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          ANALYTICS: TOP 5 CATEGORIES & TOP 5 PRODUCTS BY SALES REQUESTS
      ────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#B81862]/10 border border-[#B81862]/20 flex items-center justify-center text-[#B81862]">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                Demand &amp; Sales Analytics
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#B81862]/15 text-[#B81862] border border-[#B81862]/30">
                  Top 5 Leaderboard
                </span>
              </h2>
              <p className="text-xs text-[var(--muted)]">
                Ranked by customer requests, inquiries, and orders.
              </p>
            </div>
          </div>

          {analytics?.summary && (
            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--muted)] font-medium">
                Total Pieces In Demand: <strong className="text-[var(--foreground)]">{analytics.summary.totalUnitsRequested}</strong>
              </span>
              <Link
                href="/admin/requests"
                className="text-[#B81862] hover:underline font-semibold flex items-center gap-1 text-xs"
              >
                Manage Inquiries →
              </Link>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top 5 Categories Card */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col justify-between">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#8b5cf6]" />
                <span className="font-bold text-[var(--foreground)] text-sm">
                  Top 5 Categories
                </span>
                <span className="text-[11px] text-[var(--muted)] font-normal">
                  by requests for sales
                </span>
              </div>
              <span className="text-xs text-[var(--muted)] font-medium">
                {analytics?.topCategories?.length || 0} Ranked
              </span>
            </div>

            <div className="p-4 flex-1">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-14 bg-[var(--surface-2)] rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : !analytics?.topCategories || analytics.topCategories.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Tag className="w-8 h-8 text-[var(--border)] mx-auto" />
                  <p className="text-xs text-[var(--muted)]">No category request data yet.</p>
                  <p className="text-[11px] text-[var(--muted)]">
                    Inquiries submitted on the store will populate category demand here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {analytics.topCategories.map((cat, idx) => {
                    const rank = idx + 1;
                    const maxRequests = analytics.topCategories[0]?.requestCount || 1;
                    const fillPercent = Math.max(12, Math.round((cat.requestCount / maxRequests) * 100));

                    return (
                      <Link
                        key={cat.categoryId || idx}
                        href={`/admin/products?category=${cat.categoryId}`}
                        id={`top-cat-${cat.categoryId}`}
                        className="group flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-[var(--surface-2)] border border-transparent hover:border-[var(--border)] transition"
                      >
                        {getRankBadge(rank)}

                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--surface-2)] border border-[var(--border)] shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cat.image || getCategoryPlaceholder(cat.name)}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-[var(--foreground)] truncate group-hover:text-[#B81862] transition">
                              {cat.name}
                            </span>
                            <span className="text-xs font-bold text-[var(--foreground)] shrink-0 ml-2">
                              {cat.requestCount} {cat.requestCount === 1 ? "request" : "requests"}
                            </span>
                          </div>

                          {/* Progress bar and quantity details */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#B81862] transition-all duration-500"
                                style={{ width: `${fillPercent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-[var(--muted)] font-mono shrink-0">
                              {cat.totalQuantity} {cat.totalQuantity === 1 ? "unit" : "units"}
                            </span>
                          </div>
                        </div>

                        <ArrowUpRight className="w-4 h-4 text-[var(--muted)] opacity-0 group-hover:opacity-100 transition shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-[var(--border)]/50 bg-[var(--surface-2)]/30 text-right">
              <Link
                href="/admin/products"
                className="text-xs font-semibold text-[#8b5cf6] hover:underline"
              >
                View Collections in Products →
              </Link>
            </div>
          </div>

          {/* Top 5 Products Card */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden flex flex-col justify-between">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#B81862]" />
                <span className="font-bold text-[var(--foreground)] text-sm">
                  Top 5 Products
                </span>
                <span className="text-[11px] text-[var(--muted)] font-normal">
                  by requests / orders
                </span>
              </div>
              <span className="text-xs text-[var(--muted)] font-medium">
                {analytics?.topProducts?.length || 0} Ranked
              </span>
            </div>

            <div className="p-4 flex-1">
              {loading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-14 bg-[var(--surface-2)] rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : !analytics?.topProducts || analytics.topProducts.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <Package className="w-8 h-8 text-[var(--border)] mx-auto" />
                  <p className="text-xs text-[var(--muted)]">No product request data yet.</p>
                  <p className="text-[11px] text-[var(--muted)]">
                    Products ordered or inquired about will appear on this leaderboard.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {analytics.topProducts.map((prod, idx) => {
                    const rank = idx + 1;
                    const maxRequests = analytics.topProducts[0]?.requestCount || 1;
                    const fillPercent = Math.max(12, Math.round((prod.requestCount / maxRequests) * 100));

                    return (
                      <Link
                        key={prod.productId || idx}
                        href={prod.productId ? `/admin/products/${prod.productId}` : "/admin/requests"}
                        id={`top-prod-${prod.productId || idx}`}
                        className="group flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-[var(--surface-2)] border border-transparent hover:border-[var(--border)] transition"
                      >
                        {getRankBadge(rank)}

                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--surface-2)] border border-[var(--border)] shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={prod.image || getProductPlaceholder(prod.categoryName, prod.name)}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-[var(--foreground)] truncate group-hover:text-[#B81862] transition">
                              {prod.name}
                            </span>
                            <span className="text-xs font-bold text-[var(--foreground)] shrink-0 ml-2">
                              {prod.requestCount} {prod.requestCount === 1 ? "order/req" : "orders/req"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-[var(--muted)] mb-1">
                            <span className="truncate">
                              {prod.categoryName} {prod.sku ? `• ${prod.sku}` : ""}
                            </span>
                            {prod.price > 0 && (
                              <span className="font-semibold text-[var(--foreground)] shrink-0">
                                ₹{Number(prod.discountPrice || prod.price).toLocaleString("en-IN")}
                              </span>
                            )}
                          </div>

                          {/* Progress bar */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-[#B81862] to-[#ec4899] transition-all duration-500"
                                style={{ width: `${fillPercent}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-[var(--muted)] font-mono shrink-0">
                              {prod.totalQuantity} {prod.totalQuantity === 1 ? "unit" : "units"}
                            </span>
                          </div>
                        </div>

                        <ArrowUpRight className="w-4 h-4 text-[var(--muted)] opacity-0 group-hover:opacity-100 transition shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-[var(--border)]/50 bg-[var(--surface-2)]/30 text-right">
              <Link
                href="/admin/requests"
                className="text-xs font-semibold text-[#B81862] hover:underline"
              >
                View Full Inquiries &amp; Orders Log →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          id="quick-add-product-btn"
          href="/admin/products/new"
          className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:border-[#B81862]/50 transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#B81862]/15 border border-[#B81862]/30 flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5 text-[#B81862]" />
          </div>
          <div>
            <span className="block font-bold text-[var(--foreground)] text-sm">
              Add New Product
            </span>
            <span className="text-xs text-[var(--muted)]">
              Upload images &amp; set details
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--muted)] ml-auto opacity-0 group-hover:opacity-100 transition" />
        </Link>

        <Link
          id="quick-manage-products-btn"
          href="/admin/products"
          className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:border-[#B81862]/50 transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-[#8b5cf6]" />
          </div>
          <div>
            <span className="block font-bold text-[var(--foreground)] text-sm">
              Manage Products
            </span>
            <span className="text-xs text-[var(--muted)]">
              Edit, publish, or delete
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--muted)] ml-auto opacity-0 group-hover:opacity-100 transition" />
        </Link>

        <Link
          id="quick-categories-btn"
          href="/admin/products"
          className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:border-[#B81862]/50 transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5 text-[#22c55e]" />
          </div>
          <div>
            <span className="block font-bold text-[var(--foreground)] text-sm">
              Categories
            </span>
            <span className="text-xs text-[var(--muted)]">
              Organise your catalogue
            </span>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--muted)] ml-auto opacity-0 group-hover:opacity-100 transition" />
        </Link>
      </div>

      {/* Recent products + categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent products */}
        <div className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <span className="font-bold text-[var(--foreground)] text-sm">Recent Products</span>
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-[#B81862] dark:text-[#B81862] hover:text-[#B81862] dark:hover:text-[#d43d8a] transition"
            >
              View All →
            </Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 bg-[var(--surface-2)] rounded-xl shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-[var(--surface-2)] rounded w-3/4" />
                    <div className="h-2.5 bg-[var(--surface-2)] rounded w-1/2" />
                  </div>
                  <div className="h-3 bg-[var(--surface-2)] rounded w-16" />
                </div>
              ))}
            </div>
          ) : recentProducts.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="w-10 h-10 text-[var(--border)] mx-auto mb-3" />
              <p className="text-sm text-[var(--muted)]">No products yet.</p>
              <Link
                href="/admin/products/new"
                className="text-xs font-semibold text-[#B81862] dark:text-[#B81862] hover:text-[#B81862] dark:hover:text-[#d43d8a] mt-2 inline-block"
              >
                Add your first product →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {recentProducts.map((p) => {
                const cat =
                  (p.categoryId as unknown as { name: string })?.name || "";
                const img =
                  p.images?.find((i) => i.isPrimary)?.url ||
                  p.images?.[0]?.url ||
                  getProductPlaceholder(cat, p.name);
                return (
                  <Link
                    key={p._id}
                    href={`/admin/products/${p._id}`}
                    id={`recent-${p._id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-[var(--surface-2)] transition"
                  >
                    <div className="w-10 h-10 shrink-0 rounded-xl overflow-hidden bg-[var(--surface-2)] border border-[var(--border)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block font-semibold text-[var(--foreground)] text-sm truncate">
                        {p.name}
                      </span>
                      <span className="block text-xs text-[var(--muted)] truncate">
                        {cat || "Uncategorized"} • SKU: {p.sku}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block text-sm font-bold text-[var(--foreground)]">
                        ₹{p.price.toLocaleString("en-IN")}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          p.isPublished
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {p.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Categories panel */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
            <span className="font-bold text-[var(--foreground)] text-sm">Collections</span>
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-[#B81862] dark:text-[#B81862] hover:text-[#B81862] dark:hover:text-[#d43d8a] transition"
            >
              View Folders →
            </Link>
          </div>
          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 bg-[var(--surface-2)] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center">
              <Tag className="w-10 h-10 text-[var(--border)] mx-auto mb-3" />
              <p className="text-sm text-[var(--muted)]">No categories yet.</p>
              <Link
                href="/admin/categories"
                className="text-xs font-semibold text-[#B81862] dark:text-[#B81862] mt-2 inline-block"
              >
                Create category →
              </Link>
            </div>
          ) : (
            <div className="p-3 space-y-1">
              {categories.map((cat) => (
                <Link
                  key={cat._id}
                  href={`/admin/products?category=${cat._id}`}
                  id={`cat-dash-${cat._id}`}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[var(--surface-2)] transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#B81862]" />
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      {cat.name}
                    </span>
                  </div>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
