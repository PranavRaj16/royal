import React from "react";
import Link from "next/link";
import { Star, ArrowRight, MessageCircle } from "lucide-react";
import { IProduct } from "@/types";
import { getProductPlaceholder } from "@/lib/placeholderImages";

interface ProductCardProps {
  product: IProduct;
  businessSlug: string;
  whatsappNumber?: string;
  businessName?: string;
}

/** Formats a price consistently on both server and client using a fixed locale */
function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ProductCard({
  product,
  businessSlug,
  whatsappNumber,
  businessName,
}: ProductCardProps) {
  const catIdentifier =
    (typeof product.categoryId === "object" && product.categoryId !== null
      ? (product.categoryId as { name?: string; slug?: string })?.name || (product.categoryId as { name?: string; slug?: string })?.slug
      : typeof product.categoryId === "string"
      ? product.categoryId
      : "") || product.category?.name || "";

  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    getProductPlaceholder(catIdentifier, product.name);

  // Calculate discount percent
  const discountPercent =
    product.discountPrice && product.price > product.discountPrice
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : 0;

  // Use a relative URL — both server and client will render the same value.
  // The WhatsApp link opens externally so the full URL isn't strictly needed here.
  const productPath = `/store/${businessSlug}/product/${product.slug}`;

  const cleanWhatsapp = whatsappNumber?.replace(/[^0-9]/g, "") || "919581335925";
  const whatsappEnquiryUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
    `Hi ${businessName || "Dwara Collections"}, I am interested in ${product.name} (Product ID: ${product.sku}). Catalogue: ${productPath}`
  )}`;

  return (
    <div className="group bg-white dark:bg-[#161616] rounded-2xl border border-[#E8E2D9] dark:border-[#2a2a2a] overflow-hidden shadow-xs hover:shadow-xl dark:hover:border-[#B81862]/50 transition-all duration-500 flex flex-col justify-between">
      {/* Product Image Stage */}
      <div className="relative aspect-square overflow-hidden bg-[#FFF8FB] dark:bg-[#1f1f1f]">
        <Link href={productPath}>
          {/* Main Photo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
        </Link>

        {/* Badges on Top */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          {product.isFeatured && (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#d43d8a] text-black shadow-xs flex items-center gap-1">
              <Star className="w-3 h-3 fill-black" /> Featured
            </span>
          )}
          {discountPercent > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs">
              Save {discountPercent}%
            </span>
          )}
          {product.stockStatus === "made_to_order" && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#141414]/80 dark:bg-black/70 text-white backdrop-blur-xs">
              Bespoke Order
            </span>
          )}
        </div>

        {/* Floating Quick Action */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
                  description: `Direct enquiry from store catalogue`,
                }),
              }).catch(() => {});
            }}
            className="p-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition flex items-center justify-center"
            title="Enquire on WhatsApp"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
          </a>
        </div>
      </div>

      {/* Product Details Section */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#B81862] dark:text-[#d43d8a] block mb-1">
            {(typeof product.categoryId === "object" && product.categoryId !== null
              ? (product.categoryId as { name?: string })?.name
              : null) ||
              product.category?.name ||
              "Bespoke Collection"}
          </span>
          <Link
            href={productPath}
            className="font-serif text-base sm:text-lg font-bold text-[#141414] dark:text-[#f5f5f5] hover:text-[#B81862] dark:hover:text-[#d43d8a] transition line-clamp-1 block leading-snug"
          >
            {product.name}
          </Link>
          <span className="text-[11px] font-mono text-[#736E66] dark:text-[#a0a0a0] block mt-0.5">
            Product ID: {product.sku}
          </span>
        </div>

        <div className="mt-4 pt-3 border-t border-[#E8E2D9] dark:border-[#2a2a2a] flex items-center justify-between">
          <div>
            {product.showPrice ? (
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold text-[#141414] dark:text-[#f5f5f5]">
                  ₹{formatPrice(product.discountPrice || product.price)}
                </span>
                {product.discountPrice && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 line-through">
                    ₹{formatPrice(product.price)}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs font-semibold text-[#B81862] dark:text-[#d43d8a]">
                Price upon enquiry
              </span>
            )}
          </div>

          <Link
            href={productPath}
            className="inline-flex items-center gap-1 text-xs font-bold text-[#141414] dark:text-[#f5f5f5] group-hover:text-[#B81862] dark:group-hover:text-[#d43d8a] transition"
          >
            <span>View</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>
      </div>
    </div>
  );
}
