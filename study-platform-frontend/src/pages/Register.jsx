import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Loader2, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import API from "../api/client";

export default function Register() {
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
  const [status, setStatus] = useState({ loading: false, error: null });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (status.loading) return;
    if (formData.password.length < 8) {
      return setStatus({ loading: false, error: "Password must be at least 8 characters." });
    }

    // Basic Validation
    if (formData.password !== formData.confirmPassword) {
      return setStatus({ loading: false, error: "Passwords do not match." });
    }

    setStatus({ loading: true, error: null });

    try {
      // Backend expects UserCreate schema (email, password)
      const { data } = await API.post("/register", {
        email: formData.email,
        password: formData.password,
      });

      // FIX 2: Guard against missing token — if backend doesn't return a token
      // on register, accessing data.access_token would silently store "undefined"
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
      }

      // FIX 3: Clear loading state before navigating to prevent stale state
      // if the user navigates back
      setStatus({ loading: false, error: null });
      navigate("/dashboard");
    } catch (err) {
      // FIX 4: Normalize error detail — FastAPI can return detail as a string
      // or as an array of validation error objects (same pattern as Login fix)
      const detail = err.response?.data?.detail;
      let errorMessage = "Registration failed. Try a different email.";
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
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="mb-10 text-center">
          <Link
            to="/"
            className="inline-block mb-6 text-xl font-bold tracking-tight hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-2 justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">SC</span>
              </div>
              {/* FIX 5: Wrapped logo text in a span so it inherits the Link's
                  font styles correctly and doesn't render as a bare text node
                  next to a flex child — bare text nodes in flex containers can
                  cause inconsistent vertical alignment across browsers */}
              <span className="text-white text-sm font-bold">StudyCoach</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white">Create Account</h1>
          <p className="text-neutral-500 mt-2">
            Join the learning platform built for consistency.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <AnimatePresence mode="wait">
            {status.error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm overflow-hidden"
              >
                {/* FIX 6: Added flex-shrink-0 on icon and min-w-0 + break-words
                    on text to prevent long error messages from overflowing */}
                <AlertCircle size={16} className="flex-shrink-0" />
                <span className="min-w-0 break-words">{status.error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Field */}
          <div className="relative group">
            <Mail
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors"
              size={18}
            />
            <input
              required
              type="email"
              placeholder="Work or student email"
              value={formData.email}
              // FIX 7: Added value props to all inputs to make them controlled,
              // preventing stale values if state is reset externally
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/5 focus:border-neutral-600 transition-all"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Password Field */}
          <div className="relative group">
            <Lock
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors"
              size={18}
            />
            <input
              required
              type="password"
              placeholder="Create password"
              value={formData.password}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/5 focus:border-neutral-600 transition-all"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {/* Confirm Password Field */}
          <div className="relative group">
            <ShieldCheck
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors"
              size={18}
            />
            <input
              required
              type="password"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/5 focus:border-neutral-600 transition-all"
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          {/* FIX 8: Added type="submit" explicitly and disabled cursor style */}
          <button
            type="submit"
            disabled={status.loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status.loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Create Account <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* FIX 9: Removed unused UserPlus import (was imported but never rendered) */}
        <p className="mt-8 text-center text-neutral-500 text-sm font-medium">
          Already a member?{" "}
          <Link
            to="/login"
            className="text-white hover:underline underline-offset-4 transition-all"
          >
            Sign in here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}