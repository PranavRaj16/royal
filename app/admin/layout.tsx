"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";
import { IBusiness } from "@/types";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [business, setBusiness] = useState<IBusiness | null>(null);

  // If on login page, don't render admin shell
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
        if (data?.business) {
          setBusiness(data.business);
        }
      })
      .catch(() => {
        router.push("/admin/login");
      });
  }, [isLoginPage, router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    }
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <AdminSidebar
        businessName={business?.name || "Royal Jewellers"}
        businessSlug={business?.slug || "royal-jewellers"}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onLogout={handleLogout}
      />

      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        <AdminHeader
          businessName={business?.name || "Royal Jewellers"}
          businessSlug={business?.slug || "royal-jewellers"}
          catalogueStatus={business?.catalogueStatus || "published"}
          onMenuClick={() => setMobileOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
