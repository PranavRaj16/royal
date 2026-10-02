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
  MessageCircle,
  Settings,
  Users,
} from "lucide-react";
import { IBusiness } from "@/types";

const NAV_ITEMS = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/products", icon: Package, label: "Products" },
  { href: "/admin/requests", icon: Inbox, label: "Orders" },
  { href: "/admin/whatsapp-requests", icon: MessageCircle, label: "Requests" },
  { href: "/admin/customers", icon: Users, label: "Customers" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
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
  const [pendingOrders, setPendingOrders] = useState(0);
  const [pendingWhatsAppRequests, setPendingWhatsAppRequests] = useState(0);

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

  // Poll pending request count and reactively update on events/navigation
  useEffect(() => {
    if (isLoginPage) return;
    const fetchCount = () => {
      // Fetch pending orders (Orders tab)
      fetch("/api/admin/requests?source=orders&limit=1", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            const count = typeof d.pendingCount === "number" ? d.pendingCount : (d.total || 0);
            setPendingOrders(count);
          }
        })
        .catch(() => {});

      // Fetch pending WhatsApp enquiries (Requests tab)
      fetch("/api/admin/requests?source=whatsapp&limit=1", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) {
            const count = typeof d.pendingCount === "number" ? d.pendingCount : (d.total || 0);
            setPendingWhatsAppRequests(count);
          }
        })
        .catch(() => {});
    };

    fetchCount();
    const interval = setInterval(fetchCount, 5000);

    const onRequestsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<{ type?: "orders" | "whatsapp"; pendingCount?: number }>;
      if (typeof customEvent.detail?.pendingCount === "number") {
        if (customEvent.detail.type === "whatsapp") {
          setPendingWhatsAppRequests(customEvent.detail.pendingCount);
        } else {
          setPendingOrders(customEvent.detail.pendingCount);
        }
      } else {
        setTimeout(() => fetchCount(), 0);
      }
    };

    const onFocus = () => fetchCount();
    window.addEventListener("rj:requests-updated", onRequestsUpdated);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("rj:requests-updated", onRequestsUpdated);
      window.removeEventListener("focus", onFocus);
    };
  }, [isLoginPage, pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    router.push("/admin/login");
    router.refresh();
  };

  if (isLoginPage) return <>{children}</>;

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={`flex flex-col h-full bg-[var(--surface)] border-r border-[var(--border)] transition-colors ${
        mobile ? "w-72" : "w-64"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-2.5">
          <img
            src="/logo.png"
            alt="Dwara Collections"
            className="h-8 w-auto object-contain max-w-[120px]"
          />
          <span className="block text-[10px] text-[#B81862] font-semibold uppercase tracking-wider">
            Admin Studio
          </span>
        </Link>
        {mobile && (
          <button
            id="close-sidebar-btn"
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-2)] transition"
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
          const badgeCount =
            item.href === "/admin/requests"
              ? pendingOrders
              : item.href === "/admin/whatsapp-requests"
              ? pendingWhatsAppRequests
              : 0;
          const showBadge = badgeCount > 0;
          return (
            <Link
              key={item.href}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}-btn`}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                active
                  ? "bg-[#B81862]/15 text-[#B81862] dark:text-[#d43d8a] border border-[#B81862]/30"
                  : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
              {showBadge && (
                <span className="ml-auto flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#B81862] text-white text-[10px] font-bold">
                  {badgeCount > 9 ? "9+" : badgeCount}
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
      <div className="p-3 pb-8 border-t border-[var(--border)] space-y-1">
        <a
          id="view-catalogue-btn"
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)] transition"
        >
          <ExternalLink className="w-4 h-4 shrink-0" />
          View Catalogue
        </a>
        <button
          id="logout-btn"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-[var(--background)] text-[var(--foreground)] transition-colors">
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
        <header className="sticky top-0 z-20 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border)] h-14 flex items-center px-4 gap-4 transition-colors">
          <button
            id="open-sidebar-btn"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 text-[var(--muted)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--surface-2)] transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-[var(--foreground)] capitalize">
              {NAV_ITEMS.find(
                (n) =>
                  pathname === n.href || pathname.startsWith(n.href + "/")
              )?.label || "Admin"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              id="header-catalogue-btn"
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-[#B81862] dark:text-[#B81862] hover:text-[#B81862] dark:hover:text-[#d43d8a] transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Live Catalogue</span>
            </a>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
