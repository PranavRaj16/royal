import React, { Suspense } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { Business, Category, Product } from "@/models";
import StoreHero from "@/components/store/StoreHero";
import StoreCategories from "@/components/store/StoreCategories";
import PublicProductShowcase from "@/components/store/PublicProductShowcase";
import PreviewBanner from "@/components/store/PreviewBanner";
import { Sparkles, Clock, ShieldCheck, HeartHandshake } from "lucide-react";

interface PageProps {
  params: Promise<{ businessSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: { params: Promise<{ businessSlug: string }> }): Promise<Metadata> {
  const { businessSlug } = await params;
  await connectToDatabase();

  const business = await Business.findOne({ slug: businessSlug.toLowerCase() });
  if (!business) {
    return {
      title: "Store Not Found",
    };
  }

  const title = `${business.name} | Official Digital Catalogue`;
  const description =
    business.description ||
    `${business.name} digital catalogue. Discover exclusive collections and enquire directly on WhatsApp.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url:
            business.catalogueSettings?.heroImage ||
            business.logo ||
            "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80",
          width: 1200,
          height: 630,
          alt: business.name,
        },
      ],
    },
  };
}

export default async function BusinessStorePage({
  params,
  searchParams,
}: PageProps) {
  const { businessSlug } = await params;
  const sParams = await searchParams;
  const isPreview = sParams.preview === "true";

  await connectToDatabase();

  const business = await Business.findOne({ slug: businessSlug.toLowerCase() });
  if (!business) {
    notFound();
  }

  // Unpublished Guard
  if (business.catalogueStatus === "unpublished" && !isPreview) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-[#FAF8F5]">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
          <Clock className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#141414] tracking-tight">
          Catalogue Coming Soon
        </h1>
        <p className="mt-3 text-sm text-[#666059] max-w-md leading-relaxed">
          This digital catalogue is currently being curated and updated with new bespoke pieces. Please check back soon.
        </p>
        <div className="mt-8 pt-6 border-t border-[#E8E2D9] text-xs text-gray-400">
          {business.name} Concierge
        </div>
      </div>
    );
  }

  // Fetch active categories
  const categories = await Category.find({
    businessId: business._id,
    isActive: true,
  }).sort({ displayOrder: 1 });

  // Fetch products
  const productQuery: Record<string, unknown> = {
    businessId: business._id,
  };
  if (!isPreview) {
    productQuery.isPublished = true;
  }

  const products = await Product.find(productQuery)
    .populate("categoryId", "name slug")
    .sort({ isFeatured: -1, createdAt: -1 });

  // Serialize Mongoose docs
  const businessObj = JSON.parse(JSON.stringify(business));
  const categoriesObj = JSON.parse(JSON.stringify(categories));
  const productsObj = JSON.parse(JSON.stringify(products));

  return (
    <div>
      {isPreview && (
        <PreviewBanner
          businessSlug={business.slug}
          isPublished={business.catalogueStatus === "published"}
        />
      )}

      {/* Hero Banner */}
      <StoreHero
        settings={businessObj.catalogueSettings}
        branding={businessObj.branding}
        businessSlug={business.slug}
      />

      {/* Visual Categories Grid */}
      <StoreCategories
        categories={categoriesObj}
        businessSlug={business.slug}
      />

      {/* Product Showcase with Live Filters & Search */}
      <Suspense fallback={<div className="h-96 flex items-center justify-center"><span className="text-[#B4833E] text-sm animate-pulse">Loading products...</span></div>}>
        <PublicProductShowcase
          initialProducts={productsObj}
          categories={categoriesObj}
          business={businessObj}
          businessSlug={business.slug}
        />
      </Suspense>

      {/* About Us & Heritage Section */}
      {business.catalogueSettings?.showAbout && (
        <section id="about" className="py-20 bg-[#FAF8F5] border-t border-[#E8E2D9]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#B4833E] block mb-2">
              Legacy of Excellence
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#141414] tracking-tight mb-6">
              About {business.name}
            </h2>
            <p className="text-base sm:text-lg text-[#666059] leading-relaxed max-w-3xl mx-auto font-light mb-12">
              {business.catalogueSettings?.aboutText || business.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
              <div className="p-6 bg-white rounded-2xl border border-[#E8E2D9] shadow-xs">
                <ShieldCheck className="w-6 h-6 text-[#B4833E] mb-3" />
                <h3 className="font-bold text-sm text-[#141414] mb-1">Peerless Authenticity</h3>
                <p className="text-xs text-[#666059] leading-relaxed">
                  Every jewel is rigorously inspected, hallmarked, and certified by globally accredited gemological laboratories.
                </p>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-[#E8E2D9] shadow-xs">
                <Sparkles className="w-6 h-6 text-[#B4833E] mb-3" />
                <h3 className="font-bold text-sm text-[#141414] mb-1">Master Karigari</h3>
                <p className="text-xs text-[#666059] leading-relaxed">
                  Sculpted by generational artisans preserving traditional filigree, nakshi repousse, and precision prong settings.
                </p>
              </div>

              <div className="p-6 bg-white rounded-2xl border border-[#E8E2D9] shadow-xs">
                <HeartHandshake className="w-6 h-6 text-[#B4833E] mb-3" />
                <h3 className="font-bold text-sm text-[#141414] mb-1">Personalized Concierge</h3>
                <p className="text-xs text-[#666059] leading-relaxed">
                  Connect with our jewelry advisors on WhatsApp for customized sizing, customization, and bridal consultations.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
