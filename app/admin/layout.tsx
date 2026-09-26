"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { IBusiness } from "@/types";

const NAV_ITEMS = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/products", icon: Package, label: "Products" },
  { href: "/admin/requests", icon: Inbox, label: "Requests" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [business, setBusiness] = useState<IBusiness | null>(null);
  const [pendingRequests, setPendingRequests] = useState(0);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/admin/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.business) setBusiness(data.business);
      })
      .catch(() => router.push("/admin/login"));
  }, [isLoginPage, router]);

  // Poll pending request count every 30 seconds
  useEffect(() => {
    if (isLoginPage) return;
    const fetchCount = () => {
      fetch("/api/admin/requests?status=pending&limit=1")
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setPendingRequests(d.total || 0);
        })
        .catch(() => {});
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [isLoginPage]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/admin/login");
    router.refresh();
  };

  if (isLoginPage) return <>{children}</>;

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={`flex flex-col h-full bg-[var(--surface)] border-r border-[var(--border)] ${
        mobile ? "w-72" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#B4833E] to-[#D4AF37] flex items-center justify-center font-bold text-black text-sm">
            R
          </div>
          <div>
            <span className="block font-bold text-white text-sm leading-tight">
              {business?.name || "Royal Jewellers"}
            </span>
            <span className="block text-[10px] text-[#B4833E] font-semibold uppercase tracking-wider">
              Admin Studio
            </span>
          </div>
        </Link>
        {mobile && (
          <button
            id="close-sidebar-btn"
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-[var(--muted)] hover:text-white rounded-lg hover:bg-[var(--surface-2)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/admin/dashboard" &&
              pathname.startsWith(item.href));
          const showBadge = item.href === "/admin/requests" && pendingRequests > 0;
          return (
            <Link
              key={item.href}
              id={`nav-${item.label.toLowerCase()}-btn`}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                active
                  ? "bg-[#B4833E]/15 text-[#D4AF37] border border-[#B4833E]/30"
                  : "text-[var(--muted)] hover:text-white hover:bg-[var(--surface-2)]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
              {showBadge && (
                <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-[#B4833E] text-black text-[10px] font-bold">
                  {pendingRequests > 9 ? "9+" : pendingRequests}
                </span>
              )}
              {active && !showBadge && (
                <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--border)] space-y-1">
        <a
          id="view-catalogue-btn"
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[var(--muted)] hover:text-white hover:bg-[var(--surface-2)] transition"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          View Catalogue
        </a>
        <button
          id="logout-btn"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex fixed inset-y-0 left-0 z-30">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="absolute left-0 top-0 h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border)] h-14 flex items-center px-4 gap-4">
          <button
            id="open-sidebar-btn"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 text-[var(--muted)] hover:text-white rounded-lg hover:bg-[var(--surface-2)] transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-white capitalize">
              {NAV_ITEMS.find(
                (n) =>
                  pathname === n.href || pathname.startsWith(n.href + "/")
              )?.label || "Admin"}
            </h1>
          </div>
          <a
            id="header-catalogue-btn"
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#B4833E] hover:text-[#D4AF37] transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Live Catalogue</span>
          </a>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
