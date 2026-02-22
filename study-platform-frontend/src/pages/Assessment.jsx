import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  RefreshCcw, 
  ArrowLeft,
  Loader2,
  Sparkles
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../api/client";

export default function Assessment() {
  const navigate = useNavigate();
  const { state } = useLocation(); // Topic passed from dashboard
  
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const generateQuestions = async () => {
      try {
        const res = await API.post("/assessment/generate", { 
          topic: state?.topic || "General Knowledge" 
        });
        setQuestions(res.data.questions);
      } catch (err) {
        console.error("Failed to generate questions");
      } finally {
        setLoading(false);
      }
    };
    generateQuestions();
  }, [state]);

  const handleAnswer = (isCorrect) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(isCorrect);
    if (isCorrect) setScore(s => s + 1);

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
        setSelectedAnswer(null);
      } else {
        setShowResult(true);
      }
    }, 1200);
  };

  if (loading) return <LoadingState topic={state?.topic} />;
  if (showResult) return <FinalScore score={score} total={questions.length} onRetry={() => window.location.reload()} />;

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        
        {/* PROGRESS HEADER */}
        <div className="mb-12">
          <div className="flex justify-between items-end mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Assessment Phase</span>
              <h2 className="text-xl font-bold">{state?.topic}</h2>
            </div>
            <span className="text-sm font-mono text-neutral-500">
              {currentIndex + 1} <span className="text-neutral-700">/</span> {questions.length}
            </span>
          </div>
          <div className="h-1 w-full bg-neutral-900 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-white" 
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* QUESTION CARD */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-neutral-900/50 border border-neutral-800 p-8 md:p-10 rounded-[2.5rem] backdrop-blur-sm"
          >
            <h3 className="text-2xl font-medium leading-relaxed mb-10">
              {currentQ.question_text}
            </h3>

            <div className="grid gap-4">
              {currentQ.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(option.is_correct)}
                  disabled={selectedAnswer !== null}
                  className={`
                    group flex items-center justify-between p-5 rounded-2xl border transition-all text-left
                    ${selectedAnswer === null ? 'border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800/50' : ''}
                    ${selectedAnswer !== null && option.is_correct ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : ''}
                    ${selectedAnswer === false && !option.is_correct ? 'border-red-500/20 text-neutral-600' : ''}
                  `}
                >
                  <span className="font-medium">{option.text}</span>
                  {selectedAnswer !== null && option.is_correct && <CheckCircle2 size={20} />}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* SUB-COMPONENTS */

function LoadingState({ topic }) {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
        <div className="relative bg-neutral-900 p-6 rounded-3xl border border-neutral-800">
          <Brain size={48} className="text-white animate-bounce" />
        </div>
      </div>
      <h2 className="text-2xl font-bold mb-2">Synthesizing Assessment</h2>
      <p className="text-neutral-500 max-w-xs leading-relaxed">
        AI is analyzing your notes on <span className="text-white">"{topic}"</span> to generate optimized challenges...
      </p>
      <div className="mt-8 flex gap-2">
        {[0, 1, 2].map(i => (
          <motion.div 
            key={i} 
            animate={{ opacity: [0.3, 1, 0.3] }} 
            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
            className="w-2 h-2 bg-white rounded-full" 
          />
        ))}
      </div>
    </div>
  );
}

function FinalScore({ score, total, onRetry }) {
  const navigate = useNavigate();
  const percentage = Math.round((score / total) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="min-h-screen bg-neutral-950 flex items-center justify-center p-6"
    >
      <div className="bg-neutral-900 border border-neutral-800 p-12 rounded-[3rem] text-center max-w-md w-full">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white text-black text-3xl font-black mb-8">
          {percentage}%
        </div>
        <h2 className="text-3xl font-bold mb-2">Knowledge Locked.</h2>
        <p className="text-neutral-500 mb-10">
          You identified {score} out of {total} key concepts correctly. Your Study Efficiency Score has been updated.
        </p>
        
        <div className="space-y-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full bg-white text-black py-4 rounded-2xl font-bold hover:bg-neutral-200 transition-colors"
          >
            Return to Dashboard
          </button>
          <button 
            onClick={onRetry}
            className="w-full bg-neutral-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-700 transition-colors"
          >
            <RefreshCcw size={18} /> Retake Assessment
          </button>
        </div>
      </div>
    </motion.div>
  );
}