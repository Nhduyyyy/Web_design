import React from 'react'
import ChampionCard from './ChampionCard'

function parseDragData(e) {
  try {
    const raw = e.dataTransfer.getData('application/json')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function VuDaiLoanTheBoard({
  boardState = [],
  championsMap,
  maxSlots = 10,
  onSlotClick,
  onChampionInfo,
  onDropToBoard,
  onSell,
  readOnly = false
}) {
  const slotCount = Math.max(1, Math.min(10, Number(maxSlots) || 10))
  const slots = Array.from({ length: slotCount }, (_, i) => {
    const unit = boardState.find((u) => u.slotIndex === i)
    const champion = unit ? championsMap?.[unit.champion_key] : null
    return { slotIndex: i, unit, champion }
  })

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    e.currentTarget.classList.add('vdlt-drop-over')
  }
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('vdlt-drop-over')
  }
  const handleDrop = (e, slotIndex) => {
    e.preventDefault()
    e.currentTarget.classList.remove('vdlt-drop-over')
    const data = parseDragData(e)
    if (data && onDropToBoard) onDropToBoard(slotIndex, data)
  }

  return (
    <div className="vdlt-board">
      {slots.map(({ slotIndex, unit, champion }) => (
        <div
          key={slotIndex}
          className={`vdlt-board-slot ${unit ? 'filled' : ''} ${readOnly ? 'vdlt-board-slot-readonly' : ''}`}
          onClick={readOnly && !onChampionInfo ? undefined : () => (unit && onChampionInfo ? onChampionInfo(slotIndex, unit) : onSlotClick?.(slotIndex, unit))}
          onDragOver={readOnly ? undefined : handleDragOver}
          onDragLeave={readOnly ? undefined : handleDragLeave}
          onDrop={readOnly ? undefined : (e) => handleDrop(e, slotIndex)}
          role="button"
          tabIndex={readOnly && !onChampionInfo ? -1 : 0}
          onKeyDown={
            readOnly && !onChampionInfo
              ? undefined
              : (e) => (e.key === 'Enter' || e.key === ' ') && (unit && onChampionInfo ? onChampionInfo(slotIndex, unit) : onSlotClick?.(slotIndex, unit))
          }
        >
          {champion ? (
            <div
              className="vdlt-draggable-wrap"
              draggable={readOnly ? false : true}
              onDragStart={
                readOnly
                  ? undefined
                  : (e) => {
                      e.dataTransfer.setData(
                        'application/json',
                        JSON.stringify({ source: 'board', sourceIndex: slotIndex, unit })
                      )
                      e.dataTransfer.effectAllowed = 'move'
                    }
              }
              onClick={readOnly && !onChampionInfo ? undefined : (ev) => ev.stopPropagation()}
            >
              <ChampionCard
                champion={champion}
                star={unit.star ?? 1}
                maskColor={unit.mask_color}
                onClick={unit && onChampionInfo ? () => onChampionInfo(slotIndex, unit) : (readOnly ? undefined : () => onSlotClick?.(slotIndex, unit))}
              />
              {!readOnly && onSell && (
                <button
                  type="button"
                  className="vdlt-sell-btn"
                  title="Bán tướng"
                  onClick={(ev) => { ev.stopPropagation(); onSell(slotIndex, unit) }}
                  aria-label="Bán tướng"
                >
                  <span className="material-symbols-outlined">sell</span>
                </button>
              )}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
