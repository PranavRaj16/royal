"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  MessageCircle,
  Phone,
  User,
  Package,
  Clock,
  Search,
  RefreshCw,
  Loader2,
  X,
  Hash,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Timer,
  Trash2,
  MessageSquare,
  Sparkles,
  Check,
  Send,
  Eye,
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
  source?: string;
  isWhatsAppEnquiry?: boolean;
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

function formatDate(d: string) {
  try {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (hours < 1) {
      const mins = Math.max(1, Math.floor(diff / 60000));
      return `${mins}m ago`;
    }
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Recent";
  }
}

function buildReplyMessage(req: ItemRequest) {
  const cleanPhone = req.visitorPhone.replace(/\D/g, "");
  const note = req.description ? `\n\nRegarding your query:\n"${req.description}"` : "";
  const skuText = req.productSku ? ` (Product ID: ${req.productSku})` : "";
  return `Hello ${req.visitorName || "there"},\n\nThank you for contacting Dwara Collections regarding *${req.productName}*${skuText}.${note}\n\nWe would be delighted to assist you with complete details, customization, or private video viewing. Please let us know how you would like to proceed!`;
}

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
    <div className={`relative ${isOpen ? "z-40" : "z-10"}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!isUpdating) setIsOpen((prev) => !prev);
        }}
        disabled={isUpdating}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition shadow-xs cursor-pointer disabled:opacity-60 ${activeCfg.color} hover:brightness-95`}
      >
        <ActiveIcon className="w-3.5 h-3.5 shrink-0" />
        <span>{activeCfg.label}</span>
        {isUpdating ? (
          <Loader2 className="w-3 h-3 animate-spin shrink-0 opacity-70 ml-1" />
        ) : (
          <ChevronDown
            className={`w-3 h-3 shrink-0 transition-transform duration-200 opacity-70 ml-0.5 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1.5 w-44 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl z-50 p-1.5 space-y-0.5 animate-in fade-in-50 zoom-in-95 duration-150 backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
            Update Status
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
                  onSelect(statusKey);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  isCurrent
                    ? "bg-[#B81862]/15 text-[#B81862] dark:text-[#d43d8a] font-bold"
                    : "text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{cfg.label}</span>
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

export default function WhatsAppRequestsPage() {
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteReq, setPendingDeleteReq] = useState<ItemRequest | null>(null);
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
        const pendingCount = reqList.filter((r) => r.status === "pending").length;
        window.dispatchEvent(
          new CustomEvent("rj:requests-updated", {
            detail: { type: "whatsapp", pendingCount },
          })
        );
      }, 0);
    }
  }, []);

  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/requests?source=whatsapp&limit=500", {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json();
      if (data.success) {
        const list = data.requests || [];
        setRequests(list);
        syncSidebarPendingCount(list);
      } else if (!silent) {
        showToast("Failed to load WhatsApp requests", "error");
      }
    } catch {
      if (!silent) showToast("Failed to load WhatsApp requests", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [syncSidebarPendingCount]);

  useEffect(() => {
    fetchRequests(false);
    const interval = setInterval(() => fetchRequests(true), 12000);
    const onFocus = () => fetchRequests(true);
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchRequests]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests((prev) => {
          const next = prev.map((r) =>
            r._id === id ? { ...r, status: newStatus as ItemRequest["status"] } : r
          );
          syncSidebarPendingCount(next);
          return next;
        });
        showToast(`Status updated to ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label || newStatus}`);
      } else {
        showToast(data.error || "Failed to update status", "error");
      }
    } catch {
      showToast("Network error while updating status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteRequest = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok && data.success) {
        setRequests((prev) => {
          const next = prev.filter((r) => r._id !== id);
          syncSidebarPendingCount(next);
          return next;
        });
        showToast("Request deleted successfully");
      } else {
        showToast(data.error || "Failed to delete request", "error");
      }
    } catch {
      showToast("Network error while deleting request", "error");
    } finally {
      setDeletingId(null);
      setPendingDeleteReq(null);
    }
  };

  const filtered = requests.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.visitorName.toLowerCase().includes(q) ||
      r.visitorPhone.includes(q) ||
      r.productName.toLowerCase().includes(q) ||
      (r.productSku || "").toLowerCase().includes(q) ||
      (r.orderId || "").toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q)
    );
  });

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    contacted: requests.filter((r) => r.status === "contacted").length,
    "in-progress": requests.filter((r) => r.status === "in-progress").length,
    fulfilled: requests.filter((r) => r.status === "fulfilled").length,
    cancelled: requests.filter((r) => r.status === "cancelled").length,
  };

  const uniqueCustomers = new Set(requests.map((r) => r.visitorPhone.trim())).size;

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-2xl text-sm font-semibold animate-in slide-in-from-bottom-4 duration-300 backdrop-blur-md ${
            toastType === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
          }`}
        >
          {toastType === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {toastMsg}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-[var(--surface)] border border-[var(--border)] rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <h3 className="font-semibold text-sm text-[var(--foreground)] truncate pr-4">
                {previewImage.name}
              </h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-full hover:bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/20 max-h-[70vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-h-[60vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDeleteReq && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => !deletingId && setPendingDeleteReq(null)}
        >
          <div
            className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-serif text-lg font-bold text-[var(--foreground)]">
                Delete WhatsApp Request
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Are you sure you want to permanently delete this WhatsApp enquiry from{" "}
                <strong className="text-[var(--foreground)]">{pendingDeleteReq.visitorName}</strong>?
              </p>
            </div>

            <div className="p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-2xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[var(--muted)]">Product:</span>
                <span className="font-semibold text-[var(--foreground)] truncate max-w-[200px]">
                  {pendingDeleteReq.productName}
                </span>
              </div>
              {pendingDeleteReq.description && (
                <div className="pt-1 border-t border-[var(--border)] text-[var(--muted)] italic">
                  &ldquo;{pendingDeleteReq.description}&rdquo;
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingDeleteReq(null)}
                disabled={Boolean(deletingId)}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteRequest(pendingDeleteReq._id)}
                disabled={Boolean(deletingId)}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition flex items-center justify-center gap-2 disabled:opacity-60 shadow-md shadow-red-600/20"
              >
                {deletingId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Enquiry
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-[var(--foreground)] tracking-tight">
              Customer WhatsApp Requests
            </h1>
          </div>
          <p className="text-xs text-[var(--muted)] mt-1 ml-11">
            All customer inquiries, questions, and WhatsApp consult requests sent to admin
          </p>
        </div>

        <button
          onClick={() => fetchRequests(false)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--surface-2)] transition disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#B81862]" : ""}`} />
          Refresh Requests
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="col-span-2 sm:col-span-2 p-4 rounded-2xl border bg-gradient-to-br from-emerald-500/10 via-[var(--surface)] to-[var(--surface-2)] border-emerald-500/30 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-[var(--foreground)]">{requests.length}</p>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Total Enquiries
              </span>
            </div>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              From <strong className="text-[var(--foreground)]">{uniqueCustomers}</strong> unique customer{uniqueCustomers !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {(["pending", "contacted"] as const).map((s) => {
          const cfg = STATUS_CONFIG[s];
          const Icon = cfg.icon;
          const isActive = statusFilter === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer shadow-xs ${
                isActive
                  ? "border-[#B81862] bg-[#B81862]/10 ring-1 ring-[#B81862]"
                  : "bg-[var(--surface)] border-[var(--border)] hover:border-[var(--muted)]"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  {cfg.label}
                </span>
                <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]">{counts[s]}</p>
            </button>
          );
        })}
      </div>

      {/* Filter toolbar */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search by customer name, phone, product ID, note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[#B81862] transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["all", "pending", "contacted", "in-progress", "fulfilled", "cancelled"] as const).map(
              (s) => {
                const isActive = statusFilter === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition capitalize cursor-pointer ${
                      isActive
                        ? "bg-[#B81862] text-white shadow-sm shadow-[#B81862]/30"
                        : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"
                    }`}
                  >
                    {s === "all"
                      ? `All (${counts.all})`
                      : `${STATUS_CONFIG[s].label} (${counts[s]})`}
                  </button>
                );
              }
            )}
          </div>
        </div>

        <div className="text-[11px] text-[var(--muted)] border-t border-[var(--border)] pt-2.5 flex items-center justify-between">
          <span>
            Showing <strong className="text-[var(--foreground)]">{filtered.length}</strong> of{" "}
            <strong className="text-[var(--foreground)]">{requests.length}</strong> enquiries
          </span>
          {statusFilter !== "all" && (
            <button
              onClick={() => setStatusFilter("all")}
              className="text-[#B81862] hover:underline font-semibold cursor-pointer"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-3xl">
          <Loader2 className="w-8 h-8 animate-spin text-[#B81862]" />
          <span className="text-sm font-medium text-[var(--muted)]">Loading WhatsApp enquiries...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-[var(--surface)] border border-[var(--border)] rounded-3xl space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <MessageCircle className="w-7 h-7" />
          </div>
          <h3 className="font-serif text-lg font-bold text-[var(--foreground)]">
            No WhatsApp Requests Found
          </h3>
          <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
            {search
              ? `No requests matched your search query "${search}".`
              : "Whenever customers click 'Enquire on WhatsApp' on products, their queries will appear here."}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="px-4 py-2 rounded-xl bg-[var(--surface-2)] text-xs font-semibold text-[var(--foreground)] border border-[var(--border)] hover:bg-[var(--surface)] transition cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((req) => {
            const cleanPhone = req.visitorPhone.replace(/\D/g, "");
            const replyText = buildReplyMessage(req);
            const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(replyText)}`;
            const isUpdating = updatingId === req._id;

            return (
              <div
                key={req._id}
                className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-[#B81862]/40 transition shadow-xs space-y-4"
              >
                {/* Header: Customer info & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B81862]/20 to-emerald-500/20 border border-[var(--border)] flex items-center justify-center font-serif font-bold text-sm text-[var(--foreground)]">
                      {(req.visitorName || "C")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[var(--foreground)]">
                          {req.visitorName || "Customer"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <MessageCircle className="w-2.5 h-2.5" /> WhatsApp Request
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--muted)]">
                        <a
                          href={`tel:${req.visitorPhone}`}
                          className="font-mono hover:text-[var(--foreground)] flex items-center gap-1 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          {req.visitorPhone}
                        </a>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(req.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <StatusDropdown
                      currentStatus={req.status}
                      onSelect={(newSt) => handleUpdateStatus(req._id, newSt)}
                      isUpdating={isUpdating}
                    />
                  </div>
                </div>

                {/* Main Content: Product + Query Note */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  {/* Product card snippet */}
                  <div className="md:col-span-5 flex items-center gap-3 p-3 bg-[var(--surface-2)]/60 border border-[var(--border)] rounded-xl">
                    <div
                      className="relative w-16 h-16 rounded-xl overflow-hidden bg-[var(--surface)] border border-[var(--border)] shrink-0 cursor-pointer group"
                      onClick={() =>
                        req.productImage &&
                        setPreviewImage({ url: req.productImage, name: req.productName })
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={req.productImage || "/placeholder.jpg"}
                        alt={req.productName}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-xs text-[var(--foreground)] truncate">
                        {req.productName}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {req.productSku && (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-[#B81862] dark:text-[#d43d8a] bg-[#B81862]/10 px-1.5 py-0.5 rounded border border-[#B81862]/20 font-bold">
                            <Hash className="w-2.5 h-2.5" />
                            {req.productSku}
                          </span>
                        )}
                        <span className="text-[10px] text-[var(--muted)]">
                          Qty: <strong className="text-[var(--foreground)]">{req.quantity}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Customer Enquiry / Query Note */}
                  <div className="md:col-span-7 flex flex-col justify-between h-full space-y-2">
                    <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>Customer Query Note</span>
                      </div>
                      <p className="text-[var(--foreground)] leading-relaxed font-medium">
                        {req.description ? (
                          req.description
                        ) : (
                          <span className="text-[var(--muted)] italic">
                            Customer clicked direct WhatsApp enquiry for this piece.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--border)] flex-wrap">
                  <div className="flex items-center gap-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-sm cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5 fill-white" />
                      <span>Reply on WhatsApp</span>
                      <ExternalLink className="w-3 h-3 opacity-80 ml-0.5" />
                    </a>

                    <a
                      href={`tel:${cleanPhone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--surface-2)] text-[var(--foreground)] hover:bg-[var(--surface)] text-xs font-semibold border border-[var(--border)] transition cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPendingDeleteReq(req)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition cursor-pointer"
                    title="Delete enquiry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
