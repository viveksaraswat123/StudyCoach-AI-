import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BookOpen,
  BarChart3,
  Brain,
  Clock,
  ChevronRight,
  Zap,
  Target,
  RefreshCw,
  MessageCircle,
  Users,
  Trophy,
  Sparkles,
} from "lucide-react";

// Animation Variants
const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.1 } }
};

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-white selection:text-black">
      
      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-neutral-800/50 bg-neutral-950/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <div className="text-xl font-bold tracking-tighter flex items-center gap-2">
            <div className="w-6 h-6 bg-white rounded-sm" /> 
            StudyCoach
          </div>

          <div className="hidden md:flex gap-10 items-center text-sm font-medium">
            <a href="#features" className="text-neutral-400 hover:text-white transition-colors">features</a>
            <a href="#how" className="text-neutral-400 hover:text-white transition-colors">how it works</a>
            <Link to="/login" className="text-neutral-400 hover:text-white transition-colors">login</Link>
            <Link
              to="/register"
              className="bg-neutral-100 text-black px-5 py-2 rounded-full hover:bg-white transition-all active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-5xl mx-auto text-center">
          <motion.div {...fadeIn}>
            <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-widest uppercase border border-neutral-800 rounded-full text-neutral-400">
              Your Personalized AI Tutor Platfrom
            </span>
            <h1 className="text-5xl md:text-8xl font-bold leading-[1.1] tracking-tight mb-8">
              Study smarter, <br />
              <span className="text-neutral-500">not harder.</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Track your study sessions, get insights from an AI tutor, collaborate with study groups, and climb the leaderboard. Everything you need to master any subject.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="bg-white text-black px-8 py-4 rounded-full font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all"
              >
                Start Learning Free <ChevronRight size={18} />
              </Link>
              <Link
                to="/login"
                className="border border-neutral-800 bg-neutral-900/50 backdrop-blur px-8 py-4 rounded-full font-semibold hover:bg-neutral-800 transition-all"
              >
                View Live Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* WORKFLOW SECTION */}
      <section id="how" className="py-24 px-6 border-t border-neutral-900">
        <div className="max-w-7xl mx-auto">
          <div className="mb-20">
            <h2 className="text-sm font-bold uppercase tracking-widest text-blue-500 mb-4">How It Works</h2>
            <h3 className="text-3xl md:text-4xl font-semibold">Track, Learn, Compete.</h3>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            <Step 
              icon={<Clock size={24} />} 
              step="01" 
              title="Log Study Time" 
              desc="Record what you're studying, how focused you are, and take notes. Build a complete learning history." 
            />
            <Step 
              icon={<Sparkles size={24} />} 
              step="02" 
              title="AI-Powered Help" 
              desc="Chat with your AI tutor to understand complex topics, get explanations, and clear up confusion instantly." 
            />
            <Step 
              icon={<Trophy size={24} />} 
              step="03" 
              title="Study Together, Win Together" 
              desc="Join study groups, share resources, earn XP, and compete on leaderboards with peers." 
            />
          </motion.div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-24 px-6 bg-neutral-900/30">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-semibold mb-16 text-center">Everything you need to master any subject.</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-800 border border-neutral-800 rounded-2xl overflow-hidden">
            <FeatureCard 
              icon={<Clock className="text-blue-400" />}
              title="Focus Tracking" 
              desc="Record focus levels during each study session to identify your peak learning times." 
            />
            <FeatureCard 
              icon={<BarChart3 className="text-purple-400" />}
              title="Progress Dashboard" 
              desc="See your study patterns, total hours, streaks, and key metrics at a glance." 
            />
            <FeatureCard 
              icon={<Brain className="text-green-400" />}
              title="Study Logs" 
              desc="Keep detailed notes on what you studied, your focus level, and key takeaways." 
            />
            <FeatureCard 
              icon={<Zap className="text-yellow-400" />}
              title="Performance Stats" 
              desc="Track learning efficiency and identify topics that need more attention." 
            />
          </div>
        </div>
      </section>

      {/* PREMIUM FEATURES SECTION */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">Supercharged Learning</h2>
            <p className="text-neutral-400 text-lg">New tools that transform how you study</p>
          </div>

          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid md:grid-cols-2 gap-8"
          >
            {/* AI Tutor Card */}
            <motion.div 
              variants={fadeIn}
              className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-10 hover:border-blue-700/50 transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]"
            >
              <div className="absolute -right-32 -top-32 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl group-hover:bg-blue-500/10 transition-all" />
              
              <div className="relative z-10">
                <div className="mb-6 p-3 w-fit bg-blue-500/10 rounded-xl border border-blue-500/20 group-hover:bg-blue-500/20 transition-all">
                  <MessageCircle className="text-blue-400" size={28} />
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-white">AI Tutor</h3>
                <p className="text-neutral-400 mb-6 leading-relaxed">
                  Ask questions about any topic and get instant explanations. Your personal tutor that's available 24/7 to help you understand concepts faster.
                </p>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3 text-neutral-300">
                    <span className="text-blue-400 font-bold">→</span>
                    <span>Instant answers to your study questions</span>
                  </li>
                  <li className="flex items-start gap-3 text-neutral-300">
                    <span className="text-blue-400 font-bold">→</span>
                    <span>Learn at your own pace with detailed explanations</span>
                  </li>
                  <li className="flex items-start gap-3 text-neutral-300">
                    <span className="text-blue-400 font-bold">→</span>
                    <span>Conversation history to track your progress</span>
                  </li>
                </ul>

                <Link 
                  to="/register"
                  className="inline-block text-blue-400 font-semibold hover:text-blue-300 transition-colors flex items-center gap-2"
                >
                  Try AI Tutor <ChevronRight size={16} />
                </Link>
              </div>
            </motion.div>

            {/* Study Groups Card */}
            <motion.div 
              variants={fadeIn}
              className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-10 hover:border-green-700/50 transition-all hover:shadow-[0_0_30px_rgba(34,197,94,0.1)]"
            >
              <div className="absolute -right-32 -top-32 w-64 h-64 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-all" />
              
              <div className="relative z-10">
                <div className="mb-6 p-3 w-fit bg-green-500/10 rounded-xl border border-green-500/20 group-hover:bg-green-500/20 transition-all">
                  <Users className="text-green-400" size={28} />
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-white">Study Groups & Leaderboards</h3>
                <p className="text-neutral-400 mb-6 leading-relaxed">
                  Connect with other students, join study groups, and compete on leaderboards. Earn XP and climb the ranks as you study.
                </p>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3 text-neutral-300">
                    <span className="text-green-400 font-bold">→</span>
                    <span>Create or join study groups with peers</span>
                  </li>
                  <li className="flex items-start gap-3 text-neutral-300">
                    <span className="text-green-400 font-bold">→</span>
                    <span>Earn XP and compete on global & group leaderboards</span>
                  </li>
                  <li className="flex items-start gap-3 text-neutral-300">
                    <span className="text-green-400 font-bold">→</span>
                    <span>Stay motivated with friendly competition</span>
                  </li>
                </ul>

                <Link 
                  to="/register"
                  className="inline-block text-green-400 font-semibold hover:text-green-300 transition-colors flex items-center gap-2"
                >
                  Join a Group <ChevronRight size={16} />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
      <section className="py-32 px-6 text-center border-t border-neutral-900">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="max-w-3xl mx-auto bg-gradient-to-b from-neutral-900 to-transparent p-12 rounded-[3rem] border border-neutral-800"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Ready to level up your studies?
          </h2>
          <p className="text-neutral-400 mb-10 text-lg leading-relaxed">
            Track your progress, learn from an AI tutor, collaborate with study groups, and climb the leaderboard. All in one platform.
          </p>
          <Link
            to="/register"
            className="inline-block bg-white text-black px-12 py-5 rounded-full font-bold text-lg hover:scale-105 transition-transform"
          >
            Get Started Free
          </Link>
        </motion.div>
      </section>

      <footer className="py-12 border-t border-neutral-900 text-center text-neutral-600 text-sm">
        <div className="mb-4 font-bold tracking-tighter text-neutral-400 text-base">StudyCoach</div>
        <p>© {new Date().getFullYear()} All rights reserved. Built for the cognitively ambitious.</p>
      </footer>
    </div>
  );
}

function Step({ icon, step, title, desc }) {
  return (
    <motion.div variants={fadeIn} className="p-8 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 hover:border-neutral-700 transition-colors group">
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-neutral-800 rounded-lg text-white group-hover:bg-white group-hover:text-black transition-colors">
          {icon}
        </div>
        <span className="text-4xl font-black text-neutral-800 tracking-tighter">{step}</span>
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-neutral-400 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-neutral-950 p-10 hover:bg-neutral-900 transition-colors group">
      <div className="mb-6">{icon}</div>
      <h3 className="text-white text-lg font-bold mb-3 group-hover:translate-x-1 transition-transform">{title}</h3>
      <p className="text-neutral-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}