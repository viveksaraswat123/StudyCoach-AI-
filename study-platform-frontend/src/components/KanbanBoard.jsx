import React, { useEffect, useState } from 'react'
import KanbanColumn from './KanbanColumn'
import { createColumn, updateCard } from '../api/kanban'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

export default function KanbanBoard({ board, onBoardChange }){
  const [cols, setCols] = useState(board.columns || [])

  useEffect(()=>{
    setCols(board.columns ? board.columns.map(c => ({ ...c, cards: c.cards || [] })) : [])
  }, [board])

  async function addColumn(){
    const title = prompt('Column title', 'To Do')
    if(!title) return
    const col = await createColumn(title, board.id)
    setCols(prev=>[...prev, { ...col, cards: [] }])
  }

  function findColumnById(id){
    return cols.find(c => String(c.id) === String(id))
  }

  const onDragEnd = async (result) => {
    if(!result.destination) return
    const sourceColId = result.source.droppableId
    const destColId = result.destination.droppableId
    const sourceIndex = result.source.index
    const destIndex = result.destination.index

    if(sourceColId === destColId){
      // reorder within same column
      const col = findColumnById(sourceColId)
      const newCards = Array.from(col.cards)
      const [moved] = newCards.splice(sourceIndex,1)
      newCards.splice(destIndex,0,moved)
      const newCols = cols.map(c => c.id === col.id ? { ...c, cards: newCards } : c)
      setCols(newCols)
      // update positions on server for cards in this column
      for(let i=0;i<newCards.length;i++){
        await updateCard(newCards[i].id, { position: i })
      }
      if(onBoardChange) onBoardChange({ ...board, columns: newCols })
      return
    }

    // moving between columns
    const sourceCol = findColumnById(sourceColId)
    const destCol = findColumnById(destColId)
    const sourceCards = Array.from(sourceCol.cards)
    const destCards = Array.from(destCol.cards)
    const [moved] = sourceCards.splice(sourceIndex,1)
    moved.column_id = destCol.id
    destCards.splice(destIndex,0,moved)

    const newCols = cols.map(c => {
      if(c.id === sourceCol.id) return { ...c, cards: sourceCards }
      if(c.id === destCol.id) return { ...c, cards: destCards }
      return c
    })

    setCols(newCols)
    // persist changed card
    await updateCard(moved.id, { column_id: destCol.id, position: destIndex })
    // update positions for affected cards
    for(let i=0;i<destCards.length;i++){
      await updateCard(destCards[i].id, { position: i })
    }
    for(let i=0;i<sourceCards.length;i++){
      await updateCard(sourceCards[i].id, { position: i })
    }

    if(onBoardChange) onBoardChange({ ...board, columns: newCols })
  }

  return (
    <div>
      <div className="flex items-start gap-4 overflow-x-auto pb-6">
        <DragDropContext onDragEnd={onDragEnd}>
          {cols.map((col, colIndex) => (
            <Droppable droppableId={String(col.id)} key={col.id}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="min-w-[260px]">
                  <KanbanColumn column={col} boardId={board.id} index={colIndex} />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}

          <div className="min-w-[260px] p-2">
            <button onClick={addColumn} className="w-full px-3 py-2 bg-blue-600 text-white rounded">+ Add Column</button>
          </div>
        </DragDropContext>
      </div>
    </div>
  )
}
