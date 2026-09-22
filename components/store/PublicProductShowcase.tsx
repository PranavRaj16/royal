"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
  Package,
  X,
  Filter,
} from "lucide-react";
import ProductCard from "./ProductCard";
import { IProduct, ICategory, IBusiness } from "@/types";

interface PublicProductShowcaseProps {
  initialProducts: IProduct[];
  categories: ICategory[];
  business: IBusiness;
  businessSlug: string;
}

export default function PublicProductShowcase({
  initialProducts,
  categories,
  business,
  businessSlug,
}: PublicProductShowcaseProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read URL params
  const urlCategory = searchParams.get("category") || "all";
  const urlSearch = searchParams.get("search") || "";

  const [search, setSearch] = useState(urlSearch);
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [selectedStock, setSelectedStock] = useState("all");
  const [selectedSort, setSelectedSort] = useState("featured");
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | "">("");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  useEffect(() => {
    setSelectedCategory(searchParams.get("category") || "all");
    if (searchParams.get("search")) {
      setSearch(searchParams.get("search") || "");
    }
  }, [searchParams]);

  // Filter and sort products client-side for ultra-fast instant feedback
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q)) ||
          p.category?.name?.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      result = result.filter(
        (p) =>
          p.category?.slug === selectedCategory ||
          p.categoryId === selectedCategory ||
          p.category?._id === selectedCategory
      );
    }

    // Stock status
    if (selectedStock !== "all") {
      result = result.filter((p) => p.stockStatus === selectedStock);
    }

    // Max Price
    if (maxPriceFilter !== "" && !isNaN(Number(maxPriceFilter))) {
      result = result.filter(
        (p) => (p.discountPrice || p.price) <= Number(maxPriceFilter)
      );
    }

    // Sorting
    if (selectedSort === "featured") {
      result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    } else if (selectedSort === "price-asc") {
      result.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (selectedSort === "price-desc") {
      result.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    } else if (selectedSort === "name-asc") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (selectedSort === "name-desc") {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (selectedSort === "newest") {
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    return result;
  }, [
    initialProducts,
    search,
    selectedCategory,
    selectedStock,
    maxPriceFilter,
    selectedSort,
  ]);

  const handleCategoryClick = (slug: string) => {
    setSelectedCategory(slug);
    const params = new URLSearchParams(searchParams.toString());
    if (slug === "all") {
      params.delete("category");
    } else {
      params.set("category", slug);
    }
    router.replace(`/store/${businessSlug}?${params.toString()}#products`, {
      scroll: false,
    });
  };

  const clearAllFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    setSelectedStock("all");
    setMaxPriceFilter("");
    setSelectedSort("featured");
    router.replace(`/store/${businessSlug}#products`, { scroll: false });
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    selectedCategory !== "all" ||
    selectedStock !== "all" ||
    maxPriceFilter !== "" ||
    selectedSort !== "featured";

  return (
    <section id="products" className="py-16 sm:py-24 bg-white border-t border-[#E8E2D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#B4833E] block mb-2">
              Fine Adornments
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#141414] tracking-tight">
              Catalogue Collection
            </h2>
            <p className="mt-2 text-sm text-[#666059]">
              Showing {filteredProducts.length} handcrafted pieces
            </p>
          </div>

          {/* Quick Search & Sort on Desktop */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[240px] sm:min-w-[300px]">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search jewellery, SKU, diamond..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF8F5] border border-[#E8E2D9] rounded-full focus:outline-none focus:ring-2 focus:ring-[#B4833E]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-3 text-gray-400 hover:text-black"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-full px-3 py-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="text-xs font-semibold bg-transparent text-gray-800 focus:outline-none cursor-pointer"
              >
                <option value="featured">Featured First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest Additions</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          <button
            type="button"
            onClick={() => handleCategoryClick("all")}
            className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider shrink-0 transition ${
              selectedCategory === "all"
                ? "bg-[#141414] text-white shadow-sm"
                : "bg-[#FAF8F5] text-gray-700 hover:bg-[#F3EFEA] border border-[#E8E2D9]"
            }`}
          >
            All Pieces ({initialProducts.length})
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => handleCategoryClick(c.slug)}
              className={`px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider shrink-0 transition ${
                selectedCategory === c.slug
                  ? "bg-[#B4833E] text-white shadow-sm"
                  : "bg-[#FAF8F5] text-gray-700 hover:bg-[#F3EFEA] border border-[#E8E2D9]"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-8 p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-xs">
            <span className="font-semibold text-gray-600">Active Filters:</span>
            {selectedCategory !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#D9D2C7] text-[#141414] font-medium">
                Category: {selectedCategory}
                <button onClick={() => handleCategoryClick("all")}>×</button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#D9D2C7] text-[#141414] font-medium">
                &ldquo;{search}&rdquo;
                <button onClick={() => setSearch("")}>×</button>
              </span>
            )}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs text-[#B4833E] font-semibold hover:underline ml-auto"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Product Responsive Grid */}
        {/* Requirement: Desktop 4 columns, Tablet 3 columns, Mobile 2 columns */}
        {filteredProducts.length === 0 ? (
          <div className="p-16 text-center border-2 border-dashed border-[#E8E2D9] rounded-2xl bg-[#FAF8F5]">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="font-serif text-xl font-bold text-gray-800">
              No matching jewellery found
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              We couldn&apos;t find any pieces matching your current filters. Try resetting search or selecting another collection.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-5 px-5 py-2.5 rounded-full bg-[#141414] text-white text-xs font-semibold hover:bg-[#B4833E] transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p._id}
                product={p}
                businessSlug={businessSlug}
                whatsappNumber={business.whatsapp}
                businessName={business.name}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
