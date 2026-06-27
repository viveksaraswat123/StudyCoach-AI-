import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import API from "../api/client";
import {
  LayoutDashboard, BookOpen, TrendingUp, MessageSquare, Users,
  Timer, BookMarked, User, Brain, LogOut, Plus, Search,
  Trophy, ArrowLeft, UserPlus, UserMinus, AlertCircle, Shield,
  MessageCircle, CalendarDays, Rss, Crown, Trash2, Send,
  Clock, Flame, CheckCircle,
} from "lucide-react";

const FOCUS_COLORS = { high: "#10b981", medium: "#f59e0b", low: "#ef4444" };

function timeUntil(dateStr) {
  const diff = new Date(dateStr) - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${mins}m`;
  return `in ${mins}m`;
}

function nowPlusHour() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

export default function StudyGroups() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("browse");
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [globalLB, setGlobalLB] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "", is_public: true });
  const [creating, setCreating] = useState(false);
  const [actionId, setActionId] = useState(null);

  // ── Detail view state ──
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [detailTab, setDetailTab] = useState("overview");

  // Overview
  const [groupLB, setGroupLB] = useState(null);
  const [groupLBLoading, setGroupLBLoading] = useState(false);
  const [weeklyData, setWeeklyData] = useState(null);
  const [weeklyLoading, setWeeklyLoading] = useState(false);

  // Chat
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef(null);

  // Feed
  const [feedLogs, setFeedLogs] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [newSession, setNewSession] = useState({ title: "", scheduled_at: nowPlusHour(), duration_minutes: 60, topic: "" });
  const [schedulingSession, setSchedulingSession] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState(null);

  // ── List view data loading ──
  const getErr = (err, fallback) => {
    const d = err?.response?.data?.detail;
    return typeof d === "string" ? d : (Array.isArray(d) ? d[0]?.msg : null) || fallback;
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "browse") {
        const res = await API.get("/study-groups");
        setGroups(res.data);
      } else if (activeTab === "my-groups") {
        const res = await API.get("/study-groups/my");
        setMyGroups(res.data);
      } else if (activeTab === "leaderboard") {
        const res = await API.get("/leaderboard/global");
        setGlobalLB(res.data);
      }
    } catch (err) {
      setError(getErr(err, "Failed to load data"));
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Open group detail ──
  const openDetail = async (group) => {
    setSelectedGroup(group);
    setDetailTab("overview");
    setGroupLB(null);
    setWeeklyData(null);
    setMessages([]);
    setFeedLogs([]);
    setSessions([]);
    setGroupLBLoading(true);
    setWeeklyLoading(true);
    try {
      const [lbRes, weeklyRes, groupRes] = await Promise.all([
        API.get(`/leaderboard/group/${group.id}`),
        API.get(`/study-groups/${group.id}/weekly`),
        API.get(`/study-groups/${group.id}`),
      ]);
      setGroupLB(lbRes.data);
      setWeeklyData(weeklyRes.data);
      setSelectedGroup(groupRes.data);
    } catch {
      // partial data is fine
    } finally {
      setGroupLBLoading(false);
      setWeeklyLoading(false);
    }
  };

  // ── Chat: load + poll ──
  useEffect(() => {
    if (detailTab !== "chat" || !selectedGroup) return;
    setMessagesLoading(true);
    const loadMsgs = async () => {
      try {
        const res = await API.get(`/study-groups/${selectedGroup.id}/messages`);
        setMessages(res.data);
      } catch {}
      setMessagesLoading(false);
    };
    loadMsgs();
    const pollId = setInterval(loadMsgs, 8000);
    return () => clearInterval(pollId);
  }, [detailTab, selectedGroup?.id]);

  // Chat auto-scroll
  useEffect(() => {
    if (detailTab === "chat") messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, detailTab]);

  // ── Feed: load on tab switch ──
  useEffect(() => {
    if (detailTab !== "feed" || !selectedGroup) return;
    setFeedLoading(true);
    API.get(`/study-groups/${selectedGroup.id}/feed`)
      .then((res) => setFeedLogs(res.data))
      .catch(() => {})
      .finally(() => setFeedLoading(false));
  }, [detailTab, selectedGroup?.id]);

  // ── Sessions: load on tab switch ──
  useEffect(() => {
    if (detailTab !== "sessions" || !selectedGroup) return;
    setSessionsLoading(true);
    API.get(`/study-groups/${selectedGroup.id}/sessions`)
      .then((res) => setSessions(res.data))
      .catch(() => {})
      .finally(() => setSessionsLoading(false));
  }, [detailTab, selectedGroup?.id]);

  // ── Actions ──
  const handleJoin = async (groupId) => {
    if (actionId) return;
    setActionId(groupId);
    setError(null);
    try {
      await API.post(`/study-groups/${groupId}/join`);
      if (selectedGroup?.id === groupId) {
        setSelectedGroup((g) => g ? { ...g, is_member: true, member_count: (g.member_count || 0) + 1 } : null);
      }
      loadData();
    } catch (err) { setError(getErr(err, "Failed to join group")); }
    finally { setActionId(null); }
  };

  const handleLeave = async (groupId) => {
    if (actionId) return;
    setActionId(groupId);
    setError(null);
    try {
      await API.post(`/study-groups/${groupId}/leave`);
      if (selectedGroup?.id === groupId) {
        setSelectedGroup((g) => g ? { ...g, is_member: false, member_count: Math.max(0, (g.member_count || 1) - 1) } : null);
      }
      loadData();
    } catch (err) { setError(getErr(err, "Failed to leave group")); }
    finally { setActionId(null); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (newGroup.name.trim().length < 3) { setError("Group name must be at least 3 characters."); return; }
    setCreating(true); setError(null);
    try {
      await API.post("/study-groups", newGroup);
      setShowCreateModal(false);
      setNewGroup({ name: "", description: "", is_public: true });
      loadData();
    } catch (err) { setError(getErr(err, "Failed to create group")); }
    finally { setCreating(false); }
  };

  const sendMessage = async () => {
    const content = chatInput.trim();
    if (!content || sendingMsg) return;
    setSendingMsg(true);
    try {
      const res = await API.post(`/study-groups/${selectedGroup.id}/messages`, { content });
      setMessages((prev) => [...prev, res.data]);
      setChatInput("");
    } catch {}
    finally { setSendingMsg(false); }
  };

  const scheduleSession = async (e) => {
    e.preventDefault();
    if (!newSession.title.trim()) return;
    setSchedulingSession(true);
    try {
      const payload = {
        ...newSession,
        scheduled_at: new Date(newSession.scheduled_at).toISOString(),
        duration_minutes: parseInt(newSession.duration_minutes),
        topic: newSession.topic || null,
      };
      const res = await API.post(`/study-groups/${selectedGroup.id}/sessions`, payload);
      setSessions((prev) => [...prev, res.data].sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)));
      setShowScheduleModal(false);
      setNewSession({ title: "", scheduled_at: nowPlusHour(), duration_minutes: 60, topic: "" });
    } catch (err) { setError(getErr(err, "Failed to schedule session")); }
    finally { setSchedulingSession(false); }
  };

  const deleteSession = async (sessionId) => {
    setDeletingSessionId(sessionId);
    try {
      await API.delete(`/study-groups/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } catch {}
    finally { setDeletingSessionId(null); }
  };

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/", { replace: true }); };
  const filteredGroups = groups.filter((g) => {
    const q = searchQuery.toLowerCase();
    return g.name?.toLowerCase().includes(q) || g.description?.toLowerCase().includes(q);
  });

  // ────────────────────────────────────────────────────────────────────────────
  // DETAIL VIEW
  // ────────────────────────────────────────────────────────────────────────────
  if (selectedGroup) {
    const upcoming = sessions.filter((s) => new Date(s.scheduled_at) > Date.now());
    const past = sessions.filter((s) => new Date(s.scheduled_at) <= Date.now());

    return (
      <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
        <Sidebar navigate={navigate} handleLogout={handleLogout} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 md:p-10">

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => setSelectedGroup(null)}
                className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all flex-shrink-0"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight truncate">{selectedGroup.name}</h1>
                  {selectedGroup.is_admin && (
                    <span className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/15 border border-amber-500/25 text-amber-400 rounded-lg text-xs font-bold flex-shrink-0">
                      <Crown size={11} /> Admin
                    </span>
                  )}
                </div>
                {selectedGroup.description && (
                  <p className="text-neutral-500 text-sm mt-1 line-clamp-1">{selectedGroup.description}</p>
                )}
              </div>
              {selectedGroup.is_member ? (
                <button
                  onClick={() => handleLeave(selectedGroup.id)}
                  disabled={actionId === selectedGroup.id || selectedGroup.is_admin}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-sm font-semibold disabled:opacity-40 flex-shrink-0"
                  title={selectedGroup.is_admin ? "Admins cannot leave" : undefined}
                >
                  <UserMinus size={15} />
                  {actionId === selectedGroup.id ? "Leaving…" : "Leave"}
                </button>
              ) : (
                <button
                  onClick={() => handleJoin(selectedGroup.id)}
                  disabled={actionId === selectedGroup.id}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all text-sm font-bold disabled:opacity-40 flex-shrink-0"
                >
                  <UserPlus size={15} />
                  {actionId === selectedGroup.id ? "Joining…" : "Join"}
                </button>
              )}
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2"><AlertCircle size={15} />{error}</div>
                  <button onClick={() => setError(null)} className="font-bold">✕</button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats strip */}
            <div className="grid grid-cols-4 gap-3 mb-6">
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4">
                <p className="text-2xl font-bold">{selectedGroup.member_count ?? "—"}</p>
                <p className="text-neutral-600 text-xs uppercase tracking-widest mt-1">Members</p>
              </div>
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <Shield size={13} className={selectedGroup.is_public ? "text-emerald-400" : "text-neutral-500"} />
                  <p className={`font-bold text-sm ${selectedGroup.is_public ? "text-emerald-400" : "text-neutral-400"}`}>
                    {selectedGroup.is_public ? "Public" : "Private"}
                  </p>
                </div>
                <p className="text-neutral-600 text-xs uppercase tracking-widest">Visibility</p>
              </div>
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4">
                <p className={`font-bold text-sm mb-1 ${selectedGroup.is_member ? "text-emerald-400" : "text-neutral-400"}`}>
                  {selectedGroup.is_member ? "Joined" : "Not joined"}
                </p>
                <p className="text-neutral-600 text-xs uppercase tracking-widest">Status</p>
              </div>
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-4">
                <p className={`font-bold text-sm mb-1 ${selectedGroup.is_admin ? "text-amber-400" : "text-neutral-400"}`}>
                  {selectedGroup.is_admin ? "Admin" : "Member"}
                </p>
                <p className="text-neutral-600 text-xs uppercase tracking-widest">Role</p>
              </div>
            </div>

            {/* Detail tabs */}
            <div className="flex gap-1 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-1 mb-6 w-fit">
              {[
                { key: "overview", label: "Overview", icon: <Trophy size={14} /> },
                { key: "chat", label: "Chat", icon: <MessageCircle size={14} /> },
                { key: "feed", label: "Feed", icon: <Rss size={14} /> },
                { key: "sessions", label: "Sessions", icon: <CalendarDays size={14} /> },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setDetailTab(t.key)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    detailTab === t.key ? "bg-white text-black" : "text-neutral-500 hover:text-white"
                  }`}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* ── OVERVIEW TAB ── */}
            {detailTab === "overview" && (
              <div className="space-y-6">
                {/* Weekly challenge */}
                <section className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
                    <div>
                      <h2 className="font-bold flex items-center gap-2"><Flame size={16} className="text-orange-400" />Weekly Challenge</h2>
                      <p className="text-neutral-600 text-xs mt-0.5">
                        {weeklyData ? `Week of ${weeklyData.week_start}` : "Hours studied this week"}
                      </p>
                    </div>
                  </div>
                  {weeklyLoading ? (
                    <div className="p-10 text-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                  ) : !weeklyData?.entries?.length ? (
                    <div className="p-10 text-center text-neutral-600 text-sm">No activity this week yet</div>
                  ) : (
                    <div className="divide-y divide-neutral-800">
                      {weeklyData.entries.map((entry, i) => {
                        const maxHours = weeklyData.entries[0]?.hours || 1;
                        return (
                          <div key={entry.user_email} className="flex items-center gap-4 px-6 py-4">
                            <div className="w-6 flex-shrink-0 text-center">
                              {i === 0
                                ? <Flame size={16} className="text-orange-400 mx-auto" />
                                : <span className="text-neutral-600 text-sm font-bold">{entry.rank}</span>}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {entry.user_email.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium truncate">{entry.user_email}</p>
                                <p className="text-sm font-bold text-orange-400 ml-3 flex-shrink-0">{entry.hours}h</p>
                              </div>
                              <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(entry.hours / maxHours) * 100}%` }}
                                  transition={{ duration: 0.7, delay: i * 0.05 }}
                                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                {/* All-time leaderboard */}
                <section className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden">
                  <div className="px-6 py-5 border-b border-neutral-800">
                    <h2 className="font-bold">All-time Leaderboard</h2>
                    <p className="text-neutral-600 text-xs mt-0.5">Ranked by total XP</p>
                  </div>
                  {groupLBLoading ? (
                    <div className="p-10 text-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                  ) : !groupLB?.entries?.length ? (
                    <div className="p-10 text-center text-neutral-600 text-sm">No members yet</div>
                  ) : (
                    <>
                      {groupLB.user_rank && (
                        <div className="px-6 py-4 bg-blue-500/8 border-b border-blue-500/15 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-0.5">Your Position</p>
                            <p className="text-3xl font-bold text-blue-400">#{groupLB.user_rank.rank}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-neutral-500 uppercase tracking-widest mb-0.5">Your XP</p>
                            <p className="text-3xl font-bold">{groupLB.user_rank.total_xp}</p>
                          </div>
                        </div>
                      )}
                      <div className="divide-y divide-neutral-800">
                        {groupLB.entries.map((entry, i) => (
                          <div key={entry.user_email} className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-800/20 transition-colors">
                            <div className="w-7 flex-shrink-0 flex items-center justify-center">
                              {i === 0 ? <Trophy size={17} className="text-yellow-500" />
                                : i === 1 ? <Trophy size={17} className="text-neutral-400" />
                                : i === 2 ? <Trophy size={17} className="text-orange-600" />
                                : <span className="text-neutral-600 font-bold text-sm">{entry.rank}</span>}
                            </div>
                            <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {entry.user_email.charAt(0).toUpperCase()}
                            </div>
                            <p className="flex-1 text-sm font-medium truncate min-w-0">{entry.user_email}</p>
                            {entry.user_email === selectedGroup.creator_email && (
                              <Crown size={13} className="text-amber-400 flex-shrink-0" />
                            )}
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm font-bold text-blue-400">{entry.total_xp} XP</p>
                              <p className="text-xs text-neutral-600">{typeof entry.study_hours === "number" ? entry.study_hours.toFixed(1) : "0.0"}h</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </section>
              </div>
            )}

            {/* ── CHAT TAB ── */}
            {detailTab === "chat" && (
              <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col" style={{ height: "60vh" }}>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {messagesLoading && messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle size={36} className="text-neutral-700 mb-3" />
                      <p className="text-neutral-500 font-medium">No messages yet</p>
                      <p className="text-neutral-600 text-sm mt-1">Be the first to say something!</p>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-start gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {msg.author_email.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-sm font-semibold truncate">{msg.author_email}</span>
                              {msg.author_email === selectedGroup.creator_email && (
                                <Crown size={11} className="text-amber-400 flex-shrink-0" />
                              )}
                              <span className="text-xs text-neutral-600 flex-shrink-0">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-300 leading-relaxed break-words">{msg.content}</p>
                          </div>
                        </motion.div>
                      ))}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Input */}
                {selectedGroup.is_member ? (
                  <div className="border-t border-neutral-800 p-4 flex gap-3">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                      placeholder="Message the group…"
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!chatInput.trim() || sendingMsg}
                      className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors disabled:opacity-40 flex-shrink-0"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-neutral-800 p-4 text-center">
                    <p className="text-neutral-600 text-sm">
                      <button onClick={() => handleJoin(selectedGroup.id)} className="text-blue-400 hover:text-blue-300 font-semibold">
                        Join this group
                      </button>
                      {" "}to participate in the chat
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── FEED TAB ── */}
            {detailTab === "feed" && (
              <section className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-neutral-800">
                  <h2 className="font-bold flex items-center gap-2"><Rss size={15} className="text-emerald-400" />Member Activity</h2>
                  <p className="text-neutral-600 text-xs mt-0.5">Recent study sessions from everyone in the group</p>
                </div>
                {feedLoading ? (
                  <div className="p-12 text-center"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                ) : feedLogs.length === 0 ? (
                  <div className="p-12 text-center">
                    <Rss size={32} className="text-neutral-700 mx-auto mb-3" />
                    <p className="text-neutral-600 text-sm">No activity yet — start studying!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-800">
                    {feedLogs.map((log, i) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i < 15 ? i * 0.03 : 0 }}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-800/20 transition-colors"
                      >
                        <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: FOCUS_COLORS[log.focus_level] || "#404040" }} />
                        <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {log.user_email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{log.topic}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{log.user_email}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold">{log.hours}h</p>
                          <p className="text-xs text-neutral-600">
                            {log.study_date ? new Date(log.study_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ── SESSIONS TAB ── */}
            {detailTab === "sessions" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-lg">Study Sessions</h2>
                    <p className="text-neutral-600 text-sm">Scheduled group study blocks</p>
                  </div>
                  {selectedGroup.is_member && (
                    <button
                      onClick={() => { setNewSession({ title: "", scheduled_at: nowPlusHour(), duration_minutes: 60, topic: "" }); setShowScheduleModal(true); }}
                      className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors"
                    >
                      <Plus size={15} /> Schedule
                    </button>
                  )}
                </div>

                {sessionsLoading ? (
                  <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-12 text-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-12 text-center">
                    <CalendarDays size={36} className="text-neutral-700 mx-auto mb-3" />
                    <p className="text-neutral-500 font-medium">No sessions scheduled</p>
                    {selectedGroup.is_member && (
                      <p className="text-neutral-600 text-sm mt-1">Click "Schedule" to plan your next group study block</p>
                    )}
                  </div>
                ) : (
                  <>
                    {upcoming.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-600">Upcoming</p>
                        {upcoming.map((s) => {
                          const countdown = timeUntil(s.scheduled_at);
                          return (
                            <motion.div
                              key={s.id}
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-5 hover:border-neutral-700 transition-colors group"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold truncate">{s.title}</h3>
                                    {countdown && (
                                      <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 border border-blue-500/20 text-xs font-bold rounded-lg flex-shrink-0">
                                        {countdown}
                                      </span>
                                    )}
                                  </div>
                                  {s.topic && <p className="text-neutral-500 text-sm mb-2">{s.topic}</p>}
                                  <div className="flex items-center gap-4 text-xs text-neutral-600">
                                    <span className="flex items-center gap-1">
                                      <CalendarDays size={12} />
                                      {new Date(s.scheduled_at).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock size={12} />{s.duration_minutes} min
                                    </span>
                                  </div>
                                  <p className="text-xs text-neutral-700 mt-1.5">by {s.creator_email}</p>
                                </div>
                                {(selectedGroup.is_admin || s.creator_email === selectedGroup.creator_email) && (
                                  <button
                                    onClick={() => deleteSession(s.id)}
                                    disabled={deletingSessionId === s.id}
                                    className="p-2 text-neutral-700 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100 disabled:opacity-30 flex-shrink-0"
                                  >
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}

                    {past.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-xs font-bold uppercase tracking-widest text-neutral-600">Past</p>
                        {past.map((s) => (
                          <div key={s.id} className="bg-neutral-900/30 border border-neutral-800/50 rounded-2xl p-5 opacity-50">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle size={14} className="text-neutral-600 flex-shrink-0" />
                              <h3 className="font-semibold truncate text-neutral-400">{s.title}</h3>
                            </div>
                            <p className="text-xs text-neutral-600">
                              {new Date(s.scheduled_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {s.duration_minutes} min
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Schedule Session Modal */}
        <AnimatePresence>
          {showScheduleModal && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowScheduleModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 w-full max-w-md"
              >
                <h2 className="text-2xl font-bold mb-6">Schedule Session</h2>
                <form onSubmit={scheduleSession} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Title</label>
                    <input
                      required value={newSession.title}
                      onChange={(e) => setNewSession({ ...newSession, title: e.target.value })}
                      placeholder="e.g. Calculus Review"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600 text-sm transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Date & Time</label>
                    <input
                      required type="datetime-local" value={newSession.scheduled_at}
                      onChange={(e) => setNewSession({ ...newSession, scheduled_at: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neutral-600 text-sm transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Duration (minutes)</label>
                    <select
                      value={newSession.duration_minutes}
                      onChange={(e) => setNewSession({ ...newSession, duration_minutes: e.target.value })}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neutral-600 text-sm transition-colors"
                    >
                      {[30, 45, 60, 90, 120, 180].map((d) => <option key={d} value={d}>{d} min</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Topic <span className="text-neutral-700 font-normal normal-case">(optional)</span></label>
                    <input
                      value={newSession.topic}
                      onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })}
                      placeholder="What will you study?"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600 text-sm transition-colors"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowScheduleModal(false)}
                      className="flex-1 py-3 border border-neutral-800 rounded-xl text-sm font-semibold text-neutral-400 hover:text-white hover:border-neutral-700 transition-all">
                      Cancel
                    </button>
                    <button type="submit" disabled={schedulingSession}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                      {schedulingSession ? "Scheduling…" : "Schedule"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────────
  // LIST VIEW
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
      <Sidebar navigate={navigate} handleLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-10">
          <header className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Study Groups</h1>
              <p className="text-neutral-500 mt-1">Join a group, earn XP, climb the leaderboard</p>
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/30 transition-all flex-shrink-0">
              <Plus size={18} /> Create Group
            </motion.button>
          </header>

          {/* Tabs */}
          <div className="flex gap-1 bg-neutral-900/60 border border-neutral-800 rounded-2xl p-1 w-fit mb-8">
            {[{ key: "browse", label: "Browse" }, { key: "my-groups", label: "My Groups" }, { key: "leaderboard", label: "Leaderboard" }].map((tab) => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.key ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center justify-between gap-2">
                <div className="flex items-center gap-2"><AlertCircle size={15} />{error}</div>
                <button onClick={() => setError(null)} className="font-bold">✕</button>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-neutral-900/40 border border-neutral-800 rounded-2xl animate-pulse" />)}
            </div>
          ) : (
            <>
              {activeTab === "browse" && (
                <div className="space-y-6">
                  <div className="relative">
                    <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600" />
                    <input type="text" placeholder="Search groups…" value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-neutral-900/60 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors" />
                  </div>
                  {filteredGroups.length === 0 ? (
                    <div className="text-center py-20">
                      <Users size={40} className="text-neutral-700 mx-auto mb-4" />
                      <p className="text-neutral-500 font-medium mb-2">{searchQuery ? "No groups match" : "No groups yet"}</p>
                      <p className="text-neutral-600 text-sm">Create the first one!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filteredGroups.map((group, idx) => (
                        <GroupCard key={group.id} group={group} idx={idx} actionId={actionId}
                          onView={() => openDetail(group)} onJoin={() => handleJoin(group.id)} onLeave={() => handleLeave(group.id)} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "my-groups" && (
                myGroups.length === 0 ? (
                  <div className="text-center py-20">
                    <Users size={40} className="text-neutral-700 mx-auto mb-4" />
                    <p className="text-neutral-500 font-medium mb-3">You haven't joined any groups yet</p>
                    <button onClick={() => setActiveTab("browse")} className="text-blue-400 text-sm hover:text-blue-300 transition-colors font-semibold">Browse groups →</button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {myGroups.map((group, idx) => (
                      <GroupCard key={group.id} group={{ ...group, is_member: true }} idx={idx} actionId={actionId}
                        onView={() => openDetail({ ...group, is_member: true })} onJoin={() => handleJoin(group.id)} onLeave={() => handleLeave(group.id)} />
                    ))}
                  </div>
                )
              )}

              {activeTab === "leaderboard" && globalLB && (
                <div className="space-y-5">
                  {globalLB.user_rank && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                      className="bg-blue-500/8 border border-blue-500/20 rounded-2xl p-6 flex items-center justify-between">
                      <div>
                        <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">Your Global Rank</p>
                        <p className="text-4xl font-bold text-blue-400">#{globalLB.user_rank.rank}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-neutral-500 text-xs uppercase tracking-widest mb-1">Total XP</p>
                        <p className="text-4xl font-bold">{globalLB.user_rank.total_xp}</p>
                      </div>
                    </motion.div>
                  )}
                  <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden">
                    <div className="px-6 py-5 border-b border-neutral-800">
                      <h3 className="font-bold">Global Rankings</h3>
                    </div>
                    <div className="divide-y divide-neutral-800">
                      {globalLB.entries.slice(0, 50).map((entry, i) => (
                        <motion.div key={entry.user_email} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: i < 20 ? i * 0.025 : 0 }}
                          className="flex items-center gap-4 px-6 py-4 hover:bg-neutral-800/20 transition-colors">
                          <div className="w-7 flex-shrink-0 flex items-center justify-center">
                            {i === 0 ? <Trophy size={17} className="text-yellow-500" />
                              : i === 1 ? <Trophy size={17} className="text-neutral-400" />
                              : i === 2 ? <Trophy size={17} className="text-orange-600" />
                              : <span className="text-neutral-600 font-bold text-sm">{entry.rank}</span>}
                          </div>
                          <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {entry.user_email.charAt(0).toUpperCase()}
                          </div>
                          <p className="flex-1 text-sm font-medium truncate min-w-0">{entry.user_email}</p>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-blue-400">{entry.total_xp} XP</p>
                            <p className="text-xs text-neutral-600">{typeof entry.study_hours === "number" ? entry.study_hours.toFixed(1) : "0.0"}h</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Create Group Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => { setShowCreateModal(false); setError(null); }}>
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6">Create Study Group</h2>
              {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Group Name</label>
                  <input type="text" required value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    placeholder="e.g. Physics Study Squad"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600 transition-colors text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Description <span className="text-neutral-700 font-normal normal-case">(optional)</span></label>
                  <textarea value={newGroup.description} onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    placeholder="What's this group about?" rows={3}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-white placeholder:text-neutral-700 focus:outline-none focus:border-neutral-600 transition-colors text-sm resize-none" />
                </div>
                <button type="button" onClick={() => setNewGroup((g) => ({ ...g, is_public: !g.is_public }))} className="flex items-center gap-3 w-full">
                  <div className={`w-10 h-6 rounded-full relative transition-colors flex-shrink-0 ${newGroup.is_public ? "bg-blue-600" : "bg-neutral-700"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${newGroup.is_public ? "left-5" : "left-1"}`} />
                  </div>
                  <span className="text-sm text-neutral-300">Make group public</span>
                </button>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowCreateModal(false); setError(null); }}
                    className="flex-1 py-3 border border-neutral-800 rounded-xl text-sm font-semibold text-neutral-400 hover:text-white hover:border-neutral-700 transition-all">Cancel</button>
                  <button type="submit" disabled={creating}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                    {creating ? "Creating…" : "Create Group"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GroupCard({ group, idx, actionId, onView, onJoin, onLeave }) {
  const busy = actionId === group.id;
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx < 12 ? idx * 0.04 : 0 }}
      className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition-all flex flex-col gap-4 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate leading-tight">{group.name}</h3>
          <p className="text-neutral-600 text-sm mt-0.5">{group.member_count || 0} {group.member_count === 1 ? "member" : "members"}</p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
          {group.is_member && <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-xs font-bold rounded-lg">Joined</span>}
          {group.is_public && <span className="px-2 py-0.5 bg-neutral-800 text-neutral-500 text-xs font-bold rounded-lg">Public</span>}
        </div>
      </div>
      {group.description && <p className="text-neutral-500 text-sm leading-relaxed line-clamp-2 flex-1">{group.description}</p>}
      <div className="flex gap-2 mt-auto">
        <button onClick={onView} className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-sm font-semibold transition-colors">View</button>
        {group.is_member ? (
          <button onClick={onLeave} disabled={busy}
            className="px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-sm font-semibold disabled:opacity-40 border border-red-500/20">
            {busy ? "…" : "Leave"}
          </button>
        ) : (
          <button onClick={onJoin} disabled={busy}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40">
            {busy ? "Joining…" : "Join"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

function Sidebar({ navigate, handleLogout }) {
  return (
    <aside className="w-72 bg-neutral-900/50 border-r border-neutral-800 p-8 hidden lg:flex flex-col flex-shrink-0">
      <div className="flex items-center gap-3 text-xl font-bold tracking-tight mb-12">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
          <Brain size={18} className="text-white" />
        </div>
        StudyCoach
      </div>
      <nav className="space-y-1.5 flex-1">
        <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={() => navigate("/dashboard")} />
        <SidebarItem icon={<BookOpen size={18} />} label="Study Logs" onClick={() => navigate("/logs")} />
        <SidebarItem icon={<TrendingUp size={18} />} label="Performance" onClick={() => navigate("/performance")} />
        <SidebarItem icon={<MessageSquare size={18} />} label="Tutor" onClick={() => navigate("/tutor")} />
        <SidebarItem icon={<Users size={18} />} label="Study Groups" active />
        <SidebarItem icon={<Timer size={18} />} label="Pomodoro" onClick={() => navigate("/pomodoro")} />
        <SidebarItem icon={<BookMarked size={18} />} label="Flashcards" onClick={() => navigate("/flashcards")} />
        <SidebarItem icon={<User size={18} />} label="Profile" onClick={() => navigate("/profile")} />
      </nav>
      <button onClick={handleLogout} className="flex items-center gap-3 text-neutral-500 hover:text-red-400 transition-colors p-3 mt-auto group">
        <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Sign Out</span>
      </button>
    </aside>
  );
}

function SidebarItem({ icon, label, active = false, onClick }) {
  return (
    <motion.div whileHover={{ x: 4 }} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all ${
        active ? "bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-white font-bold border border-blue-500/30"
               : "text-neutral-500 hover:text-white hover:bg-neutral-800/50"
      }`}>
      {icon}
      <span className="text-sm tracking-tight">{label}</span>
    </motion.div>
  );
}
