import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Suspense, lazy, useEffect, useState } from "react";
import { Brain } from "lucide-react";

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/Profile"));
const Register = lazy(() => import("./pages/Register"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Assessment = lazy(() => import("./pages/Assessment"));
const LogSession = lazy(() => import("./pages/LogSession"));
const ChatTutor = lazy(() => import("./pages/ChatTutor"));
const StudyGroups = lazy(() => import("./pages/StudyGroups"));
const Kanban = lazy(() => import("./pages/Kanban"));
const Pomodoro = lazy(() => import("./pages/Pomodoro"));
const Flashcards = lazy(() => import("./pages/Flashcards"));
const StudyLogs = lazy(() => import("./pages/StudyLogs"));
const Performance = lazy(() => import("./pages/Performance"));

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const LOAD_TIPS = [
  "Syncing your study data…",
  "Preparing your workspace…",
  "Loading AI tutor…",
  "Building your flashcards…",
  "Almost ready…",
];

const Ring = ({ size, duration, reverse, color, dots, delay = 0 }) => (
  <motion.div
    animate={{ rotate: reverse ? -360 : 360 }}
    transition={{ repeat: Infinity, duration, ease: "linear", delay }}
    style={{
      position: "absolute",
      width: size,
      height: size,
      top: "50%",
      left: "50%",
      marginTop: -size / 2,
      marginLeft: -size / 2,
      borderRadius: "50%",
      border: `1px solid ${color}22`,
    }}
  >
    {Array.from({ length: dots }).map((_, i) => {
      const angle = (360 / dots) * i;
      const rad   = (angle * Math.PI) / 180;
      const r     = size / 2;
      const x     = r + r * Math.sin(rad) - 5;
      const y     = r - r * Math.cos(rad) - 5;
      return (
        <motion.div
          key={i}
          animate={{ opacity: [0.5, 1, 0.5], scale: [0.8, 1.2, 0.8] }}
          transition={{ repeat: Infinity, duration: 2, delay: i * (2 / dots), ease: "easeInOut" }}
          style={{
            position: "absolute",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: color,
            top: y,
            left: x,
            boxShadow: `0 0 10px 2px ${color}88`,
          }}
        />
      );
    })}
  </motion.div>
);

const LoadingScreen = () => {
  const [tip, setTip] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTip((t) => (t + 1) % LOAD_TIPS.length), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-neutral-950 select-none overflow-hidden">
      {/* Ambient background glow */}
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {/* Orbital system */}
      <div style={{ position: "relative", width: 180, height: 180, marginBottom: 48 }}>
        {/* Outer ring — emerald, 1 dot, slow */}
        <Ring size={180} duration={7}   reverse={false} color="#10b981" dots={1} />
        {/* Middle ring — purple, 2 dots, reverse */}
        <Ring size={130} duration={4.5} reverse={true}  color="#a855f7" dots={2} delay={0.3} />
        {/* Inner ring — blue, 3 dots, fast */}
        <Ring size={82}  duration={2.8} reverse={false} color="#3b82f6" dots={3} delay={0.6} />

        {/* Center icon */}
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))",
              border: "1px solid rgba(59,130,246,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 24px rgba(59,130,246,0.25)",
            }}
          >
            <Brain size={22} color="#60a5fa" />
          </motion.div>
        </div>
      </div>

      {/* Wordmark */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}
      >
        <span style={{ color: "#f5f5f5", fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" }}>
          StudyCoach
        </span>
      </motion.div>

      {/* Cycling tip */}
      <AnimatePresence mode="wait">
        <motion.p
          key={tip}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.35 }}
          style={{ color: "#525252", fontSize: 12, letterSpacing: "0.06em" }}
        >
          {LOAD_TIPS[tip]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-neutral-950 text-white px-6 text-center">
      <h1 className="text-8xl font-black opacity-10 mb-[-1rem]">404</h1>
      <h2 className="text-2xl font-bold mb-4 italic">Neural path not found</h2>
      <p className="text-neutral-500 mb-8 max-w-sm">
        The requested node is unavailable or has been moved to another sector.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 border border-neutral-800 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
        >
          Go Back
        </button>
        <button
          onClick={() => navigate("/", { replace: true })}
          className="px-6 py-2 border border-neutral-800 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<LoadingScreen />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile/>}/>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/assessment"
              element={
                <ProtectedRoute>
                  <Assessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/log-session"
              element={
                <ProtectedRoute>
                  <LogSession />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tutor"
              element={
                <ProtectedRoute>
                  <ChatTutor />
                </ProtectedRoute>
              }
            />
            <Route
              path="/study-groups"
              element={
                <ProtectedRoute>
                  <StudyGroups />
                </ProtectedRoute>
              }
            />
            {/* FIX 5: Added dynamic study group detail route */}
            <Route
              path="/study-groups/:id"
              element={
                <ProtectedRoute>
                  <StudyGroups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/kanban"
              element={
                <ProtectedRoute>
                  <Kanban />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pomodoro"
              element={
                <ProtectedRoute>
                  <Pomodoro />
                </ProtectedRoute>
              }
            />
            <Route
              path="/flashcards"
              element={
                <ProtectedRoute>
                  <Flashcards />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logs"
              element={
                <ProtectedRoute>
                  <StudyLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/performance"
              element={
                <ProtectedRoute>
                  <Performance />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </>
  );
};

export default function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}