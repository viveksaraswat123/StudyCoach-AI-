import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import API from "../api/client";
import {
  LayoutDashboard, BookOpen, TrendingUp, MessageSquare, Users,
  Timer, BookMarked, User, Brain, LogOut, Flame, Clock, BarChart3, Target,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";

export default function Performance() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          API.get("/dashboard/stats"),
          API.get("/logs?limit=500"),
        ]);
        setStats(statsRes.data);
        setLogs(logsRes.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const focusDist = useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    logs.forEach((l) => { if (l.focus_level in counts) counts[l.focus_level]++; });
    const total = counts.high + counts.medium + counts.low || 1;
    return [
      { label: "High", count: counts.high, pct: Math.round((counts.high / total) * 100), color: "#10b981" },
      { label: "Medium", count: counts.medium, pct: Math.round((counts.medium / total) * 100), color: "#f59e0b" },
      { label: "Low", count: counts.low, pct: Math.round((counts.low / total) * 100), color: "#ef4444" },
    ];
  }, [logs]);

  const topTopics = useMemo(() => {
    const map = {};
    logs.forEach((l) => { map[l.topic] = (map[l.topic] || 0) + (l.hours || 0); });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([topic, hours]) => ({ topic: topic.length > 22 ? topic.slice(0, 22) + "…" : topic, hours: +hours.toFixed(1) }));
  }, [logs]);

  const totalHours = logs.reduce((s, l) => s + (l.hours || 0), 0);
  const avgSession = logs.length ? totalHours / logs.length : 0;
  const bestDay = useMemo(() => {
    if (!stats?.chart_data?.length) return "—";
    const best = stats.chart_data.reduce((a, b) => (b.hours > a.hours ? b : a), stats.chart_data[0]);
    return best.hours > 0 ? best.day : "—";
  }, [stats]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/", { replace: true });
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-72 bg-neutral-900/50 border-r border-neutral-800 p-8 hidden lg:flex flex-col flex-shrink-0">
        <div className="flex items-center gap-3 text-xl font-bold tracking-tight mb-12">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain size={18} className="text-white" />
          </div>
          StudyCoach
        </div>
        <nav className="space-y-1.5 flex-1">
          <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => navigate("/dashboard")} />
          <SidebarItem icon={<BookOpen size={18} />} label="Study Logs" onClick={() => navigate("/logs")} />
          <SidebarItem icon={<TrendingUp size={18} />} label="Performance" active />
          <SidebarItem icon={<MessageSquare size={18} />} label="Tutor" onClick={() => navigate("/tutor")} />
          <SidebarItem icon={<Users size={18} />} label="Study Groups" onClick={() => navigate("/study-groups")} />
          <SidebarItem icon={<Timer size={18} />} label="Pomodoro" onClick={() => navigate("/pomodoro")} />
          <SidebarItem icon={<BookMarked size={18} />} label="Flashcards" onClick={() => navigate("/flashcards")} />
          <SidebarItem icon={<User size={18} />} label="Profile" onClick={() => navigate("/profile")} />
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
        <div className="max-w-6xl mx-auto p-6 md:p-10">
          <header className="mb-10">
            <h1 className="text-4xl font-bold tracking-tight">Performance</h1>
            <p className="text-neutral-500 mt-1">Your study analytics at a glance</p>
          </header>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-neutral-900/50 border border-neutral-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <KpiCard
                  label="Total Hours"
                  value={`${totalHours.toFixed(1)}h`}
                  icon={<Clock size={20} className="text-blue-400" />}
                  gradient="from-blue-500/10 to-blue-600/10"
                  border="border-blue-500/10 hover:border-blue-500/25"
                />
                <KpiCard
                  label="Total Sessions"
                  value={logs.length}
                  icon={<BarChart3 size={20} className="text-purple-400" />}
                  gradient="from-purple-500/10 to-purple-600/10"
                  border="border-purple-500/10 hover:border-purple-500/25"
                />
                <KpiCard
                  label="Avg Session"
                  value={`${avgSession.toFixed(1)}h`}
                  icon={<Target size={20} className="text-emerald-400" />}
                  gradient="from-emerald-500/10 to-emerald-600/10"
                  border="border-emerald-500/10 hover:border-emerald-500/25"
                />
                <KpiCard
                  label="Study Streak"
                  value={`${stats?.study_streak || 0}d`}
                  icon={<Flame size={20} className="text-orange-400" />}
                  gradient="from-orange-500/10 to-orange-600/10"
                  border="border-orange-500/10 hover:border-orange-500/25"
                />
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                {/* Weekly activity */}
                <motion.section
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="lg:col-span-3 bg-neutral-900/40 border border-neutral-800 rounded-2xl p-7 hover:border-neutral-700 transition-colors"
                >
                  <h3 className="text-lg font-bold mb-1">Weekly Activity</h3>
                  <p className="text-neutral-500 text-sm mb-6">Hours studied per day (last 7 days)</p>
                  {stats?.chart_data?.length ? (
                    <div className="h-52">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.chart_data}>
                          <defs>
                            <linearGradient id="perf-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke="#262626" vertical={false} strokeDasharray="3 3" />
                          <XAxis dataKey="day" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#171717", border: "1px solid #262626", borderRadius: "12px" }}
                            itemStyle={{ color: "#3b82f6", fontSize: "12px" }}
                            formatter={(v) => (typeof v === "number" ? [`${v.toFixed(1)}h`, "Hours"] : ["0.0h", "Hours"])}
                          />
                          <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={2} fill="url(#perf-grad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <EmptyChart message="No activity in the last 7 days" />
                  )}
                  {bestDay !== "—" && (
                    <p className="text-xs text-neutral-600 mt-4">
                      Best day this week: <span className="text-neutral-400 font-semibold">{bestDay}</span>
                    </p>
                  )}
                </motion.section>

                {/* Focus distribution */}
                <motion.section
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="lg:col-span-2 bg-neutral-900/40 border border-neutral-800 rounded-2xl p-7 hover:border-neutral-700 transition-colors"
                >
                  <h3 className="text-lg font-bold mb-1">Focus Breakdown</h3>
                  <p className="text-neutral-500 text-sm mb-6">Distribution across all sessions</p>
                  {logs.length === 0 ? (
                    <EmptyChart message="Log sessions to see breakdown" />
                  ) : (
                    <div className="space-y-5 mt-2">
                      {focusDist.map((f) => (
                        <div key={f.label}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-neutral-300">{f.label}</span>
                            <span className="text-sm font-bold" style={{ color: f.color }}>
                              {f.pct}% <span className="text-neutral-600 font-normal text-xs">({f.count})</span>
                            </span>
                          </div>
                          <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${f.pct}%` }}
                              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ background: f.color }}
                            />
                          </div>
                        </div>
                      ))}
                      <p className="text-xs text-neutral-600 pt-2">
                        Focus score: <span className="text-neutral-400 font-semibold">{stats?.average_focus || 0}%</span>
                      </p>
                    </div>
                  )}
                </motion.section>
              </div>

              {/* Top topics */}
              <motion.section
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-7 hover:border-neutral-700 transition-colors"
              >
                <h3 className="text-lg font-bold mb-1">Top Subjects</h3>
                <p className="text-neutral-500 text-sm mb-6">Hours invested by topic</p>
                {topTopics.length === 0 ? (
                  <EmptyChart message="No subjects logged yet" />
                ) : (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topTopics} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
                        <CartesianGrid stroke="#262626" horizontal={false} strokeDasharray="3 3" />
                        <XAxis
                          type="number"
                          stroke="#525252"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(v) => `${v}h`}
                        />
                        <YAxis
                          type="category"
                          dataKey="topic"
                          stroke="#525252"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          width={120}
                        />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#171717", border: "1px solid #262626", borderRadius: "12px" }}
                          itemStyle={{ color: "#a78bfa", fontSize: "12px" }}
                          formatter={(v) => [`${v}h`, "Hours"]}
                        />
                        <Bar dataKey="hours" radius={[0, 6, 6, 0]} maxBarSize={18}>
                          {topTopics.map((_, i) => (
                            <Cell key={i} fill={`hsl(${220 + i * 18}, 70%, ${60 - i * 4}%)`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </motion.section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function KpiCard({ label, value, icon, gradient, border }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className={`bg-gradient-to-br ${gradient} border ${border} rounded-2xl p-6 transition-all duration-300`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="p-2.5 bg-neutral-800/60 rounded-xl">{icon}</div>
      </div>
      <p className="text-3xl font-bold tracking-tight mb-1">{value}</p>
      <p className="text-xs uppercase tracking-widest text-neutral-600">{label}</p>
    </motion.div>
  );
}

function EmptyChart({ message }) {
  return (
    <div className="h-52 flex items-center justify-center">
      <p className="text-neutral-600 text-sm">{message}</p>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, onClick }) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all group ${
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
