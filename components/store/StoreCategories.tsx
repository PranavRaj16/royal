import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { ICategory } from "@/types";
import { getCategoryPlaceholder } from "@/lib/placeholderImages";

interface StoreCategoriesProps {
  categories: ICategory[];
  businessSlug: string;
  selectedCategorySlug?: string;
}

export default function StoreCategories({
  categories,
  businessSlug,
  selectedCategorySlug,
}: StoreCategoriesProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <section id="categories" className="py-20 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#B4833E] block mb-2">
            Curated Collections
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#141414] tracking-tight">
            Discover By Category
          </h2>
          <p className="mt-3 text-sm text-[#666059]">
            Select an aesthetic realm to filter our master-crafted adornments.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const isSelected = selectedCategorySlug === cat.slug;

            return (
              <Link
                key={cat._id}
                href={`/store/${businessSlug}?category=${cat.slug}#products`}
                className={`group relative rounded-2xl overflow-hidden aspect-[4/5] shadow-xs hover:shadow-xl transition-all duration-500 flex flex-col justify-end p-5 ${
                  isSelected ? "ring-3 ring-[#B4833E]" : ""
                }`}
              >
                {/* Background Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.image || getCategoryPlaceholder(cat.name || cat.slug)}
                  alt={cat.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-700 ease-out"
                />

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent group-hover:from-black/90 transition" />

                {/* Card Content */}
                <div className="relative z-10">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block mb-1">
                    Collection
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-white leading-snug drop-shadow-sm">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-xs text-gray-300 line-clamp-2 mt-1 hidden sm:block">
                      {cat.description}
                    </p>
                  )}
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#D4AF37] group-hover:translate-x-1 transition duration-300">
                    <span>Explore Pieces</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
