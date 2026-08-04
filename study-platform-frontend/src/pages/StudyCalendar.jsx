import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import API from "../api/client";
import {
  LayoutDashboard, BookOpen, TrendingUp, Brain, LogOut,
  MessageSquare, Users, User, Timer, BookMarked, FileText,
  ChevronLeft, ChevronRight, CalendarDays, Flame, Clock, Layers,
} from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// intensity: 0=none, 1=light, 2=mid, 3=high, 4=peak
function intensity(hours) {
  if (!hours || hours === 0) return 0;
  if (hours < 1) return 1;
  if (hours < 2) return 2;
  if (hours < 4) return 3;
  return 4;
}

const COLORS = [
  "bg-neutral-800",          // 0 – no activity
  "bg-blue-900",             // 1 – < 1h
  "bg-blue-700",             // 2 – 1–2h
  "bg-blue-500",             // 3 – 2–4h
  "bg-blue-400",             // 4 – 4h+
];

const COLORS_HEX = ["#262626","#1e3a5f","#1d4ed8","#3b82f6","#93c5fd"];

export default function StudyCalendar() {
  const navigate = useNavigate();
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [data,  setData]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    setLoading(true);
    API.get(`/calendar?year=${year}&month=${month}`)
      .then((r) => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Build calendar grid (ISO week: Mon-Sun)
  const calendarGrid = useMemo(() => {
    if (!data) return [];
    const firstDay = new Date(year, month - 1, 1);
    // Monday = 0, Sunday = 6
    const startPad = (firstDay.getDay() + 6) % 7;
    const grid = [];
    for (let i = 0; i < startPad; i++) grid.push(null);
    for (const d of data.days) grid.push(d);
    while (grid.length % 7 !== 0) grid.push(null);
    return grid;
  }, [data, year, month]);

  // Build 52-week heatmap for contrib graph
  const heatmapWeeks = useMemo(() => {
    if (!data?.heatmap) return [];
    const todayDate = new Date();
    // Find last Sunday
    const endDate = new Date(todayDate);
    endDate.setDate(endDate.getDate() - endDate.getDay());

    const weeks = [];
    for (let w = 51; w >= 0; w--) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(endDate);
        date.setDate(endDate.getDate() - w * 7 + d);
        const key = date.toISOString().split("T")[0];
        week.push({ date: key, hours: data.heatmap[key] || 0 });
      }
      weeks.push(week);
    }
    return weeks;
  }, [data]);

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/", { replace: true }); };

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
          <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard"    onClick={() => navigate("/dashboard")} />
          <SidebarItem icon={<BookOpen size={18} />}        label="Study Logs"   onClick={() => navigate("/logs")} />
          <SidebarItem icon={<TrendingUp size={18} />}      label="Performance"  onClick={() => navigate("/performance")} />
          <SidebarItem icon={<MessageSquare size={18} />}   label="Tutor"        onClick={() => navigate("/tutor")} />
          <SidebarItem icon={<Users size={18} />}           label="Study Groups" onClick={() => navigate("/study-groups")} />
          <SidebarItem icon={<Timer size={18} />}           label="Pomodoro"     onClick={() => navigate("/pomodoro")} />
          <SidebarItem icon={<BookMarked size={18} />}      label="Flashcards"   onClick={() => navigate("/flashcards")} />
          <SidebarItem icon={<FileText size={18} />}        label="Notes"        onClick={() => navigate("/notes")} />
          <SidebarItem icon={<CalendarDays size={18} />}    label="Calendar"     active />
          <SidebarItem icon={<User size={18} />}            label="Profile"      onClick={() => navigate("/profile")} />
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-3 text-neutral-500 hover:text-red-400 transition-colors p-3 mt-auto group">
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 md:p-10">
          <header className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">Study Calendar</h1>
            <p className="text-neutral-500 mt-1">Your study history at a glance</p>
          </header>

          {/* Stats strip */}
          {data && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays size={15} className="text-blue-400" />
                  <p className="text-xs text-neutral-600 uppercase tracking-widest font-semibold">Active Days</p>
                </div>
                <p className="text-3xl font-bold">{data.days_active}</p>
                <p className="text-neutral-600 text-xs mt-0.5">this month</p>
              </div>
              <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={15} className="text-emerald-400" />
                  <p className="text-xs text-neutral-600 uppercase tracking-widest font-semibold">Total Hours</p>
                </div>
                <p className="text-3xl font-bold">{data.total_hours.toFixed(1)}h</p>
                <p className="text-neutral-600 text-xs mt-0.5">this month</p>
              </div>
              <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Flame size={15} className="text-orange-400" />
                  <p className="text-xs text-neutral-600 uppercase tracking-widest font-semibold">Daily Avg</p>
                </div>
                <p className="text-3xl font-bold">
                  {data.days_active > 0 ? (data.total_hours / data.days_active).toFixed(1) : "0.0"}h
                </p>
                <p className="text-neutral-600 text-xs mt-0.5">on active days</p>
              </div>
            </div>
          )}

          {/* Monthly Calendar */}
          <section className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden mb-8">
            {/* Month nav */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
              <button onClick={prevMonth} className="p-2 rounded-xl text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all">
                <ChevronLeft size={18} />
              </button>
              <h2 className="font-bold text-lg">{MONTHS[month - 1]} {year}</h2>
              <button
                onClick={nextMonth}
                disabled={year === today.getFullYear() && month === today.getMonth() + 1}
                className="p-2 rounded-xl text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <div className="p-6">
              {/* Day labels */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-bold text-neutral-600 uppercase tracking-widest py-1">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              {loading ? (
                <div className="flex items-center justify-center h-48">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarGrid.map((day, i) => {
                    if (!day) return <div key={`pad-${i}`} />;
                    const lvl   = intensity(day.hours);
                    const isToday = day.date === today.toISOString().split("T")[0];
                    return (
                      <motion.div
                        key={day.date}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.005 }}
                        onMouseEnter={() => setTooltip({ date: day.date, hours: day.hours })}
                        onMouseLeave={() => setTooltip(null)}
                        className={`relative aspect-square rounded-xl flex items-center justify-center cursor-default transition-all hover:scale-110 ${COLORS[lvl]} ${isToday ? "ring-2 ring-white/40" : ""}`}
                      >
                        <span className={`text-xs font-semibold ${lvl > 0 ? "text-white" : "text-neutral-600"}`}>
                          {parseInt(day.date.split("-")[2])}
                        </span>
                        {day.hours > 0 && (
                          <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-white/40" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Legend */}
              <div className="flex items-center gap-2 mt-5 justify-end">
                <span className="text-xs text-neutral-700">Less</span>
                {COLORS.map((c, i) => (
                  <div key={i} className={`w-3.5 h-3.5 rounded-sm ${c}`} />
                ))}
                <span className="text-xs text-neutral-700">More</span>
              </div>
            </div>
          </section>

          {/* 52-week heatmap (GitHub style) */}
          <section className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-800">
              <h2 className="font-bold flex items-center gap-2">
                <Layers size={15} className="text-blue-400" /> Year in Review
              </h2>
              <p className="text-neutral-600 text-xs mt-0.5">Last 52 weeks of activity</p>
            </div>
            <div className="p-6 overflow-x-auto">
              {loading ? (
                <div className="h-24 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="relative">
                  {/* Tooltip */}
                  {tooltip && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1 text-xs whitespace-nowrap z-10 pointer-events-none">
                      {tooltip.date} — {tooltip.hours > 0 ? `${tooltip.hours.toFixed(1)}h` : "no activity"}
                    </div>
                  )}
                  <div className="flex gap-0.5">
                    {heatmapWeeks.map((week, wi) => (
                      <div key={wi} className="flex flex-col gap-0.5">
                        {week.map((day) => {
                          const lvl = intensity(day.hours);
                          return (
                            <div
                              key={day.date}
                              onMouseEnter={() => setTooltip(day)}
                              onMouseLeave={() => setTooltip(null)}
                              className={`w-3 h-3 rounded-sm cursor-default transition-transform hover:scale-125 ${COLORS[lvl]}`}
                              style={{ background: COLORS_HEX[lvl] }}
                              title={`${day.date}: ${day.hours.toFixed(1)}h`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  {/* Month labels — approximate positions */}
                  <div className="flex mt-2" style={{ gap: 0 }}>
                    {heatmapWeeks.map((week, wi) => {
                      const d = new Date(week[0].date);
                      const showLabel = wi === 0 || d.getDate() <= 7;
                      return (
                        <div key={wi} style={{ width: 13, marginRight: 2 }} className="flex-shrink-0">
                          {showLabel && (
                            <span className="text-[9px] text-neutral-700">
                              {d.toLocaleString("en-US", { month: "short" })}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
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
