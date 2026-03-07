import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Suspense, lazy, useEffect } from "react";

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

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-neutral-950 text-neutral-400">
    <div className="relative flex items-center justify-center mb-6">
      <div className="absolute w-16 h-16 bg-white/10 blur-xl rounded-full animate-pulse"></div>
      <div className="w-4 h-4 bg-white rounded-sm rotate-45 animate-spin"></div>
    </div>
    <p className="text-xs font-bold tracking-[0.3em] uppercase opacity-60">
      Loading Application
    </p>
  </div>
);

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