"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Sparkles, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin/dashboard";

  const [email, setEmail] = useState("admin@royaljewellers.com");
  const [password, setPassword] = useState("RoyalAdmin@2026");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to log in.");
      }

      // Successful login
      router.push(callbackUrl);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = () => {
    setEmail("admin@royaljewellers.com");
    setPassword("RoyalAdmin@2026");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#141414] text-[#D4AF37] flex items-center justify-center font-bold text-2xl shadow-lg shadow-[#141414]/10">
            R
          </div>
          <div className="text-left">
            <span className="font-bold text-xl tracking-tight text-[#141414] block">Catalogue Studio</span>
            <span className="text-xs font-semibold uppercase tracking-widest text-[#B4833E]">Admin Portal</span>
          </div>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight text-[#141414]">Welcome back</h2>
        <p className="mt-2 text-sm text-[#666059]">
          Log in to manage your digital catalogue, categories, and products.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-[#141414]/5 sm:rounded-2xl sm:px-10 border border-[#E8E2D9]">
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[#444]">
                Business Email
              </label>
              <div className="mt-2 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#888]">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="block w-full pl-10 pr-3 py-3 border border-[#D9D2C7] rounded-xl text-sm placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#B4833E] focus:border-[#B4833E] bg-white transition"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[#444]">
                Password
              </label>
              <div className="mt-2 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#888]">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-10 py-3 border border-[#D9D2C7] rounded-xl text-sm placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#B4833E] focus:border-[#B4833E] bg-white transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#888] hover:text-[#444]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-[#B4833E] focus:ring-[#B4833E] border-[#D9D2C7] rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-xs font-medium text-[#666]">
                  Remember me
                </label>
              </div>

              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-semibold text-[#B4833E] hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-[#141414] hover:bg-[#B4833E] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#B4833E] transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Fill Pill */}
          <div className="mt-6 pt-6 border-t border-[#E8E2D9]">
            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] text-xs font-semibold text-[#666059] hover:text-[#141414] hover:border-[#B4833E] transition"
            >
              <Sparkles className="w-4 h-4 text-[#B4833E]" />
              Fill Demo Credentials (Royal Jewellers)
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E8E2D9] shadow-2xl">
            <h3 className="text-lg font-bold text-[#141414] mb-2">Password Reset</h3>
            <p className="text-sm text-[#666059] mb-6">
              For demo safety, password resets are handled by the platform administrator. For this demonstration, you can log in using the pre-seeded credentials:
            </p>
            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8E2D9] text-xs font-mono mb-6 space-y-1">
              <div><strong>Email:</strong> admin@royaljewellers.com</div>
              <div><strong>Password:</strong> RoyalAdmin@2026</div>
            </div>
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="w-full py-2.5 bg-[#141414] text-white rounded-xl text-sm font-semibold hover:bg-[#B4833E] transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#B4833E]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
