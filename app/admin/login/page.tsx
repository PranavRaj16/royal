"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn, Loader2, ArrowLeft, Lock, Mail, Sparkles } from "lucide-react";

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
      setError("Please enter both email and password.");
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
      setError("Connection error. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("admin@royaljewellers.com");
    setPassword("RoyalAdmin@2026");
    setError("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] relative overflow-hidden transition-colors selection:bg-[#B81862]/30 selection:text-[#B81862]">
      {/* Background Decorative Glow Orbs (absolute + pointer-events-none) */}
      <div
        aria-hidden="true"
        className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full blur-3xl opacity-20 dark:opacity-25 pointer-events-none transition-opacity"
        style={{ background: "radial-gradient(circle, #B81862 0%, rgba(180,131,62,0.1) 60%, transparent 80%)" }}
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full blur-3xl opacity-15 dark:opacity-20 pointer-events-none transition-opacity"
        style={{ background: "radial-gradient(circle, #d43d8a 0%, rgba(212,175,55,0.1) 60%, transparent 80%)" }}
      />

      {/* Top Header Bar */}
      <header className="relative z-20 w-full px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
        <Link
          id="back-to-store-btn"
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[var(--muted)] hover:text-[#B81862] transition py-1 px-2.5 rounded-lg hover:bg-[var(--surface-2)]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalogue</span>
        </Link>
      </header>

      {/* Login Card Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[440px]">
          {/* Brand Emblem & Title */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="relative inline-block mb-4">
              <img
                src="/logo.png"
                alt="Dwara Collections"
                className="h-14 sm:h-16 w-auto object-contain mx-auto"
              />
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-[var(--foreground)] tracking-tight">
              Admin Studio
            </h1>
            <p className="text-xs sm:text-sm text-[var(--muted)] mt-1">
              Sign in to manage your collections catalogue
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden backdrop-blur-md">
            {/* Top brand accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#B81862] to-transparent" />

            {error && (
              <div
                id="login-error"
                className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2"
              >
                <span className="shrink-0 text-base leading-none">⚠️</span>
                <span className="font-medium">{error}</span>
              </div>
            )}

            <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Email field */}
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@royaljewellers.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[#B81862] focus:ring-2 focus:ring-[#B81862]/20 transition"
                    autoComplete="email"
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--foreground)] placeholder-[var(--muted)] focus:outline-none focus:border-[#B81862] focus:ring-2 focus:ring-[#B81862]/20 transition"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    id="toggle-password-btn"
                    type="button"
                    onClick={() => setShowPassword((x) => !x)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] p-1 transition cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Demo Fill Helper */}
              <div className="pt-1 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="inline-flex items-center gap-1 text-[#B81862] hover:text-[#d43d8a] font-semibold hover:underline cursor-pointer transition"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Fill Demo Credentials</span>
                </button>
                <span className="text-[var(--muted)]">Default Admin</span>
              </div>

              {/* Submit button */}
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-5 rounded-xl bg-gradient-to-r from-[#B81862] to-[#d43d8a] text-white font-bold text-sm tracking-wide shadow-md hover:shadow-[0_6px_20px_rgba(184,24,98,0.4)] active:scale-[0.99] disabled:opacity-60 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 text-white" />
                    <span>Sign In to Studio</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer lock notice */}
          <p className="text-center text-[11px] text-[var(--muted)] mt-6 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3 text-[#B81862]" />
            <span>Secure 256-bit Encrypted Admin Portal</span>
          </p>
        </div>
      </main>
    </div>
  );
}
