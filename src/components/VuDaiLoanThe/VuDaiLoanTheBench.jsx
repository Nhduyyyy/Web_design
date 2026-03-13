import React from 'react'
import ChampionCard from './ChampionCard'

const BENCH_SLOTS = 9

function parseDragData(e) {
  try {
    const raw = e.dataTransfer.getData('application/json')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export default function VuDaiLoanTheBench({ benchState = [], championsMap, onSlotClick, onChampionInfo, onDropToBench, onSell }) {
  const slots = Array.from({ length: BENCH_SLOTS }, (_, i) => {
    const unit = benchState[i] ?? null
    const champion = unit ? championsMap?.[unit.champion_key] : null
    return { index: i, unit, champion }
  })

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    e.currentTarget.classList.add('vdlt-drop-over')
  }
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('vdlt-drop-over')
  }
  const handleDrop = (e, index) => {
    e.preventDefault()
    e.currentTarget.classList.remove('vdlt-drop-over')
    const data = parseDragData(e)
    if (data && onDropToBench) onDropToBench(index, data)
  }

  return (
    <div className="vdlt-bench">
      {slots.map(({ index, unit, champion }) => (
        <div
          key={index}
          className="vdlt-bench-slot"
          onClick={() => onSlotClick?.(index, unit)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSlotClick?.(index, unit)}
        >
          {champion ? (
            <div
              className="vdlt-draggable-wrap"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ source: 'bench', sourceIndex: index, unit }))
                e.dataTransfer.effectAllowed = 'move'
              }}
              onClick={(ev) => ev.stopPropagation()}
            >
              <ChampionCard
                champion={champion}
                star={unit.star ?? 1}
                maskColor={unit.mask_color}
                onClick={(e) => {
                  e.stopPropagation()
                  if (onChampionInfo) onChampionInfo(index, unit)
                  else onSlotClick?.(index, unit)
                }}
              />
              {onSell && (
                <button
                  type="button"
                  className="vdlt-sell-btn"
                  title="Bán tướng"
                  onClick={(ev) => { ev.stopPropagation(); onSell(index, unit) }}
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
