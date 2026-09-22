"use client";

import React, { useState, useEffect } from "react";
import {
  Palette,
  Sparkles,
  Layout,
  Image as ImageIcon,
  Check,
  Loader2,
  AlertCircle,
  Eye,
} from "lucide-react";
import { IBusiness, CatalogueTheme } from "@/types";

interface ThemePreset {
  name: string;
  theme: CatalogueTheme;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

const PRESETS: ThemePreset[] = [
  {
    name: "Regal Gold & Ivory (Default)",
    theme: "luxury",
    primaryColor: "#B4833E",
    secondaryColor: "#141414",
    accentColor: "#D4AF37",
    backgroundColor: "#FAF8F5",
    textColor: "#1A1A1A",
  },
  {
    name: "Midnight Sapphire & Platinum",
    theme: "modern",
    primaryColor: "#2563EB",
    secondaryColor: "#0F172A",
    accentColor: "#38BDF8",
    backgroundColor: "#F8FAFC",
    textColor: "#0F172A",
  },
  {
    name: "Emerald Palace & Gold",
    theme: "classic",
    primaryColor: "#059669",
    secondaryColor: "#064E3B",
    accentColor: "#D97706",
    backgroundColor: "#F4FDF9",
    textColor: "#132A13",
  },
  {
    name: "Monolith Minimalist",
    theme: "minimal",
    primaryColor: "#18181B",
    secondaryColor: "#09090B",
    accentColor: "#71717A",
    backgroundColor: "#FFFFFF",
    textColor: "#18181B",
  },
];

export default function AppearancePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessSlug, setBusinessSlug] = useState("royal-jewellers");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Theme & Colors
  const [theme, setTheme] = useState<CatalogueTheme>("luxury");
  const [primaryColor, setPrimaryColor] = useState("#B4833E");
  const [secondaryColor, setSecondaryColor] = useState("#141414");
  const [accentColor, setAccentColor] = useState("#D4AF37");
  const [backgroundColor, setBackgroundColor] = useState("#FAF8F5");
  const [textColor, setTextColor] = useState("#1A1A1A");

  // Hero & Sections
  const [heroHeading, setHeroHeading] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [heroCtaText, setHeroCtaText] = useState("Explore Collection");
  const [showAbout, setShowAbout] = useState(true);
  const [showContact, setShowContact] = useState(true);
  const [aboutText, setAboutText] = useState("");

  useEffect(() => {
    fetch("/api/business")
      .then((res) => res.json())
      .then((data) => {
        if (data.business) {
          const b: IBusiness = data.business;
          setBusinessSlug(b.slug || "royal-jewellers");
          setTheme(b.branding?.theme || "luxury");
          setPrimaryColor(b.branding?.primaryColor || "#B4833E");
          setSecondaryColor(b.branding?.secondaryColor || "#141414");
          setAccentColor(b.branding?.accentColor || "#D4AF37");
          setBackgroundColor(b.branding?.backgroundColor || "#FAF8F5");
          setTextColor(b.branding?.textColor || "#1A1A1A");

          setHeroHeading(b.catalogueSettings?.heroHeading || "");
          setHeroSubtitle(b.catalogueSettings?.heroSubtitle || "");
          setHeroImage(b.catalogueSettings?.heroImage || "");
          setHeroCtaText(b.catalogueSettings?.heroCtaText || "Explore Collection");
          setShowAbout(b.catalogueSettings?.showAbout ?? true);
          setShowContact(b.catalogueSettings?.showContact ?? true);
          setAboutText(b.catalogueSettings?.aboutText || "");
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const applyPreset = (preset: ThemePreset) => {
    setTheme(preset.theme);
    setPrimaryColor(preset.primaryColor);
    setSecondaryColor(preset.secondaryColor);
    setAccentColor(preset.accentColor);
    setBackgroundColor(preset.backgroundColor);
    setTextColor(preset.textColor);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);

    const payload = {
      branding: {
        theme,
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor,
        textColor,
      },
      catalogueSettings: {
        heroHeading,
        heroSubtitle,
        heroImage,
        heroCtaText,
        showAbout,
        showContact,
        aboutText,
      },
    };

    try {
      const res = await fetch("/api/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSuccessMessage("Appearance settings saved successfully!");
        setTimeout(() => setSuccessMessage(null), 4000);
      }
    } catch {
      alert("Failed to save appearance");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#B4833E]" />
        <span className="text-sm text-gray-500">Loading appearance studio...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#141414] tracking-tight">Appearance & Branding</h1>
          <p className="text-sm text-[#666059]">
            Customize color schemes, luxury typography, banner images, and catalogue themes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`/store/${businessSlug}?preview=true`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border border-[#D9D2C7] text-xs font-semibold text-[#141414] hover:bg-[#F3EFEA] transition shadow-xs"
          >
            <Eye className="w-4 h-4 text-[#B4833E]" />
            <span>Preview Theme</span>
          </a>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#141414] text-white text-xs font-semibold hover:bg-[#B4833E] transition shadow-xs disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Appearance</span>
              </>
            )}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2 font-medium">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Preset Palettes */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#141414] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#B4833E]" />
          Curated Design Palettes
        </h2>
        <p className="text-xs text-[#666059]">
          Choose a pre-harmonized color palette or customize individual tones below.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {PRESETS.map((p) => {
            const isSelected =
              primaryColor === p.primaryColor && secondaryColor === p.secondaryColor;

            return (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p)}
                className={`p-4 rounded-xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? "border-[#B4833E] ring-2 ring-[#B4833E]/20 bg-[#FAF8F5]"
                    : "border-[#E8E2D9] hover:border-gray-400 bg-white"
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: p.primaryColor }}
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: p.secondaryColor }}
                  />
                  <div
                    className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                    style={{ backgroundColor: p.accentColor }}
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-900 block">{p.name}</span>
                  <span className="text-[10px] uppercase font-semibold text-gray-400 block mt-0.5">
                    Theme: {p.theme}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Color Tokens & Theme Engine */}
        <div className="lg:col-span-2 space-y-8">
          {/* Custom Color Tokens */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-[#141414] flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#B4833E]" />
              Branding Colors
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1.5">
                  Primary Brand
                </label>
                <div className="flex items-center gap-2 border border-[#D9D2C7] rounded-xl p-1.5">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 text-xs font-mono font-semibold text-gray-800 uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1.5">
                  Secondary Tone
                </label>
                <div className="flex items-center gap-2 border border-[#D9D2C7] rounded-xl p-1.5">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 text-xs font-mono font-semibold text-gray-800 uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1.5">
                  Accent Color
                </label>
                <div className="flex items-center gap-2 border border-[#D9D2C7] rounded-xl p-1.5">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 text-xs font-mono font-semibold text-gray-800 uppercase focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-3 border-t border-[#E8E2D9]">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1.5">
                  Store Background Tone
                </label>
                <div className="flex items-center gap-2 border border-[#D9D2C7] rounded-xl p-1.5">
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    className="flex-1 text-xs font-mono text-gray-800 uppercase focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1.5">
                  Primary Text Color
                </label>
                <div className="flex items-center gap-2 border border-[#D9D2C7] rounded-xl p-1.5">
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="flex-1 text-xs font-mono text-gray-800 uppercase focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hero Section Customization */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#141414] flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-[#B4833E]" />
              Storefront Hero Banner
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Main Headline *
              </label>
              <input
                type="text"
                required
                value={heroHeading}
                onChange={(e) => setHeroHeading(e.target.value)}
                placeholder="Timeless Masterpieces Designed to Celebrate Your Legacy"
                className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Subtitle Description
              </label>
              <textarea
                rows={2}
                value={heroSubtitle}
                onChange={(e) => setHeroSubtitle(e.target.value)}
                placeholder="Discover certified solitaire diamonds and handcrafted 22K temple gold."
                className="w-full px-3.5 py-2 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  CTA Button Label
                </label>
                <input
                  type="text"
                  value={heroCtaText}
                  onChange={(e) => setHeroCtaText(e.target.value)}
                  placeholder="Explore Collection"
                  className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Hero Image URL
                </label>
                <input
                  type="text"
                  value={heroImage}
                  onChange={(e) => setHeroImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Theme Mode & Live Preview Pill */}
        <div className="space-y-8">
          {/* Theme Mode Selector */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#141414] flex items-center gap-2">
              <Layout className="w-4 h-4 text-[#B4833E]" />
              Catalogue Layout Theme
            </h2>

            <div className="space-y-2">
              {[
                { id: "luxury", title: "Luxury (Serif & Gold)", desc: "Warm tones, serif titles, editorial spacing" },
                { id: "modern", title: "Modern (Clean Sans)", desc: "Contemporary cards, crisp lines, geometric grid" },
                { id: "classic", title: "Classic (Heritage)", desc: "Traditional frames and rich accents" },
                { id: "minimal", title: "Minimal (Monochrome)", desc: "High contrast, generous whitespace" },
              ].map((t) => (
                <label
                  key={t.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    theme === t.id
                      ? "border-[#B4833E] bg-[#FAF8F5]"
                      : "border-[#E8E2D9] hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="theme"
                    checked={theme === t.id}
                    onChange={() => setTheme(t.id as CatalogueTheme)}
                    className="mt-1 text-[#B4833E] focus:ring-[#B4833E]"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">{t.title}</span>
                    <span className="text-[11px] text-gray-500 block">{t.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Section Toggles */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-[#141414]">Optional Sections</h2>

            <label className="flex items-center justify-between p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] cursor-pointer">
              <span className="text-xs font-bold text-gray-800">Show &quot;About Business&quot;</span>
              <input
                type="checkbox"
                checked={showAbout}
                onChange={(e) => setShowAbout(e.target.checked)}
                className="w-4 h-4 text-[#B4833E] rounded border-gray-300 focus:ring-[#B4833E]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] cursor-pointer">
              <span className="text-xs font-bold text-gray-800">Show &quot;Contact & Location&quot;</span>
              <input
                type="checkbox"
                checked={showContact}
                onChange={(e) => setShowContact(e.target.checked)}
                className="w-4 h-4 text-[#B4833E] rounded border-gray-300 focus:ring-[#B4833E]"
              />
            </label>
          </div>

          {/* Live Preview Card */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-3">
              Live Swatch Preview
            </span>
            <div
              className="rounded-xl p-5 border text-center transition-all"
              style={{ backgroundColor, color: textColor, borderColor: primaryColor }}
            >
              <span
                className="text-xs font-bold uppercase tracking-widest block mb-1"
                style={{ color: primaryColor }}
              >
                Sample Headline
              </span>
              <p className="text-xs opacity-80 mb-4 line-clamp-2">
                Preview how your chosen color harmony and background blend together.
              </p>
              <button
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {heroCtaText || "Explore"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
