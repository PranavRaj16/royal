"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Phone,
  MessageCircle,
  Mail,
  Globe,
  MapPin,
  Share2,
  Upload,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { IBusiness } from "@/types";

export default function BusinessProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [logo, setLogo] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  // Address
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [mapsUrl, setMapsUrl] = useState("");

  // Social
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [youtube, setYoutube] = useState("");

  useEffect(() => {
    fetch("/api/business")
      .then((res) => res.json())
      .then((data) => {
        if (data.business) {
          const b: IBusiness = data.business;
          setName(b.name || "");
          setSlug(b.slug || "");
          setLogo(b.logo || "");
          setDescription(b.description || "");
          setPhone(b.phone || "");
          setWhatsapp(b.whatsapp || "");
          setEmail(b.email || "");
          setWebsite(b.website || "");

          setStreet(b.address?.street || "");
          setCity(b.address?.city || "");
          setState(b.address?.state || "");
          setCountry(b.address?.country || "India");
          setMapsUrl(b.address?.mapsUrl || "");

          setInstagram(b.socialLinks?.instagram || "");
          setFacebook(b.socialLinks?.facebook || "");
          setYoutube(b.socialLinks?.youtube || "");
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setLogo(data.url);
      } else {
        alert(data.error || "Failed to upload logo");
      }
    } catch {
      alert("Error uploading logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    const payload = {
      name,
      slug,
      logo,
      description,
      phone,
      whatsapp,
      email,
      website,
      address: { street, city, state, country, mapsUrl },
      socialLinks: { instagram, facebook, youtube },
    };

    try {
      const res = await fetch("/api/business", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }
      setSuccessMessage("Business profile updated successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#B4833E]" />
        <span className="text-sm text-gray-500">Loading business settings...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#141414] tracking-tight">Business Profile</h1>
          <p className="text-sm text-[#666059]">
            Configure store contact information, WhatsApp concierge number, and location details.
          </p>
        </div>

        <button
          type="submit"
          disabled={saving || uploadingLogo}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#141414] text-white text-xs font-semibold hover:bg-[#B4833E] transition shadow-xs disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Save Profile</span>
            </>
          )}
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-800 flex items-center gap-2 font-medium">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Basic Details & Address */}
        <div className="lg:col-span-2 space-y-8">
          {/* General Information */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-[#141414] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#B4833E]" />
              Basic Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Catalogue Slug (URL) *
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 bg-gray-100 border border-r-0 border-[#D9D2C7] rounded-l-xl text-xs text-gray-500 font-mono">
                    /store/
                  </span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-[#D9D2C7] rounded-r-xl text-sm font-mono focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Store Bio & Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe your heritage, values, and offerings..."
                className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
              />
            </div>
          </div>

          {/* Physical Address & Maps */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#141414] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#B4833E]" />
              Store Location & Address
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Street Address
              </label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="42, Heritage Boulevard, Zaveri Bazaar"
                className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Mumbai"
                  className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  State
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Maharashtra"
                  className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Country
                </label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="India"
                  className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Google Maps Embed / Place URL
              </label>
              <input
                type="text"
                value={mapsUrl}
                onChange={(e) => setMapsUrl(e.target.value)}
                placeholder="https://maps.google.com/?q=..."
                className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right 1 Col: Logo, Contact Channels, Social Media */}
        <div className="space-y-8">
          {/* Logo Card */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#141414]">Business Brand Logo</h2>
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-2xl border-2 border-[#E8E2D9] overflow-hidden bg-[#FAF8F5] flex items-center justify-center shadow-xs">
                {logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logo} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-10 h-10 text-gray-300" />
                )}
              </div>

              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D9D2C7] bg-[#FAF8F5] text-xs font-semibold text-gray-700 hover:bg-[#F3EFEA] transition">
                <Upload className="w-4 h-4 text-[#B4833E]" />
                <span>{uploadingLogo ? "Uploading..." : "Upload Logo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                  className="hidden"
                />
              </label>

              <input
                type="text"
                value={logo}
                onChange={(e) => setLogo(e.target.value)}
                placeholder="Or paste direct logo URL"
                className="w-full px-3 py-1.5 border border-[#D9D2C7] rounded-xl text-xs text-gray-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Contact & WhatsApp */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#141414] flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              Contact & WhatsApp
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                WhatsApp Number *
              </label>
              <div className="relative">
                <MessageCircle className="w-4 h-4 absolute left-3 top-3 text-emerald-600" />
                <input
                  type="text"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+919876543210 (with country code)"
                  className="w-full pl-9 pr-3 py-2.5 border border-[#D9D2C7] rounded-xl text-sm font-semibold focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-gray-500 mt-1">
                Used for instant customer product enquiry links.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Voice Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2.5 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Concierge Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="concierge@store.com"
                  className="w-full pl-9 pr-3 py-2.5 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Official Website
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full pl-9 pr-3 py-2.5 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Social Channels */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#141414] flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#B4833E]" />
              Social Channels
            </h2>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Instagram URL
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full px-3.5 py-2 border border-[#D9D2C7] rounded-xl text-xs focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Facebook Page
              </label>
              <input
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full px-3.5 py-2 border border-[#D9D2C7] rounded-xl text-xs focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                YouTube Channel
              </label>
              <input
                type="text"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="https://youtube.com/@..."
                className="w-full px-3.5 py-2 border border-[#D9D2C7] rounded-xl text-xs focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
