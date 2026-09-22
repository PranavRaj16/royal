import React from "react";
import Link from "next/link";
import { ArrowDown, Sparkles } from "lucide-react";
import { ICatalogueSettings, IBranding } from "@/types";

interface StoreHeroProps {
  settings?: ICatalogueSettings;
  branding?: IBranding;
  businessSlug: string;
}

export default function StoreHero({
  settings,
  branding,
  businessSlug,
}: StoreHeroProps) {
  const heading =
    settings?.heroHeading || "Timeless Jewellery Designed to Celebrate Every Moment";
  const subtitle =
    settings?.heroSubtitle ||
    "Discover handcrafted gold, certified solitaires, and heirloom bridal collections.";
  const heroImage =
    settings?.heroImage ||
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1920&q=80";
  const ctaText = settings?.heroCtaText || "Explore Collection";
  const primaryColor = branding?.primaryColor || "#B4833E";

  return (
    <section className="relative min-h-[70vh] lg:min-h-[82vh] flex items-center justify-center overflow-hidden bg-[#141414]">
      {/* Background Image with Cinematic Darkness Gradient */}
      <div className="absolute inset-0 z-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={heroImage}
          alt="Catalogue Hero Background"
          className="w-full h-full object-cover object-center opacity-45 scale-105 transform animate-fade-in"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
        <div className="absolute inset-0 bg-radial from-transparent via-[#141414]/40 to-[#141414]" />
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#D4AF37] text-xs font-semibold uppercase tracking-[0.2em] mb-6 shadow-md">
          <Sparkles className="w-3.5 h-3.5" /> High Jewellery &amp; Bespoke Creations
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.15] max-w-4xl drop-shadow-md">
          {heading}
        </h1>

        <p className="mt-6 text-base sm:text-lg lg:text-xl text-[#FAF8F5]/80 max-w-2xl font-light leading-relaxed">
          {subtitle}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href={`/store/${businessSlug}#products`}
            className="px-8 py-4 rounded-full text-white font-semibold text-sm uppercase tracking-wider transition duration-300 shadow-xl shadow-black/40 hover:scale-105 active:scale-95 flex items-center gap-2"
            style={{ backgroundColor: primaryColor }}
          >
            <span>{ctaText}</span>
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </Link>

          <Link
            href={`/store/${businessSlug}#categories`}
            className="px-8 py-4 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 font-semibold text-sm uppercase tracking-wider transition duration-300"
          >
            Browse Categories
          </Link>
        </div>
      </div>
    </section>
  );
}
