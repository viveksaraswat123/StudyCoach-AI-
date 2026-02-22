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
  Menu,
  X,
  ArrowRight,
  Users,
  MessageSquare,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching dashboard data...");
        const [statsRes, logsRes] = await Promise.all([
          API.get("/dashboard/stats"),
          API.get("/logs?limit=5"),
        ]);
        console.log("Dashboard stats:", statsRes.data);
        console.log("Study logs:", logsRes.data);
        setStats(statsRes.data);
        setLogs(logsRes.data);
        setError(null);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        
        // Only redirect on auth errors, not other errors
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError(err.response?.data?.detail || "Failed to load dashboard");
          // Still show dashboard with empty state instead of blank screen
          setStats({ user: "User", total_hours: 0, study_streak: 0, average_focus: 0, topics_studied: 0, chart_data: [] });
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
    navigate("/");
  };

  if (loading) return <DashboardSkeleton />;

  const focusColors = {
    high: "#10b981",
    medium: "#f59e0b",
    low: "#ef4444",
  };

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
            label="AI Tutor"
            onClick={() => navigate("/tutor")}
          />
          <SidebarItem
            icon={<Users size={18} />}
            label="Study Groups"
            onClick={() => navigate("/study-groups")}
          />
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-neutral-500 hover:text-red-400 transition-colors p-3 mt-auto group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </aside>

      {/* MAIN VIEW */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-12">
          {/* HEADER */}
          <header className="flex items-center justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Welcome Back</h1>
              <p className="text-neutral-500">
                {stats?.user}
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
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-500 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* QUICK ACCESS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/tutor")}
              className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 p-6 rounded-2xl text-left hover:border-purple-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <MessageSquare size={28} className="text-purple-400" />
                <ArrowRight size={18} className="text-purple-400" />
              </div>
              <h3 className="text-lg font-bold">AI Tutor</h3>
              <p className="text-neutral-400 text-sm mt-1">
                Ask questions and get expert guidance
              </p>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/study-groups")}
              className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 p-6 rounded-2xl text-left hover:border-emerald-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <Users size={28} className="text-emerald-400" />
                <ArrowRight size={18} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold">Study Groups</h3>
              <p className="text-neutral-400 text-sm mt-1">
                Connect with peers and compete on leaderboards
              </p>
            </motion.button>
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
              change={stats?.study_streak > 0 ? "Keep it going!" : "Start your streak"}
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ACTIVITY CHART */}
            <section className="lg:col-span-2 bg-neutral-900/40 border border-neutral-800 p-8 rounded-2xl backdrop-blur-sm hover:border-neutral-700 transition-colors">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold">Weekly Activity</h3>
                  <p className="text-neutral-500 text-sm mt-1">Study hours per day</p>
                </div>
              </div>

              {stats?.chart_data && stats.chart_data.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chart_data}>
                      <defs>
                        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#171717",
                          border: "1px solid #262626",
                          borderRadius: "12px",
                        }}
                        itemStyle={{ color: "#3b82f6", fontSize: "12px" }}
                        formatter={(value) => `${value.toFixed(1)}h`}
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
                  <p className="text-neutral-500">No activity data yet. Start logging sessions!</p>
                </div>
              )}
            </section>

            {/* RECENT SESSIONS */}
            <section className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden backdrop-blur-sm hover:border-neutral-700 transition-colors">
              <div className="p-8 border-b border-neutral-800">
                <h3 className="text-xl font-bold">Recent Sessions</h3>
                <p className="text-neutral-500 text-sm mt-1">Latest study logs</p>
              </div>

              <div className="divide-y divide-neutral-800 max-h-96 overflow-y-auto">
                {logs && logs.length > 0 ? (
                  logs.map((log, idx) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 hover:bg-neutral-800/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-neutral-100 truncate">
                          {log.topic}
                        </h4>
                        <span
                          className="px-2 py-1 rounded text-xs font-bold text-white"
                          style={{
                            backgroundColor: focusColors[log.focus_level],
                          }}
                        >
                          {log.focus_level.charAt(0).toUpperCase() +
                            log.focus_level.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm text-neutral-500">
                        <span>{log.hours}h</span>
                        <span>{new Date(log.study_date).toLocaleDateString()}</span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-neutral-500 mb-4">No sessions logged yet</p>
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
    </div>
  );
}

/* HELPER COMPONENTS */

function SidebarItem({ icon, label, active = false, onClick }) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={onClick}
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