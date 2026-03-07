import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import API from "../api/client";

import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Pencil,
  Check,
  X,
  Loader2,
  AlertCircle,
  LogOut,
  Flame,
  BookOpen,
  Clock,
  Star,
  Trash2,
  Camera,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

const getInitials = (email = "") =>
  email.slice(0, 2).toUpperCase();

const formatHours = (h = 0) =>
  h >= 1 ? `${h.toFixed(1)}h` : `${Math.round(h * 60)}m`;

const STAGGER = 0.07;

function StatCard({ icon: Icon, label, value, accent, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, ease: "easeOut" }}
      className="relative bg-neutral-900/60 border border-neutral-800 rounded-2xl p-5 overflow-hidden group"
    >
      {/* accent glow */}
      <div
        className={`absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${accent}`}
      />
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-600">
          {label}
        </span>
        <Icon size={15} className="text-neutral-600 group-hover:text-neutral-400 transition-colors" />
      </div>
      <p className="text-3xl font-black text-white tracking-tight font-mono">
        {value}
      </p>
    </motion.div>
  );
}

function EditableField({ label, value, icon: Icon, onSave, type = "text", disabled }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const handleSave = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail[0]?.msg
          : "Update failed."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
    setError(null);
  };

  return (
    <div className="group">
      <label className="block text-xs font-mono font-bold uppercase tracking-widest text-neutral-600 mb-2">
        {label}
      </label>
      <div
        className={`relative flex items-center gap-3 bg-neutral-900/60 border rounded-xl px-4 py-3.5 transition-all duration-200 ${
          editing
            ? "border-neutral-600 ring-1 ring-neutral-700"
            : "border-neutral-800 hover:border-neutral-700"
        }`}
      >
        <Icon size={16} className="text-neutral-500 flex-shrink-0" />

        {editing ? (
          <input
            ref={inputRef}
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={saving || disabled}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-neutral-600 min-w-0"
          />
        ) : (
          <span className="flex-1 text-sm text-neutral-200 truncate font-mono">
            {value || <span className="text-neutral-600 italic">Not set</span>}
          </span>
        )}

        <div className="flex items-center gap-1 flex-shrink-0">
          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div
                key="edit-actions"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                className="flex gap-1"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin text-neutral-400" />
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={handleCancel}
                      className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-800 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.button
                key="edit-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !disabled && setEditing(true)}
                disabled={disabled}
                className="p-1.5 rounded-lg text-neutral-600 hover:text-white hover:bg-neutral-800 transition-all opacity-0 group-hover:opacity-100 disabled:pointer-events-none"
              >
                <Pencil size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-xs text-red-400 font-mono flex items-center gap-1"
        >
          <AlertCircle size={11} /> {error}
        </motion.p>
      )}
    </div>
  );
}

function AvatarBlock({ email, onLogout }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1, ease: "easeOut" }}
      className="flex flex-col items-center text-center"
    >
      {/* avatar ring */}
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/40 to-cyan-500/20 blur-lg scale-110" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border border-neutral-700 flex items-center justify-center overflow-hidden">
          <span className="text-2xl font-black font-mono text-white tracking-tight">
            {getInitials(email)}
          </span>
          {/* camera overlay — placeholder for future upload */}
          <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer rounded-full">
            <Camera size={18} className="text-white" />
          </div>
        </div>
      </div>

      <p className="text-white font-mono font-bold text-base truncate max-w-[220px]">
        {email}
      </p>
      <span className="mt-1 px-3 py-0.5 bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-mono font-bold rounded-full">
        ACTIVE MEMBER
      </span>

      <button
        onClick={onLogout}
        className="mt-5 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-widest text-neutral-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
      >
        <LogOut size={14} />
        Sign Out
      </button>
    </motion.div>
  );
}

function DangerZone({ onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="border border-red-500/20 rounded-2xl p-6 bg-red-500/5"
    >
      <p className="text-xs font-mono font-bold uppercase tracking-widest text-red-500/60 mb-1">
        Danger Zone
      </p>
      <p className="text-sm text-neutral-500 mb-4">
        Permanently delete your account and all associated data. This action cannot be undone.
      </p>
      <AnimatePresence mode="wait">
        {!confirming ? (
          <motion.button
            key="danger-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirming(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-widest text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-all"
          >
            <Trash2 size={13} /> Delete Account
          </motion.button>
        ) : (
          <motion.div
            key="danger-confirm"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 flex-wrap"
          >
            <span className="text-xs text-red-400 font-mono">
              Are you absolutely sure?
            </span>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-mono font-bold uppercase tracking-widest hover:bg-red-600 disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              Confirm Delete
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-widest text-neutral-500 border border-neutral-800 hover:bg-neutral-800 transition-all"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setPageError(null);
      try {
        const [profileRes, statsRes] = await Promise.all([
          API.get("/users/me"),
          API.get("/users/me/stats"),
        ]);
        setProfile(profileRes.data);
        setStats(statsRes.data);
      } catch (err) {
        const detail = err.response?.data?.detail;
        setPageError(
          typeof detail === "string"
            ? detail
            : "Failed to load profile. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleUpdateEmail = async (email) => {
    const { data } = await API.patch("/users/me", { email });
    setProfile((p) => ({ ...p, email: data.email }));
    flashSuccess();
  };

  const handleUpdatePassword = async (password) => {
    await API.patch("/users/me", { password });
    flashSuccess();
  };

  const flashSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const handleDeleteAccount = async () => {
    await API.delete("/users/me");
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-10 h-10 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
          <p className="text-xs font-mono text-neutral-600 uppercase tracking-widest">
            Loading Profile
          </p>
        </motion.div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <AlertCircle size={40} className="mx-auto text-red-400 mb-4" />
          <p className="text-neutral-300 mb-6 font-mono text-sm">{pageError}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-6 py-2.5 bg-white text-black rounded-xl text-sm font-bold font-mono hover:bg-neutral-200 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">

      {/* scanline texture overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, #fff 2px, #fff 3px)",
          backgroundSize: "100% 3px",
        }}
      />

      {/* ambient glow */}
      <div className="pointer-events-none fixed top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[140px] rounded-full" />

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/60">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-lg font-black font-mono tracking-tight text-white">
                PROFILE
              </h1>
              <p className="text-xs font-mono text-neutral-600 tracking-widest uppercase">
                Account Settings
              </p>
            </div>
          </div>

          {/* save success toast */}
          <AnimatePresence>
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-mono font-bold"
              >
                <Check size={12} /> Saved
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ── Body ── */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">

          {/* ── Left column: Avatar + Stats ── */}
          <div className="space-y-6">
            {/* Avatar */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
              <AvatarBlock email={profile?.email} onLogout={handleLogout} />
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <p className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-600 px-1">
                Activity Stats
              </p>
              <StatCard
                icon={Flame}
                label="Streak"
                value={`${stats?.streak ?? 0}d`}
                accent="bg-orange-500"
                delay={STAGGER * 1}
              />
              <StatCard
                icon={Clock}
                label="Study Time"
                value={formatHours(stats?.total_study_hours ?? 0)}
                accent="bg-blue-500"
                delay={STAGGER * 2}
              />
              <StatCard
                icon={BookOpen}
                label="Sessions"
                value={stats?.total_sessions ?? 0}
                accent="bg-cyan-500"
                delay={STAGGER * 3}
              />
              <StatCard
                icon={Star}
                label="Total XP"
                value={`${stats?.total_xp ?? 0}`}
                accent="bg-yellow-500"
                delay={STAGGER * 4}
              />
            </div>
          </div>

          {/* ── Right column: Edit fields ── */}
          <div className="space-y-6">

            {/* Account info section */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 space-y-5"
            >
              <div className="flex items-center gap-2 mb-1">
                <User size={14} className="text-neutral-500" />
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-500">
                  Account Info
                </span>
              </div>

              <EditableField
                label="Email Address"
                value={profile?.email ?? ""}
                icon={Mail}
                type="email"
                onSave={handleUpdateEmail}
              />
            </motion.div>

            {/* Security section */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6 space-y-5"
            >
              <div className="flex items-center gap-2 mb-1">
                <Shield size={14} className="text-neutral-500" />
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-neutral-500">
                  Security
                </span>
              </div>

              <EditableField
                label="Password"
                value="••••••••"
                icon={Shield}
                type="password"
                onSave={handleUpdatePassword}
              />

              <div className="pt-1 border-t border-neutral-800">
                <p className="text-xs font-mono text-neutral-600 leading-relaxed">
                  Your password is encrypted and never stored in plain text.
                  Use a strong, unique password for maximum security.
                </p>
              </div>
            </motion.div>

            {/* Member since */}
            {profile?.created_at && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="px-5 py-3 bg-neutral-900/30 border border-neutral-800/50 rounded-xl"
              >
                <p className="text-xs font-mono text-neutral-600">
                  <span className="text-neutral-500 font-bold">Member since</span>{" "}
                  {new Date(profile.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </motion.div>
            )}

            {/* Danger zone */}
            <DangerZone onDelete={handleDeleteAccount} />
          </div>
        </div>
      </main>
    </div>
  );
}