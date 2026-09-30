"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  ChevronRight,
} from "lucide-react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP || "919876543210";

interface ItemRequest {
  _id: string;
  productName: string;
  productSku?: string;
  visitorName: string;
  visitorPhone: string;
  quantity: number;
  description?: string;
  status: "pending" | "contacted" | "fulfilled" | "cancelled";
  orderId?: string;
  createdAt: string;
}

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "text-amber-700 bg-amber-50 border-amber-200", dot: "bg-amber-500", icon: Clock },
  contacted: { label: "Contacted", color: "text-blue-700 bg-blue-50 border-blue-200", dot: "bg-blue-500", icon: Phone },
  fulfilled: { label: "Fulfilled", color: "text-emerald-700 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-rose-700 bg-rose-50 border-rose-200", dot: "bg-rose-500", icon: XCircle },
};

function formatDate(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function buildWAMessage(req: ItemRequest) {
  return `Hello ${req.visitorName},\nThank you for your interest in *${req.productName}*${req.productSku ? ` (SKU: ${req.productSku})` : ""}.\n\nYou requested *${req.quantity} piece${req.quantity > 1 ? "s" : ""}*.\n${req.description ? `\nYour note: _${req.description}_\n` : ""}\nWe would love to assist you further. Please let us know how you would like to proceed.`;
}

export default function WhatsAppRequestsPage() {
  const [requests, setRequests] = useState<ItemRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const fetchRequests = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/requests?limit=500", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests || []);
      } else if (!silent) {
        showToast("Failed to load requests", "error");
      }
    } catch {
      if (!silent) showToast("Failed to load requests", "error");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests(false);
    const interval = setInterval(() => fetchRequests(true), 15000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const filtered = requests.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.visitorName.toLowerCase().includes(q) ||
      r.visitorPhone.includes(q) ||
      r.productName.toLowerCase().includes(q) ||
      (r.productSku || "").toLowerCase().includes(q) ||
      (r.orderId || "").toLowerCase().includes(q)
    );
  });

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    contacted: requests.filter((r) => r.status === "contacted").length,
    fulfilled: requests.filter((r) => r.status === "fulfilled").length,
    cancelled: requests.filter((r) => r.status === "cancelled").length,
  };

  // Group by unique customers for quick view
  const uniqueCustomers = new Set(requests.map((r) => r.visitorPhone)).size;

  return (
    <div className="space-y-6">
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
            <MessageCircle className="w-6 h-6 text-[#25D366]" />
            WhatsApp Requests
          </h1>
          <p className="text-xs text-[var(--muted)] mt-1">
            All individual product enquiries — click a request to open WhatsApp directly
          </p>
        </div>
        <button
          onClick={() => fetchRequests(false)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="col-span-2 sm:col-span-2 p-4 rounded-2xl border bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/5 border-[#25D366]/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center shrink-0 shadow-md">
            <MessageCircle className="w-6 h-6 fill-white text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[var(--foreground)]">{requests.length}</p>
            <p className="text-xs text-[var(--muted)] font-semibold">Total Enquiries from <span className="text-[var(--foreground)]">{uniqueCustomers}</span> customers</p>
          </div>
        </div>
        {(["pending", "contacted"] as const).map((s) => {
          const cfg = STATUS_CONFIG[s]; const Icon = cfg.icon;
          return (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              className={`p-4 rounded-2xl border text-left transition ${statusFilter === s ? "border-[#B81862]/60 bg-[#B81862]/10" : "bg-[var(--card)] border-[var(--border)] hover:border-[var(--muted)]"}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">{cfg.label}</span>
                <Icon className="w-4 h-4 text-[var(--muted)]" />
              </div>
              <p className="text-2xl font-bold text-[var(--foreground)]">{counts[s]}</p>
            </button>
          );
        })}
      </div>

      {/* Filter toolbar */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, phone, or product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[#B81862] transition"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["all", "pending", "contacted", "fulfilled", "cancelled"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition capitalize ${statusFilter === s ? "bg-[#B81862] text-white" : "bg-[var(--surface-2)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)]"}`}>
                {s === "all" ? `All (${counts.all})` : `${STATUS_CONFIG[s].label} (${counts[s]})`}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-[var(--muted)] border-t border-[var(--border)]/40 pt-2">
          Showing <strong className="text-[var(--foreground)]">{filtered.length}</strong> of <strong className="text-[var(--foreground)]">{requests.length}</strong> enquiries
        </div>
      </div>

      {/* Requests list */}
      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3">
          <Loader2 className="w-7 h-7 animate-spin text-[#B81862]" />
          <span className="text-sm text-[var(--muted)]">Loading enquiries...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-[var(--card)] border border-[var(--border)] rounded-3xl space-y-3">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto" />
          <h3 className="font-serif text-lg font-bold text-[var(--foreground)]">No Enquiries Found</h3>
          <p className="text-xs text-[var(--muted)] max-w-sm mx-auto">
            {search ? `No requests matched "${search}".` : "No customer enquiries yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const cfg = STATUS_CONFIG[req.status];
            const StatusIcon = cfg.icon;
            const cleanPhone = req.visitorPhone.replace(/\D/g, "");
            const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(buildWAMessage(req))}`;
            const isExpanded = expandedId === req._id;

            return (
              <div key={req._id} className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden hover:border-[var(--muted)]/40 transition shadow-sm">
                {/* Main row */}
                <div
                  className="flex items-center gap-3 px-4 py-3.5 cursor-pointer group"
                  onClick={() => setExpandedId(isExpanded ? null : req._id)}
                >
                  {/* Status icon */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${cfg.color}`}>
                    <StatusIcon className="w-4 h-4" />
                  </div>

                  {/* Customer + product */}
                  <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-1">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-[var(--muted)] shrink-0" />
                        <span className="font-bold text-sm text-[var(--foreground)] truncate">{req.visitorName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-[var(--muted)] shrink-0" />
                        <span className="text-[11px] text-[var(--muted)] font-mono">{req.visitorPhone}</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3 h-3 text-[var(--muted)] shrink-0" />
                        <span className="text-sm font-semibold text-[var(--foreground)] truncate">{req.productName}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {req.productSku && (
                          <span className="flex items-center gap-1 text-[10px] text-[var(--muted)] font-mono">
                            <Hash className="w-2.5 h-2.5" />{req.productSku}
                          </span>
                        )}
                        <span className="text-[10px] text-[var(--muted)]">Qty: <strong className="text-[var(--foreground)]">{req.quantity}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {cfg.label}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-[var(--muted)]">
                      <Clock className="w-2.5 h-2.5" />{formatDate(req.createdAt)}
                    </span>
                  </div>

                  <ChevronRight className={`w-4 h-4 text-[var(--muted)] shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-[var(--border)]/60 bg-[var(--surface-2)]/30 px-4 py-4 space-y-3">
                    {/* Meta row (mobile visible) */}
                    <div className="flex flex-wrap items-center gap-2 sm:hidden">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                      </span>
                      <span className="text-[10px] text-[var(--muted)] flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />{formatDate(req.createdAt)}
                      </span>
                    </div>

                    {/* Order ref */}
                    {req.orderId && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[var(--muted)] font-semibold">Order Ref:</span>
                        <span className="font-mono font-bold text-[#B81862] bg-[#B81862]/10 px-2 py-0.5 rounded-lg border border-[#B81862]/20">{req.orderId}</span>
                      </div>
                    )}

                    {/* Customer note */}
                    {req.description && (
                      <div className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-xs text-[var(--foreground)] leading-relaxed">
                        <span className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider block mb-1">Customer Note</span>
                        {req.description}
                      </div>
                    )}

                    {/* WhatsApp preview message */}
                    <div className="p-3 rounded-xl bg-[#25D366]/5 border border-[#25D366]/20 text-xs text-[var(--foreground)] leading-relaxed whitespace-pre-wrap font-mono">
                      <span className="text-[10px] font-bold text-[#1a9648] uppercase tracking-wider block mb-1 font-sans">WhatsApp Message Preview</span>
                      {buildWAMessage(req)}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-xs hover:bg-[#20ba59] transition shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white" />
                        Open WhatsApp Chat
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                      <a
                        href={`tel:${req.visitorPhone.replace(/\s/g, "")}`}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--foreground)] font-semibold text-xs hover:bg-[var(--surface)] transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call {req.visitorPhone}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
