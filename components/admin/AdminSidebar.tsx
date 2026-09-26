"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Eye,
  QrCode,
  Building2,
  Palette,
  Settings,
  LogOut,
  ExternalLink,
  X,
} from "lucide-react";

interface AdminSidebarProps {
  businessSlug?: string;
  businessName?: string;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onLogout: () => void;
}

export default function AdminSidebar({
  businessSlug = "royal-jewellers",
  businessName = "Royal Jewellers",
  mobileOpen,
  setMobileOpen,
  onLogout,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const navGroups = [
    {
      label: "OVERVIEW",
      items: [
        { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "CATALOGUE",
      items: [
        { label: "Products", href: "/admin/products", icon: Package },
        { label: "Preview Store", href: `/store/${businessSlug}?preview=true`, icon: Eye, external: true },
        { label: "QR & Share", href: "/admin/qr-share", icon: QrCode },
      ],
    },
    {
      label: "BUSINESS",
      items: [
        { label: "Business Profile", href: "/admin/business", icon: Building2 },
        { label: "Appearance", href: "/admin/appearance", icon: Palette },
        { label: "Settings", href: "/admin/settings", icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#141414] text-white flex flex-col justify-between border-r border-[#262626] transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div>
          <div className="h-18 px-6 flex items-center justify-between border-b border-[#262626]">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3"
              onClick={() => setMobileOpen(false)}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#B4833E] text-black font-bold text-lg flex items-center justify-center shadow-md">
                R
              </div>
              <div className="overflow-hidden">
                <span className="font-bold text-sm text-white block truncate tracking-tight">
                  {businessName}
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-[#D4AF37] block">
                  Admin Studio
                </span>
              </div>
            </Link>

            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-6 overflow-y-auto max-h-[calc(100vh-160px)]">
            {navGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <div className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#888888] mb-2">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = !item.external && pathname === item.href;

                  return item.external ? (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-[#222] transition"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-[#D4AF37]" />
                        <span>{item.label}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                        isActive
                          ? "bg-[#B4833E] text-white shadow-md font-semibold"
                          : "text-gray-300 hover:text-white hover:bg-[#222]"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-[#262626]">
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950/30 hover:text-red-300 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
