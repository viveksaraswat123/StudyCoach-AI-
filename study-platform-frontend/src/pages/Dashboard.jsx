import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Clock, 
  Target, 
  Mic, 
  Plus, 
  TrendingUp, 
  Award, 
  Search,
  BookOpen,
  Calendar,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from 'recharts';

// Mock data for the chart - you'll eventually fetch this from FastAPI
const studyData = [
  { day: 'Mon', hours: 2 },
  { day: 'Tue', hours: 4.5 },
  { day: 'Wed', hours: 3 },
  { day: 'Thu', hours: 5.5 },
  { day: 'Fri', hours: 4 },
  { day: 'Sat', hours: 8 },
  { day: 'Sun', hours: 6 },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* --- SIDEBAR (Desktop) --- */}
      <aside className="w-72 bg-white border-r border-slate-200 p-8 hidden xl:flex flex-col">
        <div className="flex items-center gap-2 text-2xl font-black text-indigo-600 mb-12 uppercase tracking-tighter">
          <div className="p-2 bg-indigo-600 text-white rounded-lg"><Target size={20}/></div>
          Lumina
        </div>
        
        <nav className="space-y-2 flex-1">
          <SidebarItem icon={<LayoutDashboard size={20}/>} label="Dashboard" active />
          <SidebarItem icon={<BookOpen size={20}/>} label="My Topics" />
          <SidebarItem icon={<Clock size={20}/>} label="Study History" />
          <SidebarItem icon={<Award size={20}/>} label="Achievements" />
        </nav>

        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-3 text-slate-400 hover:text-red-500 transition-colors p-4 mt-auto"
        >
          <LogOut size={20} /> <span className="font-bold">Logout</span>
        </button>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Dashboard</h1>
            <p className="text-slate-500 font-medium mt-1">Welcome back! You're 3 hours away from your weekly goal.</p>
          </motion.div>
          
          <div className="flex gap-3">
            <button className="hidden md:flex p-4 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition shadow-sm">
              <Search size={20}/>
            </button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/log-session')}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition"
            >
              <Plus size={20}/> Log Session
            </motion.button>
          </div>
        </header>

        {/* --- STATS GRID --- */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
        >
          <StatCard 
            variants={itemVariants}
            label="Avg. Accuracy" 
            value="88.4%" 
            trend="+5.2%" 
            trendUp={true}
            icon={<TrendingUp size={20} className="text-emerald-500"/>} 
          />
          <StatCard 
            variants={itemVariants}
            label="Current Streak" 
            value="12 Days" 
            trend="New Record" 
            trendUp={true}
            icon={<Award size={20} className="text-amber-500"/>} 
          />
          <StatCard 
            variants={itemVariants}
            label="Total Hours" 
            value="142h" 
            trend="+12h this week" 
            trendUp={true}
            icon={<Calendar size={20} className="text-blue-500"/>} 
          />
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* --- ACTIVITY CHART --- */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="xl:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-slate-800">Study Activity</h3>
              <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-sm font-bold text-slate-500">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studyData}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} 
                    dy={10}
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="#4f46e5" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorHours)" 
                    dot={{ r: 6, fill: '#4f46e5', strokeWidth: 3, stroke: '#fff' }}
                    activeDot={{ r: 8 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.section>

          {/* --- AI ASSESSMENT CARD --- */}
          <motion.section 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-indigo-600 p-10 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-between relative overflow-hidden group"
          >
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-8 group-hover:rotate-12 transition-transform">
                <Mic size={28}/>
              </div>
              <h3 className="text-3xl font-black mb-4 leading-tight">AI Voice <br/>Assessment</h3>
              <p className="text-indigo-100 opacity-80 mb-10 leading-relaxed font-medium">
                Test your knowledge on your recently studied topics. Our AI will conduct a conversational quiz to verify your mastery.
              </p>
              <button className="w-full bg-white text-indigo-600 py-5 rounded-2xl font-black text-lg hover:bg-indigo-50 transition transform active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-indigo-900/20">
                Begin Interview <ChevronRight size={20}/>
              </button>
            </div>
            
            {/* Decorative circles */}
            <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-400/20 rounded-full blur-2xl" />
          </motion.section>

        </div>
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function SidebarItem({ icon, label, active = false }) {
  return (
    <motion.div 
      whileHover={{ x: 5 }}
      className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200 ${
        active 
          ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50' 
          : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'
      }`}
    >
      <span className={active ? 'text-indigo-600' : ''}>{icon}</span>
      <span className="font-bold">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
    </motion.div>
  );
}

function StatCard({ label, value, trend, trendUp, icon, variants }) {
  return (
    <motion.div 
      variants={variants}
      className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-100 transition-colors"
    >
      <div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">{label}</p>
        <p className="text-4xl font-black text-slate-900 mb-2">{value}</p>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${trendUp ? 'text-emerald-500' : 'text-slate-400'}`}>
            {trend}
          </span>
          <span className="text-slate-300 text-xs font-medium">vs last month</span>
        </div>
      </div>
      <div className="p-4 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">
        {icon}
      </div>
    </motion.div>
  );
}