import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, BookOpen, TrendingUp, Brain, LogOut,
  MessageSquare, Users, User, Timer, Plus, Trash2,
  Sparkles, ChevronLeft, RotateCcw, BookMarked, Trophy,
} from "lucide-react";
import API from "../api/client";

const PALETTE = [
  "#3b82f6", "#10b981", "#a855f7", "#f59e0b", "#ef4444",
];

const RATINGS = [
  { label: "Again", sublabel: "< 1 min",  value: 0, cls: "border-red-500/30    text-red-400    hover:bg-red-500/10    bg-red-500/5"    },
  { label: "Hard",  sublabel: "~1 day",   value: 3, cls: "border-amber-500/30  text-amber-400  hover:bg-amber-500/10  bg-amber-500/5"  },
  { label: "Good",  sublabel: "~4 days",  value: 4, cls: "border-blue-500/30   text-blue-400   hover:bg-blue-500/10   bg-blue-500/5"   },
  { label: "Easy",  sublabel: "~1 week",  value: 5, cls: "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 bg-emerald-500/5" },
];

export default function Flashcards() {
  const navigate = useNavigate();
  const [view, setView]               = useState("decks");
  const [decks, setDecks]             = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [cards, setCards]             = useState([]);
  const [queue, setQueue]             = useState([]);
  const [qIdx, setQIdx]               = useState(0);
  const [flipped, setFlipped]         = useState(false);
  const [studyDone, setStudyDone]     = useState(false);
  const [loading, setLoading]         = useState(true);
  const [cardLoading, setCardLoading] = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showAI, setShowAI]           = useState(false);
  const [aiTopic, setAiTopic]         = useState("");
  const [newDeck, setNewDeck]         = useState({ name: "", description: "", color: "#3b82f6" });
  const [newCard, setNewCard]         = useState({ front: "", back: "" });

  useEffect(() => { fetchDecks(); }, []);

  // ── data helpers ──────────────────────────────────────────────────────────

  const fetchDecks = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/flashcards/decks");
      setDecks(data);
    } catch {}
    setLoading(false);
  };

  const openDeck = async (deck) => {
    setSelectedDeck(deck);
    setView("deck");
    setCardLoading(true);
    try {
      const { data } = await API.get(`/flashcards/decks/${deck.id}/cards`);
      setCards(data);
    } catch {}
    setCardLoading(false);
  };

  const startStudy = () => {
    const today = new Date().toISOString().split("T")[0];
    const due = cards.filter((c) => !c.next_review || c.next_review <= today);
    if (!due.length) return;
    setQueue([...due].sort(() => Math.random() - 0.5));
    setQIdx(0);
    setFlipped(false);
    setStudyDone(false);
    setView("study");
  };

  // ── mutations ─────────────────────────────────────────────────────────────

  const createDeck = async () => {
    if (!newDeck.name.trim()) return;
    try {
      const { data } = await API.post("/flashcards/decks", newDeck);
      setDecks((d) => [data, ...d]);
    } catch {}
    setShowNewDeck(false);
    setNewDeck({ name: "", description: "", color: "#3b82f6" });
  };

  const deleteDeck = async (id, e) => {
    e.stopPropagation();
    try {
      await API.delete(`/flashcards/decks/${id}`);
      setDecks((d) => d.filter((x) => x.id !== id));
    } catch {}
  };

  const addCard = async () => {
    if (!newCard.front.trim() || !newCard.back.trim()) return;
    try {
      const { data } = await API.post(`/flashcards/decks/${selectedDeck.id}/cards`, newCard);
      setCards((c) => [...c, data]);
      setSelectedDeck((d) => ({ ...d, card_count: (d.card_count || 0) + 1 }));
    } catch {}
    setShowAddCard(false);
    setNewCard({ front: "", back: "" });
  };

  const deleteCard = async (id) => {
    try {
      await API.delete(`/flashcards/cards/${id}`);
      setCards((c) => c.filter((x) => x.id !== id));
    } catch {}
  };

  const generateCards = async () => {
    if (!aiTopic.trim()) return;
    setGenerating(true);
    try {
      const { data } = await API.post(`/flashcards/decks/${selectedDeck.id}/generate`, {
        topic: aiTopic,
        count: 10,
      });
      setCards((c) => [...c, ...data.cards]);
      setSelectedDeck((d) => ({ ...d, card_count: (d.card_count || 0) + data.generated }));
    } catch {}
    setGenerating(false);
    setShowAI(false);
    setAiTopic("");
  };

  const handleRating = async (rating) => {
    const card = queue[qIdx];
    try { await API.post(`/flashcards/cards/${card.id}/review`, { rating }); } catch {}
    const next = qIdx + 1;
    if (next >= queue.length) {
      setStudyDone(true);
    } else {
      setQIdx(next);
      setFlipped(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-72 bg-neutral-900/50 border-r border-neutral-800 p-8 hidden lg:flex flex-col">
        <div className="flex items-center gap-3 text-xl font-bold tracking-tight mb-12">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain size={18} className="text-white" />
          </div>
          StudyCoach
        </div>
        <nav className="space-y-1.5 flex-1">
          <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard"    onClick={() => navigate("/dashboard")} />
          <SidebarItem icon={<BookOpen size={18} />}        label="Study Logs"   onClick={() => navigate("/log-session")} />
          <SidebarItem icon={<TrendingUp size={18} />}      label="Performance"  onClick={() => navigate("/performance")} />
          <SidebarItem icon={<Timer size={18} />}           label="Pomodoro"     onClick={() => navigate("/pomodoro")} />
          <SidebarItem icon={<MessageSquare size={18} />}   label="AI Tutor"     onClick={() => navigate("/tutor")} />
          <SidebarItem icon={<Users size={18} />}           label="Study Groups" onClick={() => navigate("/study-groups")} />
          <SidebarItem icon={<BookMarked size={18} />}      label="Flashcards"   active />
          <SidebarItem icon={<User size={18} />}            label="Profile"      onClick={() => navigate("/profile")} />
        </nav>
        <button
          onClick={() => { localStorage.removeItem("token"); navigate("/", { replace: true }); }}
          className="flex items-center gap-3 text-neutral-500 hover:text-red-400 transition-colors p-3 mt-auto group"
        >
          <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 md:p-12">

          {/* ═══════════════════ DECKS VIEW ═══════════════════ */}
          {view === "decks" && (
            <motion.div key="decks" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <header className="flex items-center justify-between mb-12">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight">Flashcards</h1>
                  <p className="text-neutral-500 mt-1">
                    {loading
                      ? "Loading…"
                      : decks.length === 0
                      ? "Create your first deck to get started"
                      : `${decks.length} deck${decks.length !== 1 ? "s" : ""}`}
                  </p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowNewDeck(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/20"
                >
                  <Plus size={16} /> New Deck
                </motion.button>
              </header>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-44 bg-neutral-900/40 border border-neutral-800 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : decks.length === 0 ? (
                <EmptyDecks onNew={() => setShowNewDeck(true)} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {decks.map((deck) => (
                    <DeckCard
                      key={deck.id}
                      deck={deck}
                      onOpen={() => openDeck(deck)}
                      onDelete={(e) => deleteDeck(deck.id, e)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════ DECK DETAIL VIEW ═══════════════════ */}
          {view === "deck" && selectedDeck && (
            <motion.div key="deck" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <header className="flex flex-wrap items-center justify-between gap-4 mb-10">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => { setView("decks"); setSelectedDeck(null); setCards([]); }}
                    className="p-2 rounded-lg border border-neutral-800 text-neutral-500 hover:text-white hover:border-neutral-700 transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: selectedDeck.color }} />
                      <h1 className="text-2xl font-bold">{selectedDeck.name}</h1>
                    </div>
                    <p className="text-neutral-500 text-sm mt-0.5">
                      {cards.length} card{cards.length !== 1 ? "s" : ""}
                      {selectedDeck.due_count > 0 && (
                        <span className="ml-2 text-blue-400 font-medium">· {selectedDeck.due_count} due</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => setShowAI(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 text-sm font-semibold transition-all"
                  >
                    <Sparkles size={14} /> Generate
                  </button>
                  <button
                    onClick={() => setShowAddCard(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 text-sm font-semibold transition-all"
                  >
                    <Plus size={14} /> Add Card
                  </button>
                  {cards.length > 0 && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={startStudy}
                      className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-lg"
                      style={{ background: selectedDeck.color, boxShadow: `0 4px 20px ${selectedDeck.color}40` }}
                    >
                      Study Now
                    </motion.button>
                  )}
                </div>
              </header>

              {cardLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-neutral-900/40 border border-neutral-800 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : cards.length === 0 ? (
                <EmptyCards onAdd={() => setShowAddCard(true)} onGenerate={() => setShowAI(true)} />
              ) : (
                <div className="space-y-2.5">
                  {cards.map((card) => (
                    <CardRow
                      key={card.id}
                      card={card}
                      color={selectedDeck.color}
                      onDelete={() => deleteCard(card.id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════ STUDY MODE ═══════════════════ */}
          {view === "study" && (
            <motion.div key="study" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center min-h-[calc(100vh-6rem)]">
              <header className="w-full flex items-center justify-between mb-10">
                <button
                  onClick={() => { setView("deck"); if (selectedDeck) openDeck(selectedDeck); }}
                  className="flex items-center gap-2 text-neutral-500 hover:text-white text-sm transition-colors"
                >
                  <ChevronLeft size={16} /> Back to deck
                </button>
                {!studyDone && (
                  <span className="text-sm text-neutral-500 tabular-nums">
                    {qIdx + 1} / {queue.length}
                  </span>
                )}
              </header>

              {studyDone ? (
                <StudyComplete
                  count={queue.length}
                  color={selectedDeck?.color || "#3b82f6"}
                  onRestart={() => { setQIdx(0); setFlipped(false); setStudyDone(false); }}
                  onBack={() => { setView("deck"); if (selectedDeck) openDeck(selectedDeck); }}
                />
              ) : (
                <>
                  {/* Progress bar */}
                  <div className="w-full max-w-xl h-0.5 bg-neutral-800 rounded-full mb-10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: selectedDeck?.color || "#3b82f6" }}
                      animate={{ width: `${(qIdx / queue.length) * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>

                  <FlipCard
                    card={queue[qIdx]}
                    flipped={flipped}
                    color={selectedDeck?.color || "#3b82f6"}
                    onFlip={() => !flipped && setFlipped(true)}
                  />

                  <AnimatePresence>
                    {flipped ? (
                      <motion.div
                        key="ratings"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex gap-3 mt-8 flex-wrap justify-center"
                      >
                        {RATINGS.map((r) => (
                          <button
                            key={r.value}
                            onClick={() => handleRating(r.value)}
                            className={`flex flex-col items-center px-6 py-3 rounded-xl border text-sm font-bold transition-all ${r.cls}`}
                          >
                            <span>{r.label}</span>
                            <span className="text-[10px] opacity-60 font-normal mt-0.5">{r.sublabel}</span>
                          </button>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.p
                        key="hint"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-neutral-600 text-sm mt-8"
                      >
                        Click the card to reveal the answer
                      </motion.p>
                    )}
                  </AnimatePresence>
                </>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {/* ── NEW DECK MODAL ── */}
      <AnimatePresence>
        {showNewDeck && (
          <Modal onClose={() => setShowNewDeck(false)}>
            <h2 className="text-xl font-bold mb-1">Create Deck</h2>
            <p className="text-neutral-500 text-sm mb-6">Give your deck a name and a color.</p>
            <div className="space-y-4">
              <Field label="Name">
                <input
                  autoFocus
                  type="text"
                  value={newDeck.name}
                  onChange={(e) => setNewDeck((p) => ({ ...p, name: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && createDeck()}
                  placeholder="e.g. Biology Chapter 5"
                  className={INPUT_CLS}
                />
              </Field>
              <Field label="Color">
                <div className="flex gap-3">
                  {PALETTE.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewDeck((p) => ({ ...p, color: c }))}
                      className="w-8 h-8 rounded-full transition-all"
                      style={{
                        background: c,
                        boxShadow: newDeck.color === c
                          ? `0 0 0 2px #0a0a0a, 0 0 0 4px ${c}`
                          : "none",
                      }}
                    />
                  ))}
                </div>
              </Field>
            </div>
            <ModalActions
              onCancel={() => setShowNewDeck(false)}
              onConfirm={createDeck}
              disabled={!newDeck.name.trim()}
              label="Create"
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* ── ADD CARD MODAL ── */}
      <AnimatePresence>
        {showAddCard && (
          <Modal onClose={() => setShowAddCard(false)}>
            <h2 className="text-xl font-bold mb-1">Add Card</h2>
            <p className="text-neutral-500 text-sm mb-6">Write a question on the front and the answer on the back.</p>
            <div className="space-y-4">
              <Field label="Front — Question">
                <textarea
                  autoFocus
                  value={newCard.front}
                  onChange={(e) => setNewCard((p) => ({ ...p, front: e.target.value }))}
                  placeholder="What is…?"
                  rows={3}
                  className={`${INPUT_CLS} resize-none`}
                />
              </Field>
              <Field label="Back — Answer">
                <textarea
                  value={newCard.back}
                  onChange={(e) => setNewCard((p) => ({ ...p, back: e.target.value }))}
                  placeholder="The answer is…"
                  rows={3}
                  className={`${INPUT_CLS} resize-none`}
                />
              </Field>
            </div>
            <ModalActions
              onCancel={() => setShowAddCard(false)}
              onConfirm={addCard}
              disabled={!newCard.front.trim() || !newCard.back.trim()}
              label="Add Card"
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* ── AI GENERATE MODAL ── */}
      <AnimatePresence>
        {showAI && (
          <Modal onClose={() => !generating && setShowAI(false)}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
              style={{ background: "#a855f715" }}>
              <Sparkles size={20} className="text-purple-400" />
            </div>
            <h2 className="text-xl font-bold mb-1">Generate with AI</h2>
            <p className="text-neutral-500 text-sm mb-6">
              Enter a topic and we'll create 10 flashcards for you automatically.
            </p>
            <Field label="Topic">
              <input
                autoFocus
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !generating && generateCards()}
                placeholder="e.g. Photosynthesis, Newton's Laws…"
                className={INPUT_CLS}
                disabled={generating}
              />
            </Field>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAI(false)}
                disabled={generating}
                className="flex-1 py-3 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white text-sm font-semibold transition-all disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                onClick={generateCards}
                disabled={!aiTopic.trim() || generating}
                className="flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                style={{ background: "#a855f7" }}
              >
                {generating ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      style={{ display: "inline-block" }}
                    >
                      <RotateCcw size={14} />
                    </motion.span>
                    Generating…
                  </>
                ) : (
                  <><Sparkles size={14} /> Generate 10 Cards</>
                )}
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── shared style constant ────────────────────────────────────────────────────
const INPUT_CLS =
  "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors";

// ── sub-components ───────────────────────────────────────────────────────────

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

function DeckCard({ deck, onOpen, onDelete }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onOpen}
      className="bg-neutral-900/40 border border-neutral-800 rounded-2xl overflow-hidden hover:border-neutral-700 transition-all cursor-pointer group"
    >
      <div className="h-1" style={{ background: deck.color }} />
      <div className="p-6">
        <div className="flex items-start justify-between mb-2 gap-2">
          <h3 className="font-bold text-base leading-tight">{deck.name}</h3>
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-neutral-600 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all shrink-0"
          >
            <Trash2 size={13} />
          </button>
        </div>
        {deck.description && (
          <p className="text-neutral-500 text-sm mb-4 line-clamp-2">{deck.description}</p>
        )}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3 text-xs text-neutral-600">
            <span>{deck.card_count ?? 0} cards</span>
            {deck.due_count > 0 && (
              <span className="font-semibold" style={{ color: deck.color }}>
                {deck.due_count} due
              </span>
            )}
          </div>
          <span className="text-xs text-neutral-600 group-hover:text-neutral-400 transition-colors">
            Open →
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function CardRow({ card, color, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="bg-neutral-900/30 border border-neutral-800 rounded-xl overflow-hidden hover:border-neutral-700 transition-colors"
    >
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
          <p className="text-sm font-medium truncate">{card.front}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {card.next_review && (
            <span className="text-xs text-neutral-600 hidden sm:block">
              due {new Date(card.next_review).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 text-neutral-600 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 border-t border-neutral-800 pt-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-600 mb-1.5">Answer</p>
              <p className="text-sm text-neutral-300">{card.back}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FlipCard({ card, flipped, color, onFlip }) {
  return (
    <div style={{ perspective: "1200px" }} className="w-full max-w-xl">
      <div
        onClick={onFlip}
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          position: "relative",
          height: "260px",
          cursor: flipped ? "default" : "pointer",
        }}
      >
        {/* Front */}
        <div
          style={{ backfaceVisibility: "hidden", position: "absolute", inset: 0 }}
          className="bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col items-center justify-center p-10 hover:border-neutral-700 transition-colors"
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color }}>Question</p>
          <p className="text-xl font-semibold text-center leading-relaxed text-neutral-100">{card.front}</p>
        </div>

        {/* Back */}
        <div
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            position: "absolute",
            inset: 0,
            borderColor: `${color}50`,
          }}
          className="bg-neutral-900 border rounded-2xl flex flex-col items-center justify-center p-10"
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-5 text-emerald-400">Answer</p>
          <p className="text-xl font-semibold text-center leading-relaxed text-neutral-100">{card.back}</p>
        </div>
      </div>
    </div>
  );
}

function StudyComplete({ count, color, onRestart, onBack }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center text-center max-w-sm mx-auto"
    >
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: `${color}20` }}>
        <Trophy size={28} style={{ color }} />
      </div>
      <h2 className="text-2xl font-bold mb-2">Round complete</h2>
      <p className="text-neutral-500 mb-8">
        You reviewed {count} card{count !== 1 ? "s" : ""}. The SM-2 algorithm has scheduled your next review.
      </p>
      <div className="flex gap-3 w-full">
        <button
          onClick={onBack}
          className="flex-1 py-3 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white text-sm font-semibold transition-all"
        >
          Back to deck
        </button>
        <button
          onClick={onRestart}
          className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all"
          style={{ background: color }}
        >
          Study again
        </button>
      </div>
    </motion.div>
  );
}

function EmptyDecks({ onNew }) {
  return (
    <div className="flex flex-col items-center text-center py-24">
      <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-5">
        <BookMarked size={24} className="text-neutral-600" />
      </div>
      <h3 className="font-bold text-lg mb-2">No decks yet</h3>
      <p className="text-neutral-500 text-sm max-w-xs mb-6">
        Create a deck and start adding flashcards, or let AI generate them for you.
      </p>
      <button
        onClick={onNew}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all"
      >
        <Plus size={16} /> Create First Deck
      </button>
    </div>
  );
}

function EmptyCards({ onAdd, onGenerate }) {
  return (
    <div className="flex flex-col items-center text-center py-20">
      <p className="text-neutral-500 mb-6">This deck is empty. Add cards manually or generate them with AI.</p>
      <div className="flex gap-3">
        <button onClick={onAdd}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 text-sm font-semibold transition-all">
          <Plus size={14} /> Add Card
        </button>
        <button onClick={onGenerate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 text-sm font-semibold transition-all">
          <Sparkles size={14} /> Generate with AI
        </button>
      </div>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 w-full max-w-md shadow-2xl"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-widest text-neutral-500 mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

function ModalActions({ onCancel, onConfirm, disabled, label }) {
  return (
    <div className="flex gap-3 mt-6">
      <button
        onClick={onCancel}
        className="flex-1 py-3 rounded-xl border border-neutral-800 text-neutral-400 hover:text-white text-sm font-semibold transition-all"
      >
        Cancel
      </button>
      <button
        onClick={onConfirm}
        disabled={disabled}
        className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold disabled:opacity-40 transition-all"
      >
        {label}
      </button>
    </div>
  );
}
