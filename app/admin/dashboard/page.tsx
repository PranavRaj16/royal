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
} from "lucide-react";
import { IProduct, ICategory } from "@/types";
import { getProductPlaceholder } from "@/lib/placeholderImages";

interface Stats {
  totalProducts: number;
  publishedProducts: number;
  draftProducts: number;
  featuredProducts: number;
  totalCategories: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentProducts, setRecentProducts] = useState<IProduct[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/products?sort=newest").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ])
      .then(([productsData, catsData]) => {
        const products: IProduct[] = productsData.products || [];
        const cats: ICategory[] = catsData.categories || [];
        setCategories(cats);
        setRecentProducts(products.slice(0, 5));
        setStats({
          totalProducts: products.length,
          publishedProducts: products.filter((p) => p.isPublished).length,
          draftProducts: products.filter((p) => !p.isPublished).length,
          featuredProducts: products.filter((p) => p.isFeatured).length,
          totalCategories: cats.length,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      id: "stat-total",
      label: "Total Products",
      value: stats?.totalProducts ?? "—",
      icon: Package,
      color: "#B4833E",
      href: "/admin/products",
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
      id: "stat-draft",
      label: "Drafts",
      value: stats?.draftProducts ?? "—",
      icon: Clock,
      color: "#f59e0b",
      href: "/admin/products?status=draft",
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

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutDashboard className="w-5 h-5 text-[#B4833E]" />
            <h1 className="font-serif text-2xl font-bold text-white">
              Dashboard
            </h1>
          </div>
          <p className="text-sm text-[var(--muted)]">
            Welcome back. Here&apos;s an overview of your catalogue.
          </p>
        </div>
        <Link
          id="add-product-btn"
          href="/admin/products/new"
          className="btn-primary self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Link>
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
              className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 hover:border-[#B4833E]/40 transition product-card group"
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
                <span className="block text-3xl font-bold text-white mb-1">
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

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          id="quick-add-product-btn"
          href="/admin/products/new"
          className="glass border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:border-[#B4833E]/50 transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#B4833E]/15 border border-[#B4833E]/30 flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5 text-[#B4833E]" />
          </div>
          <div>
            <span className="block font-bold text-white text-sm">
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
          className="glass border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:border-[#B4833E]/50 transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#8b5cf6]/15 border border-[#8b5cf6]/30 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-[#8b5cf6]" />
          </div>
          <div>
            <span className="block font-bold text-white text-sm">
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
          className="glass border border-[var(--border)] rounded-2xl p-5 flex items-center gap-4 hover:border-[#B4833E]/50 transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5 text-[#22c55e]" />
          </div>
          <div>
            <span className="block font-bold text-white text-sm">
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
            <span className="font-bold text-white text-sm">Recent Products</span>
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-[#B4833E] hover:text-[#D4AF37] transition"
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
                className="text-xs font-semibold text-[#B4833E] hover:text-[#D4AF37] mt-2 inline-block"
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
                    <div className="w-10 h-10 shrink-0 rounded-xl overflow-hidden bg-[var(--surface-2)] border border-[#2b2b2b]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block font-semibold text-white text-sm truncate">
                        {p.name}
                      </span>
                      <span className="block text-xs text-[var(--muted)] truncate">
                        {cat || "Uncategorized"} • SKU: {p.sku}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block text-sm font-bold text-white">
                        ₹{p.price.toLocaleString("en-IN")}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          p.isPublished
                            ? "text-green-400"
                            : "text-amber-400"
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
            <span className="font-bold text-white text-sm">Collections</span>
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-[#B4833E] hover:text-[#D4AF37] transition"
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
                className="text-xs font-semibold text-[#B4833E] mt-2 inline-block"
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
                    <div className="w-1.5 h-1.5 rounded-full bg-[#B4833E]" />
                    <span className="text-sm font-semibold text-white">
                      {cat.name}
                    </span>
                  </div>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
