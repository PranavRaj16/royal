import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles, Smartphone, QrCode, Sliders, Layers } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1A1A] flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="border-b border-[#E8E2D9] bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-[#D4AF37] flex items-center justify-center font-bold text-xl shadow-md">
              R
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-[#1A1A1A]">CatalogueStudio</span>
              <span className="block text-[11px] font-medium uppercase tracking-widest text-[#B4833E]">
                SaaS Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/store/royal-jewellers"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#1A1A1A] hover:text-[#B4833E] transition"
            >
              Live Demo Store
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1A1A1A] text-white text-sm font-semibold hover:bg-[#B4833E] transition shadow-sm"
            >
              Admin Studio
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#B4833E]/10 border border-[#B4833E]/20 text-[#B4833E] text-xs font-semibold uppercase tracking-wider mb-8">
          <Sparkles className="w-4 h-4" /> Multi-Tenant Digital Catalogue Platform
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#141414] max-w-4xl leading-[1.1] mb-6">
          Empower Any Business With a{" "}
          <span className="gold-gradient-text italic font-serif">Luxury Digital Catalogue</span>
        </h1>

        <p className="text-lg sm:text-xl text-[#666059] max-w-2xl font-normal leading-relaxed mb-10">
          The all-in-one catalogue management platform for Jewellery, Fashion, Watches, Furniture, and Electronics.
          Craft, customize, and publish your digital collection with instant WhatsApp customer enquiries.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
          <Link
            href="/store/royal-jewellers"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-[#B4833E] text-white font-semibold text-base shadow-lg shadow-[#B4833E]/20 hover:bg-[#996d2f] transition"
          >
            <span>View &quot;Royal Jewellers&quot; Catalogue</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/admin/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white border border-[#D9D2C7] text-[#1A1A1A] font-semibold text-base hover:bg-[#F3EFEA] transition shadow-sm"
          >
            <ShieldCheck className="w-5 h-5 text-[#B4833E]" />
            <span>Open Admin Dashboard</span>
          </Link>
        </div>

        {/* Credentials Pill */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 max-w-xl w-full shadow-sm text-left mb-16">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B4833E]">
              Demo Admin Credentials
            </span>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              Ready to Login
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-[#888] block text-xs">Email:</span>
              <code className="font-mono text-[#1A1A1A] font-semibold">admin@royaljewellers.com</code>
            </div>
            <div>
              <span className="text-[#888] block text-xs">Password:</span>
              <code className="font-mono text-[#1A1A1A] font-semibold">RoyalAdmin@2026</code>
            </div>
          </div>
        </div>

        {/* Key Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left">
          <div className="p-8 rounded-2xl bg-white border border-[#E8E2D9] shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-center text-[#B4833E] mb-5">
              <Sliders className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-[#1A1A1A]">Dynamic Specifications</h3>
            <p className="text-sm text-[#666059] leading-relaxed">
              Adaptable to any product category. Define custom key-value pairs (e.g. Karat, Purity, Gemstones for Jewellery or RAM, Storage, CPU for Tech).
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-[#E8E2D9] shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-center text-[#B4833E] mb-5">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-[#1A1A1A]">Instant WhatsApp Enquiries</h3>
            <p className="text-sm text-[#666059] leading-relaxed">
              Customers click to enquiry directly on WhatsApp with pre-filled product details, SKU, and direct catalogue link. No complex checkout barriers.
            </p>
          </div>

          <div className="p-8 rounded-2xl bg-white border border-[#E8E2D9] shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-center text-[#B4833E] mb-5">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-[#1A1A1A]">Dynamic QR & Multi-Tenancy</h3>
            <p className="text-sm text-[#666059] leading-relaxed">
              Instantly generate high-resolution QR codes for counter stands and social media. Architected with isolated business tenants.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E8E2D9] bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#888]">
          <p>© {new Date().getFullYear()} CatalogueStudio. Production-ready digital catalogue management platform.</p>
          <div className="flex gap-6">
            <Link href="/store/royal-jewellers" className="hover:text-[#B4833E] transition">Royal Jewellers Store</Link>
            <Link href="/admin/login" className="hover:text-[#B4833E] transition">Admin Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
