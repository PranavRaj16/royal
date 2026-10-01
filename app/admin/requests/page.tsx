"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  InboxIcon,
  Phone,
  User,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  RefreshCw,
  ChevronDown,
  MessageCircle,
  Hash,
  Search,
  X,
  AlertCircle,
  ShoppingBag,
  Check,
  Timer,
} from "lucide-react";

interface ItemRequest {
  _id: string;
  productId?: string;
  productName: string;
  productSku?: string;
  productImage?: string;
  visitorName: string;
  visitorPhone: string;
  quantity: number;
  description?: string;
  status: "pending" | "contacted" | "in-progress" | "fulfilled" | "cancelled";
  orderId?: string;
  createdAt: string;
}

interface OrderGroup {
  groupKey: string;
  orderId?: string;
  visitorName: string;
  visitorPhone: string;
  description?: string;
  createdAt: string;
  status: "pending" | "contacted" | "in-progress" | "fulfilled" | "cancelled";
  items: ItemRequest[];
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    icon: Clock,
  },
  contacted: {
    label: "Contacted",
    color: "text-blue-700 dark:text-blue-300 bg-blue-500/10 border-blue-500/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
    icon: Phone,
  },
  "in-progress": {
    label: "In Progress",
    color: "text-purple-700 dark:text-purple-300 bg-purple-500/10 border-purple-500/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    dot: "bg-purple-500",
    icon: Timer,
  },
  fulfilled: {
    label: "Fulfilled",
    color: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/30",
    iconColor: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
    icon: XCircle,
  },
};

function StatusDropdown({
  currentStatus,
  onSelect,
  isUpdating,
}: {
  currentStatus: keyof typeof STATUS_CONFIG;
  onSelect: (status: string) => void;
  isUpdating: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const activeCfg = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending;
  const ActiveIcon = activeCfg.icon;

  return (
    <div className={`relative w-full ${isOpen ? "z-40" : "z-10"}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !isUpdating && setIsOpen((prev) => !prev)}
        disabled={isUpdating}
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition shadow-xs cursor-pointer disabled:opacity-60 ${activeCfg.color} hover:brightness-95`}
      >
        <div className="flex items-center gap-2 truncate">
          <ActiveIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{activeCfg.label}</span>
        </div>
        {isUpdating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 opacity-70" />
        ) : (
          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 opacity-70 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-full min-w-[170px] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl z-50 p-1.5 space-y-0.5 animate-in fade-in-50 zoom-in-95 duration-150 backdrop-blur-md">
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Change Status
          </div>
          {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((statusKey) => {
            const cfg = STATUS_CONFIG[statusKey];
            const Icon = cfg.icon;
            const isCurrent = currentStatus === statusKey;
            return (
              <button
                key={statusKey}
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (!isCurrent) onSelect(statusKey);
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition text-left cursor-pointer ${
                  isCurrent
                    ? "bg-[var(--surface-2)] text-[var(--foreground)] font-semibold"
                    : "text-[var(--foreground)] hover:bg-[var(--surface-2)] font-medium"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${cfg.iconColor}`} />
                  <span className="truncate">{cfg.label}</span>
                </div>
                {isCurrent && <Check className="w-3.5 h-3.5 text-[#B81862] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function groupRequests(requests: ItemRequest[]): OrderGroup[] {
  const map = new Map<string, OrderGroup>();
  for (const req of requests) {
    const cleanOrderId =
      req.orderId || `DW-ORD-${req._id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()}`;
    const key = req.orderId || req._id;
    if (map.has(key)) {
      const group = map.get(key)!;
      group.items.push(req);
      if (new Date(req.createdAt) < new Date(group.createdAt)) group.createdAt = req.createdAt;
    } else {
      map.set(key, {
        groupKey: key,
        orderId: cleanOrderId,
        visitorName: req.visitorName,
        visitorPhone: req.visitorPhone,
        description: req.description,
        createdAt: req.createdAt,
        status: req.status,
        items: [req],
      });
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ── Custom Delete Confirmation Modal ─────────────────────────────────────────
function DeleteModal({
  group,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  group: OrderGroup;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-red-100 w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-200">
        {/* Icon */}
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-50 border border-red-100 mx-auto">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>

        {/* Title */}
        <div className="text-center space-y-1.5">
          <h3 className="text-lg font-bold text-gray-900">
            {group.items.length > 1 ? "Delete this Order?" : "Delete this Request?"}
          </h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            {group.items.length > 1
              ? `This will permanently delete all ${group.items.length} items in this order from ${group.visitorName}. This action cannot be undone.`
              : `This will permanently delete the request for "${group.items[0]?.productName}" from ${group.visitorName}. This action cannot be undone.`}
          </p>
        </div>

        {/* Items preview for multi-item orders */}
        {group.items.length > 1 && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 space-y-1.5">
            {group.items.map((item, idx) => (
              <div key={item._id} className="flex items-center gap-2 text-sm text-red-700">
                <span className="text-xs text-red-400 font-mono w-4 shrink-0">{idx + 1}.</span>
                <span className="flex-1 truncate font-medium">{item.productName}</span>
                <span className="text-xs text-red-500 shrink-0">x{item.quantity}</span>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                {group.items.length > 1 ? `Delete Order` : "Delete"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [deletingKey, setDeletingKey] = useState<string | null>(null);
  const [pendingDeleteGroup, setPendingDeleteGroup] = useState<OrderGroup | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const syncSidebarPendingCount = useCallback((reqList: ItemRequest[]) => {
    if (typeof window !== "undefined") {
      setTimeout(() => {
        const pendingGroups = groupRequests(reqList).filter((g) => g.status === "pending");
        window.dispatchEvent(
          new CustomEvent("rj:requests-updated", {
            detail: { pendingCount: pendingGroups.length },
          })
        );
      }, 0);
    }
  }, []);

  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/requests?source=orders&limit=200", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      if (data.success) {
        const list = data.requests || [];
        setRequests(list);
        syncSidebarPendingCount(list);
      } else if (!silent) {
        showToast("Failed to load orders", "error");
      }
    } catch (err) {
      console.error(err);
      if (!silent) showToast("Failed to load orders", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [syncSidebarPendingCount]);

  // Initial load + periodic silent polling every 10s + window focus
  useEffect(() => {
    fetchRequests(false);
    const interval = setInterval(() => {
      fetchRequests(true);
    }, 10000);
    const onFocus = () => fetchRequests(true);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchRequests]);

  const updateGroupStatus = async (group: OrderGroup, newStatus: string) => {
    setUpdatingKey(group.groupKey);
    try {
      const results = await Promise.all(
        group.items.map((item) =>
          fetch(`/api/admin/requests/${item._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus }),
          })
        )
      );
      const allOk = results.every((r) => r.ok);
      if (allOk) {
        const itemIds = new Set(group.items.map((i) => String(i._id)));
        setRequests((prev) => {
          const next = prev.map((r) =>
            (group.orderId && r.orderId === group.orderId) || itemIds.has(String(r._id))
              ? { ...r, status: newStatus as ItemRequest["status"] }
              : r
          );
          syncSidebarPendingCount(next);
          return next;
        });
        showToast(`Marked as ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label}`);
      } else {
        showToast("Failed to update some items", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setUpdatingKey(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDeleteGroup) return;
    const group = pendingDeleteGroup;
    setDeletingKey(group.groupKey);

    // 1. Optimistic removal from UI immediately
    const idsToRemove = new Set(group.items.map((i) => String(i._id)));
    setRequests((prev) => {
      const next = prev.filter((r) => {
        if (group.orderId && r.orderId && r.orderId === group.orderId) return false;
        return !idsToRemove.has(String(r._id));
      });
      syncSidebarPendingCount(next);
      return next;
    });

    // 2. Perform API delete
    try {
      const itemIds = group.items.map((i) => String(i._id)).filter(Boolean);
      const queryParams = new URLSearchParams();
      if (itemIds.length > 0) queryParams.set("ids", itemIds.join(","));
      if (group.orderId) queryParams.set("orderId", group.orderId);

      const res = await fetch(`/api/admin/requests?${queryParams.toString()}`, {
        method: "DELETE",
      });
      const isSuccess = res.ok;

      if (isSuccess) {
        showToast(group.items.length > 1 ? "Order deleted" : "Request deleted");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("rj:requests-updated"));
        }
      } else {
        showToast("Failed to delete from database", "error");
        // Re-fetch to restore state if delete failed
        fetchRequests(true);
      }
    } catch {
      showToast("Network error while deleting", "error");
      fetchRequests(true);
    } finally {
      setDeletingKey(null);
      setPendingDeleteGroup(null);
      // Silently sync with server to ensure state consistency
      fetchRequests(true);
    }
  };

  const groups = groupRequests(requests);
  const filteredGroups = groups.filter((g) => {
    if (statusFilter !== "all" && g.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (g.orderId && g.orderId.toLowerCase().includes(q)) ||
      g.visitorName.toLowerCase().includes(q) ||
      g.visitorPhone.includes(q) ||
      g.items.some((i) => i.productName.toLowerCase().includes(q) || (i.description || "").toLowerCase().includes(q) || (i.productSku || "").toLowerCase().includes(q))
    );
  });

  const counts = {
    all: groups.length,
    pending: groups.filter((g) => g.status === "pending").length,
    contacted: groups.filter((g) => g.status === "contacted").length,
    "in-progress": groups.filter((g) => g.status === "in-progress").length,
    fulfilled: groups.filter((g) => g.status === "fulfilled").length,
    cancelled: groups.filter((g) => g.status === "cancelled").length,
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const buildWhatsAppText = (group: OrderGroup) => {
    const itemList = group.items
      .map((i) => `- ${i.productName}${i.productSku ? ` (${i.productSku})` : ""} x${i.quantity}`)
      .join("\n");
    return `Hello ${group.visitorName},\nRegarding Order Reference: *${group.orderId}*\n\nItems:\n${itemList}\n\nWe would like to connect with you regarding your jewellery request.`;
  };

  return (
    <div className="space-y-6">
      {/* Custom Delete Modal */}
      {pendingDeleteGroup && (
        <DeleteModal
          group={pendingDeleteGroup}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteGroup(null)}
          isDeleting={deletingKey === pendingDeleteGroup.groupKey}
        />
      )}

      {/* Image Preview Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-md w-full bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-2xl p-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border)]">
              <div className="min-w-0 pr-3">
                <h3 className="font-bold text-sm text-[var(--foreground)] truncate">
                  {previewImage.name}
                </h3>
                <p className="text-[11px] text-[var(--muted)]">Product Image</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-xl bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-square w-full rounded-xl overflow-hidden bg-black/20 border border-[var(--border)] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl text-sm font-semibold animate-in slide-in-from-bottom-4 duration-300 ${toastType === "success" ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-red-50 border-red-300 text-red-700"}`}>
          {toastType === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--foreground)] tracking-tight flex items-center gap-2.5">
            <InboxIcon className="w-6 h-6 text-[#B81862]" />
            Orders
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">All customer orders — cart requests appear grouped as a single order</p>
        </div>
        <button onClick={() => fetchRequests(false)} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] transition disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["pending", "contacted", "in-progress", "fulfilled", "cancelled"] as const).map((s) => {
          const cfg = STATUS_CONFIG[s]; const Icon = cfg.icon;
          return (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "all" : s)} className={`p-4 rounded-2xl border text-left transition ${statusFilter === s ? "border-[#B81862]/60 bg-[#B81862]/10" : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--muted)]"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{cfg.label}</span>
                <Icon className="w-4 h-4 text-[var(--muted)]" />
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]">{counts[s]}</p>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
            <input type="text" placeholder="Search by name, phone, or product..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-9 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[#B81862] transition" />
            {search && <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] p-1"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["all", "pending", "contacted", "in-progress", "fulfilled", "cancelled"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${statusFilter === s ? "bg-[#B81862] text-white" : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"}`}>
                {s === "all" ? `All (${counts.all})` : `${STATUS_CONFIG[s].label} (${counts[s]})`}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-[var(--muted)] border-t border-[var(--border)]/40 pt-2">
          Showing <strong className="text-[var(--foreground)]">{filteredGroups.length}</strong> orders
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#B81862]" />
          <span className="text-sm text-[var(--muted)]">Loading orders...</span>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="py-20 text-center bg-[var(--card)] border border-[var(--border)] rounded-3xl space-y-3">
          <InboxIcon className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-[var(--foreground)]">No Orders Found</h3>
          <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
            {search ? `No orders matched "${search}".` : statusFilter !== "all" ? `No ${STATUS_CONFIG[statusFilter as keyof typeof STATUS_CONFIG]?.label} orders.` : "No orders yet. They appear here when customers submit enquiries from the catalogue."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group) => {
            const cfg = STATUS_CONFIG[group.status];
            const StatusIcon = cfg.icon;
            const isUpdating = updatingKey === group.groupKey;
            const isDeleting = deletingKey === group.groupKey;
            const isMultiItem = group.items.length > 1;
            return (
              <div key={group.groupKey} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl hover:border-[var(--muted)]/40 transition shadow-sm relative">
                {/* Order Header Bar */}
                <div className="px-5 py-3 sm:px-6 border-b border-[var(--border)]/60 flex flex-col sm:flex-row sm:items-center gap-3 justify-between bg-[var(--surface-2)]/40 rounded-t-2xl">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <ShoppingBag className="w-4 h-4 text-[#B81862] shrink-0" />
                    <span className="font-mono text-xs font-bold text-[var(--foreground)] bg-[var(--surface-2)] px-2.5 py-1 rounded-lg border border-[var(--border)] flex items-center gap-1.5 shadow-xs">
                      <span className="text-[#B81862] font-semibold">Order ID #</span>
                      <span>{group.orderId}</span>
                    </span>
                    {isMultiItem && <span className="text-[11px] font-bold text-[#B81862] bg-[#B81862]/10 border border-[#B81862]/20 px-2 py-0.5 rounded-full">{group.items.length} items</span>}
                    <span className="text-[11px] text-[var(--muted)] flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(group.createdAt)}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap self-start sm:self-auto ${cfg.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row">
                  {/* Left: Customer + Items */}
                  <div className="flex-1 p-5 sm:p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                        <User className="w-4 h-4 text-[#B81862] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">Customer</p>
                          <p className="text-sm font-bold text-[var(--foreground)] truncate">{group.visitorName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                        <Phone className="w-4 h-4 text-[#B81862] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">Phone</p>
                          <p className="text-sm font-bold text-[var(--foreground)] font-mono">{group.visitorPhone}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Package className="w-3 h-3" />
                        {isMultiItem ? `Items Ordered (${group.items.length})` : "Item Requested"}
                      </p>
                      <div className="space-y-2">
                        {group.items.map((item, idx) => (
                          <div
                            key={item._id}
                            className="flex items-center gap-3.5 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] group/item hover:border-[#B81862]/30 transition"
                          >
                            <span className="text-[11px] font-mono text-[var(--muted)] w-4 text-center shrink-0">
                              {idx + 1}.
                            </span>

                            {/* Product Image Thumbnail */}
                            <div
                              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)] shrink-0 shadow-xs relative flex items-center justify-center cursor-pointer group/thumb hover:ring-2 hover:ring-[#B81862]/40 transition"
                              onClick={() =>
                                item.productImage &&
                                setPreviewImage({ url: item.productImage, name: item.productName })
                              }
                              title={item.productImage ? "Click to preview photo" : item.productName}
                            >
                              {item.productImage ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={item.productImage}
                                  alt={item.productName}
                                  className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                                />
                              ) : (
                                <Package className="w-5 h-5 text-[var(--muted)]" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                                {item.productName}
                              </p>
                              {item.productSku && (
                                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-[var(--muted)] mt-0.5 bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                                  <Hash className="w-2.5 h-2.5" />
                                  Product ID: {item.productSku}
                                </span>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-[var(--foreground)]">x {item.quantity}</p>
                              <p className="text-[10px] text-[var(--muted)]">
                                {item.quantity === 1 ? "piece" : "pieces"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {group.description && (
                      <div className="p-3 rounded-xl bg-[var(--surface-2)]/60 border border-[var(--border)] text-xs text-[var(--foreground)] leading-relaxed">
                        <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">Note from Customer</span>
                        {group.description}
                      </div>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col sm:flex-col gap-2 p-4 sm:p-6 sm:border-l border-t sm:border-t-0 border-[var(--border)]/60 sm:min-w-[175px] justify-center bg-[var(--surface-2)]/20 sm:bg-transparent">
                    <a href={`https://wa.me/${group.visitorPhone.replace(/\D/g, "")}?text=${encodeURIComponent(buildWhatsAppText(group))}`} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-[#25D366]/10 text-[#1a9648] border border-[#25D366]/30 hover:bg-[#25D366]/20 transition">
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                    </a>

                    <StatusDropdown
                      currentStatus={group.status}
                      onSelect={(newStatus) => updateGroupStatus(group, newStatus)}
                      isUpdating={isUpdating}
                    />

                    <button
                      onClick={() => setPendingDeleteGroup(group)}
                      disabled={isDeleting}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition disabled:opacity-50 cursor-pointer"
                    >
                      {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}