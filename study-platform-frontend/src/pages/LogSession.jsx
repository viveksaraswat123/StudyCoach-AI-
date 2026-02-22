import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Book, Clock, Calendar, FileText, Zap, CheckCircle, Loader2 } from 'lucide-react';
import API from '../api/client';

export default function LogSession() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: "",
    hours: "",
    study_date: new Date().toISOString().split('T')[0],
    focus_level: "Medium",
    notes: ""
  });

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  const focusMap = {
  Low: "low",
  Medium: "medium",
  High: "high",
  Peak: "high", // if backend doesn't support peak
};

  try {
    await API.post("/logs", {
      topic: formData.topic,
      hours: parseFloat(formData.hours),
      study_date: formData.study_date,
      focus_level: focusMap[formData.focus_level],
      notes: formData.notes,
    });

    navigate("/dashboard");
  } catch (error) {
    console.log("ERROR DATA:", error.response?.data);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 py-12 px-6 selection:bg-white selection:text-black">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[30%] h-[30%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-2xl mx-auto relative z-10">
        <button 
          onClick={() => navigate('/dashboard')}
          className="mb-10 flex items-center gap-2 text-neutral-500 hover:text-white transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to Dashboard
        </button>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900/50 backdrop-blur-xl rounded-[2rem] border border-neutral-800 p-8 md:p-12 shadow-2xl"
        >
          <header className="mb-12 text-center">
            <h1 className="text-3xl font-bold tracking-tight mb-3">Sync Session</h1>
            <p className="text-neutral-500">Your notes will be used to generate your next AI assessment.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Topic Input */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">
                <Book size={14} /> Topic Studied
              </label>
              <input 
                required
                type="text" 
                value={formData.topic}
                onChange={(e) => setFormData({...formData, topic: e.target.value})}
                placeholder="e.g., Computational Neural Networks"
                className="w-full p-4 bg-neutral-950 border border-neutral-800 rounded-2xl focus:ring-1 focus:ring-white focus:border-white transition-all text-white placeholder:text-neutral-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Hours Input */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">
                  <Clock size={14} /> Time Spent (hrs)
                </label>
                <input 
                  required
                  type="number" 
                  step="0.5"
                  value={formData.hours}
                  onChange={(e) => setFormData({...formData, hours: e.target.value})}
                  placeholder="2.5"
                  className="w-full p-4 bg-neutral-950 border border-neutral-800 rounded-2xl focus:ring-1 focus:ring-white transition-all text-white"
                />
              </div>

              {/* Date Input */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">
                  <Calendar size={14} /> Session Date
                </label>
                <input 
                  required
                  type="date" 
                  value={formData.study_date}
                  onChange={(e) => setFormData({...formData, study_date: e.target.value})}
                  className="w-full p-4 bg-neutral-950 border border-neutral-800 rounded-2xl focus:ring-1 focus:ring-white transition-all text-white color-scheme-dark"
                />
              </div>
            </div>

            {/* Focus Selector */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">
                <Zap size={14} /> Cognitive Focus Level
              </label>
              <div className="flex gap-2 p-1 bg-neutral-950 border border-neutral-800 rounded-2xl">
                {['Low', 'Medium', 'High', 'Peak'].map((level) => (
                  <button 
                    key={level}
                    type="button"
                    onClick={() => setFormData({...formData, focus_level: level})}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                      formData.focus_level === level 
                        ? "bg-white text-black shadow-lg" 
                        : "text-neutral-500 hover:text-neutral-200"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes Input */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 ml-1">
                <FileText size={14} /> Knowledge Capture
              </label>
              <textarea 
                rows="4"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Paste key concepts, formulas, or summaries here for the AI to process..."
                className="w-full p-4 bg-neutral-950 border border-neutral-800 rounded-2xl focus:ring-1 focus:ring-white transition-all text-white placeholder:text-neutral-700 resize-none"
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black p-5 rounded-2xl font-bold text-lg hover:bg-neutral-200 transition-all active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <CheckCircle size={22} /> Commit to Progress
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}