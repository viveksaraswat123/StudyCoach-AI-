import { useState } from "react";

const initialColumns = [
  {
    id: "col-1", proTitle: "TO DO", stuTitle: "Not Started",
    cards: [
      { id: "c-1", proTitle: "Audit auth flow for security gaps",  stuTitle: "Read Chapter 4 & 5",          type: "bug",   priority: "high",   assignee: "SK", estimate: "3d", key: "PROJ-104", tag: "Exam Prep",  due: "Mar 10" },
      { id: "c-2", proTitle: "Write migration scripts for v2",     stuTitle: "Complete algebra problem set", type: "task",  priority: "medium", assignee: "AL", estimate: "2d", key: "PROJ-108", tag: "Homework",   due: "Mar 12" },
      { id: "c-3", proTitle: "Define pagination for feed API",     stuTitle: "Research essay outline",       type: "story", priority: "low",    assignee: null, estimate: "1d", key: "PROJ-112", tag: "Assignment", due: "Mar 15" },
    ]
  },
  {
    id: "col-2", proTitle: "IN PROGRESS", stuTitle: "Working On",
    cards: [
      { id: "c-4", proTitle: "Implement JWT refresh token",        stuTitle: "Writing lab report",           type: "task",  priority: "high",   assignee: "RK", estimate: "2d", key: "PROJ-99",  tag: "Lab",        due: "Mar 8"  },
      { id: "c-5", proTitle: "Dashboard responsive breakpoints",   stuTitle: "Group project slides",         type: "story", priority: "medium", assignee: "SK", estimate: "3d", key: "PROJ-101", tag: "Group",      due: "Mar 9"  },
    ]
  },
  {
    id: "col-3", proTitle: "IN REVIEW", stuTitle: "Check / Revise",
    cards: [
      { id: "c-6", proTitle: "Unit tests for billing module",      stuTitle: "Proofread history essay",      type: "task",  priority: "medium", assignee: "AL", estimate: "1d", key: "PROJ-95",  tag: "Essay",      due: "Mar 7"  },
    ]
  },
  {
    id: "col-4", proTitle: "DONE", stuTitle: "Done",
    cards: [
      { id: "c-7", proTitle: "Set up CI pipeline",                 stuTitle: "Submitted math quiz",          type: "task",  priority: "low",    assignee: "RK", estimate: "2d", key: "PROJ-88",  tag: "Quiz",       due: "Mar 3"  },
      { id: "c-8", proTitle: "Resolve CORS issue on staging",      stuTitle: "Flashcards for biology",       type: "bug",   priority: "high",   assignee: "SK", estimate: "4h", key: "PROJ-91",  tag: "Study",      due: "Mar 4"  },
    ]
  },
];

const ASSIGNEES = { SK: "#6366f1", AL: "#a855f7", RK: "#10b981" };

const TYPE = {
  bug:   { label: "Bug",   color: "#e11d48", icon: "⬡" },
  task:  { label: "Task",  color: "#3b82f6", icon: "✓" },
  story: { label: "Story", color: "#8b5cf6", icon: "⬟" },
};

const PRIORITY = {
  high:   { label: "High",   icon: "↑", color: "#e11d48" },
  medium: { label: "Medium", icon: "→", color: "#f59e0b" },
  low:    { label: "Low",    icon: "↓", color: "#6b7280" },
};

const TAG_COLORS = ["#6366f1","#f59e0b","#10b981","#3b82f6","#ec4899","#8b5cf6","#14b8a6"];
function tagColor(tag) {
  let h = 0; for (let i = 0; i < (tag||"").length; i++) h = (h * 31 + tag.charCodeAt(i)) & 0xffff;
  return TAG_COLORS[h % TAG_COLORS.length];
}

function genId() { return "id-" + Math.random().toString(36).slice(2,8); }

// shared styles
const S = {
  bg: "#0a0a0a",
  surface: "#111111",
  border: "#1e1e1e",
  borderHov: "#2a2a2a",
  text: "#e2e8f0",
  muted: "#4b5563",
  subtle: "#1a1a1a",
};

export default function App() {
  const [mode, setMode] = useState("student");
  const [cols, setCols]  = useState(initialColumns);
  const [drag, setDrag]  = useState(null);
  const [dragOver, setDragOver] = useState(null);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const pro = mode === "pro";

  function upd(fn) { setCols(c => { const n = JSON.parse(JSON.stringify(c)); fn(n); return n; }); }

  function moveCard(cardId, fromCol, toCol) {
    upd(cols => {
      const from = cols.find(c => c.id === fromCol);
      const to   = cols.find(c => c.id === toCol);
      const [card] = from.cards.splice(from.cards.findIndex(c => c.id === cardId), 1);
      to.cards.push(card);
    });
  }

  function saveCard(card, colId) {
    upd(cols => {
      const col = cols.find(c => c.id === colId);
      const idx = col.cards.findIndex(c => c.id === card.id);
      if (idx > -1) col.cards[idx] = card;
      else col.cards.push({ ...card, id: genId(), key: "PROJ-" + Date.now().toString().slice(-3) });
    });
  }

  function deleteCard(cardId, colId) {
    upd(cols => { const col = cols.find(c => c.id === colId); col.cards = col.cards.filter(c => c.id !== cardId); });
    setModal(null);
  }

  const totalCards = cols.reduce((s,c) => s + c.cards.length, 0);
  const doneCount  = cols.at(-1)?.cards.length || 0;
  const progress   = totalCards ? Math.round((doneCount / totalCards) * 100) : 0;

  const filtered = cols.map(col => ({
    ...col,
    cards: col.cards.filter(c => {
      const q = search.toLowerCase();
      return !q || (pro ? c.proTitle : c.stuTitle).toLowerCase().includes(q) || (c.tag||"").toLowerCase().includes(q);
    })
  }));

  function openAdd(colId) {
    setModal({ mode:"add", colId, card:{ id:genId(), proTitle:"", stuTitle:"", type:"task", priority:"medium", assignee:null, estimate:"", key:"", tag:"", due:"" } });
  }
  function openEdit(colId, card) {
    setModal({ mode:"edit", colId, card:{ ...card } });
  }

  return (
    <div style={{ height:"100vh", display:"flex", flexDirection:"column", background:S.bg, color:S.text, fontFamily:'"Inter",-apple-system,sans-serif', fontSize:13 }}>

      {/* Header */}
      <div style={{ background:S.surface, borderBottom:`1px solid ${S.border}`, padding:"0 20px", display:"flex", alignItems:"center", gap:12, height:50, flexShrink:0 }}>
        <div>
          <div style={{ fontWeight:700, fontSize:13, color:S.text }}>
            {pro ? "Sprint 24 — Q1 2026" : "My Study Board"}
          </div>
          <div style={{ fontSize:10, color:S.muted, marginTop:1 }}>
            {totalCards} {pro?"issues":"tasks"} · {progress}% complete
          </div>
        </div>

        {/* Progress */}
        <div style={{ width:72, height:3, background:S.border, borderRadius:4, overflow:"hidden" }}>
          <div style={{ width:`${progress}%`, height:"100%", background:"#3b82f6", borderRadius:4, transition:"width 0.4s" }} />
        </div>

        <div style={{ flex:1 }} />

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search…"
          style={{ background:"#050505", border:`1px solid ${S.border}`, borderRadius:6,
            padding:"5px 10px", color:S.text, fontSize:12, outline:"none", width:160 }} />

        {/* Toggle */}
        <div onClick={() => setMode(m => m==="pro"?"student":"pro")}
          style={{ display:"flex", background:"#050505", border:`1px solid ${S.border}`,
            borderRadius:6, overflow:"hidden", cursor:"pointer", userSelect:"none" }}>
          {[["student","🎓 Student"],["pro","💼 Pro"]].map(([val,label]) => (
            <div key={val} style={{ padding:"5px 13px", fontSize:11, fontWeight:700,
              background: mode===val ? "#1e1e1e" : "transparent",
              color: mode===val ? S.text : S.muted,
              borderRight: val==="student" ? `1px solid ${S.border}` : "none",
              transition:"all 0.2s", letterSpacing:"0.3px" }}>
              {label}
            </div>
          ))}
        </div>

        {/* Create */}
        <button onClick={() => openAdd(cols[0].id)}
          style={{ background:"#3b82f6", border:"none", borderRadius:6, padding:"6px 14px",
            color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer", flexShrink:0 }}>
          {pro ? "+ Create issue" : "+ Add task"}
        </button>
      </div>

      {/* Board */}
      <div style={{ flex:1, overflowX:"auto", overflowY:"hidden", display:"flex", alignItems:"flex-start", padding:"20px" }}>
        {filtered.map((col, ci) => (
          <Column key={col.id} col={col} ci={ci} total={filtered.length} pro={pro}
            isDragOver={dragOver === col.id}
            onDragOver={e => { e.preventDefault(); setDragOver(col.id); }}
            onDrop={e => { e.preventDefault(); if (drag && drag.colId !== col.id) moveCard(drag.cardId, drag.colId, col.id); setDrag(null); setDragOver(null); }}
            onDragLeave={() => setDragOver(null)}
            onAddCard={() => openAdd(col.id)}
            onEdit={card => openEdit(col.id, card)}
            onDragStart={cardId => setDrag({ cardId, colId: col.id })} />
        ))}
      </div>

      {modal && <Modal modal={modal} setModal={setModal} onSave={saveCard} onDelete={deleteCard} cols={cols} pro={pro} />}
    </div>
  );
}

function Column({ col, ci, total, pro, isDragOver, onDragOver, onDrop, onDragLeave, onAddCard, onEdit, onDragStart }) {
  const title = pro ? col.proTitle : col.stuTitle;
  return (
    <div onDragOver={onDragOver} onDrop={onDrop} onDragLeave={onDragLeave}
      style={{ width:260, flexShrink:0, display:"flex", flexDirection:"column", height:"100%",
        borderRight: ci < total-1 ? `1px solid ${S.border}` : "none" }}>

      {/* Col header */}
      <div style={{ padding:"0 14px 10px", display:"flex", alignItems:"center", gap:8 }}>
        {isDragOver && <div style={{ width:6, height:6, borderRadius:"50%", background:"#3b82f6" }} />}
        <span style={{ fontSize:11, fontWeight:700, letterSpacing:"0.8px", color: isDragOver ? S.text : S.muted, flex:1 }}>
          {pro ? title : title.toUpperCase()}
        </span>
        <span style={{ fontSize:11, color:"#2a2a2a", background:"#1a1a1a", borderRadius:4, padding:"1px 7px" }}>{col.cards.length}</span>
      </div>

      {isDragOver && <div style={{ margin:"0 14px 8px", height:2, background:"#3b82f6", borderRadius:2 }} />}

      {/* Cards */}
      <div style={{ flex:1, overflowY:"auto", padding:"0 10px", display:"flex", flexDirection:"column", gap:pro?2:6 }}>
        {col.cards.map(card => (
          <Card key={card.id} card={card} pro={pro}
            onEdit={() => onEdit(card)}
            onDragStart={() => onDragStart(card.id)} />
        ))}
      </div>

      {/* Add */}
      <div style={{ padding:"8px 10px 14px" }}>
        <button onClick={onAddCard}
          style={{ width:"100%", background:"none", border:`1px dashed ${S.border}`, textAlign:"left",
            padding:"6px 10px", color:S.muted, fontSize:12, cursor:"pointer", borderRadius:6, transition:"all 0.15s" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor="#2a2a2a"; e.currentTarget.style.color="#9ca3af"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor=S.border; e.currentTarget.style.color=S.muted; }}>
          + {pro ? "Create issue" : "Add task"}
        </button>
      </div>
    </div>
  );
}

function Card({ card, pro, onEdit, onDragStart }) {
  const [hov, setHov] = useState(false);
  const t = TYPE[card.type] || TYPE.task;
  const p = PRIORITY[card.priority] || PRIORITY.medium;
  const tc = tagColor(card.tag);

  return (
    <div draggable onDragStart={onDragStart} onClick={onEdit}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? "#161616" : S.surface,
        border: `1px solid ${hov ? S.borderHov : S.border}`,
        borderRadius:8, padding:"10px 12px", cursor:"pointer",
        transition:"background 0.12s, border-color 0.12s", userSelect:"none",
        borderLeft: `2px solid ${t.color}` }}>

      {/* Top row */}
      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:6 }}>
        {pro
          ? <span style={{ fontSize:10, color:S.muted }}>{card.key}</span>
          : card.tag && <span style={{ fontSize:10, background:`${tc}18`, color:tc, borderRadius:4, padding:"1px 6px", fontWeight:600 }}>{card.tag}</span>
        }
        <div style={{ flex:1 }} />
        <span style={{ fontSize:11, color:p.color, fontWeight:700 }}>{p.icon}</span>
      </div>

      {/* Title */}
      <div style={{ fontSize:12, color:"#d1d5db", lineHeight:1.5, marginBottom:8 }}>
        {(pro ? card.proTitle : card.stuTitle) || "Untitled"}
      </div>

      {/* Footer */}
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        <span style={{ fontSize:10, color:t.color, fontWeight:600 }}>{t.icon} {t.label}</span>
        <div style={{ flex:1 }} />
        {pro
          ? <>
              {card.estimate && <span style={{ fontSize:10, color:S.muted }}>{card.estimate}</span>}
              {card.assignee && (
                <div style={{ width:18, height:18, borderRadius:"50%", background:ASSIGNEES[card.assignee]||S.muted,
                  display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontWeight:700, color:"#fff" }}>
                  {card.assignee}
                </div>
              )}
            </>
          : card.due && <span style={{ fontSize:10, color:S.muted }}>📅 {card.due}</span>
        }
      </div>
    </div>
  );
}

function Modal({ modal, setModal, onSave, onDelete, cols, pro }) {
  const { mode, colId } = modal;
  const [form, setForm] = useState(modal.card);
  const [targetCol, setTargetCol] = useState(colId);
  const upd = (k,v) => setForm(f => ({ ...f, [k]:v }));

  function handleSave() {
    const title = pro ? form.proTitle : form.stuTitle;
    if (!title?.trim()) return;
    onSave({ ...form, proTitle: form.proTitle||form.stuTitle, stuTitle: form.stuTitle||form.proTitle }, targetCol);
    setModal(null);
  }

  return (
    <div onClick={() => setModal(null)}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.7)", display:"flex",
        alignItems:"center", justifyContent:"center", zIndex:200, backdropFilter:"blur(4px)" }}>
      <div onClick={e => e.stopPropagation()}
        style={{ background:"#0f0f0f", border:`1px solid ${S.border}`, borderRadius:10,
          width:440, boxShadow:"0 24px 60px rgba(0,0,0,0.8)", overflow:"hidden" }}>

        {/* Modal header */}
        <div style={{ background:"#0a0a0a", borderBottom:`1px solid ${S.border}`,
          padding:"11px 18px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:11, fontWeight:700, color:S.muted, letterSpacing:"0.8px" }}>
            {mode==="add" ? (pro?"NEW ISSUE":"NEW TASK") : (pro?"EDIT ISSUE":"EDIT TASK")}
          </span>
          {mode==="edit" && pro && <span style={{ fontSize:11, color:"#2a2a2a" }}>{form.key}</span>}
          <button onClick={() => setModal(null)}
            style={{ background:"none", border:"none", color:S.muted, cursor:"pointer", fontSize:18, lineHeight:1 }}>×</button>
        </div>

        <div style={{ padding:"18px 20px" }}>
          <textarea value={pro ? form.proTitle : form.stuTitle}
            onChange={e => upd(pro?"proTitle":"stuTitle", e.target.value)} rows={2}
            placeholder={pro ? "Issue summary…" : "What do you need to do?"}
            style={{ width:"100%", background:"transparent", border:"none",
              borderBottom:`1px solid ${S.border}`, color:S.text, fontSize:15, fontWeight:500,
              outline:"none", resize:"none", marginBottom:18, fontFamily:"inherit",
              lineHeight:1.5, padding:"0 0 10px", boxSizing:"border-box" }} />

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px 20px", marginBottom:18 }}>
            <MField label="PRIORITY">
              <select value={form.priority} onChange={e => upd("priority",e.target.value)} style={sel}>
                {Object.entries(PRIORITY).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </MField>
            {pro
              ? <MField label="TYPE">
                  <select value={form.type} onChange={e => upd("type",e.target.value)} style={sel}>
                    {Object.entries(TYPE).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </MField>
              : <MField label="TAG">
                  <input value={form.tag||""} onChange={e => upd("tag",e.target.value)} placeholder="e.g. Homework, Exam…" style={sel} />
                </MField>
            }
            <MField label="STATUS">
              <select value={targetCol} onChange={e => setTargetCol(e.target.value)} style={sel}>
                {cols.map(c => <option key={c.id} value={c.id}>{pro?c.proTitle:c.stuTitle}</option>)}
              </select>
            </MField>
            {pro
              ? <MField label="ASSIGNEE">
                  <select value={form.assignee||""} onChange={e => upd("assignee",e.target.value||null)} style={sel}>
                    <option value="">Unassigned</option>
                    {Object.keys(ASSIGNEES).map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </MField>
              : <MField label="DUE DATE">
                  <input value={form.due||""} onChange={e => upd("due",e.target.value)} placeholder="e.g. Mar 12" style={sel} />
                </MField>
            }
            <MField label={pro?"ESTIMATE":""}>
              {pro && <input value={form.estimate||""} onChange={e => upd("estimate",e.target.value)} placeholder="e.g. 2d, 4h" style={sel} />}
            </MField>
          </div>

          <div style={{ display:"flex", gap:8, paddingTop:12, borderTop:`1px solid ${S.border}` }}>
            {mode==="edit" && (
              <button onClick={() => onDelete(form.id, colId)}
                style={{ padding:"6px 14px", borderRadius:6, border:`1px solid #2a0a0a`,
                  background:"transparent", color:"#e11d48", fontWeight:600, fontSize:12, cursor:"pointer" }}>
                Delete
              </button>
            )}
            <div style={{ flex:1 }} />
            <button onClick={() => setModal(null)}
              style={{ padding:"6px 14px", borderRadius:6, border:`1px solid ${S.border}`,
                background:"transparent", color:S.muted, fontSize:12, cursor:"pointer" }}>
              Cancel
            </button>
            <button onClick={handleSave}
              style={{ padding:"6px 18px", borderRadius:6, border:"none",
                background:"#3b82f6", color:"#fff", fontWeight:700, fontSize:12, cursor:"pointer" }}>
              {mode==="add" ? (pro?"Create":"Add task") : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MField({ label, children }) {
  return (
    <div>
      {label && <div style={{ fontSize:10, color:"#4b5563", fontWeight:700, letterSpacing:"0.8px", marginBottom:5 }}>{label}</div>}
      {children}
    </div>
  );
}

const sel = {
  width:"100%", background:"#050505", border:"1px solid #1e1e1e",
  borderRadius:5, padding:"5px 8px", color:"#c9d1d9", fontSize:12, outline:"none", cursor:"pointer"
};