"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  KeyRound,
  Mail,
  User,
  Database,
  Check,
  AlertCircle,
  Loader2,
  Server,
  Eye,
  EyeOff,
  Lock,
  Sparkles,
} from "lucide-react";

export default function SettingsPage() {
  // Admin Profile State
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showProfilePassword, setShowProfilePassword] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loadingInitial, setLoadingInitial] = useState(true);

  // DB Connection Status State
  const [dbStatus, setDbStatus] = useState<{
    connected?: boolean;
    status?: string;
    database?: string;
    host?: string;
    message?: string;
    error?: string;
  } | null>(null);
  const [testingDb, setTestingDb] = useState(false);

  const checkDbStatus = async () => {
    setTestingDb(true);
    try {
      const res = await fetch("/api/admin/db-status");
      const data = await res.json();
      setDbStatus(data);
    } catch (err) {
      setDbStatus({
        connected: false,
        status: "disconnected",
        error: err instanceof Error ? err.message : "Failed to reach server",
      });
    } finally {
      setTestingDb(false);
    }
  };

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setAdminEmail(data.user.email || "");
          setAdminName(data.user.name || "");
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingInitial(false));

    checkDbStatus();
  }, []);

  // Handle Profile / Email Change
  const handleProfileChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileError(null);

    if (!adminEmail.trim()) {
      setProfileError("Email address cannot be empty.");
      return;
    }

    if (!profilePassword) {
      setProfileError("Please enter your current password to confirm email & name changes.");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: adminName.trim(),
          email: adminEmail.trim(),
          currentPassword: profilePassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update admin credentials.");
      }
      setProfileMessage(data.message || "Admin credentials updated successfully!");
      setProfilePassword("");
      if (data.user) {
        setAdminName(data.user.name);
        setAdminEmail(data.user.email);
      }
    } catch (err: unknown) {
      setProfileError(err instanceof Error ? err.message : "Error updating admin credentials.");
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Change
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
      const res = await fetch("/api/admin/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update password");
      }
      setPasswordMessage(data.message || "Password updated successfully!");
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
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold uppercase tracking-wider text-[#B4833E]">Admin Control</span>
        </div>
        <h1 className="text-2xl font-bold text-[#141414] tracking-tight">Admin & Security Settings</h1>
        <p className="text-sm text-[#666059]">
          Manage your administrator email, login password, and system security credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* ── 1. ADMIN EMAIL & PROFILE RESET ── */}
        <form
          onSubmit={handleProfileChange}
          className="bg-white border border-[#E8E2D9] rounded-2xl p-6 sm:p-7 shadow-xs space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#141414] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-center">
                <Mail className="w-4 h-4 text-[#B4833E]" />
              </div>
              Admin Email & Profile Credentials
            </h2>
            <span className="text-[11px] font-semibold text-[#888] bg-[#FAF8F5] px-2.5 py-1 rounded-full border border-[#E8E2D9]">
              Authentication
            </span>
          </div>

          <p className="text-xs text-[#777] leading-relaxed">
            Update the administrator login email or display name. For security, your current password is required to apply changes.
          </p>

          {profileMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{profileMessage}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{profileError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#B4833E]" />
                Admin Name
              </label>
              <input
                type="text"
                required
                disabled={loadingInitial || savingProfile}
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. Royal Concierge"
                className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm text-[#141414] bg-white focus:ring-2 focus:ring-[#B4833E] focus:outline-none transition disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#B4833E]" />
                Admin Login Email *
              </label>
              <input
                type="email"
                required
                disabled={loadingInitial || savingProfile}
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="e.g. admin@royaljewellers.com"
                className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm font-mono text-[#141414] bg-white focus:ring-2 focus:ring-[#B4833E] focus:outline-none transition disabled:opacity-60"
              />
            </div>
          </div>

          <div className="pt-1 border-t border-[#F0EBE3]">
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#B4833E]" />
              Confirm with Current Password *
            </label>
            <div className="relative max-w-sm">
              <input
                type={showProfilePassword ? "text" : "password"}
                required
                disabled={savingProfile}
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
                placeholder="Enter current password to confirm"
                className="w-full px-3.5 py-2.5 pr-10 border border-[#D9D2C7] rounded-xl text-sm text-[#141414] bg-white focus:ring-2 focus:ring-[#B4833E] focus:outline-none transition disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowProfilePassword(!showProfilePassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showProfilePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingProfile || loadingInitial}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#141414] text-white text-xs font-semibold hover:bg-[#B4833E] transition shadow-sm disabled:opacity-50"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Email & Credentials...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save Admin Credentials</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* ── 2. CHANGE ADMIN PASSWORD ── */}
        <form
          onSubmit={handlePasswordChange}
          className="bg-white border border-[#E8E2D9] rounded-2xl p-6 sm:p-7 shadow-xs space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#141414] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#E8E2D9] flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-[#B4833E]" />
              </div>
              Change Admin Password
            </h2>
            <span className="text-[11px] font-semibold text-[#888] bg-[#FAF8F5] px-2.5 py-1 rounded-full border border-[#E8E2D9]">
              Password Reset
            </span>
          </div>

          <p className="text-xs text-[#777] leading-relaxed">
            Ensure your admin account is protected with a strong, confidential password containing at least 6 characters.
          </p>

          {passwordMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{passwordMessage}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1.5">
                Current Password *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-9 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1.5">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-9 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1.5">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 pr-9 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B4833E] focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#141414] text-white text-xs font-semibold hover:bg-[#B4833E] transition shadow-sm disabled:opacity-50"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* ── 3. DATABASE & SYSTEM ENVIRONMENT ── */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#141414] flex items-center gap-2">
              <Database className="w-4 h-4 text-[#B4833E]" />
              MongoDB & System Connection Status
            </h2>
            <button
              type="button"
              onClick={checkDbStatus}
              disabled={testingDb}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D9D2C7] bg-[#FAF8F5] text-xs font-semibold text-gray-700 hover:border-[#B4833E] hover:text-[#B4833E] transition disabled:opacity-50"
            >
              {testingDb ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Server className="w-3.5 h-3.5" />
                  <span>Test Connection</span>
                </>
              )}
            </button>
          </div>

          {/* Connection Status Banner */}
          {dbStatus && (
            <div
              className={`p-4 rounded-xl border text-xs leading-relaxed flex items-start gap-3 ${
                dbStatus.connected
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-amber-50 border-amber-200 text-amber-900"
              }`}
            >
              {dbStatus.connected ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold flex items-center gap-2">
                  <span>{dbStatus.connected ? "MongoDB Atlas Connected" : "Local Disk Storage Active (Offline Mode)"}</span>
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      dbStatus.connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    }`}
                  />
                </div>
                <p className="text-[11px] text-gray-600">
                  {dbStatus.connected
                    ? `Database: ${dbStatus.database} (${dbStatus.host})`
                    : "MongoDB Atlas is unreachable. Changes are saved directly to local persistent disk (data/local_db.json)."}
                </p>
                {!dbStatus.connected && (
                  <p className="text-[11px] text-[#B4833E] font-medium pt-1">
                    Tip: Add 0.0.0.0/0 to your MongoDB Atlas Network Access whitelist at cloud.mongodb.com to connect directly.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9]">
              <span className="text-gray-400 block mb-1">Database Engine</span>
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-emerald-600" />
                MongoDB Atlas / Mongoose
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9]">
              <span className="text-gray-400 block mb-1">Auth & Token Protocol</span>
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#B4833E]" />
                JWT (Edge JOSE + Bcrypt)
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9]">
              <span className="text-gray-400 block mb-1">Disk Persistence Fallback</span>
              <span className="font-bold text-gray-900 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-[#B4833E]" />
                data/local_db.json (Active)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
