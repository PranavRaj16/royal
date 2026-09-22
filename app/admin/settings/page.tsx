"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  KeyRound,
  Database,
  Check,
  AlertCircle,
  Loader2,
  Server,
} from "lucide-react";

export default function SettingsPage() {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setAdminEmail(data.user.email);
          setAdminName(data.user.name);
        }
      });
  }, []);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      // Endpoint to update admin profile
      const res = await fetch("/api/admin/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password");
      }
      setPasswordMessage("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Error updating password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-[#141414] tracking-tight">Admin & Platform Settings</h1>
        <p className="text-sm text-[#666059]">
          Manage security credentials, administrative accounts, and system environment info.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Account Info */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#141414] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#B4833E]" />
            Administrator Account
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                Admin Name
              </label>
              <div className="px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-sm font-medium text-gray-800">
                {adminName || "Royal Concierge"}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                Admin Email
              </label>
              <div className="px-3.5 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-sm font-mono text-gray-800">
                {adminEmail || "admin@royaljewellers.com"}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <form
          onSubmit={handlePasswordChange}
          className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-5"
        >
          <h2 className="text-base font-bold text-[#141414] flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#B4833E]" />
            Change Admin Password
          </h2>

          {passwordMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{passwordMessage}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#141414] text-white text-xs font-semibold hover:bg-[#B4833E] transition shadow-xs disabled:opacity-50"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </form>

        {/* Database & Architecture Status */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#141414] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#B4833E]" />
            Database & System Info
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9]">
              <span className="text-gray-400 block mb-1">Database Engine</span>
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-600" />
                MongoDB (Mongoose ODM)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9]">
              <span className="text-gray-400 block mb-1">Architecture</span>
              <span className="font-bold text-gray-900">Multi-Tenant SaaS</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9]">
              <span className="text-gray-400 block mb-1">Image Storage Driver</span>
              <span className="font-bold text-gray-900">Local Disk / Cloudinary Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
