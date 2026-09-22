"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  MessageCircle,
  Phone,
  Search,
  Sparkles,
} from "lucide-react";
import { IBusiness, ICategory } from "@/types";

interface StoreHeaderProps {
  business: IBusiness;
  categories: ICategory[];
  onOpenSearch?: () => void;
}

export default function StoreHeader({
  business,
  categories,
  onOpenSearch,
}: StoreHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Clean WhatsApp phone number for link
  const cleanPhone = business.whatsapp.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hello ${business.name}, I am browsing your digital catalogue and would like to enquire.`
  )}`;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E8E2D9] transition-all">
        {/* Top Announcement / Notice */}
        <div className="bg-[#141414] text-[#FAF8F5] py-1.5 px-4 text-[11px] font-medium text-center tracking-widest uppercase flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3 text-[#D4AF37]" />
          <span>Curated High Fine Jewellery • Bespoke Consultations Available</span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Left: Mobile Menu Button & Desktop Nav */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-700 hover:text-black"
              aria-label="Open navigation"
            >
              <Menu className="w-6 h-6" />
            </button>

            <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-[#141414]">
              <Link
                href={`/store/${business.slug}#categories`}
                className="hover:text-[#B4833E] transition"
              >
                Collections
              </Link>
              <Link
                href={`/store/${business.slug}#products`}
                className="hover:text-[#B4833E] transition"
              >
                All Pieces
              </Link>
              {business.catalogueSettings?.showAbout && (
                <Link
                  href={`/store/${business.slug}#about`}
                  className="hover:text-[#B4833E] transition"
                >
                  Our Heritage
                </Link>
              )}
              {business.catalogueSettings?.showContact && (
                <Link
                  href={`/store/${business.slug}#contact`}
                  className="hover:text-[#B4833E] transition"
                >
                  Boutique
                </Link>
              )}
            </nav>
          </div>

          {/* Center: Brand Identity */}
          <Link
            href={`/store/${business.slug}`}
            className="flex flex-col items-center text-center group"
          >
            {business.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={business.logo}
                alt={business.name}
                className="h-10 w-auto object-contain max-w-[160px]"
              />
            ) : (
              <span className="font-serif text-2xl font-bold tracking-tight text-[#141414] group-hover:text-[#B4833E] transition">
                {business.name}
              </span>
            )}
            <span className="text-[9px] uppercase tracking-[0.25em] font-semibold text-[#B4833E]">
              Bespoke Fine Jewellery
            </span>
          </Link>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {onOpenSearch && (
              <button
                type="button"
                onClick={onOpenSearch}
                className="p-2.5 rounded-full text-gray-700 hover:text-black hover:bg-[#FAF8F5] transition"
                title="Search Catalogue"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="hidden sm:inline-flex p-2.5 rounded-full text-gray-700 hover:text-black hover:bg-[#FAF8F5] transition"
                title={`Call ${business.phone}`}
              >
                <Phone className="w-4 h-4" />
              </a>
            )}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-sm"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span className="hidden sm:inline">WhatsApp Concierge</span>
              <span className="sm:hidden">Enquire</span>
            </a>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className="fixed top-0 bottom-0 left-0 w-4/5 max-w-sm bg-white p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-[#E8E2D9]">
                <span className="font-serif text-xl font-bold text-[#141414]">
                  {business.name}
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-gray-500 hover:text-black"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="py-6 space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#B4833E]">
                  Categories
                </span>
                <div className="space-y-2">
                  {categories.map((c) => (
                    <Link
                      key={c._id}
                      href={`/store/${business.slug}?category=${c.slug}#products`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm font-medium text-gray-800 hover:text-[#B4833E] transition"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>

                <div className="pt-4 border-t border-[#E8E2D9] space-y-3">
                  <Link
                    href={`/store/${business.slug}#products`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-sm font-bold text-gray-900 hover:text-[#B4833E]"
                  >
                    All Products
                  </Link>
                  {business.catalogueSettings?.showAbout && (
                    <Link
                      href={`/store/${business.slug}#about`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm font-bold text-gray-900 hover:text-[#B4833E]"
                    >
                      Our Heritage
                    </Link>
                  )}
                  {business.catalogueSettings?.showContact && (
                    <Link
                      href={`/store/${business.slug}#contact`}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm font-bold text-gray-900 hover:text-[#B4833E]"
                    >
                      Boutique Location
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile Drawer Footer */}
            <div className="pt-6 border-t border-[#E8E2D9] space-y-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>WhatsApp Concierge</span>
              </a>

              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-[#141414] text-xs font-semibold hover:bg-[#F3EFEA] transition"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call {business.phone}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
