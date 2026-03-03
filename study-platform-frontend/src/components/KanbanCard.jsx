import React from 'react'
import { updateCard, deleteCard, suggestCard } from '../api/kanban'

export default function KanbanCard({ card }){
  async function onSuggest(){
    const s = await suggestCard({ title: card.title, description: card.description })
    alert(`Suggestion:\nTitle: ${s.suggested_title}\nPriority: ${s.suggested_priority}\nNotes: ${s.suggested_notes}`)
  }

  async function onDelete(){
    if(!confirm('Delete card?')) return
    await deleteCard(card.id)
    // simple UX: remove visually by reloading
    window.location.reload()
  }

  return (
    <div className="bg-neutral-800 p-3 rounded shadow-sm border border-neutral-800">
      <div className="flex justify-between items-start gap-3">
        <div className="min-w-0">
          <h4 className="font-bold text-sm text-white truncate">{card.title}</h4>
          {card.description && <p className="text-xs text-neutral-400 truncate">{card.description}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          <button onClick={onSuggest} title="AI Suggest" className="text-xs px-2 py-1 bg-yellow-500 rounded">AI</button>
          <button onClick={onDelete} title="Delete" className="text-xs px-2 py-1 bg-red-600 rounded">Del</button>
        </div>
      </div>
      <div className="mt-2 text-xs text-neutral-500">Priority: {card.priority}</div>
    </div>
  )
}
