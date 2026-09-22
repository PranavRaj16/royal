"use client";

import React, { useState, useEffect, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  QrCode,
  Download,
  Copy,
  Check,
  Share2,
  ExternalLink,
  Loader2,
  Sparkles,
} from "lucide-react";
import { IBusiness } from "@/types";

export default function QrSharePage() {
  const [business, setBusiness] = useState<IBusiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/business")
      .then((res) => res.json())
      .then((data) => {
        if (data.business) setBusiness(data.business);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const storeSlug = business?.slug || "royal-jewellers";
  const catalogueUrl = `${origin}/store/${storeSlug}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(catalogueUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert("Unable to copy to clipboard");
    }
  };

  const handleDownloadQr = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector("canvas");
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `${storeSlug}-catalogue-qr.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: business?.name || "Digital Catalogue",
          text: `Explore our official digital collection online.`,
          url: catalogueUrl,
        });
      } catch {
        // Share dismissed
      }
    } else {
      handleCopyLink();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#B4833E]" />
        <span className="text-sm text-gray-500">Generating dynamic QR code...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#B4833E]/10 border border-[#B4833E]/20 text-[#B4833E] text-xs font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5" /> Instant Customer Access
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#141414] tracking-tight">
          Catalogue QR & Share
        </h1>
        <p className="text-sm text-[#666059] mt-1">
          Place this QR code on showroom counter stands, marketing collateral, and invoices for instant mobile browsing.
        </p>
      </div>

      {/* Main QR Card */}
      <div className="bg-white border border-[#E8E2D9] rounded-3xl p-8 sm:p-12 shadow-sm text-center flex flex-col items-center">
        {/* Business Badge */}
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-widest text-[#B4833E] block mb-1">
            Official Digital Store
          </span>
          <h2 className="text-xl font-bold text-[#141414]">{business?.name || "Royal Jewellers"}</h2>
        </div>

        {/* QR Code Canvas */}
        <div
          ref={qrRef}
          className="p-6 bg-[#FAF8F5] border-2 border-[#E8E2D9] rounded-2xl shadow-inner mb-6 transition hover:shadow-md"
        >
          <QRCodeCanvas
            value={catalogueUrl}
            size={240}
            level="H"
            bgColor="#FAF8F5"
            fgColor="#141414"
            includeMargin={true}
          />
        </div>

        <p className="text-xs text-gray-500 max-w-sm mb-6">
          Scan with any mobile camera or QR reader to browse all collections and send instant WhatsApp inquiries.
        </p>

        {/* Link Box */}
        <div className="w-full max-w-md bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl p-3 flex items-center justify-between gap-3 mb-8">
          <span className="text-xs font-mono text-gray-700 truncate">{catalogueUrl}</span>
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#D9D2C7] text-xs font-semibold text-gray-800 hover:bg-[#F3EFEA] transition shrink-0 flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-500" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
          <button
            type="button"
            onClick={handleDownloadQr}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#141414] text-white text-xs font-semibold hover:bg-[#B4833E] transition shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG</span>
          </button>

          <button
            type="button"
            onClick={handleNativeShare}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white border border-[#D9D2C7] text-[#141414] text-xs font-semibold hover:bg-[#FAF8F5] transition shadow-xs"
          >
            <Share2 className="w-4 h-4 text-[#B4833E]" />
            <span>Share Link</span>
          </button>

          <a
            href={catalogueUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white border border-[#D9D2C7] text-[#141414] text-xs font-semibold hover:bg-[#FAF8F5] transition shadow-xs"
            title="Open Store in New Tab"
          >
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
