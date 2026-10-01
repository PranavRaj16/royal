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
  ChevronRight,
  Sparkles,
  Package,
  Award,
} from "lucide-react";
import { IProduct, IBusiness } from "@/types";
import { getProductPlaceholder } from "@/lib/placeholderImages";
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
  const productCategory =
    (typeof product.categoryId === "object" && product.categoryId !== null
      ? (product.categoryId as { name?: string; slug?: string })
      : null) || product.category;
  const categoryName = productCategory?.name || "Bespoke Collection";
  const categorySlug = productCategory?.slug || "";

  const defaultPlaceholder = getProductPlaceholder(categoryName, product.name);

  const images =
    product.images && product.images.length > 0
      ? product.images
      : [
          {
            url: defaultPlaceholder,
            alt: product.name,
            isPrimary: true,
            order: 0,
          },
        ];

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const productPath = `/store/${businessSlug}/product/${product.slug}`;
  const [productUrl, setProductUrl] = useState(productPath);

  useEffect(() => {
    setProductUrl(window.location.href);
  }, []);

  const cleanPhone = (business.whatsapp || "919581335925").replace(/[^0-9]/g, "");
  const whatsappMessage = `Hi ${business.name}, I am interested in ${product.name}.\n\nProduct Code: ${product.sku}\nPrice: ₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(product.discountPrice || product.price)}\nCatalogue Link: ${productUrl}`;
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
          text: `Discover ${product.name} by ${business.name}.`,
          url: productUrl,
        });
      } catch {
        // cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(productUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      } catch {
        alert("Unable to copy link");
      }
    }
  };

  return (
    <div className="bg-[#FFF8FB] dark:bg-[#0d0d0d] min-h-screen py-8 sm:py-14 text-[#1a1a1a] dark:text-[#f5f5f5] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-[#736b63] dark:text-[#a0a0a0] mb-6 sm:mb-8 overflow-x-auto whitespace-nowrap py-1">
          <Link
            href={`/store/${businessSlug}`}
            className="hover:text-[#B81862] dark:hover:text-[#d43d8a] font-medium transition"
          >
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#b0a89f] dark:text-[#555] shrink-0" />
          <Link
            href={`/store/${businessSlug}${categorySlug ? `?category=${categorySlug}` : ""}#products`}
            className="hover:text-[#B81862] dark:hover:text-[#d43d8a] font-medium transition"
          >
            {categoryName}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-[#b0a89f] dark:text-[#555] shrink-0" />
          <span className="font-semibold text-[#141414] dark:text-white truncate max-w-[220px] sm:max-w-none">
            {product.name}
          </span>
        </nav>

        {/* Product Stage Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 bg-white dark:bg-[#161616] border border-[#E8E2D9] dark:border-[#2a2a2a] rounded-3xl p-6 sm:p-10 lg:p-12 shadow-[0_4px_30px_rgba(0,0,0,0.03)] dark:shadow-none transition-colors">
          {/* Left Column: Image Gallery (6 cols on large) */}
          <div className="lg:col-span-6 space-y-4">
            {/* Main Stage Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#FDF0F6] dark:bg-[#1f1f1f] border border-[#E8E2D9] dark:border-[#2a2a2a] shadow-inner group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[activeImageIdx]?.url || defaultPlaceholder}
                alt={images[activeImageIdx]?.alt || product.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              {product.isFeatured && (
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#d43d8a] text-black shadow-md flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-black" />
                    <span>Featured Piece</span>
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Picker */}
            {images.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      activeImageIdx === idx
                        ? "border-[#B81862] dark:border-[#d43d8a] ring-2 ring-[#B81862]/20 scale-102"
                        : "border-[#E8E2D9] dark:border-[#333] hover:border-gray-400 opacity-75 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.alt || `Angle ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Information, Pricing, Specs & Actions (6 cols on large) */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Category & SKU Pill Row */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#B81862]/10 dark:bg-[#d43d8a]/15 text-[#8f6226] dark:text-[#d43d8a] border border-[#B81862]/25 dark:border-[#d43d8a]/30">
                  <Sparkles className="w-3 h-3 text-[#B81862] dark:text-[#d43d8a]" />
                  {categoryName}
                </span>
                <span className="font-mono text-xs text-[#666] dark:text-[#aaa] bg-[#F2ECE1] dark:bg-[#222] px-2.5 py-1 rounded-md border border-[#E4DCCE] dark:border-[#333]">
                  Product ID: {product.sku}
                </span>
              </div>

              {/* Product Title */}
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-[#141414] dark:text-[#f5f5f5] leading-snug tracking-tight">
                {product.name}
              </h1>

              {/* Pricing Section */}
              <div className="pt-2 pb-4 border-b border-[#E8E2D9] dark:border-[#2a2a2a] space-y-3">
                {product.showPrice ? (
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-bold text-[#141414] dark:text-[#f5f5f5] tracking-tight">
                      ₹{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(product.discountPrice || product.price)}
                    </span>
                    {product.discountPrice && (
                      <span className="text-lg text-[#888] dark:text-[#777] line-through font-medium">
                        ₹{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(product.price)}
                      </span>
                    )}
                    {discountPercent > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                        Save {discountPercent}%
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="text-base font-serif font-bold text-[#B81862] dark:text-[#d43d8a]">
                    Price Available Upon Boutique Enquiry
                  </div>
                )}

                {/* Stock & Availability Tag */}
                <div className="flex items-center gap-3 text-xs pt-1">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-semibold border ${
                      product.stockStatus === "in_stock"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                        : product.stockStatus === "made_to_order"
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current" />
                    <span>
                      {product.stockStatus === "in_stock"
                        ? product.showQuantity !== false
                          ? `In Stock (${product.quantity ?? 10} pieces available)`
                          : "In Stock"
                        : product.stockStatus === "made_to_order"
                        ? "Handcrafted Made-to-Order"
                        : "Currently Reserved"}
                    </span>
                  </span>
                </div>
              </div>

              {/* Descriptions */}
              {product.shortDescription && (
                <p className="text-sm font-medium text-[#2d2926] dark:text-[#d4d4d4] leading-relaxed">
                  {product.shortDescription}
                </p>
              )}

              {product.description && (
                <div className="p-4 rounded-2xl bg-[#FFF8FB] dark:bg-[#1a1a1a] border border-[#E8E2D9] dark:border-[#2a2a2a]">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#736b63] dark:text-[#a0a0a0] mb-1.5 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#B81862] dark:text-[#d43d8a]" />
                    Artisanal Details
                  </h4>
                  <p className="text-xs sm:text-sm text-[#4a443e] dark:text-[#ccc] leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {product.tags && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {product.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-1 rounded-lg bg-[#F2ECE1] dark:bg-[#222] text-[11px] font-medium text-[#5a524a] dark:text-[#aaa] border border-[#E5DDCE] dark:border-[#333]"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Action CTAs */}
            <div className="space-y-3 pt-6 border-t border-[#E8E2D9] dark:border-[#2a2a2a]">
              {/* WhatsApp Enquiry Button */}
              <a
                href={whatsappEnquiryUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  fetch("/api/public/requests", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      productId: product._id,
                      productName: product.name,
                      productSku: product.sku,
                      productImage: primaryImage,
                      visitorName: "Store Visitor",
                      visitorPhone: "WhatsApp Enquiry",
                      quantity: 1,
                      source: "whatsapp",
                      isWhatsAppEnquiry: true,
                      description: `Product detail page enquiry`,
                    }),
                  }).catch(() => {});
                }}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold text-sm transition shadow-lg shadow-[#25D366]/20 active:scale-[0.99]"
              >
                <MessageCircle className="w-5 h-5 fill-black" />
                <span>Enquire / Book on WhatsApp</span>
              </a>

              <div className="grid grid-cols-2 gap-3">
                {business.phone ? (
                  <a
                    href={`tel:${business.phone}`}
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white dark:bg-[#1a1a1a] border border-[#D9D2C7] dark:border-[#333] text-[#141414] dark:text-[#f5f5f5] text-xs font-semibold hover:bg-[#FFF8FB] dark:hover:bg-[#222] transition"
                  >
                    <Phone className="w-4 h-4 text-[#B81862] dark:text-[#d43d8a]" />
                    <span>Call Boutique</span>
                  </a>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#FFF8FB] dark:bg-[#1a1a1a] border border-[#E8E2D9] dark:border-[#333] text-[#666] dark:text-[#aaa] text-xs font-semibold">
                    <Package className="w-4 h-4 text-[#B81862] dark:text-[#d43d8a]" />
                    <span>Direct Concierge</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white dark:bg-[#1a1a1a] border border-[#D9D2C7] dark:border-[#333] text-[#141414] dark:text-[#f5f5f5] text-xs font-semibold hover:bg-[#FFF8FB] dark:hover:bg-[#222] transition cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-[#B81862] dark:text-[#d43d8a]" />
                      <span>Share Piece</span>
                    </>
                  )}
                </button>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3 pt-3 text-[11px] text-[#666] dark:text-[#a0a0a0]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#B81862] dark:text-[#d43d8a] shrink-0" />
                  <span>100% Certified Authentic</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#B81862] dark:text-[#d43d8a] shrink-0" />
                  <span>Insured Global Delivery</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16 sm:mt-20">
            <div className="flex items-center justify-between mb-6 sm:mb-8 flex-wrap gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#B81862] dark:text-[#d43d8a] block mb-1">
                  More From This Collection
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#141414] dark:text-[#f5f5f5] tracking-tight">
                  Complementary Creations
                </h2>
              </div>
              <Link
                href={`/store/${businessSlug}${categorySlug ? `?category=${categorySlug}` : ""}#products`}
                className="text-xs font-bold text-[#B81862] dark:text-[#d43d8a] hover:underline"
              >
                View all in {categoryName} →
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
