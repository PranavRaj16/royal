"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn, Loader2, ArrowLeft } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push("/admin/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Invalid credentials. Please try again.");
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] relative overflow-hidden">
      {/* Background orbs */}
      <div
        className="orb w-[600px] h-[600px] top-[-200px] left-[-200px]"
        style={{ background: "radial-gradient(circle, #B4833E, transparent)" }}
      />
      <div
        className="orb w-[400px] h-[400px] bottom-[-100px] right-[-100px]"
        style={{ background: "radial-gradient(circle, #D4AF37, transparent)" }}
      />

      {/* Back link */}
      <div className="relative p-5">
        <Link
          id="back-to-store-btn"
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Catalogue
        </Link>
      </div>

      {/* Login card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8 relative">
        <div className="w-full max-w-[420px]">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B4833E] to-[#D4AF37] flex items-center justify-center font-bold text-black text-2xl font-serif mx-auto mb-4 shadow-[0_8px_32px_rgba(180,131,62,0.4)]">
              R
            </div>
            <h1 className="font-serif text-2xl font-bold text-white mb-1">
              Admin Studio
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Sign in to manage your catalogue
            </p>
          </div>

          {/* Form */}
          <form
            id="login-form"
            onSubmit={handleSubmit}
            className="glass border border-[var(--border)] rounded-2xl p-6 space-y-4"
          >
            {error && (
              <div
                id="login-error"
                className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400 flex items-start gap-2"
              >
                <span className="mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5"
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@royaljewellers.com"
                className="input"
                autoComplete="email"
                autoFocus
                required
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input pr-11"
                  autoComplete="current-password"
                  required
                />
                <button
                  id="toggle-password-btn"
                  type="button"
                  onClick={() => setShowPassword((x) => !x)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-white transition"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 mt-2 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
