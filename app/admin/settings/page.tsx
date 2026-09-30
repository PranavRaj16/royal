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
  BellRing,
  Phone,
  Send,
  ExternalLink,
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

  // Email Notification State
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSendTestEmail = async () => {
    setTestingEmail(true);
    setEmailMessage(null);
    setEmailError(null);
    try {
      const res = await fetch("/api/admin/test-email", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send test email.");
      }
      setEmailMessage(data.message || "Test order notification sent to Eshmagold@gmail.com!");
    } catch (err: unknown) {
      setEmailError(err instanceof Error ? err.message : "Error sending test email.");
    } finally {
      setTestingEmail(false);
    }
  };

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
          <span className="text-xs font-bold uppercase tracking-wider text-[#B81862]">Admin Control</span>
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
              <div className="w-8 h-8 rounded-lg bg-[#FFF8FB] border border-[#E8E2D9] flex items-center justify-center">
                <Mail className="w-4 h-4 text-[#B81862]" />
              </div>
              Admin Email & Profile Credentials
            </h2>
            <span className="text-[11px] font-semibold text-[#888] bg-[#FFF8FB] px-2.5 py-1 rounded-full border border-[#E8E2D9]">
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
                <User className="w-3.5 h-3.5 text-[#B81862]" />
                Admin Name
              </label>
              <input
                type="text"
                required
                disabled={loadingInitial || savingProfile}
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. Royal Concierge"
                className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm text-[#141414] bg-white focus:ring-2 focus:ring-[#B81862] focus:outline-none transition disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-600 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#B81862]" />
                Admin Login Email *
              </label>
              <input
                type="email"
                required
                disabled={loadingInitial || savingProfile}
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="e.g. admin@royaljewellers.com"
                className="w-full px-3.5 py-2.5 border border-[#D9D2C7] rounded-xl text-sm font-mono text-[#141414] bg-white focus:ring-2 focus:ring-[#B81862] focus:outline-none transition disabled:opacity-60"
              />
            </div>
          </div>

          <div className="pt-1 border-t border-[#F0EBE3]">
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#B81862]" />
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
                className="w-full px-3.5 py-2.5 pr-10 border border-[#D9D2C7] rounded-xl text-sm text-[#141414] bg-white focus:ring-2 focus:ring-[#B81862] focus:outline-none transition disabled:opacity-60"
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
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#141414] text-white text-xs font-semibold hover:bg-[#B81862] transition shadow-sm disabled:opacity-50"
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
              <div className="w-8 h-8 rounded-lg bg-[#FFF8FB] border border-[#E8E2D9] flex items-center justify-center">
                <KeyRound className="w-4 h-4 text-[#B81862]" />
              </div>
              Change Admin Password
            </h2>
            <span className="text-[11px] font-semibold text-[#888] bg-[#FFF8FB] px-2.5 py-1 rounded-full border border-[#E8E2D9]">
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
                  className="w-full px-3.5 py-2.5 pr-9 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B81862] focus:outline-none transition"
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
                  className="w-full px-3.5 py-2.5 pr-9 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B81862] focus:outline-none transition"
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
                  className="w-full px-3.5 py-2.5 pr-9 border border-[#D9D2C7] rounded-xl text-sm focus:ring-2 focus:ring-[#B81862] focus:outline-none transition"
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
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#141414] text-white text-xs font-semibold hover:bg-[#B81862] transition shadow-sm disabled:opacity-50"
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

        {/* ── 3. ORDER NOTIFICATION SETTINGS ── */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#141414] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FFF8FB] border border-[#E8E2D9] flex items-center justify-center">
                <BellRing className="w-4 h-4 text-[#B81862]" />
              </div>
              Order Request Notifications
            </h2>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Active Channel
            </span>
          </div>

          <p className="text-xs text-[#777] leading-relaxed">
            Instant email alerts are automatically dispatched whenever a customer submits an inquiry or order on the storefront.
          </p>

          {emailMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{emailMessage}</span>
            </div>
          )}

          {emailError && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{emailError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase">
                <Send className="w-3.5 h-3.5 text-[#B81862]" />
                Sender Email (From)
              </div>
              <div className="text-sm font-bold font-mono text-[#141414] truncate">
                dwarajewels123@gmail.com
              </div>
              <div className="text-[11px] text-gray-500">
                Dispatches automated order receipts & requests.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase">
                <Mail className="w-3.5 h-3.5 text-[#B81862]" />
                Admin Recipient (To)
              </div>
              <div className="text-sm font-bold font-mono text-[#141414] truncate">
                Eshmagold@gmail.com
              </div>
              <div className="text-[11px] text-gray-500">
                Receives full order details, items & customer contact.
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 uppercase">
                <Phone className="w-3.5 h-3.5 text-[#B81862]" />
                Admin Contact Phone
              </div>
              <div className="text-sm font-bold font-mono text-[#141414]">
                +91 7981935590
              </div>
              <div className="text-[11px] text-gray-500">
                Included in order alerts & customer concierge.
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0EBE3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-gray-500 max-w-md">
              Want to test delivery? Click below to send a sample luxury order notification from <strong className="text-gray-800 font-mono">dwarajewels123@gmail.com</strong> to <strong className="text-gray-800 font-mono">Eshmagold@gmail.com</strong>.
            </div>
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={testingEmail}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FFF8FB] text-[#B81862] border border-[#B81862]/30 text-xs font-semibold hover:bg-[#B81862] hover:text-white transition shadow-xs disabled:opacity-50"
            >
              {testingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Test Email...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test Email</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
