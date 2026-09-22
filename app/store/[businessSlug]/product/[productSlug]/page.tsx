import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectToDatabase } from "@/lib/mongodb";
import { Business, Product } from "@/models";
import ProductDetailView from "@/components/store/ProductDetailView";
import PreviewBanner from "@/components/store/PreviewBanner";

interface PageProps {
  params: Promise<{ businessSlug: string; productSlug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ businessSlug: string; productSlug: string }>;
}): Promise<Metadata> {
  const { businessSlug, productSlug } = await params;
  await connectToDatabase();

  const business = await Business.findOne({ slug: businessSlug.toLowerCase() });
  if (!business) return { title: "Store Not Found" };

  const product = await Product.findOne({
    businessId: business._id,
    slug: productSlug.toLowerCase(),
  });
  if (!product) return { title: "Product Not Found" };

  const title = `${product.name} | ${business.name}`;
  const description =
    product.shortDescription ||
    product.description ||
    `Discover ${product.name} at ${business.name}. Enquire directly on WhatsApp.`;

  const primaryImage = product.images?.[0]?.url || business.logo;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: primaryImage
        ? [
            {
              url: primaryImage,
              width: 1200,
              height: 630,
              alt: product.name,
            },
          ]
        : [],
    },
  };
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { businessSlug, productSlug } = await params;
  const sParams = await searchParams;
  const isPreview = sParams.preview === "true";

  await connectToDatabase();

  const business = await Business.findOne({ slug: businessSlug.toLowerCase() });
  if (!business) notFound();

  const productQuery: Record<string, unknown> = {
    businessId: business._id,
    slug: productSlug.toLowerCase(),
  };

  if (!isPreview) {
    productQuery.isPublished = true;
  }

  const product = await Product.findOne(productQuery).populate("categoryId", "name slug");
  if (!product) notFound();

  // Related products from the same category
  const related = await Product.find({
    businessId: business._id,
    categoryId: product.categoryId?._id,
    _id: { $ne: product._id },
    isPublished: true,
  })
    .limit(4)
    .populate("categoryId", "name slug");

  const businessObj = JSON.parse(JSON.stringify(business));
  const productObj = JSON.parse(JSON.stringify(product));
  const relatedObj = JSON.parse(JSON.stringify(related));

  return (
    <div>
      {isPreview && (
        <PreviewBanner
          businessSlug={business.slug}
          isPublished={business.catalogueStatus === "published"}
        />
      )}

      <ProductDetailView
        product={productObj}
        business={businessObj}
        businessSlug={business.slug}
        relatedProducts={relatedObj}
      />
    </div>
  );
}
