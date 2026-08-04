import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback, useRef } from "react";
import API from "../api/client";
import {
  LayoutDashboard, BookOpen, TrendingUp, Brain, LogOut,
  MessageSquare, Users, User, Timer, BookMarked,
  Plus, Search, FileText, Trash2, Tag, Save,
  ChevronLeft, Clock, Hash,
} from "lucide-react";

// Minimal markdown → HTML (bold, italic, headings, code, lists, links)
function renderMarkdown(md) {
  if (!md) return "";
  let html = md
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    // headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // blockquote
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // unordered list items
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    // ordered list items
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    // horizontal rule
    .replace(/^---$/gm, "<hr/>")
    // paragraphs (double newline)
    .replace(/\n\n+/g, "</p><p>")
    // single newline → <br>
    .replace(/\n/g, "<br/>");
  return `<p>${html}</p>`;
}

export default function Notes() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null); // null = list, object = editing
  const [isNew, setIsNew] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState(false);
  const saveTimerRef = useRef(null);

  const loadNotes = useCallback(async (q = "") => {
    try {
      const res = await API.get(`/notes${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      setNotes(res.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => loadNotes(search), 300);
    return () => clearTimeout(t);
  }, [search, loadNotes]);

  const openNote = (note) => {
    setSelected(note);
    setIsNew(false);
    setEditTitle(note.title);
    setEditContent(note.content || "");
    setEditTags(note.tags || "");
    setPreview(false);
  };

  const openNew = () => {
    setSelected({ id: null });
    setIsNew(true);
    setEditTitle("");
    setEditContent("");
    setEditTags("");
    setPreview(false);
  };

  const saveNote = async () => {
    if (!editTitle.trim() || saving) return;
    setSaving(true);
    try {
      const payload = {
        title: editTitle.trim(),
        content: editContent,
        tags: editTags.trim() || null,
      };
      if (isNew) {
        const res = await API.post("/notes", payload);
        setNotes((prev) => [res.data, ...prev]);
        setSelected(res.data);
        setIsNew(false);
      } else {
        const res = await API.put(`/notes/${selected.id}`, payload);
        setNotes((prev) => prev.map((n) => n.id === res.data.id ? res.data : n));
        setSelected(res.data);
      }
    } catch {}
    setSaving(false);
  };

  // Auto-save after 1.5 seconds of inactivity
  useEffect(() => {
    if (!selected || isNew || !editTitle.trim()) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => { saveNote(); }, 1500);
    return () => clearTimeout(saveTimerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editTitle, editContent, editTags]);

  const deleteNote = async () => {
    if (!selected?.id || deleting) return;
    setDeleting(true);
    try {
      await API.delete(`/notes/${selected.id}`);
      setNotes((prev) => prev.filter((n) => n.id !== selected.id));
      setSelected(null);
    } catch {}
    setDeleting(false);
  };

  const handleLogout = () => { localStorage.removeItem("token"); navigate("/", { replace: true }); };

  const parseTags = (t) => t ? t.split(",").map(s => s.trim()).filter(Boolean) : [];
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-72 bg-neutral-900/50 border-r border-neutral-800 p-8 hidden lg:flex flex-col flex-shrink-0">
        <div className="flex items-center gap-3 text-xl font-bold tracking-tight mb-12">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain size={18} className="text-white" />
          </div>
          StudyCoach
        </div>
        <nav className="space-y-1.5 flex-1">
          <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard"    onClick={() => navigate("/dashboard")} />
          <SidebarItem icon={<BookOpen size={18} />}        label="Study Logs"   onClick={() => navigate("/logs")} />
          <SidebarItem icon={<TrendingUp size={18} />}      label="Performance"  onClick={() => navigate("/performance")} />
          <SidebarItem icon={<MessageSquare size={18} />}   label="Tutor"        onClick={() => navigate("/tutor")} />
          <SidebarItem icon={<Users size={18} />}           label="Study Groups" onClick={() => navigate("/study-groups")} />
          <SidebarItem icon={<Timer size={18} />}           label="Pomodoro"     onClick={() => navigate("/pomodoro")} />
          <SidebarItem icon={<BookMarked size={18} />}      label="Flashcards"   onClick={() => navigate("/flashcards")} />
          <SidebarItem icon={<FileText size={18} />}        label="Notes"        active />
          <SidebarItem icon={<User size={18} />}            label="Profile"      onClick={() => navigate("/profile")} />
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-3 text-neutral-500 hover:text-red-400 transition-colors p-3 mt-auto group">
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </aside>

      {/* NOTES LIST PANEL */}
      <div className="w-80 flex-shrink-0 border-r border-neutral-800 flex flex-col bg-neutral-900/30">
        <div className="p-5 border-b border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold">Notes</h1>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={openNew}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              <Plus size={16} />
            </motion.button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-8 pr-3 py-2.5 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-700 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-neutral-800/50">
          {loading ? (
            <div className="flex items-center justify-center h-24">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            <div className="p-8 text-center">
              <FileText size={28} className="text-neutral-700 mx-auto mb-2" />
              <p className="text-neutral-600 text-xs">{search ? "No matches" : "No notes yet"}</p>
            </div>
          ) : (
            notes.map((note) => (
              <motion.button
                key={note.id}
                onClick={() => openNote(note)}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                className={`w-full text-left p-4 transition-colors ${selected?.id === note.id ? "bg-blue-500/10 border-l-2 border-l-blue-500" : ""}`}
              >
                <p className="font-semibold text-sm truncate mb-1">{note.title}</p>
                <p className="text-neutral-600 text-xs line-clamp-2 mb-2 leading-relaxed">
                  {note.content?.replace(/[#*`>]/g, "").slice(0, 80) || "No content"}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {parseTags(note.tags).slice(0, 2).map((t) => (
                      <span key={t} className="px-1.5 py-0.5 bg-neutral-800 text-neutral-500 text-xs rounded-md">#{t}</span>
                    ))}
                  </div>
                  <span className="text-neutral-700 text-xs flex-shrink-0">{fmtDate(note.updated_at)}</span>
                </div>
              </motion.button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-neutral-800">
          <p className="text-neutral-700 text-xs">{notes.length} note{notes.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* EDITOR PANEL */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {!selected ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-10"
            >
              <FileText size={48} className="text-neutral-800 mb-4" />
              <p className="text-neutral-500 font-medium mb-1">No note selected</p>
              <p className="text-neutral-700 text-sm mb-4">Pick a note from the list or create a new one</p>
              <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors">
                <Plus size={15} /> New Note
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={selected?.id ?? "new"}
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              {/* Editor toolbar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelected(null)} className="text-neutral-600 hover:text-white transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl p-0.5">
                    <button
                      onClick={() => setPreview(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!preview ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}
                    >
                      Write
                    </button>
                    <button
                      onClick={() => setPreview(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${preview ? "bg-white text-black" : "text-neutral-500 hover:text-white"}`}
                    >
                      Preview
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selected?.updated_at && !isNew && (
                    <span className="text-neutral-700 text-xs flex items-center gap-1">
                      <Clock size={11} />
                      {fmtDate(selected.updated_at)}
                    </span>
                  )}
                  {saving && <span className="text-neutral-600 text-xs">Saving…</span>}
                  {isNew && (
                    <button
                      onClick={saveNote}
                      disabled={!editTitle.trim() || saving}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-40"
                    >
                      <Save size={12} /> Save
                    </button>
                  )}
                  {!isNew && (
                    <button
                      onClick={deleteNote}
                      disabled={deleting}
                      className="p-2 text-neutral-700 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-40"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-10">
                {/* Title */}
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Untitled note…"
                  className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-neutral-800 text-neutral-100 mb-4"
                />

                {/* Tags */}
                <div className="flex items-center gap-2 mb-6 pb-4 border-b border-neutral-800">
                  <Tag size={13} className="text-neutral-600 flex-shrink-0" />
                  <input
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="Tags, comma separated (e.g. math, calculus)"
                    className="flex-1 text-xs bg-transparent border-none outline-none placeholder:text-neutral-700 text-neutral-500"
                  />
                  {parseTags(editTags).map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-neutral-800 text-neutral-400 text-xs rounded-lg flex items-center gap-1">
                      <Hash size={10} />{t}
                    </span>
                  ))}
                </div>

                {/* Content area */}
                {preview ? (
                  <div
                    className="prose prose-invert max-w-none text-sm text-neutral-300 leading-relaxed"
                    style={{ lineHeight: 1.8 }}
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(editContent) }}
                  />
                ) : (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder={`Start writing…\n\nMarkdown supported:\n# Heading\n**bold**, *italic*, \`code\`\n- bullet list\n> blockquote`}
                    className="w-full h-full min-h-[400px] bg-transparent border-none outline-none resize-none text-sm text-neutral-300 placeholder:text-neutral-800 leading-relaxed font-mono"
                    style={{ lineHeight: 1.8 }}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, onClick }) {
  return (
    <motion.div
      whileHover={{ x: 4 }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${
        active
          ? "bg-gradient-to-r from-blue-500/20 to-blue-600/20 text-white font-bold border border-blue-500/30"
          : "text-neutral-500 hover:text-white hover:bg-neutral-800/50"
      }`}
    >
      {icon}
      <span className="text-sm tracking-tight">{label}</span>
    </motion.div>
  );
}
