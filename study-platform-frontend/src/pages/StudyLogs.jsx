import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import API from "../api/client";
import {
  LayoutDashboard, BookOpen, TrendingUp, MessageSquare, Users,
  Timer, BookMarked, User, Brain, LogOut, Plus, Search,
  Trash2, ChevronDown, ChevronUp, Calendar, Clock, AlertCircle,
} from "lucide-react";

const FOCUS_COLORS = { high: "#10b981", medium: "#f59e0b", low: "#ef4444" };
const FOCUS_BADGE = {
  high: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  medium: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  low: "bg-red-500/15 text-red-400 border border-red-500/20",
};

export default function StudyLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [focusFilter, setFocusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [expandedId, setExpandedId] = useState(null);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await API.get("/logs?limit=500");
        setLogs(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
        } else {
          setError("Failed to load study logs");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await API.delete(`/logs/${id}`);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch {
      setError("Could not delete log — please try again");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = useMemo(() => {
    let list = [...logs];
    if (search.trim())
      list = list.filter((l) => l.topic.toLowerCase().includes(search.toLowerCase()));
    if (focusFilter !== "all")
      list = list.filter((l) => l.focus_level === focusFilter);
    list.sort((a, b) => {
      const da = new Date(a.study_date), db = new Date(b.study_date);
      return sortOrder === "newest" ? db - da : da - db;
    });
    return list;
  }, [logs, search, focusFilter, sortOrder]);

  const totalHours = logs.reduce((s, l) => s + (l.hours || 0), 0);
  const avgSession = logs.length ? totalHours / logs.length : 0;
  const topicMap = logs.reduce((acc, l) => {
    acc[l.topic] = (acc[l.topic] || 0) + (l.hours || 0);
    return acc;
  }, {});
  const topTopic = Object.entries(topicMap).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

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
          <SidebarItem icon={<BookOpen size={18} />} label="Study Logs" active />
          <SidebarItem icon={<TrendingUp size={18} />} label="Performance" onClick={() => navigate("/performance")} />
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
        <div className="max-w-5xl mx-auto p-6 md:p-10">
          {/* Header */}
          <header className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Study Logs</h1>
              <p className="text-neutral-500 mt-1">
                {logs.length} {logs.length === 1 ? "session" : "sessions"} recorded
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/log-session")}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/30 transition-all"
            >
              <Plus size={18} /> Log Session
            </motion.button>
          </header>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2"><AlertCircle size={16} />{error}</div>
                <button onClick={() => setError(null)} className="font-bold">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: "Total Sessions", value: logs.length, big: true },
              { label: "Total Hours", value: `${totalHours.toFixed(1)}h`, big: true },
              { label: "Avg Session", value: `${avgSession.toFixed(1)}h`, big: true },
              { label: "Top Subject", value: topTopic, truncate: true },
            ].map((s) => (
              <div key={s.label} className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-colors">
                <p className={`font-bold tracking-tight mb-2 ${s.truncate ? "text-lg truncate" : "text-3xl"}`}>
                  {s.value}
                </p>
                <p className="text-neutral-600 text-xs uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by topic…"
                className="w-full pl-10 pr-4 py-3 bg-neutral-900/60 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
              />
            </div>
            <div className="flex gap-1 bg-neutral-900/60 border border-neutral-800 rounded-xl p-1">
              {["all", "high", "medium", "low"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFocusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                    focusFilter === f ? "bg-white text-black" : "text-neutral-500 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSortOrder((s) => (s === "newest" ? "oldest" : "newest"))}
              className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900/60 border border-neutral-800 rounded-xl text-xs font-bold text-neutral-400 hover:text-white transition-colors whitespace-nowrap"
            >
              {sortOrder === "newest" ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              {sortOrder === "newest" ? "Newest first" : "Oldest first"}
            </button>
          </div>

          {/* Log list */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-[72px] bg-neutral-900/40 border border-neutral-800 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <BookOpen size={24} className="text-neutral-600" />
              </div>
              <p className="text-neutral-400 font-semibold mb-2">
                {logs.length === 0 ? "No sessions logged yet" : "No sessions match your filters"}
              </p>
              <p className="text-neutral-600 text-sm mb-6">
                {logs.length === 0 ? "Start tracking your study time to see it here." : "Try adjusting your search or filters."}
              </p>
              {logs.length === 0 && (
                <button
                  onClick={() => navigate("/log-session")}
                  className="px-6 py-3 bg-white text-black rounded-full font-bold text-sm hover:bg-neutral-200 transition-colors"
                >
                  Log your first session
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {filtered.map((log, idx) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ delay: idx < 15 ? idx * 0.025 : 0 }}
                    className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-700 transition-colors group"
                  >
                    <div className="flex items-center gap-4 px-5 py-4">
                      {/* Focus strip */}
                      <div
                        className="w-1 self-stretch rounded-full flex-shrink-0 min-h-[40px]"
                        style={{ background: FOCUS_COLORS[log.focus_level] || "#404040" }}
                      />

                      {/* Main content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                          <h3 className="font-semibold text-neutral-100 truncate">{log.topic}</h3>
                          {log.focus_level && (
                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold capitalize ${FOCUS_BADGE[log.focus_level] || "bg-neutral-800 text-neutral-400"}`}>
                              {log.focus_level}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-neutral-500">
                          <span className="flex items-center gap-1.5">
                            <Clock size={13} />{log.hours}h
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} />
                            {log.study_date
                              ? new Date(log.study_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                              : "—"}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {log.notes && (
                          <button
                            onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                            className="p-2 rounded-xl text-neutral-600 hover:text-neutral-300 hover:bg-neutral-800 transition-all"
                            title="View notes"
                          >
                            {expandedId === log.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(log.id)}
                          disabled={deleting === log.id}
                          className="p-2 rounded-xl text-neutral-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30"
                          title="Delete log"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Expanded notes */}
                    <AnimatePresence>
                      {expandedId === log.id && log.notes && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-neutral-800 px-6 pt-4 pb-5 ml-5">
                            <p className="text-xs font-bold uppercase tracking-widest text-neutral-600 mb-2">Notes</p>
                            <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-wrap">{log.notes}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
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
