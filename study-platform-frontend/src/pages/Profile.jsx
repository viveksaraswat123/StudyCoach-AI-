import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import API from "../api/client";
import {
  LayoutDashboard, BookOpen, TrendingUp, Brain, LogOut,
  MessageSquare, Users, User, Timer, BookMarked,
  Mail, Shield, Pencil, Check, X, Loader2, AlertCircle,
  Flame, Clock, Star, Trash2, ChevronRight,
} from "lucide-react";

// ── XP level config ───────────────────────────────────────────────────────────
const LEVELS = [
  { min: 0,    max: 99,   n: 1, label: "Beginner", color: "#6b7280" },
  { min: 100,  max: 299,  n: 2, label: "Explorer", color: "#10b981" },
  { min: 300,  max: 599,  n: 3, label: "Scholar",  color: "#3b82f6" },
  { min: 600,  max: 999,  n: 4, label: "Expert",   color: "#a855f7" },
  { min: 1000, max: Infinity, n: 5, label: "Master", color: "#f59e0b" },
];

const getLevel = (xp = 0) =>
  LEVELS.find((l) => xp >= l.min && xp <= l.max) || LEVELS[0];

const fmt = (h = 0) =>
  h >= 1 ? `${h.toFixed(1)}h` : `${Math.round(h * 60)}m`;

// ── sub-components ────────────────────────────────────────────────────────────

function SidebarItem({ icon, label, active = false, onClick }) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-white font-bold border border-blue-500/30"
          : "text-neutral-500 hover:text-white hover:bg-neutral-800/50"
      }`}
    >
      {icon}
      <span className="text-sm tracking-tight">{label}</span>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-colors group"
      style={{ background: `linear-gradient(135deg, ${color}08, transparent)` }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          {label}
        </p>
        <Icon size={15} style={{ color }} className="opacity-60 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-2xl font-bold tracking-tight" style={{ color: "white" }}>
        {value}
      </p>
    </motion.div>
  );
}

function EditableField({ label, value, icon: Icon, onSave, type = "text" }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);
  const inputRef = useRef(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const save = async () => {
    if (draft === value) { setEditing(false); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === "string" ? d : Array.isArray(d) ? d[0]?.msg : "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => { setDraft(value); setEditing(false); setError(null); };

  return (
    <div className="group/field">
      <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-2">
        {label}
      </label>
      <div
        className={`flex items-center gap-3 bg-neutral-800/40 border rounded-xl px-4 py-3.5 transition-all ${
          editing ? "border-neutral-600 ring-1 ring-neutral-700/50" : "border-neutral-800 hover:border-neutral-700"
        }`}
      >
        <Icon size={15} className="text-neutral-500 shrink-0" />

        {editing ? (
          <input
            ref={inputRef}
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={saving}
            onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
            className="flex-1 bg-transparent text-sm text-white focus:outline-none min-w-0"
          />
        ) : (
          <span className="flex-1 text-sm text-neutral-200 truncate">
            {value || <span className="text-neutral-600 italic">Not set</span>}
          </span>
        )}

        <AnimatePresence mode="wait">
          {editing ? (
            <motion.div
              key="actions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-1 shrink-0"
            >
              {saving ? (
                <Loader2 size={15} className="animate-spin text-neutral-400" />
              ) : (
                <>
                  <button onClick={save} className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                    <Check size={13} />
                  </button>
                  <button onClick={cancel} className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-800 transition-colors">
                    <X size={13} />
                  </button>
                </>
              )}
            </motion.div>
          ) : (
            <motion.button
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-neutral-600 hover:text-white hover:bg-neutral-800 transition-all opacity-0 group-hover/field:opacity-100"
            >
              <Pencil size={13} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

function DangerZone({ onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading]       = useState(false);

  const run = async () => {
    setLoading(true);
    try { await onDelete(); } finally { setLoading(false); }
  };

  return (
    <div className="border border-red-500/15 rounded-2xl p-6 bg-red-500/[0.03]">
      <p className="text-xs font-semibold uppercase tracking-widest text-red-500/50 mb-1">Danger Zone</p>
      <p className="text-sm text-neutral-500 mb-5">
        Permanently delete your account and all associated data. This cannot be undone.
      </p>
      <AnimatePresence mode="wait">
        {!confirming ? (
          <motion.button
            key="trigger"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirming(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-red-400 border border-red-500/25 hover:bg-red-500/10 transition-all font-medium"
          >
            <Trash2 size={14} /> Delete Account
          </motion.button>
        ) : (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 flex-wrap"
          >
            <span className="text-sm text-red-400">Are you absolutely sure?</span>
            <button
              onClick={run}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              Confirm
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-4 py-2 rounded-xl text-sm text-neutral-500 border border-neutral-800 hover:bg-neutral-800 transition-all"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile]         = useState(null);
  const [stats, setStats]             = useState(null);
  const [badges, setBadges]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const [pageError, setPageError]     = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [pRes, sRes, bRes] = await Promise.all([
          API.get("/users/me"),
          API.get("/users/me/stats"),
          API.get("/badges"),
        ]);
        setProfile(pRes.data);
        setStats(sRes.data);
        setBadges(bRes.data);
      } catch (err) {
        const d = err.response?.data?.detail;
        setPageError(typeof d === "string" ? d : "Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const flashSuccess = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleUpdateEmail    = async (email)    => { const { data } = await API.patch("/users/me", { email }); setProfile((p) => ({ ...p, email: data.email })); flashSuccess(); };
  const handleUpdatePassword = async (password) => { await API.patch("/users/me", { password }); flashSuccess(); };
  const handleLogout         = ()               => { localStorage.removeItem("token"); navigate("/", { replace: true }); };
  const handleDelete         = async ()         => { await API.delete("/users/me"); localStorage.removeItem("token"); navigate("/", { replace: true }); };

  if (loading) {
    return (
      <div className="flex h-screen bg-neutral-950 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neutral-700 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-xs text-neutral-600 uppercase tracking-widest">Loading profile</p>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex h-screen bg-neutral-950 items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle size={36} className="mx-auto text-red-400 mb-4" />
          <p className="text-neutral-400 text-sm mb-6">{pageError}</p>
          <button onClick={() => navigate("/dashboard")} className="px-6 py-2.5 bg-white text-black rounded-xl text-sm font-bold hover:bg-neutral-200 transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const xp      = stats?.total_xp ?? 0;
  const level   = getLevel(xp);
  const nextXP  = level.n < 5 ? level.max + 1 : null;
  const prevXP  = level.min;
  const progress = nextXP ? ((xp - prevXP) / (nextXP - prevXP)) * 100 : 100;

  const initials = (profile?.email || "")
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-72 bg-neutral-900/50 border-r border-neutral-800 p-8 hidden lg:flex flex-col">
        <div className="flex items-center gap-3 text-xl font-bold tracking-tight mb-12">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain size={18} className="text-white" />
          </div>
          StudyCoach
        </div>
        <nav className="space-y-1.5 flex-1">
          <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard"    onClick={() => navigate("/dashboard")} />
          <SidebarItem icon={<BookOpen size={18} />}        label="Study Logs"   onClick={() => navigate("/log-session")} />
          <SidebarItem icon={<TrendingUp size={18} />}      label="Performance"  onClick={() => navigate("/performance")} />
          <SidebarItem icon={<Timer size={18} />}           label="Pomodoro"     onClick={() => navigate("/pomodoro")} />
          <SidebarItem icon={<MessageSquare size={18} />}   label="AI Tutor"     onClick={() => navigate("/tutor")} />
          <SidebarItem icon={<Users size={18} />}           label="Study Groups" onClick={() => navigate("/study-groups")} />
          <SidebarItem icon={<BookMarked size={18} />}      label="Flashcards"   onClick={() => navigate("/flashcards")} />
          <SidebarItem icon={<User size={18} />}            label="Profile"      active />
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-neutral-500 hover:text-red-400 transition-colors p-3 mt-auto group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 md:p-12">

          {/* Header */}
          <header className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Profile</h1>
              <p className="text-neutral-500 mt-1">Manage your account and see your progress.</p>
            </div>
            <AnimatePresence>
              {saveSuccess && (
                <motion.div
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-semibold"
                >
                  <Check size={13} /> Saved
                </motion.div>
              )}
            </AnimatePresence>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">

            {/* ── LEFT COLUMN ── */}
            <div className="space-y-6">

              {/* Avatar card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-7 flex flex-col items-center text-center"
              >
                {/* Avatar ring */}
                <div className="relative mb-5">
                  <div
                    className="absolute inset-0 rounded-full blur-xl scale-110 opacity-30"
                    style={{ background: `radial-gradient(circle, ${level.color}, transparent)` }}
                  />
                  <div className="relative w-20 h-20 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center">
                    <span className="text-xl font-bold text-white">{initials}</span>
                  </div>
                  {/* Level badge */}
                  <div
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-neutral-950 flex items-center justify-center text-[10px] font-black text-white"
                    style={{ background: level.color }}
                  >
                    {level.n}
                  </div>
                </div>

                <p className="font-semibold text-sm text-neutral-200 truncate max-w-full mb-1">
                  {profile?.email}
                </p>
                <span
                  className="text-xs font-bold px-3 py-1 rounded-full mb-5"
                  style={{ background: `${level.color}20`, color: level.color }}
                >
                  {level.label}
                </span>

                {/* XP Progress */}
                <div className="w-full">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-neutral-500">{xp} XP</span>
                    {nextXP ? (
                      <span className="text-xs text-neutral-600">{nextXP} XP next level</span>
                    ) : (
                      <span className="text-xs text-neutral-600">Max level</span>
                    )}
                  </div>
                  <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
                      className="h-full rounded-full"
                      style={{ background: level.color }}
                    />
                  </div>
                </div>

                {profile?.created_at && (
                  <p className="text-xs text-neutral-600 mt-4">
                    Member since{" "}
                    {new Date(profile.created_at).toLocaleDateString("en-US", {
                      year: "numeric", month: "long",
                    })}
                  </p>
                )}
              </motion.div>

              {/* Stats grid */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600 mb-3 px-1">
                  Activity Stats
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <StatCard icon={Flame}    label="Streak"   value={`${stats?.streak ?? 0}d`}                   color="#f59e0b" delay={0.05} />
                  <StatCard icon={Clock}    label="Hours"    value={fmt(stats?.total_study_hours ?? 0)}          color="#3b82f6" delay={0.1}  />
                  <StatCard icon={BookOpen} label="Sessions" value={String(stats?.total_sessions ?? 0)}          color="#10b981" delay={0.15} />
                  <StatCard icon={Star}     label="XP"       value={String(stats?.total_xp ?? 0)}                color="#a855f7" delay={0.2}  />
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="space-y-5">

              {/* Account Info */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 space-y-5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <User size={14} className="text-neutral-500" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
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

              {/* Security */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 space-y-5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={14} className="text-neutral-500" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
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
                <p className="text-xs text-neutral-600 pt-1 border-t border-neutral-800/60">
                  Your password is hashed and never stored in plain text.
                </p>
              </motion.div>

              {/* Badges */}
              {badges && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ChevronRight size={14} className="text-neutral-500" />
                      <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">Badges</span>
                    </div>
                    <span className="text-xs font-bold text-neutral-500">
                      {badges.earned_count} / {badges.total}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {badges.badges.map((badge, i) => (
                      <motion.div
                        key={badge.id}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.28 + i * 0.03 }}
                        title={`${badge.name}: ${badge.desc}`}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                          badge.earned
                            ? "border-neutral-700 bg-neutral-800/50"
                            : "border-neutral-800/50 bg-neutral-900/20 opacity-35 grayscale"
                        }`}
                      >
                        <span className="text-2xl leading-none">{badge.emoji}</span>
                        <p className="text-xs font-semibold text-center leading-tight">{badge.name}</p>
                        {badge.earned && (
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                      </motion.div>
                    ))}
                  </div>
                  {badges.earned_count < badges.total && (
                    <p className="text-xs text-neutral-700 mt-4 text-center">
                      Hover a badge to see how to unlock it
                    </p>
                  )}
                </motion.div>
              )}

              {/* Level benefits */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Star size={14} className="text-neutral-500" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                    Rank Progress
                  </span>
                </div>
                <div className="space-y-2">
                  {LEVELS.map((l) => (
                    <div key={l.n} className="flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0"
                        style={{ background: l.n <= level.n ? l.color : "#262626" }}
                      >
                        {l.n}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span
                          className={`text-sm font-medium ${l.n === level.n ? "text-white" : l.n < level.n ? "text-neutral-500 line-through" : "text-neutral-600"}`}
                        >
                          {l.label}
                        </span>
                        <span className="text-xs text-neutral-600">
                          {l.n < 5 ? `${l.min}–${l.max} XP` : `${l.min}+ XP`}
                        </span>
                      </div>
                      {l.n === level.n && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: `${l.color}20`, color: l.color }}>
                          Current
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Danger Zone */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <DangerZone onDelete={handleDelete} />
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
