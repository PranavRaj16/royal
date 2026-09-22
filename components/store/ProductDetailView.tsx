"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Phone,
  Share2,
  Check,
  Star,
  ShieldCheck,
  Truck,
  Sparkles,
  ChevronRight,
  ArrowLeft,
  Copy,
} from "lucide-react";
import { IProduct, IBusiness } from "@/types";
import ProductCard from "./ProductCard";

interface ProductDetailViewProps {
  product: IProduct;
  business: IBusiness;
  businessSlug: string;
  relatedProducts: IProduct[];
}

export default function ProductDetailView({
  product,
  business,
  businessSlug,
  relatedProducts,
}: ProductDetailViewProps) {
  const images = product.images && product.images.length > 0
    ? product.images
    : [
        {
          url: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80",
          alt: product.name,
          isPrimary: true,
          order: 0,
        },
      ];

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Start with the relative path — both server and first-client render agree.
  // After mount, upgrade to the full absolute URL from the browser.
  const productPath = `/store/${businessSlug}/product/${product.slug}`;
  const [productUrl, setProductUrl] = useState(productPath);
  useEffect(() => {
    setProductUrl(window.location.href);
  }, []);

  const cleanPhone = business.whatsapp.replace(/[^0-9]/g, "");
  const whatsappMessage = `Hi ${business.name}, I am interested in ${product.name}.\n\nProduct Code: ${product.sku}\nCatalogue: ${productUrl}`;
  const whatsappEnquiryUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`;

  const discountPercent =
    product.discountPrice && product.price > product.discountPrice
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : 0;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${product.name} | ${business.name}`,
          text: `Check out ${product.name} on ${business.name}'s digital catalogue.`,
          url: productUrl,
        });
      } catch {
        // Share cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(productUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } catch {
        alert("Unable to copy URL");
      }
    }
  };

  return (
    <div className="bg-[#FAF8F5] min-h-screen py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-8 overflow-x-auto whitespace-nowrap">
          <Link href={`/store/${businessSlug}`} className="hover:text-[#B4833E] transition">
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <Link
            href={`/store/${businessSlug}?category=${product.category?.slug}#products`}
            className="hover:text-[#B4833E] transition"
          >
            {product.category?.name || "Collection"}
          </Link>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="font-semibold text-gray-900 truncate max-w-[200px] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        {/* Product Stage Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 bg-white border border-[#E8E2D9] rounded-3xl p-6 sm:p-10 lg:p-12 shadow-sm">
          {/* Left Column: Image Gallery */}
          <div className="space-y-4">
            {/* Main Stage Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#E8E2D9] shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[activeImageIdx]?.url}
                alt={images[activeImageIdx]?.alt || product.name}
                className="w-full h-full object-cover transition-all duration-500"
              />

              {product.isFeatured && (
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#D4AF37] text-black shadow-md flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-black" />
                    <span>Featured Piece</span>
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Picker (if multiple images) */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                      activeImageIdx === idx
                        ? "border-[#B4833E] ring-2 ring-[#B4833E]/20"
                        : "border-[#E8E2D9] hover:border-gray-400 opacity-70 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt || `Angle ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Information, Pricing, Specs & Actions */}
          <div className="flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              {/* Category & SKU */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#B4833E]">
                  {product.category?.name || "Bespoke Collection"}
                </span>
                <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
                  SKU: {product.sku}
                </span>
              </div>

              {/* Title */}
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#141414] leading-tight">
                {product.name}
              </h1>

              {/* Pricing Display */}
              <div className="pt-2 pb-4 border-b border-[#E8E2D9]">
                {product.showPrice ? (
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-[#141414]">
                      ₹{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(product.discountPrice || product.price)}
                    </span>
                    {product.discountPrice && (
                      <span className="text-lg text-gray-400 line-through">
                        ₹{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(product.price)}
                      </span>
                    )}
                    {discountPercent > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-[#B4833E]">
                    Price Available Upon Private Enquiry
                  </div>
                )}

                <div className="mt-3 flex items-center gap-3 text-xs">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold ${
                      product.stockStatus === "in_stock"
                        ? "bg-emerald-50 text-emerald-700"
                        : product.stockStatus === "made_to_order"
                        ? "bg-purple-50 text-purple-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    <span>
                      {product.stockStatus === "in_stock"
                        ? "In Stock / Ready for Dispatch"
                        : product.stockStatus === "made_to_order"
                        ? "Handcrafted Upon Order"
                        : "Currently Reserved"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Short & Full Description */}
              {product.shortDescription && (
                <p className="text-sm font-medium text-gray-700 leading-relaxed">
                  {product.shortDescription}
                </p>
              )}

              {product.description && (
                <p className="text-xs text-gray-600 leading-relaxed font-light">
                  {product.description}
                </p>
              )}

              {/* Dynamic Specifications Table */}
              {product.specifications && product.specifications.length > 0 && (
                <div className="pt-4 border-t border-[#E8E2D9]">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#141414] mb-3 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[#B4833E]" />
                    Product Specifications
                  </h3>

                  <div className="rounded-xl border border-[#E8E2D9] overflow-hidden text-xs">
                    {product.specifications.map((spec, index) => (
                      <div
                        key={index}
                        className={`flex py-2.5 px-3.5 ${
                          index % 2 === 0 ? "bg-[#FAF8F5]" : "bg-white"
                        }`}
                      >
                        <span className="w-2/5 font-semibold text-gray-600">{spec.key}</span>
                        <span className="w-3/5 font-medium text-gray-900">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {product.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-0.5 rounded-full bg-gray-100 text-[10px] font-medium text-gray-600"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Action Buttons */}
            <div className="space-y-3 pt-6 border-t border-[#E8E2D9]">
              {/* WhatsApp Enquiry Button */}
              <a
                href={whatsappEnquiryUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition shadow-md shadow-emerald-950/10 active:scale-98"
              >
                <MessageCircle className="w-5 h-5 fill-white" />
                <span>Enquire via WhatsApp</span>
              </a>

              <div className="grid grid-cols-2 gap-3">
                {business.phone ? (
                  <a
                    href={`tel:${business.phone}`}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border border-[#D9D2C7] text-gray-800 text-xs font-semibold hover:bg-[#FAF8F5] transition"
                  >
                    <Phone className="w-4 h-4 text-[#B4833E]" />
                    <span>Call Boutique</span>
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border border-[#D9D2C7] text-gray-800 text-xs font-semibold hover:bg-[#FAF8F5] transition"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-[#B4833E]" />
                      <span>Share Piece</span>
                    </>
                  )}
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3 pt-4 text-[11px] text-gray-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#B4833E] shrink-0" />
                  <span>100% Certified Authentic</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#B4833E] shrink-0" />
                  <span>Insured Global Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-20">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#B4833E] block mb-1">
                  More From This Collection
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#141414]">
                  Complementary Creations
                </h2>
              </div>
              <Link
                href={`/store/${businessSlug}?category=${product.category?.slug}#products`}
                className="text-xs font-bold text-[#B4833E] hover:underline"
              >
                View all in {product.category?.name} →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  businessSlug={businessSlug}
                  whatsappNumber={business.whatsapp}
                  businessName={business.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
