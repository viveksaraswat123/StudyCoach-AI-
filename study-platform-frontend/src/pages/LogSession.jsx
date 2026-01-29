import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Book, Clock, Calendar, FileText, Smile, CheckCircle } from 'lucide-react';

export default function LogSession() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  const payload = {
    topic: e.target[0].value,
    hours: parseFloat(e.target[1].value),
    study_date: e.target[2].value,
    focus_level: "High", // You can capture this from state
    notes: e.target[4].value
  };

  try {
    const response = await fetch('http://localhost:8000/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) navigate('/dashboard');
  } catch (error) {
    console.error("Submission failed", error);
  } finally {
    setLoading(false);
  }
};

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-slate-50 py-12 px-4"
    >
      <div className="max-w-2xl mx-auto">
        <button 
          onClick={() => navigate('/dashboard')}
          className="mb-8 flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition font-medium"
        >
          <ArrowLeft size={20} /> Back to Dashboard
        </button>

        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 p-8 md:p-12 border border-white">
          <header className="mb-10 text-center">
            <h1 className="text-3xl font-black tracking-tight mb-2">Log Study Session</h1>
            <p className="text-slate-500">Record your progress to fuel your AI analytics</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Topic Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                <Book size={16} className="text-indigo-500" /> Topic Studied
              </label>
              <input 
                required
                type="text" 
                placeholder="e.g., Quantum Mechanics, React Hooks..."
                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 transition text-lg"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hours Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                  <Clock size={16} className="text-indigo-500" /> Hours Spent
                </label>
                <input 
                  required
                  type="number" 
                  step="0.5"
                  placeholder="2.5"
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 transition"
                />
              </div>

              {/* Date Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                  <Calendar size={16} className="text-indigo-500" /> Date
                </label>
                <input 
                  required
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 transition"
                />
              </div>
            </div>

            {/* Focus/Mood Selector */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                <Smile size={16} className="text-indigo-500" /> Study Focus Level
              </label>
              <div className="flex gap-3">
                {['Low', 'Medium', 'High', 'God Mode'].map((level) => (
                  <button 
                    key={level}
                    type="button"
                    className="flex-1 py-3 bg-slate-50 rounded-xl text-sm font-bold text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 border-2 border-transparent hover:border-indigo-200 transition"
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes Input */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
                <FileText size={16} className="text-indigo-500" /> Quick Summary / Notes
              </label>
              <textarea 
                rows="3"
                placeholder="What were the key takeaways? (This helps AI generate better questions)"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600 transition"
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white p-5 rounded-2xl font-black text-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition transform hover:scale-[1.01] flex items-center justify-center gap-3 disabled:opacity-70"
            >
              {loading ? "Saving Progress..." : <><CheckCircle size={24} /> Save Study Session</>}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}