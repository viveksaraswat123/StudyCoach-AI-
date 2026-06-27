import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BookOpen,
  BarChart3,
  Clock,
  ChevronRight,
  Users,
  Trophy,
  Layers,
  Timer,
  TrendingUp,
  RotateCcw,
  CheckSquare,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.09 } },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 selection:bg-white selection:text-black">

      {/* NAV */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-neutral-800/50 bg-neutral-950/60">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <div className="text-xl font-bold tracking-tighter flex items-center gap-2.5">
            <div className="w-6 h-6 bg-white rounded-sm" />
            StudyCoach
          </div>
          <div className="hidden md:flex gap-10 items-center text-sm font-medium">
            <a href="#features" className="text-neutral-400 hover:text-white transition-colors">features</a>
            <a href="#how" className="text-neutral-400 hover:text-white transition-colors">how it works</a>
            <Link to="/login" className="text-neutral-400 hover:text-white transition-colors">login</Link>
            <Link
              to="/register"
              className="bg-neutral-100 text-black px-5 py-2 rounded-full hover:bg-white transition-all active:scale-95 font-semibold"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-40 pb-24 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-blue-500/8 blur-[120px] rounded-full -z-10" />
        <div className="max-w-5xl mx-auto text-center">
          <motion.div {...fadeUp}>
            <span className="inline-block px-4 py-1.5 mb-8 text-xs font-semibold tracking-widest uppercase border border-neutral-800 rounded-full text-neutral-500">
              Built for students who mean it
            </span>
            <h1 className="text-5xl md:text-8xl font-bold leading-[1.05] tracking-tight mb-8">
              Study smarter,<br />
              <span className="text-neutral-500">not harder.</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Track your sessions, review with flashcards, stay focused with a built-in timer, and compete with your study group — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/register"
                className="bg-white text-black px-8 py-4 rounded-full font-semibold flex items-center justify-center gap-2 hover:shadow-[0_0_24px_rgba(255,255,255,0.25)] transition-all"
              >
                Start for free <ChevronRight size={18} />
              </Link>
              <Link
                to="/login"
                className="border border-neutral-800 bg-neutral-900/50 backdrop-blur px-8 py-4 rounded-full font-semibold hover:bg-neutral-800/60 transition-all"
              >
                Sign in
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="border-y border-neutral-900 py-10 px-6 bg-neutral-950">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "25 min", label: "Focus blocks" },
            { value: "SM-2", label: "Spaced repetition" },
            { value: "XP", label: "Earned per session" },
            { value: "100%", label: "Free to use" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-1">{s.value}</p>
              <p className="text-neutral-600 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Everything you need in one place
            </h2>
            <p className="text-neutral-500 text-lg max-w-xl mx-auto">
              Six tools that cover the full study cycle — from planning to review.
            </p>
          </div>

          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            <FeatureCard
              icon={<BookOpen size={22} className="text-blue-400" />}
              title="Study Logs"
              desc="Record every session — topic, duration, focus level, and notes. Build a full history of what you've studied."
              accent="blue"
            />
            <FeatureCard
              icon={<Timer size={22} className="text-orange-400" />}
              title="Focus Timer"
              desc="Built-in Pomodoro timer with 25-minute work blocks, short and long breaks, and automatic session logging."
              accent="orange"
            />
            <FeatureCard
              icon={<Layers size={22} className="text-purple-400" />}
              title="Flashcard Decks"
              desc="Create decks, add cards, and study with spaced repetition. Cards are scheduled based on how well you know them."
              accent="purple"
            />
            <FeatureCard
              icon={<Users size={22} className="text-emerald-400" />}
              title="Study Groups"
              desc="Join or create study groups, climb XP leaderboards with your peers, and stay motivated together."
              accent="emerald"
            />
            <FeatureCard
              icon={<BarChart3 size={22} className="text-cyan-400" />}
              title="Performance Charts"
              desc="See your weekly study hours, focus breakdown, and top subjects visualized in clear charts."
              accent="cyan"
            />
            <FeatureCard
              icon={<CheckSquare size={22} className="text-rose-400" />}
              title="Task Board"
              desc="Organize assignments and study tasks on a Kanban board. Move cards from To Do to Done."
              accent="rose"
            />
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-24 px-6 bg-neutral-900/20 border-t border-neutral-900">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="text-sm font-bold uppercase tracking-widest text-blue-500 mb-4">How It Works</h2>
            <h3 className="text-3xl md:text-4xl font-bold">Log. Review. Improve.</h3>
          </div>
          <motion.div
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            <Step
              icon={<Clock size={22} />}
              step="01"
              title="Log Your Sessions"
              desc="After every study block, record the topic, time spent, and how focused you were. Your history builds itself."
            />
            <Step
              icon={<RotateCcw size={22} />}
              step="02"
              title="Review with Flashcards"
              desc="Turn your notes into flashcard decks. The spaced repetition system shows you cards right before you'd forget them."
            />
            <Step
              icon={<TrendingUp size={22} />}
              step="03"
              title="Track Your Progress"
              desc="Check your performance charts, earn XP for every session, and compete with your study group on the leaderboard."
            />
          </motion.div>
        </div>
      </section>

      {/* SPOTLIGHT: POMODORO + FLASHCARDS */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8">

          {/* Pomodoro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="group relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-10 hover:border-orange-800/50 transition-all hover:shadow-[0_0_40px_rgba(251,146,60,0.07)]"
          >
            <div className="absolute -right-24 -top-24 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl group-hover:bg-orange-500/10 transition-all" />
            <div className="relative z-10">
              <div className="mb-6 p-3 w-fit bg-orange-500/10 rounded-xl border border-orange-500/20">
                <Timer className="text-orange-400" size={26} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Focus Timer</h3>
              <p className="text-neutral-400 mb-6 leading-relaxed">
                Work in focused 25-minute blocks with short breaks between them. Every completed focus session is automatically logged to your study history.
              </p>
              <ul className="space-y-2.5 mb-8">
                {["25 / 5 / 15 minute modes", "Circular countdown ring", "Audio notification on completion", "Auto-logs focus sessions"].map((pt) => (
                  <li key={pt} className="flex items-center gap-3 text-neutral-300 text-sm">
                    <span className="text-orange-400 font-bold">→</span>{pt}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="text-orange-400 font-semibold hover:text-orange-300 transition-colors flex items-center gap-2 text-sm">
                Try the timer <ChevronRight size={15} />
              </Link>
            </div>
          </motion.div>

          {/* Flashcards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="group relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-10 hover:border-purple-800/50 transition-all hover:shadow-[0_0_40px_rgba(168,85,247,0.07)]"
          >
            <div className="absolute -right-24 -top-24 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all" />
            <div className="relative z-10">
              <div className="mb-6 p-3 w-fit bg-purple-500/10 rounded-xl border border-purple-500/20">
                <Layers className="text-purple-400" size={26} />
              </div>
              <h3 className="text-2xl font-bold mb-3">Flashcard Decks</h3>
              <p className="text-neutral-400 mb-6 leading-relaxed">
                Create color-coded decks for each subject. Study with 3D card flips and rate how well you know each card — the system schedules your next review automatically.
              </p>
              <ul className="space-y-2.5 mb-8">
                {["Spaced repetition (SM-2 algorithm)", "3D card flip animation", "Again / Hard / Good / Easy ratings", "Multiple color-coded decks"].map((pt) => (
                  <li key={pt} className="flex items-center gap-3 text-neutral-300 text-sm">
                    <span className="text-purple-400 font-bold">→</span>{pt}
                  </li>
                ))}
              </ul>
              <Link to="/register" className="text-purple-400 font-semibold hover:text-purple-300 transition-colors flex items-center gap-2 text-sm">
                Create a deck <ChevronRight size={15} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 text-center border-t border-neutral-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto bg-gradient-to-b from-neutral-900 to-transparent p-12 rounded-[3rem] border border-neutral-800"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight">
            Ready to build a better study habit?
          </h2>
          <p className="text-neutral-400 mb-10 text-lg leading-relaxed">
            Track your sessions, review smarter, and compete with your group. Free to use, no setup required.
          </p>
          <Link
            to="/register"
            className="inline-block bg-white text-black px-12 py-5 rounded-full font-bold text-lg hover:scale-105 transition-transform"
          >
            Get Started Free
          </Link>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-neutral-900 text-center text-neutral-600 text-sm">
        <div className="mb-3 font-bold tracking-tighter text-neutral-400 text-base">StudyCoach</div>
        <p>© {new Date().getFullYear()} All rights reserved.</p>
      </footer>
    </div>
  );
}

function Step({ icon, step, title, desc }) {
  return (
    <motion.div
      variants={fadeUp}
      className="p-8 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 hover:border-neutral-700 transition-colors group"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-neutral-800 rounded-xl text-white group-hover:bg-white group-hover:text-black transition-colors">
          {icon}
        </div>
        <span className="text-4xl font-black text-neutral-800 tracking-tighter">{step}</span>
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-neutral-500 leading-relaxed text-sm">{desc}</p>
    </motion.div>
  );
}

function FeatureCard({ icon, title, desc, accent }) {
  const borderMap = {
    blue: "hover:border-blue-800/50",
    orange: "hover:border-orange-800/50",
    purple: "hover:border-purple-800/50",
    emerald: "hover:border-emerald-800/50",
    cyan: "hover:border-cyan-800/50",
    rose: "hover:border-rose-800/50",
  };
  return (
    <motion.div
      variants={fadeUp}
      className={`bg-neutral-900/50 border border-neutral-800 rounded-2xl p-7 hover:bg-neutral-900/80 transition-all ${borderMap[accent] || ""}`}
    >
      <div className="mb-5 p-2.5 w-fit bg-neutral-800/60 rounded-xl">{icon}</div>
      <h3 className="text-white text-base font-bold mb-2">{title}</h3>
      <p className="text-neutral-500 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}
