"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  FolderTree,
  CheckCircle2,
  FileEdit,
  ArrowUpRight,
  Plus,
  Eye,
  Globe,
  Sparkles,
  Loader2,
  Calendar,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { IProduct, IBusiness, DashboardStats } from "@/types";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProducts, setRecentProducts] = useState<IProduct[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<IProduct[]>([]);
  const [business, setBusiness] = useState<IBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
        setRecentProducts(data.recentProducts || []);
        setFeaturedProducts(data.featuredProducts || []);
        setBusiness(data.business);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleCatalogueStatus = async () => {
    if (!business) return;
    const newStatus = business.catalogueStatus === "published" ? "unpublished" : "published";
    setTogglingStatus(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogueStatus: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        setBusiness(data.business);
        if (stats) {
          setStats({ ...stats, catalogueStatus: newStatus });
        }
        setStatusMessage(
          newStatus === "published"
            ? "Catalogue is now LIVE to public visitors!"
            : "Catalogue is now UNPUBLISHED (Visitors see 'Coming Soon')."
        );
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err) {
      console.error("Error toggling catalogue status:", err);
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#B4833E]" />
        <span className="text-sm text-gray-500 font-medium">Loading studio metrics...</span>
      </div>
    );
  }

  const isLive = business?.catalogueStatus === "published";

  return (
    <div className="space-y-8">
      {/* Top Banner / Status Hero */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#B4833E]">
                Business Control Center
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Updated: {stats?.lastUpdated ? new Date(stats.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Today"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#141414] tracking-tight">
              {business?.name || "Royal Jewellers"}
            </h1>
            <p className="text-sm text-[#666059] mt-1 max-w-xl">
              Manage your showcase, upload high-resolution product photography, configure dynamic specifications, and publish instantly.
            </p>
          </div>

          {/* Quick Actions & Status Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleToggleCatalogueStatus}
              disabled={togglingStatus}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition ${
                isLive
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                  : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isLive ? "bg-emerald-600 animate-ping" : "bg-amber-600"
                }`}
              />
              <span>{isLive ? "Catalogue: Published" : "Catalogue: Unpublished"}</span>
              <span className="text-[10px] underline ml-1">
                {togglingStatus ? "Updating..." : "(Click to Switch)"}
              </span>
            </button>

            <Link
              href={`/store/${business?.slug}?preview=true`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#D9D2C7] text-xs font-semibold text-[#141414] hover:bg-[#F3EFEA] transition shadow-xs"
            >
              <Eye className="w-4 h-4 text-[#B4833E]" />
              <span>Preview</span>
            </Link>

            <Link
              href={`/store/${business?.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#141414] text-white text-xs font-semibold hover:bg-[#B4833E] transition shadow-xs"
            >
              <Globe className="w-4 h-4 text-[#D4AF37]" />
              <span>View Live Store</span>
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </Link>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#B4833E] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Total Products
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-center">
              <Package className="w-4 h-4 text-[#B4833E]" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#141414]">{stats?.totalProducts ?? 0}</div>
          <p className="text-xs text-gray-400 mt-1">Across all categories</p>
        </div>

        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Published
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#141414]">{stats?.publishedProducts ?? 0}</div>
          <p className="text-xs text-gray-400 mt-1">Visible to customers</p>
        </div>

        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Drafts
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
              <FileEdit className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#141414]">{stats?.draftProducts ?? 0}</div>
          <p className="text-xs text-gray-400 mt-1">Unpublished items</p>
        </div>

        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Categories
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <FolderTree className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-[#141414]">{stats?.totalCategories ?? 0}</div>
          <p className="text-xs text-gray-400 mt-1">Active taxonomy groups</p>
        </div>
      </div>

      {/* Onboarding Checklist Widget */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#141414] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B4833E]" />
              Catalogue Launch Checklist
            </h2>
            <p className="text-xs text-[#666059]">Follow these steps to customize and expand your business catalogue</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">
            5 of 6 Steps Ready
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Link
            href="/admin/business"
            className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 transition flex flex-col items-start"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-2" />
            <span className="text-xs font-bold text-gray-900">1. Business Profile</span>
            <span className="text-[10px] text-gray-500">Contact & Info</span>
          </Link>

          <Link
            href="/admin/categories"
            className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 transition flex flex-col items-start"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-2" />
            <span className="text-xs font-bold text-gray-900">2. Categories</span>
            <span className="text-[10px] text-gray-500">{stats?.totalCategories} Created</span>
          </Link>

          <Link
            href="/admin/products"
            className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 transition flex flex-col items-start"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-2" />
            <span className="text-xs font-bold text-gray-900">3. Products</span>
            <span className="text-[10px] text-gray-500">{stats?.totalProducts} Items</span>
          </Link>

          <Link
            href="/admin/appearance"
            className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 transition flex flex-col items-start"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-2" />
            <span className="text-xs font-bold text-gray-900">4. Appearance</span>
            <span className="text-[10px] text-gray-500">Luxury Theme</span>
          </Link>

          <Link
            href={`/store/${business?.slug}?preview=true`}
            target="_blank"
            className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 transition flex flex-col items-start"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-2" />
            <span className="text-xs font-bold text-gray-900">5. Preview</span>
            <span className="text-[10px] text-gray-500">Tested Live</span>
          </Link>

          <Link
            href="/admin/qr-share"
            className="p-3 rounded-xl border border-[#D9D2C7] bg-[#FAF8F5] hover:bg-[#F3EFEA] transition flex flex-col items-start"
          >
            <ArrowUpRight className="w-4 h-4 text-[#B4833E] mb-2" />
            <span className="text-xs font-bold text-gray-900">6. Share QR</span>
            <span className="text-[10px] text-gray-500">Display QR Stand</span>
          </Link>
        </div>
      </div>

      {/* Main Content Grid: Recent Products & Featured Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recently Added Products (2 Columns) */}
        <div className="lg:col-span-2 bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-[#141414]">Recently Added Products</h2>
              <p className="text-xs text-[#666059]">Latest items in your catalogue inventory</p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/products/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141414] text-white text-xs font-semibold hover:bg-[#B4833E] transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </Link>
              <Link
                href="/admin/products"
                className="text-xs font-semibold text-[#B4833E] hover:underline"
              >
                View all
              </Link>
            </div>
          </div>

          {recentProducts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[#E8E2D9] rounded-xl">
              <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No products added yet</p>
              <Link
                href="/admin/products/new"
                className="inline-block mt-3 text-xs font-semibold text-[#B4833E] hover:underline"
              >
                Add your first product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E8E2D9] text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="pb-3">Product</th>
                    <th className="pb-3">SKU</th>
                    <th className="pb-3">Price</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9]">
                  {recentProducts.map((p) => (
                    <tr key={p._id} className="hover:bg-[#FAF8F5] transition">
                      <td className="py-3.5 pr-3">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.images?.[0]?.url || "/placeholder.jpg"}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover bg-gray-100 border border-[#E8E2D9]"
                          />
                          <div className="max-w-[200px]">
                            <span className="font-semibold text-gray-900 block truncate">{p.name}</span>
                            <span className="text-[11px] text-gray-500 block truncate">
                              {p.category?.name || "General"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-xs text-gray-600">{p.sku}</td>
                      <td className="py-3.5 px-3 font-medium text-gray-900">
                        ₹{p.price.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            p.isPublished
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {p.isPublished ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="py-3.5 pl-3 text-right">
                        <Link
                          href={`/admin/products/${p._id}`}
                          className="text-xs font-semibold text-[#B4833E] hover:underline"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Featured Showcase List (1 Column) */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#141414]">Featured Showcase</h2>
                <p className="text-xs text-[#666059]">Highlighted on your store hero & grid</p>
              </div>
              <Sparkles className="w-5 h-5 text-[#D4AF37]" />
            </div>

            <div className="space-y-3">
              {featuredProducts.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500">
                  <AlertCircle className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                  No products marked as featured yet.
                </div>
              ) : (
                featuredProducts.map((p) => (
                  <div
                    key={p._id}
                    className="p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] flex items-center justify-between gap-3 hover:border-[#B4833E] transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.images?.[0]?.url || "/placeholder.jpg"}
                        alt={p.name}
                        className="w-9 h-9 rounded-lg object-cover bg-gray-100 border border-[#E8E2D9]"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-gray-900 block truncate">{p.name}</span>
                        <span className="text-[11px] text-[#B4833E] font-medium">
                          ₹{p.price.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/admin/products/${p._id}`}
                      className="text-xs font-semibold text-gray-500 hover:text-black shrink-0"
                    >
                      Edit
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-[#E8E2D9]">
            <Link
              href="/admin/products?featured=true"
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#D9D2C7] text-xs font-semibold text-gray-700 hover:bg-[#F3EFEA] hover:text-[#141414] transition"
            >
              <span>Manage Featured Products</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
