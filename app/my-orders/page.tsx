"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  MessageCircle,
  ArrowLeft,
  User,
  LogOut,
  Loader2,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  ChevronRight,
  Hash,
  Calendar,
  Eye,
  X,
  Timer,
} from "lucide-react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP || "919581335925";

interface CustomerInfo {
  name: string;
  phone: string;
}

interface Order {
  _id: string;
  orderId?: string;
  productName: string;
  productSku?: string;
  quantity: number;
  description?: string;
  status: "pending" | "contacted" | "in-progress" | "fulfilled" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

const statusConfig: Record<
  Order["status"],
  { label: string; color: string; bg: string; border: string; iconName: string }
> = {
  pending: {
    label: "Pending Review",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconName: "clock",
  },
  contacted: {
    label: "Contacted",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconName: "phone",
  },
  "in-progress": {
    label: "In Progress",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    iconName: "timer",
  },
  fulfilled: {
    label: "Fulfilled",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconName: "check",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    iconName: "x",
  },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusIcon({ status }: { status: Order["status"] }) {
  switch (status) {
    case "pending":
      return <Clock className="w-3.5 h-3.5" />;
    case "contacted":
      return <Phone className="w-3.5 h-3.5" />;
    case "in-progress":
      return <Timer className="w-3.5 h-3.5" />;
    case "fulfilled":
      return <CheckCircle2 className="w-3.5 h-3.5" />;
    case "cancelled":
      return <XCircle className="w-3.5 h-3.5" />;
  }
}

function LoginForm({ onLogin }: { onLogin: (c: CustomerInfo) => void }) {
  const [form, setForm] = useState({ name: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("royal_visitor_info");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.name || parsed.phone) {
          setForm({
            name: parsed.name || "",
            phone: parsed.phone || "",
          });
        }
      }
    } catch {}
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("Please enter your name."); return; }
    if (!form.phone.trim() || !/^[0-9+\-\s()]{7,15}$/.test(form.phone.trim())) {
      setError("Please enter a valid phone number."); return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name.trim(), phone: form.phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Login failed.");
      onLogin(data.customer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8FB] flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#B81862]/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#d43d8a]/6 rounded-full blur-3xl" />
      </div>
      <div className="relative w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-[#7A5E6A] hover:text-[#B81862] transition mb-6 font-medium">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Store
        </Link>
        <div className="bg-white border border-[#F0D6E8] rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B81862] to-[#d43d8a] flex items-center justify-center mx-auto mb-4 shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-[#111111]">My Orders</h1>
            <p className="text-xs text-[#7A5E6A] mt-2 leading-relaxed">
              Enter the name &amp; phone number you used when placing requests to view your order history.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#443E36] mb-1.5">Your Name</label>
              <input type="text" id="customer-name" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Priya Sharma"
                className="w-full px-4 py-3 bg-[#FFF8FB] border border-[#F0D6E8] rounded-xl text-sm text-[#111111] placeholder-[#aaa] focus:outline-none focus:border-[#B81862] focus:ring-2 focus:ring-[#B81862]/10 transition" />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#443E36] mb-1.5">Phone / WhatsApp Number</label>
              <input type="tel" id="customer-phone" required value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-4 py-3 bg-[#FFF8FB] border border-[#F0D6E8] rounded-xl text-sm text-[#111111] placeholder-[#aaa] focus:outline-none focus:border-[#B81862] focus:ring-2 focus:ring-[#B81862]/10 transition font-mono" />
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />{error}
              </div>
            )}
            <button type="submit" disabled={loading} id="customer-login-btn"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#B81862] to-[#d43d8a] text-white font-bold text-sm shadow-md hover:opacity-95 transition disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer mt-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Signing In...</> : <><Eye className="w-4 h-4" />View My Orders</>}
            </button>
          </form>
          <p className="text-center text-[11px] text-[#aaa] mt-5">Your details are used only to look up your requests. No password needed.</p>
        </div>
      </div>
    </div>
  );
}

function OrderDetailModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const sc = statusConfig[order.status];
  const refId = order.orderId || order._id.slice(-8).toUpperCase();
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello Dwara Collections, I\u2019d like to follow up on my order reference: *${refId}* for *${order.productName}* (Qty: ${order.quantity}).`)}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white border border-[#F0D6E8] rounded-3xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#111111]">Order Details</h2>
            <p className="text-xs text-[#7A5E6A] mt-0.5">Reference: <span className="font-mono font-bold text-[#B81862]">{refId}</span></p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full text-[#666] hover:bg-black/5 transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${sc.bg} ${sc.color} ${sc.border} border`}>
            <StatusIcon status={order.status} />{sc.label}
          </div>
          <div className="p-4 bg-[#FFF8FB] rounded-2xl border border-[#F0D6E8] space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B81862]/10 to-[#d43d8a]/10 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-[#B81862]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-[#111111] leading-tight">{order.productName}</p>
                {order.productSku && <p className="text-[11px] text-[#7A5E6A] font-mono mt-0.5">Product ID: {order.productSku}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F0D6E8]">
              <div>
                <span className="text-[10px] text-[#7A5E6A] block">Quantity</span>
                <span className="font-bold text-sm text-[#111111]">{order.quantity} piece{order.quantity > 1 ? "s" : ""}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#7A5E6A] block">Requested On</span>
                <span className="font-medium text-xs text-[#111111]">{formatDate(order.createdAt)}</span>
              </div>
            </div>
          </div>
          {order.description && (
            <div className="p-3.5 bg-[#FFF8FB] rounded-xl border border-[#F0D6E8]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#7A5E6A] block mb-1">Your Note</span>
              <p className="text-xs text-[#443E36] leading-relaxed">{order.description}</p>
            </div>
          )}
          {order.status === "pending" && <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl"><p className="text-xs text-amber-800 leading-relaxed">🔔 Your request is being reviewed. Our concierge will contact you shortly.</p></div>}
          {order.status === "contacted" && <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl"><p className="text-xs text-blue-800 leading-relaxed">📞 Our team has reached out to you. Please check your phone / WhatsApp.</p></div>}
          {order.status === "in-progress" && <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl"><p className="text-xs text-purple-800 leading-relaxed">⏳ Your order is currently in progress and being prepared.</p></div>}
        </div>
        <div className="flex gap-2.5 mt-5">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex-1 py-3 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#20ba59] transition">
            <MessageCircle className="w-4 h-4 fill-white" />Follow Up on WhatsApp
          </a>
          <button onClick={onClose} className="px-4 py-3 rounded-xl bg-[#F0D6E8] text-[#B81862] font-bold text-xs hover:bg-[#e8c8da] transition">Close</button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ customer }: { customer: CustomerInfo }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | Order["status"]>("all");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/customer/orders");
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to load orders.");
      setOrders(data.orders);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/customer/logout", { method: "POST" });
    window.location.href = "/my-orders";
  };

  const filteredOrders = activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab);

  const statusCounts = {
    pending: orders.filter((o) => o.status === "pending").length,
    contacted: orders.filter((o) => o.status === "contacted").length,
    "in-progress": orders.filter((o) => o.status === "in-progress").length,
    fulfilled: orders.filter((o) => o.status === "fulfilled").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello Dwara Collections, I\u2019m ${customer.name} and I\u2019d like to enquire about my orders.`)}`;

  return (
    <div className="min-h-screen bg-[#FFF8FB]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#B81862]/6 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-[#d43d8a]/4 rounded-full blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#F0D6E8] shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl text-[#7A5E6A] hover:text-[#B81862] hover:bg-[#FFF0F7] transition" title="Back to Store">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="font-serif text-base font-bold text-[#111111] leading-tight">My Orders</h1>
              <p className="text-[11px] text-[#7A5E6A]">Dwara Collections</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchOrders} disabled={loading} className="p-2 rounded-xl text-[#7A5E6A] hover:text-[#B81862] hover:bg-[#FFF0F7] transition disabled:opacity-50" title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button onClick={handleLogout} disabled={loggingOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-[#B81862] border border-[#F0D6E8] hover:bg-[#FFF0F7] transition disabled:opacity-60 cursor-pointer">
              {loggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 relative">
        {/* Greeting card */}
        <div className="bg-gradient-to-br from-[#B81862] to-[#8B0E48] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-[#FFD6E8]" />
                <span className="text-[11px] font-semibold text-[#FFD6E8] uppercase tracking-wider">Welcome Back</span>
              </div>
              <h2 className="font-serif text-2xl font-bold">{customer.name}</h2>
              <p className="text-[13px] text-white/70 mt-1 font-mono">{customer.phone}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-3xl font-bold">{orders.length}</div>
              <div className="text-[11px] text-white/70 font-semibold">Total {orders.length === 1 ? "Request" : "Requests"}</div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[
              { label: "Pending", count: statusCounts.pending },
              { label: "Contacted", count: statusCounts.contacted },
              { label: "Fulfilled", count: statusCounts.fulfilled },
            ].map(({ label, count }) => (
              <div key={label} className="bg-white rounded-2xl p-2.5 text-center border border-[#B81862] shadow-sm">
                <div className="text-xl font-bold text-[#B81862]">{count}</div>
                <div className="text-[10px] font-semibold text-[#B81862]">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp CTA */}
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between p-4 bg-[#25D366] rounded-2xl text-white shadow-md hover:bg-[#20ba59] transition group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 fill-white" />
            </div>
            <div>
              <p className="font-bold text-sm">Chat with Our Concierge</p>
              <p className="text-[11px] text-white/80">Get updates on your requests</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </a>

        {/* Orders */}
        <div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {(["all", "pending", "contacted", "in-progress", "fulfilled", "cancelled"] as const).map((tab) => {
              const isActive = activeTab === tab;
              const count = tab === "all" ? orders.length : statusCounts[tab];
              return (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold border transition cursor-pointer ${isActive ? "bg-[#B81862] text-white border-[#B81862]" : "bg-white text-[#7A5E6A] border-[#F0D6E8] hover:border-[#B81862] hover:text-[#B81862]"}`}>
                  {tab === "all" ? "All" : statusConfig[tab].label}
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${isActive ? "bg-white/20 text-white" : "bg-[#F0D6E8] text-[#B81862]"}`}>{count}</span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#7A5E6A]">
              <Loader2 className="w-8 h-8 animate-spin text-[#B81862]" />
              <p className="text-sm font-medium">Loading your orders...</p>
            </div>
          ) : error ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm font-semibold text-[#111111]">Failed to load orders</p>
              <p className="text-xs text-[#7A5E6A]">{error}</p>
              <button onClick={fetchOrders} className="mt-1 px-4 py-2 rounded-xl bg-[#B81862] text-white text-xs font-bold hover:opacity-90 transition">Try Again</button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF0F7] border border-[#F0D6E8] flex items-center justify-center">
                <ShoppingBag className="w-7 h-7 text-[#B81862]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#111111]">{activeTab === "all" ? "No orders yet" : `No ${statusConfig[activeTab].label.toLowerCase()} orders`}</p>
                <p className="text-xs text-[#7A5E6A] mt-1">{activeTab === "all" ? "Browse our catalogue and request items you love!" : "Switch tabs to see other orders."}</p>
              </div>
              {activeTab === "all" && (
                <Link href="/" className="mt-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#B81862] to-[#d43d8a] text-white text-xs font-bold hover:opacity-90 transition shadow-md">Explore Jewellery</Link>
              )}
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {filteredOrders.map((order) => {
                const sc = statusConfig[order.status];
                const refId = order.orderId || order._id.slice(-8).toUpperCase();
                return (
                  <button key={order._id} onClick={() => setSelectedOrder(order)}
                    className="w-full text-left bg-white border border-[#F0D6E8] rounded-2xl p-4 hover:border-[#B81862]/40 hover:shadow-md transition-all group">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl ${sc.bg} ${sc.border} border flex items-center justify-center shrink-0 ${sc.color}`}>
                        <StatusIcon status={order.status} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm text-[#111111] leading-tight truncate">{order.productName}</p>
                          <ChevronRight className="w-4 h-4 text-[#B0869A] shrink-0 group-hover:translate-x-1 transition-transform mt-0.5" />
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1 text-[10px] text-[#7A5E6A]">
                            <Hash className="w-3 h-3" /><span className="font-mono font-semibold">{refId}</span>
                          </span>
                          <span className="text-[10px] text-[#7A5E6A]">Qty: <span className="font-semibold text-[#443E36]">{order.quantity}</span></span>
                          <span className="flex items-center gap-1 text-[10px] text-[#7A5E6A]">
                            <Calendar className="w-3 h-3" />{formatDate(order.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${sc.bg} ${sc.color} ${sc.border} border`}>
                        <StatusIcon status={order.status} />{sc.label}
                      </span>
                      {order.description && <span className="text-[10px] text-[#7A5E6A] italic truncate max-w-[150px]">&quot;{order.description}&quot;</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {orders.length > 0 && (
          <div className="pb-8">
            <Link href="/" className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border-2 border-dashed border-[#F0D6E8] text-[#B81862] text-sm font-bold hover:bg-[#FFF0F7] hover:border-[#B81862]/30 transition">
              <Sparkles className="w-4 h-4" />Browse More Jewellery
            </Link>
          </div>
        )}
      </main>

      {selectedOrder && <OrderDetailModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}

export default function MyOrdersPage() {
  const [customer, setCustomer] = useState<CustomerInfo | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/customer/me");
        const data = await res.json();
        if (data.customer) {
          setCustomer(data.customer);
          setChecking(false);
          return;
        }
      } catch {}

      // If no active cookie, check localStorage visitor info
      try {
        const saved = localStorage.getItem("royal_visitor_info");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.name && parsed.phone) {
            const loginRes = await fetch("/api/customer/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: parsed.name, phone: parsed.phone }),
            });
            const loginData = await loginRes.json();
            if (loginData.success && loginData.customer) {
              setCustomer(loginData.customer);
              setChecking(false);
              return;
            }
          }
        }
      } catch {}

      setChecking(false);
    }

    checkAuth();
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen bg-[#FFF8FB] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#B81862]" />
      </div>
    );
  }

  if (!customer) return <LoginForm onLogin={(c) => setCustomer(c)} />;
  return <Dashboard customer={customer} />;
}
