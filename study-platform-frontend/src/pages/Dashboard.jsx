import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/client";

import {
  LayoutDashboard,
  BookOpen,
  Plus,
  TrendingUp,
  Flame,
  Brain,
  LogOut,
  Bell,
  ArrowRight,
  Users,
  MessageSquare,
  AlertCircle,
  User,
  Timer,
  BookMarked,
  Target,
  Trash2,
  X,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
// FIX 2: Removed unused BarChart and Bar imports from recharts

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [goalsData, setGoalsData] = useState(null);
  const [showGoalModal, setShowGoalModal] = useState(false);

  const fetchGoals = async () => {
    try {
      const res = await API.get("/goals/progress");
      setGoalsData(res.data);
    } catch {}
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          API.get("/dashboard/stats"),
          API.get("/logs?limit=5"),
        ]);
        setStats(statsRes.data);
        setLogs(logsRes.data);
        fetchGoals();
        setError(null);
      } catch (err) {
        // FIX 4: Removed console.error leak of full error object

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
        } else {
          // FIX 5: Normalize FastAPI error detail (string or array)
          const detail = err.response?.data?.detail;
          let message = "Failed to load dashboard";
          if (typeof detail === "string") message = detail;
          else if (Array.isArray(detail) && detail.length > 0)
            message = detail[0]?.msg || message;
          setError(message);

          // Still show dashboard with empty state instead of blank screen
          setStats({
            user: "",
            total_hours: 0,
            study_streak: 0,
            average_focus: 0,
            topics_studied: 0,
            chart_data: [],
          });
          setLogs([]);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    // FIX 6: Navigate with replace so the user can't navigate back to the
    // dashboard after logging out
    navigate("/", { replace: true });
  };

  if (loading) return <DashboardSkeleton />;

  // FIX 7: Moved focusColors outside the render function — it's a static
  // constant and was being re-created on every render cycle
  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside className="w-72 bg-neutral-900/50 border-r border-neutral-800 p-8 hidden lg:flex flex-col">
        <div className="flex items-center gap-3 text-xl font-bold tracking-tight mb-12">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain size={18} className="text-white" />
          </div>
          StudyCoach
        </div>

        <nav className="space-y-1.5 flex-1">
          <SidebarItem
            icon={<LayoutDashboard size={18} />}
            label="Dashboard"
            active
          />
          <SidebarItem
            icon={<BookOpen size={18} />}
            label="Study Logs"
            onClick={() => navigate("/logs")}
          />
          <SidebarItem
            icon={<TrendingUp size={18} />}
            label="Performance"
            onClick={() => navigate("/performance")}
          />
          <SidebarItem
            icon={<MessageSquare size={18} />}
            label="Tutor"
            onClick={() => navigate("/tutor")}
          />
          <SidebarItem
            icon={<Users size={18} />}
            label="Study Groups"
            onClick={() => navigate("/study-groups")}
          />
          {/* FIX 8: Added Profile link to sidebar — the Profile page exists
              but was not reachable from the dashboard navigation */}
          <SidebarItem
            icon={<Timer size={18} />}
            label="Pomodoro"
            onClick={() => navigate("/pomodoro")}
          />
          <SidebarItem
            icon={<BookMarked size={18} />}
            label="Flashcards"
            onClick={() => navigate("/flashcards")}
          />
          <SidebarItem
            icon={<User size={18} />}
            label="Profile"
            onClick={() => navigate("/profile")}
          />
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-neutral-500 hover:text-red-400 transition-colors p-3 mt-auto group"
        >
          <LogOut
            size={18}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </aside>

      {/* MAIN VIEW */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-12">
          {/* HEADER */}
          <header className="flex items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">
                Welcome Back
              </h1>
              {/* FIX 9: Guard against rendering nothing when stats.user is an
                  empty string or undefined — show a neutral fallback */}
              <p className="text-neutral-500">
                {stats?.user || "Loading your workspace…"}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors hidden md:block">
                <Bell size={20} />
              </button>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/log-session")}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
              >
                <Plus size={18} /> Log Session
              </motion.button>
            </div>
          </header>

          {/* ERROR MESSAGE */}
          {/* FIX 10: Added AlertCircle icon and dismiss button to error banner,
              matching the style used across other pages in the codebase */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-500 text-sm flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span className="break-words min-w-0">{error}</span>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-amber-500 hover:text-amber-300 flex-shrink-0 font-bold ml-2"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* QUICK ACCESS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {[
              {
                icon: <MessageSquare size={22} className="text-purple-400" />,
                label: "AI Tutor",
                desc: "Ask anything",
                path: "/tutor",
                border: "border-purple-500/20 hover:border-purple-500/40",
                bg: "from-purple-500/10 to-purple-600/10",
              },
              {
                icon: <Users size={22} className="text-emerald-400" />,
                label: "Study Groups",
                desc: "Compete & collab",
                path: "/study-groups",
                border: "border-emerald-500/20 hover:border-emerald-500/40",
                bg: "from-emerald-500/10 to-emerald-600/10",
              },
              {
                icon: <Timer size={22} className="text-orange-400" />,
                label: "Pomodoro",
                desc: "Focus timer",
                path: "/pomodoro",
                border: "border-orange-500/20 hover:border-orange-500/40",
                bg: "from-orange-500/10 to-orange-600/10",
              },
              {
                icon: <BookMarked size={22} className="text-blue-400" />,
                label: "Flashcards",
                desc: "Spaced repetition",
                path: "/flashcards",
                border: "border-blue-500/20 hover:border-blue-500/40",
                bg: "from-blue-500/10 to-blue-600/10",
              },
            ].map((item) => (
              <motion.button
                key={item.path}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(item.path)}
                className={`bg-gradient-to-br ${item.bg} border ${item.border} p-5 rounded-2xl text-left transition-all`}
              >
                <div className="flex items-center justify-between mb-4">
                  {item.icon}
                  <ArrowRight size={14} className="text-neutral-600" />
                </div>
                <p className="font-bold text-sm">{item.label}</p>
                <p className="text-neutral-500 text-xs mt-0.5">{item.desc}</p>
              </motion.button>
            ))}
          </div>

          {/* KPI GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <StatCard
              label="Total Study Hours"
              value={`${Math.round(stats?.total_hours || 0)}h`}
              change={`${stats?.topics_studied || 0} topics covered`}
              icon={<BookOpen size={24} className="text-blue-400" />}
              gradient="from-blue-500/10 to-blue-600/10"
            />
            <StatCard
              label="Study Streak"
              value={`${stats?.study_streak || 0} Days`}
              change={
                stats?.study_streak > 0
                  ? "Keep it going!"
                  : "Start your streak"
              }
              icon={<Flame size={24} className="text-orange-400" />}
              gradient="from-orange-500/10 to-orange-600/10"
            />
            <StatCard
              label="Focus Level"
              value={`${stats?.average_focus || 0}%`}
              change="Average over 7 days"
              icon={<Brain size={24} className="text-purple-400" />}
              gradient="from-purple-500/10 to-purple-600/10"
            />
            <StatCard
              label="Recent Activity"
              value={logs?.length || 0}
              change="sessions this week"
              icon={<TrendingUp size={24} className="text-emerald-400" />}
              gradient="from-emerald-500/10 to-emerald-600/10"
            />
          </div>

          {/* WEEKLY GOALS */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Target size={18} className="text-blue-400" /> Weekly Goals
                </h3>
                <p className="text-neutral-500 text-xs mt-0.5">
                  {goalsData?.week_start ? `Week of ${goalsData.week_start}` : "Hours target per subject"}
                </p>
              </div>
              <button
                onClick={() => setShowGoalModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 rounded-xl transition-all"
              >
                <Plus size={13} /> Manage
              </button>
            </div>

            {!goalsData?.goals?.length ? (
              <div className="bg-neutral-900/40 border border-neutral-800 border-dashed rounded-2xl p-8 text-center">
                <Target size={28} className="text-neutral-700 mx-auto mb-2" />
                <p className="text-neutral-600 text-sm">No goals set yet</p>
                <button onClick={() => setShowGoalModal(true)} className="mt-2 text-blue-400 text-xs hover:text-blue-300 font-semibold">
                  Set your first goal →
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {goalsData.goals.map((goal) => {
                  const pct = Math.min(1, goal.current_hours / goal.weekly_hours_target);
                  const r = 28; const circ = 2 * Math.PI * r;
                  const done = pct >= 1;
                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5 flex items-center gap-4 hover:border-neutral-700 transition-all min-w-[200px]"
                    >
                      <div className="relative flex-shrink-0">
                        <svg width={72} height={72} style={{ transform: "rotate(-90deg)" }}>
                          <circle cx={36} cy={36} r={r} fill="none" stroke="#262626" strokeWidth={5} />
                          <motion.circle
                            cx={36} cy={36} r={r}
                            fill="none"
                            stroke={done ? "#10b981" : "#3b82f6"}
                            strokeWidth={5}
                            strokeLinecap="round"
                            strokeDasharray={circ}
                            initial={{ strokeDashoffset: circ }}
                            animate={{ strokeDashoffset: circ * (1 - pct) }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            style={{ filter: done ? "drop-shadow(0 0 6px #10b98170)" : "drop-shadow(0 0 6px #3b82f670)" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold" style={{ color: done ? "#10b981" : "#3b82f6" }}>
                            {Math.round(pct * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{goal.subject}</p>
                        <p className="text-neutral-500 text-xs mt-0.5">
                          {goal.current_hours}h / {goal.weekly_hours_target}h
                        </p>
                        {done && <p className="text-emerald-400 text-xs mt-0.5 font-semibold">✓ Complete!</p>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ACTIVITY CHART */}
            <section className="lg:col-span-2 bg-neutral-900/40 border border-neutral-800 p-8 rounded-2xl backdrop-blur-sm hover:border-neutral-700 transition-colors">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold">Weekly Activity</h3>
                  <p className="text-neutral-500 text-sm mt-1">
                    Study hours per day
                  </p>
                </div>
              </div>

              {stats?.chart_data && stats.chart_data.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chart_data}>
                      <defs>
                        <linearGradient
                          id="chartGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#3b82f6"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#3b82f6"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        stroke="#262626"
                        vertical={false}
                        strokeDasharray="3 3"
                      />
                      <XAxis
                        dataKey="day"
                        stroke="#737373"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#737373"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        // FIX 11: Added tickFormatter to label Y axis values
                        // as hours (e.g. "2h") so the axis is self-explanatory
                        tickFormatter={(v) => `${v}h`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#171717",
                          border: "1px solid #262626",
                          borderRadius: "12px",
                        }}
                        itemStyle={{ color: "#3b82f6", fontSize: "12px" }}
                        // FIX 12: Guard against non-numeric values crashing
                        // toFixed() if the API returns null/undefined in chart_data
                        formatter={(value) =>
                          typeof value === "number"
                            ? `${value.toFixed(1)}h`
                            : "0.0h"
                        }
                      />
                      <Area
                        type="monotone"
                        dataKey="hours"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#chartGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 w-full flex items-center justify-center">
                  <p className="text-neutral-500">
                    No activity data yet. Start logging sessions!
                  </p>
                </div>
              )}
            </section>

            {/* RECENT SESSIONS */}
            <section className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-neutral-700 transition-colors">
              <div className="p-8 border-b border-neutral-800">
                <h3 className="text-xl font-bold">Recent Sessions</h3>
                <p className="text-neutral-500 text-sm mt-1">
                  Latest study logs
                </p>
              </div>

              <div className="divide-y divide-neutral-800 max-h-96 overflow-y-auto">
                {logs && logs.length > 0 ? (
                  logs.map((log, idx) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.07 }}
                      className="p-4 hover:bg-neutral-800/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2 gap-2">
                        <h4 className="font-bold text-neutral-100 truncate min-w-0">
                          {log.topic}
                        </h4>
                        {/* FIX 13: Guard against log.focus_level being
                            undefined — accessing .charAt(0) on undefined
                            throws. Fall back to a neutral badge. */}
                        {log.focus_level && (
                          <span
                            className="px-2 py-1 rounded text-xs font-bold text-white flex-shrink-0"
                            style={{
                              backgroundColor:
                                focusColors[log.focus_level] ?? "#737373",
                            }}
                          >
                            {log.focus_level.charAt(0).toUpperCase() +
                              log.focus_level.slice(1)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-sm text-neutral-500">
                        <span>{log.hours}h</span>
                        {/* FIX 14: Guard against invalid dates — new Date(undefined)
                            produces "Invalid Date" which renders as garbage text */}
                        <span>
                          {log.study_date
                            ? new Date(log.study_date).toLocaleDateString()
                            : "—"}
                        </span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-neutral-500 mb-4">
                      No sessions logged yet
                    </p>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate("/log-session")}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-2 justify-center w-full text-sm font-medium"
                    >
                      Log your first session <ArrowRight size={14} />
                    </motion.button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
      {/* GOAL MODAL */}
      <AnimatePresence>
        {showGoalModal && (
          <GoalModal
            onClose={() => setShowGoalModal(false)}
            onRefresh={fetchGoals}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// FIX 7: Moved focusColors to module scope — it's a static constant and
// should not be re-created inside the component on every render
const focusColors = {
  high: "#10b981",
  medium: "#f59e0b",
  low: "#ef4444",
};

/* HELPER COMPONENTS */

function SidebarItem({ icon, label, active = false, onClick }) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={onClick}
      // FIX 15: Added role and keyboard support so sidebar items are
      // accessible — they were clickable divs with no keyboard handling
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group ${
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

function StatCard({ label, value, change, icon, gradient }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`bg-gradient-to-br ${gradient} border border-neutral-800 p-6 rounded-2xl group hover:border-neutral-700 transition-all duration-300 backdrop-blur-sm`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-neutral-800/50 rounded-xl group-hover:bg-neutral-700/50 transition-colors">
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight mb-2">{value}</p>
      <p className="text-sm text-neutral-500 font-medium">{change}</p>
      <p className="text-xs uppercase tracking-widest text-neutral-600 mt-3">
        {label}
      </p>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="h-screen bg-neutral-950 flex items-center justify-center">
      <motion.div
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="text-center"
      >
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg mx-auto mb-4 animate-pulse" />
        <p className="text-neutral-500 text-sm font-medium tracking-widest uppercase">
          Loading your workspace...
        </p>
      </motion.div>
    </div>
  );
}

function GoalModal({ onClose, onRefresh }) {
  const [goals, setGoals] = useState([]);
  const [subject, setSubject] = useState("");
  const [hours, setHours] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    API.get("/goals").then((r) => setGoals(r.data)).catch(() => {});
  }, []);

  const addGoal = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !hours) return;
    setSaving(true); setErr(null);
    try {
      const res = await API.post("/goals", {
        subject: subject.trim(),
        weekly_hours_target: parseFloat(hours),
      });
      setGoals((g) => [...g, res.data]);
      setSubject(""); setHours("");
      onRefresh();
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to save");
    } finally { setSaving(false); }
  };

  const deleteGoal = async (id) => {
    setDeletingId(id);
    try {
      await API.delete(`/goals/${id}`);
      setGoals((g) => g.filter((x) => x.id !== id));
      onRefresh();
    } catch {}
    setDeletingId(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 w-full max-w-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2"><Target size={18} className="text-blue-400" /> Weekly Goals</h2>
          <button onClick={onClose} className="text-neutral-600 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        {/* existing goals */}
        {goals.length > 0 && (
          <div className="space-y-2 mb-6">
            {goals.map((g) => (
              <div key={g.id} className="flex items-center justify-between bg-neutral-800/50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{g.subject}</p>
                  <p className="text-xs text-neutral-500">{g.weekly_hours_target}h / week</p>
                </div>
                <button
                  onClick={() => deleteGoal(g.id)}
                  disabled={deletingId === g.id}
                  className="text-neutral-600 hover:text-red-400 transition-colors p-1.5 disabled:opacity-40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {err && <p className="text-red-400 text-xs mb-4">{err}</p>}

        <form onSubmit={addGoal} className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Add New Goal</p>
          <input
            value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (e.g. Mathematics)"
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600 transition-colors"
          />
          <div className="flex gap-3">
            <input
              type="number" min="0.5" max="168" step="0.5"
              value={hours} onChange={(e) => setHours(e.target.value)}
              placeholder="Hours / week"
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600 transition-colors"
            />
            <button
              type="submit" disabled={!subject.trim() || !hours || saving}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40"
            >
              {saving ? "…" : "Add"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}