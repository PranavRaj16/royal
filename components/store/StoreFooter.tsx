import React from "react";
import Link from "next/link";
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { IBusiness } from "@/types";

interface StoreFooterProps {
  business: IBusiness;
}

export default function StoreFooter({ business }: StoreFooterProps) {
  const cleanPhone = business.whatsapp.replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    `Hello ${business.name}, I would like to schedule a private viewing consultation.`
  )}`;

  return (
    <footer id="contact" className="bg-[#141414] text-white pt-20 pb-12 border-t border-[#262626]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-16 border-b border-[#262626]">
          {/* Col 1: Brand & Heritage */}
          <div className="space-y-4">
            <span className="font-serif text-2xl font-bold tracking-tight text-white block">
              {business.name}
            </span>
            <p className="text-xs text-gray-400 leading-relaxed">
              {business.catalogueSettings?.aboutText ||
                business.description ||
                "Purveyors of master-crafted fine jewellery, heirloom bridal adornments, and natural solitaires hallmarked to absolute perfection."}
            </p>

            <div className="pt-2 flex items-center gap-3">
              {business.socialLinks?.instagram && (
                <a
                  href={business.socialLinks.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-[#222] hover:bg-[#B4833E] text-white flex items-center justify-center transition"
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              )}
              {business.socialLinks?.facebook && (
                <a
                  href={business.socialLinks.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-[#222] hover:bg-[#B4833E] text-white flex items-center justify-center transition"
                  aria-label="Facebook"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
              )}
              {business.socialLinks?.youtube && (
                <a
                  href={business.socialLinks.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 rounded-full bg-[#222] hover:bg-[#B4833E] text-white flex items-center justify-center transition"
                  aria-label="YouTube"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Col 2: Concierge & Direct Contact */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              Concierge Service
            </h3>
            <ul className="space-y-3 text-xs text-gray-300">
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 hover:text-[#D4AF37] transition group"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition" />
                  <span>WhatsApp: {business.whatsapp}</span>
                </a>
              </li>
              {business.phone && (
                <li>
                  <a
                    href={`tel:${business.phone}`}
                    className="flex items-center gap-2.5 hover:text-[#D4AF37] transition"
                  >
                    <Phone className="w-4 h-4 text-[#B4833E]" />
                    <span>Call: {business.phone}</span>
                  </a>
                </li>
              )}
              {business.email && (
                <li>
                  <a
                    href={`mailto:${business.email}`}
                    className="flex items-center gap-2.5 hover:text-[#D4AF37] transition"
                  >
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{business.email}</span>
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3: Boutique Flagship & Location */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              Boutique Location
            </h3>
            <div className="text-xs text-gray-300 space-y-2">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#B4833E] shrink-0 mt-0.5" />
                <span>
                  {business.address?.street || "42, Heritage Boulevard, Zaveri Bazaar"},
                  <br />
                  {business.address?.city || "Mumbai"},{" "}
                  {business.address?.state || "Maharashtra"},{" "}
                  {business.address?.country || "India"}
                </span>
              </div>

              {business.address?.mapsUrl && (
                <a
                  href={business.address.mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-[#D4AF37] hover:underline pt-2 text-[11px] font-semibold"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* Col 4: Authenticity & Trust */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">
              Royal Trust Guarantee
            </h3>
            <div className="p-4 rounded-xl bg-[#1C1C1C] border border-[#2E2E2E] space-y-2 text-xs text-gray-400">
              <div className="flex items-center gap-2 text-white font-semibold">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                <span>100% Certified Purity</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                BIS 916 hallmarked 22K gold and IGI/GIA certified natural untreated diamonds.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
          <p>© {new Date().getFullYear()} {business.name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-gray-300 transition">
              Powered by CatalogueStudio
            </Link>
            <span>•</span>
            <Link href="/admin/login" className="hover:text-[#D4AF37] transition">
              Store Owner Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
