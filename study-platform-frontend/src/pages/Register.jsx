import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, UserPlus, Loader2, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import API from "../api/client";

export default function Register() {
  const [formData, setFormData] = useState({ email: "", password: "", confirmPassword: "" });
  const [status, setStatus] = useState({ loading: false, error: null });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (status.loading) return;

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
      
      localStorage.setItem("token", data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setStatus({ 
        loading: false, 
        error: err.response?.data?.detail || "Registration failed. Try a different email." 
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
          <Link to="/" className="inline-block mb-6 text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2 justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-bold">SC</span>
              </div>
              StudyCoach
            </div>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white">Create Account</h1>
          <p className="text-neutral-500 mt-2">Join the learning platform built for consistency.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <AnimatePresence mode="wait">
            {status.error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 text-sm"
              >
                <AlertCircle size={16} />
                {status.error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Field */}
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors" size={18} />
            <input
              required
              type="email"
              placeholder="Work or student email"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/5 focus:border-neutral-600 transition-all"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          {/* Password Field */}
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors" size={18} />
            <input
              required
              type="password"
              placeholder="Create password"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/5 focus:border-neutral-600 transition-all"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          {/* Confirm Password Field */}
          <div className="relative group">
            <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-white transition-colors" size={18} />
            <input
              required
              type="password"
              placeholder="Confirm password"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/5 focus:border-neutral-600 transition-all"
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <button
            disabled={status.loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/30 transition-all active:scale-[0.98] disabled:opacity-50"
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

        <p className="mt-8 text-center text-neutral-500 text-sm font-medium">
          Already a member?{" "}
          <Link to="/login" className="text-white hover:underline underline-offset-4 transition-all">
            Sign in here
          </Link>
        </p>
      </motion.div>
    </div>
  );
}