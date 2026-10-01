"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  Phone,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Timer,
  TrendingUp,
  Calendar,
  Hash,
  Loader2,
  AlertCircle,
  Inbox,
  IndianRupee,
  MessageCircle,
  ExternalLink,
} from "lucide-react";

interface CustomerEntry {
  _id: string;
  orderId?: string;
  productName: string;
  productSku?: string;
  productImage?: string;
  price?: number;
  totalPrice?: number;
  quantity: number;
  description?: string;
  status: string;
  createdAt: string;
  type: "order" | "request";
}

interface Customer {
  phone: string;
  name: string;
  totalItems: number;
  totalOrders: number;
  totalSpent: number;
  firstOrderAt: string;
  lastOrderAt: string;
  statusBreakdown: Record<string, number>;
  entries: CustomerEntry[];
}

interface OrderGroup {
  orderKey: string;
  orderId?: string;
  createdAt: string;
  entries: CustomerEntry[];
  totalQuantity: number;
  totalCost: number;
  statuses: string[];
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; dot: string; icon: React.ElementType }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30",
    dot: "bg-amber-500",
    icon: Clock,
  },
  contacted: {
    label: "Contacted",
    color: "text-blue-700 dark:text-blue-300 bg-blue-500/10 border-blue-500/30",
    dot: "bg-blue-500",
    icon: Phone,
  },
  "in-progress": {
    label: "In Progress",
    color: "text-purple-700 dark:text-purple-300 bg-purple-500/10 border-purple-500/30",
    dot: "bg-purple-500",
    icon: Timer,
  },
  fulfilled: {
    label: "Fulfilled",
    color: "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30",
    dot: "bg-emerald-500",
    icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/30",
    dot: "bg-rose-500",
    icon: XCircle,
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    color: "text-gray-600 bg-gray-500/10 border-gray-500/30",
    dot: "bg-gray-400",
    icon: Clock,
  };
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return dateStr; }
}

function formatDateTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return dateStr; }
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function getAvatarColor(phone: string) {
  const colors = [
    "from-[#B81862] to-[#d43d8a]",
    "from-violet-500 to-purple-600",
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-pink-600",
    "from-cyan-500 to-blue-500",
  ];
  let hash = 0;
  for (const ch of phone) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(hash) % colors.length];
}

function groupCustomerOrders(entries: CustomerEntry[]): OrderGroup[] {
  const groupMap = new Map<string, OrderGroup>();

  for (const entry of entries) {
    const rawOid = entry.orderId ? entry.orderId.trim() : "";
    const key = rawOid ? `ORDER_${rawOid}` : `REQ_${entry._id}`;
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        orderKey: key,
        orderId: rawOid || undefined,
        createdAt: entry.createdAt,
        entries: [],
        totalQuantity: 0,
        totalCost: 0,
        statuses: [],
      });
    }

    const group = groupMap.get(key)!;
    group.entries.push(entry);
    group.totalQuantity += entry.quantity || 1;
    const itemCost = entry.totalPrice ?? (entry.price ? entry.price * (entry.quantity || 1) : 0);
    group.totalCost += itemCost;
    if (!group.statuses.includes(entry.status)) {
      group.statuses.push(entry.status);
    }
    if (new Date(entry.createdAt) > new Date(group.createdAt)) {
      group.createdAt = entry.createdAt;
    }
  }

  return Array.from(groupMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

function OrderGroupItemRow({ entry }: { entry: CustomerEntry }) {
  const [imgError, setImgError] = useState(false);
  const unitPrice = entry.price || 0;
  const totalPrice = entry.totalPrice || (unitPrice * (entry.quantity || 1));

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[#B81862]/30 transition-all">
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--surface-2)] shrink-0 border border-[var(--border)]">
        {entry.productImage && !imgError ? (
          <img
            src={entry.productImage}
            alt={entry.productName}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-5 h-5 text-[var(--muted)]" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)] truncate max-w-[240px]">
              {entry.productName}
            </p>
            {entry.productSku && (
              <p className="text-xs text-[var(--muted)] mt-0.5 font-mono">Product ID: {entry.productSku}</p>
            )}
          </div>
          <StatusBadge status={entry.status} />
        </div>

        <div className="flex items-center justify-between gap-2 mt-2 flex-wrap text-xs">
          <div className="flex items-center gap-3 text-[var(--muted)]">
            <span className="flex items-center gap-1 font-medium bg-[var(--surface-2)] px-2 py-0.5 rounded-md text-[var(--foreground)]">
              <Hash className="w-3 h-3" />
              Qty: {entry.quantity}
            </span>
            {unitPrice > 0 && (
              <span>
                ₹{unitPrice.toLocaleString("en-IN")} each
              </span>
            )}
          </div>

          {totalPrice > 0 && (
            <span className="font-bold text-[var(--foreground)]">
              ₹{totalPrice.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        {entry.description && (
          <p className="text-xs text-[var(--muted)] mt-1.5 italic bg-[var(--surface-2)]/50 p-1.5 rounded-lg border border-[var(--border)]/50">
            &ldquo;{entry.description}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}

function OrderGroupCard({ group }: { group: OrderGroup }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/30 overflow-hidden">
      {/* Order Header */}
      <div
        onClick={() => setIsOpen((v) => !v)}
        className="p-3.5 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between gap-3 flex-wrap cursor-pointer hover:bg-[var(--surface-2)]/40 transition"
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          {group.orderId ? (
            <span className="flex items-center gap-1.5 font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#B81862]/10 text-[#B81862] border border-[#B81862]/20">
              <ShoppingBag className="w-3.5 h-3.5" />
              Order ID: #{group.orderId}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20">
              <Inbox className="w-3.5 h-3.5" />
              Direct Enquiry
            </span>
          )}

          <span className="flex items-center gap-1 text-xs text-[var(--muted)]">
            <Calendar className="w-3.5 h-3.5" />
            {formatDateTime(group.createdAt)}
          </span>

          <span className="text-xs text-[var(--muted)] bg-[var(--surface-2)] px-2 py-0.5 rounded-md">
            {group.entries.length} {group.entries.length === 1 ? "product" : "products"} ({group.totalQuantity} pcs)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {group.totalCost > 0 && (
            <span className="text-sm font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-lg">
              ₹{group.totalCost.toLocaleString("en-IN")}
            </span>
          )}

          <div className="flex items-center gap-1">
            {group.statuses.map((st) => (
              <StatusBadge key={st} status={st} />
            ))}
          </div>

          <button
            type="button"
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition ml-1"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Items in this Order */}
      {isOpen && (
        <div className="p-3 space-y-2">
          {group.entries.map((entry) => (
            <OrderGroupItemRow key={entry._id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

function WhatsAppRequestRow({
  entry,
  customerName,
  customerPhone,
}: {
  entry: CustomerEntry;
  customerName: string;
  customerPhone: string;
}) {
  const [imgError, setImgError] = useState(false);
  const cleanPhone = customerPhone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;

  const messageText = `Hello ${customerName},\nThank you for your enquiry on *${entry.productName}*${entry.productSku ? ` (Product ID: ${entry.productSku})` : ""}.\n\nYou requested *${entry.quantity} piece${entry.quantity > 1 ? "s" : ""}*.\n${entry.description ? `\nYour note: _${entry.description}_\n` : ""}\nWe would love to assist you further.`;
  const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(messageText)}`;

  const unitPrice = entry.price || 0;
  const totalPrice = entry.totalPrice || (unitPrice * (entry.quantity || 1));

  return (
    <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-emerald-500/30 transition-all space-y-3">
      <div className="flex items-start gap-3.5">
        {/* Thumbnail */}
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--surface-2)] shrink-0 border border-[var(--border)]">
          {entry.productImage && !imgError ? (
            <img
              src={entry.productImage}
              alt={entry.productName}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-6 h-6 text-[var(--muted)]" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="text-sm font-bold text-[var(--foreground)] truncate max-w-[260px]">
                {entry.productName}
              </p>
              {entry.productSku && (
                <p className="text-xs text-[var(--muted)] mt-0.5 font-mono">Product ID: {entry.productSku}</p>
              )}
            </div>
            <StatusBadge status={entry.status} />
          </div>

          <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1 font-semibold bg-[var(--surface-2)] px-2 py-0.5 rounded-md text-[var(--foreground)]">
              <Hash className="w-3 h-3" />
              Qty: {entry.quantity}
            </span>
            {entry.orderId && (
              <span className="flex items-center gap-1 font-mono bg-[#B81862]/10 text-[#B81862] px-2 py-0.5 rounded-md font-bold">
                <ShoppingBag className="w-3 h-3" />
                Order ID: #{entry.orderId}
              </span>
            )}
            {totalPrice > 0 && (
              <span className="font-bold text-emerald-600">
                ₹{totalPrice.toLocaleString("en-IN")}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDateTime(entry.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Description / Message */}
      {entry.description && (
        <div className="bg-[var(--surface-2)]/60 rounded-lg p-2.5 border border-[var(--border)] text-xs text-[var(--foreground)]">
          <p className="text-[10px] text-[var(--muted)] font-semibold uppercase tracking-wider mb-1">Customer Note:</p>
          <p className="italic">&ldquo;{entry.description}&rdquo;</p>
        </div>
      )}

      {/* Action Row */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border)]/60 flex-wrap">
        <span className="text-[11px] text-[var(--muted)]">
          Enquiry ID: <span className="font-mono text-[var(--foreground)]">{entry._id.slice(-6).toUpperCase()}</span>
        </span>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-sm"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Reply on WhatsApp
          <ExternalLink className="w-3 h-3 opacity-70" />
        </a>
      </div>
    </div>
  );
}

function CustomerCard({ customer }: { customer: Customer }) {
  const [expanded, setExpanded] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<"orders" | "requests">("orders");

  const totalStatuses = Object.values(customer.statusBreakdown).reduce((a, b) => a + b, 0);
  const fulfilled = customer.statusBreakdown["fulfilled"] || 0;
  const pending = customer.statusBreakdown["pending"] || 0;
  const cancelled = customer.statusBreakdown["cancelled"] || 0;
  const inProgress = customer.statusBreakdown["in-progress"] || 0;
  const contacted = customer.statusBreakdown["contacted"] || 0;

  const orderEntries = useMemo(() => customer.entries.filter((e) => e.type === "order"), [customer.entries]);
  const requestEntries = useMemo(() => customer.entries.filter((e) => e.type === "request"), [customer.entries]);
  const orderGroups = useMemo(() => groupCustomerOrders(orderEntries), [orderEntries]);
  const totalOrdersCount = customer.totalOrders || orderGroups.length;
  const totalRequestsCount = requestEntries.length;
  const totalSpentAmount = customer.totalSpent || orderGroups.reduce((s, g) => s + g.totalCost, 0);

  const avatarGradient = getAvatarColor(customer.phone);
  const initials = getInitials(customer.name);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-all hover:border-[#B81862]/40 hover:shadow-lg hover:shadow-[#B81862]/5">
      {/* Header Row */}
      <button
        id={`customer-card-${customer.phone.replace(/\D/g, "")}`}
        className="w-full text-left p-5 flex items-center gap-4 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center shrink-0 shadow-md`}>
          <span className="text-sm font-bold text-white">{initials}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-[var(--foreground)] text-base">{customer.name}</p>
            {fulfilled > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Regular
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1 font-medium">
              <Phone className="w-3 h-3" />
              {customer.phone}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Last: {formatDate(customer.lastOrderAt)}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="hidden sm:flex items-center gap-5 shrink-0">
          <div className="text-center">
            <p className="text-lg font-bold text-[var(--foreground)]">{totalOrdersCount}</p>
            <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wide">Orders</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-blue-600">{totalRequestsCount}</p>
            <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wide">Requests</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-emerald-600">
              ₹{totalSpentAmount.toLocaleString("en-IN")}
            </p>
            <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wide">Total Spent</p>
          </div>
          {fulfilled > 0 && (
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600">{fulfilled}</p>
              <p className="text-[10px] text-[var(--muted)] font-medium uppercase tracking-wide">Fulfilled</p>
            </div>
          )}
        </div>

        <div className="shrink-0 ml-2 text-[var(--muted)]">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Mobile Quick Stats */}
      <div className="sm:hidden px-5 pb-4 flex items-center justify-between text-xs border-t border-[var(--border)] pt-3 gap-2 flex-wrap">
        <span className="flex items-center gap-1 text-[var(--muted)]">
          <ShoppingBag className="w-3.5 h-3.5 text-[#B81862]" />
          <span className="font-semibold text-[var(--foreground)]">{totalOrdersCount}</span> Orders
        </span>
        <span className="flex items-center gap-1 text-[var(--muted)]">
          <MessageCircle className="w-3.5 h-3.5 text-blue-500" />
          <span className="font-semibold text-[var(--foreground)]">{totalRequestsCount}</span> Requests
        </span>
        <span className="font-bold text-emerald-600">
          ₹{totalSpentAmount.toLocaleString("en-IN")} Spent
        </span>
      </div>

      {/* Expanded Panel */}
      {expanded && (
        <div className="border-t border-[var(--border)] bg-[var(--surface-2)]/40">
          {/* Analytics Grid */}
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { label: "Orders Placed", value: totalOrdersCount, cls: "text-[var(--foreground)]" },
              { label: "WhatsApp Requests", value: totalRequestsCount, cls: "text-blue-600 font-extrabold" },
              { label: "Total Spent", value: `₹${totalSpentAmount.toLocaleString("en-IN")}`, cls: "text-emerald-600 font-extrabold" },
              { label: "Fulfilled Items", value: fulfilled, cls: "text-emerald-600" },
              { label: "Pending Items", value: pending, cls: "text-amber-600" },
            ].map(({ label, value, cls }) => (
              <div key={label} className="bg-[var(--surface)] rounded-xl p-3.5 border border-[var(--border)] text-center">
                <p className="text-xs text-[var(--muted)] font-medium mb-1">{label}</p>
                <p className={`text-xl sm:text-2xl font-bold ${cls}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Status Bar */}
          {totalStatuses > 0 && (
            <div className="px-5 pb-4">
              <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider mb-2">Status Breakdown</p>
              <div className="flex rounded-full overflow-hidden h-2.5 bg-[var(--surface-2)] gap-px">
                {fulfilled > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${(fulfilled / totalStatuses) * 100}%` }} />}
                {inProgress > 0 && <div className="bg-purple-500 h-full" style={{ width: `${(inProgress / totalStatuses) * 100}%` }} />}
                {contacted > 0 && <div className="bg-blue-500 h-full" style={{ width: `${(contacted / totalStatuses) * 100}%` }} />}
                {pending > 0 && <div className="bg-amber-500 h-full" style={{ width: `${(pending / totalStatuses) * 100}%` }} />}
                {cancelled > 0 && <div className="bg-rose-500 h-full" style={{ width: `${(cancelled / totalStatuses) * 100}%` }} />}
              </div>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                  const count = customer.statusBreakdown[key] || 0;
                  if (count === 0) return null;
                  return (
                    <span key={key} className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                      {cfg.label}: <span className="font-semibold text-[var(--foreground)] ml-0.5">{count}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="px-5 pb-4 flex items-center gap-4 flex-wrap text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              First: <span className="font-semibold text-[var(--foreground)] ml-1">{formatDate(customer.firstOrderAt)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Latest: <span className="font-semibold text-[var(--foreground)] ml-1">{formatDate(customer.lastOrderAt)}</span>
            </span>
          </div>

          {/* Sub-Tab Switcher: Orders vs WhatsApp Requests */}
          <div className="px-5 pb-3">
            <div className="flex items-center gap-2 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] w-fit">
              <button
                type="button"
                onClick={() => setActiveSubTab("orders")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSubTab === "orders"
                    ? "bg-[#B81862] text-white shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Orders ({orderGroups.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab("requests")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeSubTab === "requests"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-2)]"
                }`}
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp Requests ({totalRequestsCount})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="px-5 pb-5">
            {activeSubTab === "orders" ? (
              <div>
                {orderGroups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 rounded-xl border border-dashed border-[var(--border)]">
                    <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center">
                      <Inbox className="w-5 h-5 text-[var(--muted)]" />
                    </div>
                    <p className="text-sm text-[var(--muted)]">No orders from this customer yet</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {orderGroups.map((group) => (
                      <OrderGroupCard key={group.orderKey} group={group} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {requestEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3 rounded-xl border border-dashed border-[var(--border)]">
                    <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-[var(--muted)]" />
                    </div>
                    <p className="text-sm text-[var(--muted)]">No WhatsApp requests from this customer</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {requestEntries.map((entry) => (
                      <WhatsAppRequestRow
                        key={entry._id}
                        entry={entry}
                        customerName={customer.name}
                        customerPhone={customer.phone}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "orders" | "requests" | "spent" | "items">("latest");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/customers", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
      } else {
        setError(data.error || "Failed to load customers");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = customers
    .filter((c) => {
      const q = search.toLowerCase();
      return (
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.entries.some(
          (e) =>
            e.productName.toLowerCase().includes(q) ||
            (e.orderId && e.orderId.toLowerCase().includes(q)) ||
            (e.productSku && e.productSku.toLowerCase().includes(q))
        )
      );
    })
    .sort((a, b) => {
      if (sortBy === "orders") return (b.totalOrders || b.entries.length) - (a.totalOrders || a.entries.length);
      if (sortBy === "requests") return b.entries.length - a.entries.length;
      if (sortBy === "spent") return (b.totalSpent || 0) - (a.totalSpent || 0);
      if (sortBy === "items") return b.totalItems - a.totalItems;
      return new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime();
    });

  const totalOrdersCount = customers.reduce((s, c) => s + (c.totalOrders || 0), 0);
  const totalRequestsCount = customers.reduce((s, c) => s + c.entries.length, 0);
  const totalRevenue = customers.reduce((s, c) => s + (c.totalSpent || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--foreground)] flex items-center gap-2.5">
            <Users className="w-7 h-7 text-[#B81862]" />
            Customers
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Customer management with grouped orders, WhatsApp requests, counts, and spending analytics
          </p>
        </div>
        <button
          id="refresh-customers-btn"
          onClick={fetchCustomers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--surface)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[#B81862]/40 transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      {!loading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Users, label: "Total Customers", value: customers.length, bg: "bg-[#B81862]/10", ic: "text-[#B81862]" },
            { icon: ShoppingBag, label: "Orders Placed", value: totalOrdersCount, bg: "bg-blue-500/10", ic: "text-blue-500" },
            { icon: MessageCircle, label: "WhatsApp Requests", value: totalRequestsCount, bg: "bg-emerald-500/10", ic: "text-emerald-500" },
            { icon: IndianRupee, label: "Total Revenue", value: `₹${totalRevenue.toLocaleString("en-IN")}`, bg: "bg-violet-500/10", ic: "text-violet-500" },
          ].map(({ icon: Icon, label, value, bg, ic }) => (
            <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${ic}`} />
                </div>
                <p className="text-sm text-[var(--muted)] font-medium">{label}</p>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-[var(--foreground)]">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search & Sort */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
          <input
            id="customer-search-input"
            type="text"
            placeholder="Search by name, phone, order ID, product…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[#B81862]/50 focus:ring-2 focus:ring-[#B81862]/10 transition"
          />
        </div>
        <select
          id="customer-sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--foreground)] focus:outline-none focus:border-[#B81862]/50 transition cursor-pointer"
        >
          <option value="latest">Sort: Latest First</option>
          <option value="orders">Sort: Most Orders</option>
          <option value="requests">Sort: Most Requests</option>
          <option value="spent">Sort: Highest Spent</option>
          <option value="items">Sort: Most Items</option>
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-8 h-8 text-[#B81862] animate-spin" />
          <p className="text-[var(--muted)] text-sm">Loading customers…</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 rounded-2xl border border-rose-500/20 bg-rose-500/5">
          <AlertCircle className="w-10 h-10 text-rose-500" />
          <p className="text-sm text-rose-600 font-medium">{error}</p>
          <button onClick={fetchCustomers} className="px-4 py-2 rounded-xl bg-rose-500 text-white text-sm font-semibold hover:bg-rose-600 transition">
            Retry
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filteredCustomers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-2xl border border-dashed border-[var(--border)]">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] flex items-center justify-center">
            <Users className="w-8 h-8 text-[var(--muted)]" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[var(--foreground)]">
              {search ? "No customers found" : "No customers yet"}
            </p>
            <p className="text-sm text-[var(--muted)] mt-1">
              {search ? "Try a different search term" : "Customers will appear here once orders are placed"}
            </p>
          </div>
        </div>
      )}

      {/* Customer List */}
      {!loading && !error && filteredCustomers.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider px-1">
            {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? "s" : ""}
            {search ? ` matching "${search}"` : ""}
          </p>
          {filteredCustomers.map((customer) => (
            <CustomerCard key={customer.phone} customer={customer} />
          ))}
        </div>
      )}
    </div>
  );
}
