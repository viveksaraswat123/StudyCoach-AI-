import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Loader2, ArrowRight, AlertCircle } from "lucide-react";
import API from "../api/client";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [status, setStatus] = useState({ loading: false, error: null });
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (status.loading) return;

    setStatus({ loading: true, error: null });

    // OAuth2PasswordRequestForm expects application/x-www-form-urlencoded
    const payload = new URLSearchParams();
    payload.append("username", formData.email);
    payload.append("password", formData.password);

    try {
      const { data } = await API.post("/login", payload, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      localStorage.setItem("token", data.access_token);
      // FIX 1: Clear loading state before navigating, prevents stale state
      // if the user navigates back
      setStatus({ loading: false, error: null });
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err.response);

      // FIX 2: Normalize error detail — FastAPI can return detail as a string
      // or as an array of validation error objects
      const detail = err.response?.data?.detail;
      let errorMessage = "Invalid credentials. Please try again.";
      if (typeof detail === "string") {
        errorMessage = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        errorMessage = detail[0]?.msg || errorMessage;
      }

      setStatus({
        loading: false,
        error: errorMessage,
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6 selection:bg-white selection:text-black">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="inline-block mb-6 text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2 justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">SC</span>
              </div>
              {/* FIX 3: "text-s" is not a valid Tailwind class, replaced with "text-sm" */}
              <span className="text-white text-sm font-bold">StudyCoach</span>
            </div>
          </Link>
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Welcome back
          </h1>
          <p className="text-neutral-500 mt-2">
            Enter your credentials to continue.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Error Message */}
          <AnimatePresence mode="wait">
            {status.error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3 text-red-400 text-sm overflow-hidden"
              >
                <AlertCircle size={16} className="flex-shrink-0" />
                {/* FIX 4: Added flex-shrink-0 on icon and min-w-0 on text to prevent
                    long error messages from overflowing the container */}
                <span className="min-w-0 break-words">{status.error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-2">
            <div className="relative group">
              <Mail
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors"
                size={18}
              />
              <input
                required
                type="email"
                placeholder="Email address"
                value={formData.email}
                // FIX 5: Added value prop to make input controlled, preventing
                // stale values after programmatic state changes
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-neutral-700 transition-all"
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative group">
              <Lock
                className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors"
                size={18}
              />
              <input
                required
                type="password"
                placeholder="Password"
                value={formData.password}
                // FIX 5: Added value prop to make input controlled
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/10 focus:border-neutral-700 transition-all"
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>
          </div>

          {/* FIX 6: Added type="submit" explicitly to avoid ambiguity in some
              browsers where button type defaults to "submit" only inside forms —
              being explicit is safer and more semantically correct */}
          <button
            type="submit"
            disabled={status.loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status.loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Sign In <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-neutral-500 text-sm">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-white font-medium hover:underline underline-offset-4 transition-all"
          >
            Join the beta
          </Link>
        </p>
      </motion.div>
    </div>
  );
}