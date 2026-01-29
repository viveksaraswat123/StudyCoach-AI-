import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Mic, BarChart3, Shield, Zap, ChevronRight } from 'lucide-react';

export default function Home() {
  const containerVars = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  const itemVars = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="bg-white text-slate-900 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 glass-morphism py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2 text-2xl font-bold text-indigo-600">
          <BookOpen size={32} /> <span>Lumina AI</span>
        </div>
        <div className="flex gap-4">
          <Link to="/login" className="px-6 py-2 font-medium hover:text-indigo-600 transition">Login</Link>
          <Link to="/login" className="bg-indigo-600 text-white px-6 py-2 rounded-full font-medium shadow-lg hover:bg-indigo-700 transition">Join Free</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl mx-auto text-center"
        >
          <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 inline-block">
            New: Multilingual Voice Assessments
          </span>
          <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-8">
            Study smarter with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">
              Conversational AI
            </span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
            Log your study topics and engage in real-time voice exams. Lumina tracks your progress, identifies gaps, and helps you master any subject.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/login" className="bg-slate-900 text-white px-8 py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 hover:scale-105 transition transform">
              Start Your Journey <ChevronRight size={20} />
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <motion.section 
        variants={containerVars}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-3 gap-8"
      >
        <FeatureCard 
          icon={<Mic className="text-indigo-600" />}
          title="Voice Assessments"
          desc="Talk to your study assistant. Speak answers in any language, get instant feedback."
          vars={itemVars}
        />
        <FeatureCard 
          icon={<BarChart3 className="text-violet-600" />}
          title="Visual Analytics"
          desc="Watch your improvement through beautifully rendered heatmaps and trend charts."
          vars={itemVars}
        />
        <FeatureCard 
          icon={<Zap className="text-amber-500" />}
          title="Adaptive Learning"
          desc="AI identifies your weak spots and generates custom questions to fix them."
          vars={itemVars}
        />
      </motion.section>
    </div>
  );
}

function FeatureCard({ icon, title, desc, vars }) {
  return (
    <motion.div variants={vars} className="p-8 rounded-3xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-300">
      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">{icon}</div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{desc}</p>
    </motion.div>
  );
}