"use client";

import React, { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";

interface ItemRequest {
  _id: string;
  productName: string;
  productSku?: string;
  visitorName: string;
  visitorPhone: string;
  quantity: number;
  description?: string;
  status: "pending" | "contacted" | "fulfilled" | "cancelled";
  createdAt: string;
}

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "text-amber-400 bg-amber-500/10 border-amber-500/25",
    dot: "bg-amber-400",
    icon: Clock,
  },
  contacted: {
    label: "Contacted",
    color: "text-blue-400 bg-blue-500/10 border-blue-500/25",
    dot: "bg-blue-400",
    icon: Phone,
  },
  fulfilled: {
    label: "Fulfilled",
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/25",
    dot: "bg-emerald-400",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-400 bg-red-500/10 border-red-500/25",
    dot: "bg-red-400",
    icon: XCircle,
  },
};

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/requests?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests || []);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load requests", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: newStatus as ItemRequest["status"] } : r))
        );
        showToast(`Marked as ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label}`);
      } else {
        showToast("Failed to update status", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm("Delete this request? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/requests/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r._id !== id));
        showToast("Request deleted");
      } else {
        showToast("Failed to delete", "error");
      }
    } catch {
      showToast("Network error", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.visitorName.toLowerCase().includes(q) ||
      r.visitorPhone.includes(q) ||
      r.productName.toLowerCase().includes(q) ||
      (r.description || "").toLowerCase().includes(q)
    );
  });

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    contacted: requests.filter((r) => r.status === "contacted").length,
    fulfilled: requests.filter((r) => r.status === "fulfilled").length,
    cancelled: requests.filter((r) => r.status === "cancelled").length,
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

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl text-sm font-semibold animate-in slide-in-from-bottom-4 duration-300 ${
            toastType === "success"
              ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-300"
              : "bg-red-950/90 border-red-500/40 text-red-300"
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

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <InboxIcon className="w-6 h-6 text-[#B4833E]" />
            Customer Requests
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            Product enquiries submitted by visitors from the store catalogue
          </p>
        </div>
        <button
          onClick={fetchRequests}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--muted)] hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["pending", "contacted", "fulfilled", "cancelled"] as const).map((s) => {
          const cfg = STATUS_CONFIG[s];
          const Icon = cfg.icon;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              className={`p-4 rounded-2xl border text-left transition ${
                statusFilter === s
                  ? "border-[#B4833E]/60 bg-[#B4833E]/10"
                  : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--muted)]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{cfg.label}</span>
                <Icon className="w-4 h-4 text-[var(--muted)]" />
              </div>
              <p className="text-2xl font-bold text-white">{counts[s]}</p>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, phone, or product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-white placeholder-[#777] focus:outline-none focus:border-[#B4833E] transition"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["all", "pending", "contacted", "fulfilled", "cancelled"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${
                  statusFilter === s
                    ? "bg-[#B4833E] text-black"
                    : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-white border border-[var(--border)]"
                }`}
              >
                {s === "all" ? `All (${counts.all})` : `${STATUS_CONFIG[s].label} (${counts[s]})`}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-[var(--muted)] border-t border-[var(--border)]/40 pt-2">
          Showing <strong className="text-white">{filteredRequests.length}</strong> requests
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#B4833E]" />
          <span className="text-sm text-[var(--muted)]">Loading requests...</span>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="py-20 text-center bg-[var(--card)] border border-[var(--border)] rounded-3xl space-y-3">
          <InboxIcon className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-white">No Requests Found</h3>
          <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
            {search
              ? `No requests matched "${search}".`
              : statusFilter !== "all"
              ? `No ${STATUS_CONFIG[statusFilter as keyof typeof STATUS_CONFIG]?.label} requests at the moment.`
              : "No customer requests yet. When visitors submit requests from the store, they'll appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const cfg = STATUS_CONFIG[req.status];
            const StatusIcon = cfg.icon;
            const isUpdating = updatingId === req._id;
            const isDeleting = deletingId === req._id;

            return (
              <div
                key={req._id}
                className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 hover:border-[var(--muted)]/40 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  {/* Main Info */}
                  <div className="flex-1 space-y-3 min-w-0">
                    {/* Top row: Product + status badge */}
                    <div className="flex items-start gap-3 flex-wrap justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-serif font-bold text-white text-base truncate">{req.productName}</h3>
                          {req.productSku && (
                            <span className="flex items-center gap-1 font-mono text-[11px] text-[var(--muted)] bg-[var(--surface-2)] px-2 py-0.5 rounded border border-[var(--border)]">
                              <Hash className="w-3 h-3" />
                              {req.productSku}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[var(--muted)] mt-0.5 block flex items-center gap-1">
                          <Clock className="w-3 h-3 inline" />
                          {" "}{formatDate(req.createdAt)}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${cfg.color}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Visitor Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                        <User className="w-4 h-4 text-[#B4833E] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">Customer</p>
                          <p className="text-sm font-bold text-white truncate">{req.visitorName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                        <Phone className="w-4 h-4 text-[#B4833E] shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">Phone</p>
                          <p className="text-sm font-bold text-white font-mono">{req.visitorPhone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                        <Package className="w-4 h-4 text-[#B4833E] shrink-0" />
                        <div>
                          <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-semibold">Quantity</p>
                          <p className="text-sm font-bold text-white">{req.quantity} {req.quantity === 1 ? "piece" : "pieces"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    {req.description && (
                      <div className="p-3 rounded-xl bg-[var(--surface-2)]/60 border border-[var(--border)] text-xs text-[#ccc] leading-relaxed">
                        <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">Note from Customer</span>
                        {req.description}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 flex-wrap sm:min-w-[160px]">
                    {/* WhatsApp quick contact */}
                    <a
                      href={`https://wa.me/${req.visitorPhone.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Hello ${req.visitorName}, regarding your request for ${req.productName} (Qty: ${req.quantity}). We'd like to follow up with you.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#25D366]/15 text-[#25D366] border border-[#25D366]/30 hover:bg-[#25D366]/25 transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>

                    {/* Status change */}
                    <div className="relative flex-1 sm:flex-none">
                      <select
                        value={req.status}
                        onChange={(e) => updateStatus(req._id, e.target.value)}
                        disabled={isUpdating}
                        className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-semibold bg-[var(--surface-2)] border border-[var(--border)] text-white focus:outline-none focus:border-[#B4833E] transition cursor-pointer disabled:opacity-60"
                      >
                        <option value="pending">Mark Pending</option>
                        <option value="contacted">Mark Contacted</option>
                        <option value="fulfilled">Mark Fulfilled</option>
                        <option value="cancelled">Mark Cancelled</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)] pointer-events-none" />
                      {isUpdating && (
                        <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#B4833E] animate-spin" />
                      )}
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => deleteRequest(req._id)}
                      disabled={isDeleting}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 border border-red-500/20 hover:bg-red-500/10 transition disabled:opacity-50"
                      title="Delete this request"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
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
