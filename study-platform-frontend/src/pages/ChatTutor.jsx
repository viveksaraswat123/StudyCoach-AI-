import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import API from "../api/client";
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";
import {
  Send, Brain, AlertCircle, Copy, Check, Sparkles,
  Download, FileText, Plus, Hash, ChevronRight,
} from "lucide-react";

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0 mt-1">
        <Sparkles size={13} className="text-blue-400" />
      </div>
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl rounded-tl-sm px-5 py-4">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-neutral-500 rounded-full"
              animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.18, ease: "easeInOut" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg, copiedId, onCopy }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      {/* Question */}
      <div className="flex justify-end">
        <div className="max-w-[80%]">
          <div className="flex items-center gap-2 justify-end mb-1.5">
            <span className="text-xs text-neutral-600">
              {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400">
              {msg.topic}
            </span>
          </div>
          <div className="bg-blue-600 text-white px-5 py-3.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
            {msg.question}
          </div>
        </div>
      </div>

      {/* Answer */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center shrink-0 mt-1">
          <Sparkles size={13} className="text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl rounded-tl-sm p-5 relative group">
            <div className="prose prose-invert prose-sm max-w-none text-neutral-200 overflow-hidden">
              <ReactMarkdown
                components={{
                  h1: ({ ...p }) => <h1 className="text-xl font-bold mt-4 mb-2 text-white" {...p} />,
                  h2: ({ ...p }) => <h2 className="text-lg font-bold mt-3 mb-2 text-white" {...p} />,
                  h3: ({ ...p }) => <h3 className="text-base font-bold mt-2 mb-1 text-neutral-100" {...p} />,
                  p:  ({ ...p }) => <p className="mb-3 leading-relaxed text-neutral-200" {...p} />,
                  ul: ({ ...p }) => <ul className="list-disc list-inside mb-3 space-y-1 ml-2" {...p} />,
                  ol: ({ ...p }) => <ol className="list-decimal list-inside mb-3 space-y-1 ml-2" {...p} />,
                  li: ({ ...p }) => <li className="text-neutral-200 ml-2" {...p} />,
                  blockquote: ({ ...p }) => (
                    <blockquote className="border-l-4 border-blue-500/50 pl-4 py-1 my-3 text-neutral-400 italic" {...p} />
                  ),
                  strong: ({ ...p }) => <strong className="font-bold text-blue-300" {...p} />,
                  code: ({ node, children, ...p }) => {
                    const isBlock = node?.properties?.className != null;
                    return isBlock ? (
                      <code className="block bg-neutral-950 border border-neutral-800 px-4 py-3 rounded-xl text-cyan-300 font-mono text-xs overflow-x-auto my-3 whitespace-pre" {...p}>
                        {children}
                      </code>
                    ) : (
                      <code className="bg-neutral-950 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs" {...p}>
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {msg.answer}
              </ReactMarkdown>
            </div>

            {/* Copy button */}
            <button
              onClick={() => onCopy(msg.answer, msg.id)}
              className="absolute top-4 right-4 p-2 rounded-lg text-neutral-600 hover:text-white hover:bg-neutral-800 transition-all opacity-0 group-hover:opacity-100"
            >
              {copiedId === msg.id
                ? <Check size={14} className="text-emerald-400" />
                : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Suggestion chip ────────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { topic: "Python",      q: "How do list comprehensions work?"           },
  { topic: "Math",        q: "Explain the chain rule in calculus."        },
  { topic: "History",     q: "What caused the fall of the Roman Empire?"  },
  { topic: "Physics",     q: "What is the difference between work and energy?" },
  { topic: "Biology",     q: "How does DNA replication work?"             },
  { topic: "Chemistry",   q: "Explain ionic vs covalent bonds."           },
];

// ── Main component ─────────────────────────────────────────────────────────────
export default function ChatTutor() {
  const navigate = useNavigate();
  const [messages, setMessages]         = useState([]);
  const [topic, setTopic]               = useState("");
  const [question, setQuestion]         = useState("");
  const [loading, setLoading]           = useState(false);
  const [historyLoading, setHistLoading] = useState(true);
  const [error, setError]               = useState(null);
  const [copiedId, setCopiedId]         = useState(null);
  const [exportingPdf, setExportPdf]    = useState(false);
  const [activeTopicFilter, setFilter]  = useState(null);
  const endRef    = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => { fetchHistory(); }, []);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const fetchHistory = async () => {
    try {
      const { data } = await API.get("/tutor/history");
      if (data?.length) {
        setMessages(
          [...data].reverse().map((c) => ({
            id: c.id, topic: c.topic, question: c.question,
            answer: c.answer, timestamp: new Date(c.created_at),
          }))
        );
      }
    } catch {}
    setHistLoading(false);
  };

  const send = async (e) => {
    e?.preventDefault();
    if (!topic.trim() || !question.trim() || loading) return;
    if (question.trim().length < 10) { setError("Question must be at least 10 characters."); return; }

    setLoading(true);
    setError(null);
    try {
      const { data } = await API.post("/tutor/ask", {
        topic: topic.trim(),
        question: question.trim(),
      });
      setMessages((prev) => [
        ...prev,
        { id: data.id, topic: data.topic, question: data.question,
          answer: data.answer, timestamp: new Date(data.created_at) },
      ]);
      setQuestion("");
      inputRef.current?.focus();
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === "string" ? d : Array.isArray(d) ? d[0]?.msg : "Failed to get a response.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) { e.preventDefault(); send(e); }
  };

  const copy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const newChat = () => {
    setMessages([]); setTopic(""); setQuestion(""); setError(null); setFilter(null);
  };

  const loadSuggestion = (s) => { setTopic(s.topic); setQuestion(s.q); inputRef.current?.focus(); };

  // Unique topics for sidebar
  const topicList = [...new Set(messages.map((m) => m.topic))];
  const displayed = activeTopicFilter
    ? messages.filter((m) => m.topic === activeTopicFilter)
    : messages;

  const exportText = () => {
    if (!messages.length) return;
    const text = messages.map((m, i) =>
      `Q${i + 1} [${m.topic}]\n${m.question}\n\nAnswer:\n${m.answer}\n\n${"─".repeat(60)}\n`
    ).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/plain;charset=utf-8," + encodeURIComponent(`StudyCoach AI Tutor Export\n${"=".repeat(60)}\n\n${text}`);
    a.download = `tutor-chat-${Date.now()}.txt`;
    a.click();
  };

  const exportPdf = async () => {
    if (!messages.length) return;
    setExportPdf(true);
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const mg = 14;
      let y = mg;
      const next = () => { doc.addPage(); y = mg; };

      doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 100, 220);
      doc.text("StudyCoach — AI Tutor Export", mg, y); y += 9;
      doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(120);
      doc.text(`Exported ${new Date().toLocaleString()}`, mg, y); y += 8;
      doc.setDrawColor(200); doc.line(mg, y, W - mg, y); y += 8;

      for (const [i, m] of messages.entries()) {
        doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 100, 220);
        if (y + 8 > H - 18) next();
        doc.text(`Q${i + 1}  ${m.topic}`, mg, y); y += 7;

        doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(40);
        const qL = doc.splitTextToSize(m.question, W - mg * 2);
        if (y + qL.length * 4 > H - 24) next();
        doc.text(qL, mg, y); y += qL.length * 4 + 5;

        doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(30, 100, 220);
        if (y + 6 > H - 18) next();
        doc.text("Answer:", mg, y); y += 6;

        doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(50);
        const aL = doc.splitTextToSize(m.answer, W - mg * 2 - 2);
        for (const line of aL) { if (y + 4 > H - 14) next(); doc.text(line, mg + 2, y); y += 4; }
        y += 6;
        if (y + 2 > H - 14) next();
        doc.setDrawColor(220); doc.line(mg, y, W - mg, y); y += 8;
      }
      doc.save(`tutor-chat-${Date.now()}.pdf`);
    } catch {}
    setExportPdf(false);
  };

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">

      {/* ── LEFT: Topics sidebar ── */}
      <aside className="w-64 bg-neutral-900/50 border-r border-neutral-800 hidden lg:flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 p-6 pb-5 border-b border-neutral-800">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain size={15} className="text-white" />
          </div>
          <span className="font-bold tracking-tight">AI Tutor</span>
        </div>

        {/* New chat */}
        <div className="p-4">
          <button
            onClick={newChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white text-sm font-semibold transition-all"
          >
            <Plus size={15} /> New Chat
          </button>
        </div>

        {/* Topics list */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {topicList.length > 0 && (
            <>
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600 px-2 mb-2">
                Topics
              </p>
              <div className="space-y-0.5">
                {topicList.map((t) => {
                  const count = messages.filter((m) => m.topic === t).length;
                  const active = activeTopicFilter === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setFilter(active ? null : t)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                        active
                          ? "bg-blue-500/15 text-white border border-blue-500/25"
                          : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Hash size={13} className="shrink-0 opacity-50" />
                        <span className="truncate font-medium">{t}</span>
                      </div>
                      <span className="text-xs text-neutral-600 shrink-0">{count}</span>
                    </button>
                  );
                })}
                {activeTopicFilter && (
                  <button
                    onClick={() => setFilter(null)}
                    className="w-full text-xs text-neutral-600 hover:text-neutral-400 py-2 transition-colors"
                  >
                    Clear filter
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Export */}
        {messages.length > 0 && (
          <div className="border-t border-neutral-800 p-4 space-y-1">
            <button onClick={exportText} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all font-medium">
              <FileText size={13} /> Export as Text
            </button>
            <button onClick={exportPdf} disabled={exportingPdf} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-500 hover:text-white hover:bg-neutral-800 transition-all font-medium disabled:opacity-40">
              <Download size={13} /> {exportingPdf ? "Generating PDF…" : "Download PDF"}
            </button>
          </div>
        )}

        {/* Back to dashboard */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 px-6 py-4 border-t border-neutral-800 text-xs text-neutral-600 hover:text-white transition-colors"
        >
          <ChevronRight size={13} className="rotate-180" /> Dashboard
        </button>
      </aside>

      {/* ── RIGHT: Main chat ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile header */}
        <header className="lg:hidden border-b border-neutral-800 px-5 py-4 flex items-center justify-between bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="p-1.5 text-neutral-500 hover:text-white transition-colors">
              <ChevronRight size={16} className="rotate-180" />
            </button>
            <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <Brain size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm">AI Tutor</span>
          </div>
          <button onClick={newChat} className="text-xs text-neutral-500 hover:text-white transition-colors">
            New Chat
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-8">
          <div className="max-w-2xl mx-auto w-full">

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-5 flex items-start gap-3 p-4 bg-red-500/8 border border-red-500/20 rounded-xl text-red-400 text-sm"
                >
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {historyLoading ? (
              <div className="flex flex-col items-center justify-center h-80 gap-3">
                <div className="w-8 h-8 border-2 border-neutral-700 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-xs text-neutral-600 uppercase tracking-widest">Loading history</p>
              </div>
            ) : displayed.length === 0 && !loading ? (
              /* Empty state */
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center pt-16 pb-8"
              >
                <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl mx-auto mb-6 flex items-center justify-center">
                  <Brain size={28} className="text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Ask me anything</h2>
                <p className="text-neutral-500 text-sm max-w-sm mx-auto mb-10">
                  Set your topic, type a question, and get a clear, detailed explanation instantly.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.q}
                      onClick={() => loadSuggestion(s)}
                      className="flex items-start gap-3 p-4 bg-neutral-900/40 border border-neutral-800 rounded-xl hover:border-neutral-700 hover:bg-neutral-900/60 transition-all text-left group"
                    >
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-500/15 text-blue-400 shrink-0">
                        {s.topic}
                      </span>
                      <p className="text-sm text-neutral-400 group-hover:text-neutral-200 transition-colors leading-relaxed">
                        {s.q}
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-8">
                <AnimatePresence mode="popLayout">
                  {displayed.map((msg) => (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      copiedId={copiedId}
                      onCopy={copy}
                    />
                  ))}
                </AnimatePresence>
                {loading && <TypingDots />}
                <div ref={endRef} />
              </div>
            )}
          </div>
        </div>

        {/* ── Input area ── */}
        <div className="border-t border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-4 md:px-8 py-5">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={send}>
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl focus-within:border-neutral-700 transition-colors overflow-hidden">

                {/* Topic row */}
                <div className="flex items-center gap-3 px-4 pt-3 pb-2 border-b border-neutral-800/60">
                  <Hash size={13} className="text-neutral-600 shrink-0" />
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Topic  (e.g. Python, Biology…)"
                    disabled={loading}
                    className="flex-1 bg-transparent text-xs text-neutral-300 placeholder-neutral-600 focus:outline-none disabled:opacity-50 font-medium"
                  />
                  {topic && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 shrink-0">
                      {topic}
                    </span>
                  )}
                </div>

                {/* Question row */}
                <div className="flex items-end gap-3 px-4 py-3">
                  <textarea
                    ref={inputRef}
                    rows={2}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Ask your question…"
                    disabled={loading}
                    className="flex-1 bg-transparent text-sm text-white placeholder-neutral-600 focus:outline-none resize-none disabled:opacity-50 leading-relaxed"
                    style={{ minHeight: "44px", maxHeight: "140px" }}
                  />
                  <motion.button
                    whileTap={{ scale: 0.93 }}
                    type="submit"
                    disabled={loading || !topic.trim() || !question.trim()}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                  >
                    <Send size={15} />
                  </motion.button>
                </div>
              </div>

              <p className="text-center text-xs text-neutral-700 mt-3">
                <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-500 text-[11px]">Enter</kbd>
                {" "}to send · {" "}
                <kbd className="px-1.5 py-0.5 bg-neutral-800 rounded text-neutral-500 text-[11px]">Shift+Enter</kbd>
                {" "}for newline
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
