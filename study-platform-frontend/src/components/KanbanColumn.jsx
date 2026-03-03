import React, { useState } from 'react'
import KanbanCard from './KanbanCard'
import { createCard } from '../api/kanban'
import { Draggable } from 'react-beautiful-dnd'

export default function KanbanColumn({ column, boardId, index }){
  const [cards, setCards] = useState(column.cards || [])

  async function addCard(){
    const title = prompt('Card title', 'New task')
    if(!title) return
    const c = await createCard({ title, column_id: column.id })
    setCards(prev=>[...prev, c])
    // refresh page-level state handled by parent via onBoardChange when necessary
  }

  return (
    <div className="min-w-[260px] bg-neutral-900 rounded p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{column.title}</h3>
        <button onClick={addCard} className="text-xs px-2 py-1 bg-blue-600 rounded">+ New</button>
      </div>
      <div className="space-y-3">
        {cards.map((card, idx) => (
          <Draggable key={card.id} draggableId={String(card.id)} index={idx}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                <KanbanCard card={card} />
              </div>
            )}
          </Draggable>
        ))}
      </div>
    </div>
  )
}
