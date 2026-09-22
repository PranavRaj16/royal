"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

interface PreviewBannerProps {
  businessSlug: string;
  isPublished: boolean;
}

export default function PreviewBanner({ businessSlug, isPublished: initialPublished }: PreviewBannerProps) {
  const [isPublished, setIsPublished] = useState(initialPublished);
  const [publishing, setPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const res = await fetch("/api/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ catalogueStatus: "published" }),
      });
      if (res.ok) {
        setIsPublished(true);
        setPublishedSuccess(true);
        setTimeout(() => setPublishedSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to publish catalogue:", err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="bg-[#141414] text-white px-4 py-2.5 text-xs border-b border-[#333] sticky top-0 z-50 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
          <Eye className="w-3.5 h-3.5" />
          <span>Admin Preview Mode</span>
        </span>
        <span className="hidden sm:inline text-gray-400">
          Showing unpublished changes &amp; draft products.
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1 text-gray-300 hover:text-white transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Studio</span>
        </Link>

        {!isPublished && (
          <button
            type="button"
            onClick={handlePublish}
            disabled={publishing}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#B4833E] text-white font-semibold hover:bg-[#D4AF37] hover:text-black transition"
          >
            {publishing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : publishedSuccess ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : null}
            <span>{publishedSuccess ? "Published!" : "Publish Catalogue"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
