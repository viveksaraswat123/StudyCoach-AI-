import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../api/client";

import {
  ArrowLeft,
  Plus,
  Users,
  TrendingUp,
  Trophy,
  Loader2,
  Search,
  LogOut,
  AlertCircle,
} from "lucide-react";

export default function StudyGroups() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("browse"); // browse, my-groups, leaderboard
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: "",
    description: "",
    is_public: true,
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === "browse" || activeTab === "my-groups") {
        const res = await API.get("/study-groups");
        const allGroups = res.data;
        
        if (activeTab === "browse") {
          setGroups(allGroups);
        } else {
          // Filter my groups (user is a member)
          const res2 = await API.get("/study-groups");
          // Note: We'd need to add an endpoint to get user's groups
          // For now, showing all groups but should be filtered
          setMyGroups(allGroups);
        }
      } else if (activeTab === "leaderboard") {
        const res = await API.get("/leaderboard/global");
        setLeaderboard(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await API.post("/study-groups", newGroupData);
      setShowCreateModal(false);
      setNewGroupData({ name: "", description: "", is_public: true });
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create group");
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await API.post(`/study-groups/${groupId}/join`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to join group");
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      await API.post(`/study-groups/${groupId}/leave`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to leave group");
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* HEADER */}
      <header className="bg-neutral-900/50 border-b border-neutral-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 text-neutral-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Study Groups</h1>
              <p className="text-neutral-500">Connect and compete with other learners</p>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-full font-bold flex items-center gap-2 hover:shadow-lg hover:shadow-blue-500/30"
          >
            <Plus size={18} /> Create Group
          </motion.button>
        </div>
      </header>

      {/* TABS */}
      <div className="bg-neutral-900/30 border-b border-neutral-800 sticky top-20 z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center gap-8">
            {["browse", "my-groups", "leaderboard"].map((tab) => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-semibold capitalize transition-colors ${
                  activeTab === tab
                    ? "border-blue-500 text-white"
                    : "border-transparent text-neutral-500 hover:text-white"
                }`}
              >
                {tab === "my-groups" ? "My Groups" : tab === "leaderboard" ? "Leaderboard" : "Browse"}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <main className="max-w-6xl mx-auto p-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2"
          >
            <AlertCircle size={16} />
            {error}
          </motion.div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-blue-500 rounded-lg mx-auto mb-4 animate-pulse" />
              <p className="text-neutral-500">Loading...</p>
            </motion.div>
          </div>
        ) : (
          <>
            {/* BROWSE TAB */}
            {activeTab === "browse" && (
              <div className="space-y-6">
                {/* SEARCH */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                  <input
                    type="text"
                    placeholder="Search study groups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                {/* GROUPS GRID */}
                {filteredGroups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                      {filteredGroups.map((group, idx) => (
                        <motion.div
                          key={group.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-neutral-900/40 border border-neutral-800 p-6 rounded-2xl hover:border-neutral-700 transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold">{group.name}</h3>
                              <p className="text-neutral-500 text-sm">{group.member_count || 0} members</p>
                            </div>
                            {group.is_public && (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded font-bold">
                                Public
                              </span>
                            )}
                          </div>

                          {group.description && (
                            <p className="text-neutral-400 text-sm mb-4 line-clamp-2">
                              {group.description}
                            </p>
                          )}

                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleJoinGroup(group.id)}
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                          >
                            Join Group
                          </motion.button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users size={48} className="mx-auto text-neutral-600 mb-4" />
                    <p className="text-neutral-500">No study groups found</p>
                  </div>
                )}
              </div>
            )}

            {/* MY GROUPS TAB */}
            {activeTab === "my-groups" && (
              <div className="space-y-6">
                {myGroups.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                      {myGroups.map((group, idx) => (
                        <motion.div
                          key={group.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-neutral-900/40 border border-neutral-800 p-6 rounded-2xl"
                        >
                          <h3 className="text-lg font-bold mb-2">{group.name}</h3>
                          <p className="text-neutral-500 text-sm mb-4">
                            {group.member_count || 0} members
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/study-groups/${group.id}`)}
                              className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700"
                            >
                              View
                            </button>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleLeaveGroup(group.id)}
                              className="px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <LogOut size={18} />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users size={48} className="mx-auto text-neutral-600 mb-4" />
                    <p className="text-neutral-500">You haven't joined any study groups yet</p>
                  </div>
                )}
              </div>
            )}

            {/* LEADERBOARD TAB */}
            {activeTab === "leaderboard" && leaderboard && (
              <div className="space-y-6">
                {/* USER RANK */}
                {leaderboard.user_rank && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 border border-blue-500/30 p-6 rounded-2xl"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-neutral-500 text-sm">Your Rank</p>
                        <p className="text-3xl font-bold text-blue-400">
                          #{leaderboard.user_rank.rank}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-neutral-500 text-sm">Total XP</p>
                        <p className="text-3xl font-bold">{leaderboard.user_rank.total_xp}</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* LEADERBOARD TABLE */}
                <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-neutral-800/50 border-b border-neutral-700">
                        <tr>
                          <th className="text-left py-4 px-6 font-semibold text-neutral-400">Rank</th>
                          <th className="text-left py-4 px-6 font-semibold text-neutral-400">User</th>
                          <th className="text-right py-4 px-6 font-semibold text-neutral-400">XP</th>
                          <th className="text-right py-4 px-6 font-semibold text-neutral-400">Hours</th>
                          <th className="text-right py-4 px-6 font-semibold text-neutral-400">Streak</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {leaderboard.entries.slice(0, 50).map((entry, idx) => (
                            <motion.tr
                              key={entry.user_email}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className="border-b border-neutral-800 hover:bg-neutral-800/30 transition-colors"
                            >
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  {idx < 3 && (
                                    <Trophy
                                      size={18}
                                      className={
                                        idx === 0
                                          ? "text-yellow-500"
                                          : idx === 1
                                          ? "text-gray-400"
                                          : "text-orange-600"
                                      }
                                    />
                                  )}
                                  <span className="font-bold text-lg">{entry.rank}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 font-medium truncate">{entry.user_email}</td>
                              <td className="py-4 px-6 text-right font-bold text-blue-400">
                                {entry.total_xp} XP
                              </td>
                              <td className="py-4 px-6 text-right text-neutral-400">
                                {entry.study_hours.toFixed(1)}h
                              </td>
                              <td className="py-4 px-6 text-right">
                                <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-bold">
                                  {entry.streak} day
                                </span>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* CREATE GROUP MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 max-w-md w-full"
            >
              <h2 className="text-2xl font-bold mb-6">Create Study Group</h2>

              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Group Name</label>
                  <input
                    type="text"
                    required
                    value={newGroupData.name}
                    onChange={(e) =>
                      setNewGroupData({ ...newGroupData, name: e.target.value })
                    }
                    placeholder="e.g., Python Beginners"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={newGroupData.description}
                    onChange={(e) =>
                      setNewGroupData({ ...newGroupData, description: e.target.value })
                    }
                    placeholder="What's this group about?"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-24"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newGroupData.is_public}
                    onChange={(e) =>
                      setNewGroupData({ ...newGroupData, is_public: e.target.checked })
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Make this group public</span>
                </label>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-neutral-700 rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-2 rounded-lg font-bold hover:shadow-lg hover:shadow-blue-500/30"
                  >
                    Create
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
