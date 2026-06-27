import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, BookOpen, TrendingUp, Brain, LogOut,
  MessageSquare, Users, User, Play, Pause, RotateCcw,
  CheckCircle, Plus, Timer, BookMarked,
} from "lucide-react";
import API from "../api/client";

const CIRCUMFERENCE = 2 * Math.PI * 120;

const MODES = {
  focus:  { label: "Focus",       duration: 25 * 60, color: "#3b82f6" },
  short:  { label: "Short Break", duration:  5 * 60, color: "#10b981" },
  long:   { label: "Long Break",  duration: 15 * 60, color: "#a855f7" },
};

export default function Pomodoro() {
  const navigate = useNavigate();
  const [mode, setMode]           = useState("focus");
  const [timeLeft, setTimeLeft]   = useState(MODES.focus.duration);
  const [running, setRunning]     = useState(false);
  const [focusCount, setFocusCount] = useState(0);
  const [history, setHistory]     = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [topic, setTopic]         = useState("");
  const [logging, setLogging]     = useState(false);
  const tickRef = useRef(null);

  const cur = MODES[mode];
  const dashOffset = CIRCUMFERENCE * (1 - timeLeft / cur.duration);

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const beep = useCallback(() => {
    try {
      const ctx = new AudioContext();
      [0, 0.32, 0.64].forEach((t) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = mode === "focus" ? 880 : 660;
        gain.gain.setValueAtTime(0, ctx.currentTime + t);
        gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.46);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.5);
      });
    } catch {}
  }, [mode]);

  const switchMode = useCallback((m) => {
    clearInterval(tickRef.current);
    setRunning(false);
    setMode(m);
    setTimeLeft(MODES[m].duration);
  }, []);

  const onComplete = useCallback(() => {
    clearInterval(tickRef.current);
    setRunning(false);
    beep();

    if (mode === "focus") {
      const next = focusCount + 1;
      setFocusCount(next);
      setHistory((h) => [...h, new Date()]);
      setShowModal(true);
      setTimeout(() => switchMode(next % 4 === 0 ? "long" : "short"), 1800);
    } else {
      setTimeout(() => switchMode("focus"), 1800);
    }
  }, [mode, focusCount, beep, switchMode]);

  useEffect(() => {
    if (!running) return;
    tickRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { onComplete(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [running, onComplete]);

  useEffect(() => {
    document.title = running
      ? `${fmt(timeLeft)} · ${cur.label} — StudyCoach`
      : "Pomodoro — StudyCoach";
    return () => { document.title = "StudyCoach"; };
  });

  const logSession = async () => {
    if (!topic.trim() || logging) return;
    setLogging(true);
    try {
      await API.post("/logs", {
        topic: topic.trim(),
        hours: parseFloat((25 / 60).toFixed(4)),
        study_date: new Date().toISOString().split("T")[0],
        focus_level: "high",
        notes: "Logged via Pomodoro timer",
      });
    } catch {}
    setLogging(false);
    setShowModal(false);
    setTopic("");
  };

  const filledDots = focusCount % 4;

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
          <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => navigate("/dashboard")} />
          <SidebarItem icon={<BookOpen size={18} />}        label="Study Logs" onClick={() => navigate("/log-session")} />
          <SidebarItem icon={<TrendingUp size={18} />}      label="Performance" onClick={() => navigate("/performance")} />
          <SidebarItem icon={<Timer size={18} />}           label="Pomodoro" active />
          <SidebarItem icon={<MessageSquare size={18} />}   label="AI Tutor" onClick={() => navigate("/tutor")} />
          <SidebarItem icon={<Users size={18} />}           label="Study Groups" onClick={() => navigate("/study-groups")} />
          <SidebarItem icon={<BookMarked size={18} />}      label="Flashcards" onClick={() => navigate("/flashcards")} />
          <SidebarItem icon={<User size={18} />}            label="Profile" onClick={() => navigate("/profile")} />
        </nav>
        <button
          onClick={() => { localStorage.removeItem("token"); navigate("/", { replace: true }); }}
          className="flex items-center gap-3 text-neutral-500 hover:text-red-400 transition-colors p-3 mt-auto group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 md:p-12">
          <header className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight">Focus Timer</h1>
            <p className="text-neutral-500 mt-1">
              {focusCount > 0
                ? `${focusCount} session${focusCount !== 1 ? "s" : ""} completed today`
                : "Stay in the zone. Everything else can wait."}
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
            {/* ── TIMER PANEL ── */}
            <div className="lg:col-span-2 flex flex-col items-center gap-8">
              {/* Mode tabs */}
              <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl p-1 gap-0.5">
                {Object.entries(MODES).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => switchMode(k)}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                      mode === k
                        ? "bg-neutral-800 text-white shadow-sm"
                        : "text-neutral-500 hover:text-neutral-300"
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              {/* SVG ring */}
              <div className="relative select-none">
                <svg
                  width="280"
                  height="280"
                  style={{ transform: "rotate(-90deg)" }}
                  aria-hidden="true"
                >
                  {/* Track */}
                  <circle cx="140" cy="140" r="120" fill="none" stroke="#1c1c1c" strokeWidth="7" />
                  {/* Progress */}
                  <circle
                    cx="140" cy="140" r="120"
                    fill="none"
                    stroke={cur.color}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={dashOffset}
                    style={{
                      transition: "stroke-dashoffset 0.95s linear, stroke 0.4s ease",
                      filter: running ? `drop-shadow(0 0 10px ${cur.color}70)` : "none",
                    }}
                  />
                </svg>

                {/* Center content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span
                    className="text-[3.75rem] font-bold leading-none tracking-tight"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {fmt(timeLeft)}
                  </span>
                  <span className="text-neutral-500 text-sm mt-2 font-medium">{cur.label}</span>
                  <AnimatePresence>
                    {running && (
                      <motion.div
                        key="pulse"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.35, 1, 0.35] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        exit={{ opacity: 0 }}
                        className="w-1.5 h-1.5 rounded-full mt-3"
                        style={{ background: cur.color }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-4">
                <button
                  onClick={() => switchMode(mode)}
                  aria-label="Reset timer"
                  className="w-12 h-12 flex items-center justify-center rounded-full border border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-700 transition-all"
                >
                  <RotateCcw size={18} />
                </button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRunning((r) => !r)}
                  className="flex items-center gap-3 px-12 py-4 rounded-2xl text-white font-bold text-lg transition-all"
                  style={{
                    background: cur.color,
                    boxShadow: running
                      ? `0 6px 36px ${cur.color}55`
                      : `0 4px 18px ${cur.color}25`,
                  }}
                >
                  {running ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" />}
                  {running ? "Pause" : "Start"}
                </motion.button>

                <button
                  onClick={() => navigate("/log-session")}
                  aria-label="Log session manually"
                  className="w-12 h-12 flex items-center justify-center rounded-full border border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-700 transition-all"
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Session dots */}
              <div className="flex items-center gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                    style={{ background: i < filledDots ? cur.color : "#262626" }}
                  />
                ))}
                <span className="text-neutral-600 text-xs font-medium ml-1.5">
                  {4 - filledDots} until long break
                </span>
              </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className="space-y-5">
              {/* Session log */}
              <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-neutral-800">
                  <p className="font-semibold text-sm">Today's Log</p>
                  <p className="text-neutral-500 text-xs mt-0.5">
                    {history.length === 0
                      ? "Nothing yet"
                      : `${history.length} block${history.length > 1 ? "s" : ""} · ${history.length * 25} min`}
                  </p>
                </div>
                <div className="divide-y divide-neutral-800/60 max-h-60 overflow-y-auto">
                  {history.length === 0 ? (
                    <p className="px-6 py-8 text-neutral-600 text-sm text-center">
                      Complete a session to see it here
                    </p>
                  ) : (
                    [...history].reverse().map((t, i) => (
                      <div key={i} className="px-6 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                          <span className="text-sm text-neutral-300">25 min focus</span>
                        </div>
                        <span className="text-neutral-600 text-xs tabular-nums">
                          {t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Technique card */}
              <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6">
                <p className="font-semibold text-sm mb-4">The Technique</p>
                <div className="space-y-3.5">
                  {[
                    ["Focus — 25 min",       "One task, full attention"],
                    ["Short break — 5 min",  "Step away and reset"],
                    ["Long break — 15 min",  "After every 4 blocks"],
                  ].map(([title, desc]) => (
                    <div key={title} className="flex gap-3">
                      <span className="text-neutral-700 text-xs leading-5 shrink-0 mt-0.5">→</span>
                      <div>
                        <p className="text-xs font-semibold text-neutral-300">{title}</p>
                        <p className="text-xs text-neutral-600 mt-0.5">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── LOG SESSION MODAL ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                style={{ background: "#10b98120" }}>
                <CheckCircle size={20} className="text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold mb-1">Session complete</h2>
              <p className="text-neutral-500 text-sm mb-6">
                25 minutes done. Log what you studied to keep your streak alive.
              </p>

              <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-2">
                What did you study?
              </label>
              <input
                autoFocus
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && logSession()}
                placeholder="e.g. Calculus, React Hooks, History…"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors mb-6"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 text-sm font-semibold transition-all"
                >
                  Skip
                </button>
                <button
                  onClick={logSession}
                  disabled={!topic.trim() || logging}
                  className="flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-40 transition-all"
                  style={{ background: "#3b82f6" }}
                >
                  {logging ? "Saving…" : "Log it"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
