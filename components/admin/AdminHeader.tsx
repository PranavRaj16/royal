"use client";

import React from "react";
import Link from "next/link";
import { Menu, ExternalLink, Globe } from "lucide-react";

interface AdminHeaderProps {
  businessName?: string;
  businessSlug?: string;
  catalogueStatus?: "published" | "unpublished";
  onMenuClick: () => void;
}

export default function AdminHeader({
  businessName = "Royal Jewellers",
  businessSlug = "royal-jewellers",
  catalogueStatus = "published",
  onMenuClick,
}: AdminHeaderProps) {
  const isPublished = catalogueStatus === "published";

  return (
    <header className="h-18 bg-white border-b border-[#E8E2D9] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="font-bold text-gray-900 text-sm sm:text-base">{businessName}</span>
          <span className="text-gray-300">|</span>
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                isPublished ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
            <span className={isPublished ? "text-emerald-700 font-semibold" : "text-amber-700"}>
              {isPublished ? "Catalogue Live" : "Unpublished Draft"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href={`/store/${businessSlug}`}
          target="_blank"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#D9D2C7] text-xs font-semibold text-[#141414] hover:bg-[#F3EFEA] hover:border-[#B4833E] transition shadow-xs"
        >
          <Globe className="w-3.5 h-3.5 text-[#B4833E]" />
          <span>View Public Store</span>
          <ExternalLink className="w-3 h-3 text-gray-400" />
        </Link>
      </div>
    </header>
  );
}
