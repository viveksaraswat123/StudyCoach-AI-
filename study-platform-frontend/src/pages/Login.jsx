import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center bg-indigo-50 px-4"
    >
      <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl border border-white/50 relative overflow-hidden">
        <button onClick={() => navigate('/')} className="mb-8 text-slate-400 hover:text-indigo-600 flex items-center gap-2 transition">
          <ArrowLeft size={18} /> Back to Home
        </button>
        
        <h2 className="text-4xl font-black mb-2">Welcome.</h2>
        <p className="text-slate-500 mb-10 font-medium">Log in to your study dashboard</p>

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-slate-400" size={20} />
            <input type="email" placeholder="Email Address" className="w-full p-4 pl-12 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 transition" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-4 text-slate-400" size={20} />
            <input type="password" placeholder="Password" className="w-full p-4 pl-12 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 transition" required />
          </div>
          <button className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition transform hover:scale-[1.02]">
            Enter Dashboard
          </button>
        </form>
      </div>
    </motion.div>
  );
}