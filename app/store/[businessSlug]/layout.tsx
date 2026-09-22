import React from "react";
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { Business, Category } from "@/models";
import StoreHeader from "@/components/store/StoreHeader";
import StoreFooter from "@/components/store/StoreFooter";
import PreviewBanner from "@/components/store/PreviewBanner";

interface StoreLayoutProps {
  children: React.ReactNode;
  params: Promise<{ businessSlug: string }>;
}

export default async function StoreLayout({
  children,
  params,
}: StoreLayoutProps) {
  const { businessSlug } = await params;
  await connectToDatabase();

  const business = await Business.findOne({ slug: businessSlug.toLowerCase() });
  if (!business) {
    notFound();
  }

  const categories = await Category.find({
    businessId: business._id,
    isActive: true,
  }).sort({ displayOrder: 1 });

  const branding = business.branding || {
    primaryColor: "#B4833E",
    secondaryColor: "#141414",
    accentColor: "#D4AF37",
    backgroundColor: "#FAF8F5",
    textColor: "#1A1A1A",
  };

  // Convert mongoose documents to plain objects
  const businessObj = JSON.parse(JSON.stringify(business));
  const categoriesObj = JSON.parse(JSON.stringify(categories));

  return (
    <div
      className="min-h-screen flex flex-col transition-colors"
      style={
        {
          "--primary": branding.primaryColor,
          "--secondary": branding.secondaryColor,
          "--accent": branding.accentColor,
          "--background": branding.backgroundColor || "#FAF8F5",
          "--foreground": branding.textColor || "#1A1A1A",
        } as React.CSSProperties
      }
    >
      <StoreHeader business={businessObj} categories={categoriesObj} />

      <main className="flex-1">{children}</main>

      <StoreFooter business={businessObj} />
    </div>
  );
}
