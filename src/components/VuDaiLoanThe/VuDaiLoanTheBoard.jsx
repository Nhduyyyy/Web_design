import React from 'react'
import ChampionCard from './ChampionCard'
import { MONSTER_IMAGE_URL } from './constants/championImages'

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
  cols = 4,
  rows = 4,
  onSlotClick,
  onChampionInfo,
  onDropToBoard,
  onSell,
  readOnly = false,
  useMonsterImage = false
}) {
  const rowsArr = Array.from({ length: rows }, (_, row) => row)
  const colsArr = Array.from({ length: cols }, (_, col) => col)
  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    e.currentTarget.classList.add('vdlt-drop-over')
  }
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('vdlt-drop-over')
  }
  const handleDrop = (e, col, row) => {
    e.preventDefault()
    e.currentTarget.classList.remove('vdlt-drop-over')
    const data = parseDragData(e)
    if (data && onDropToBoard) onDropToBoard(col, row, data)
  }

  return (
    <div className="vdlt-board">
      {rowsArr.map((row) =>
        colsArr.map((col) => {
          const unit = boardState.find((u) => u.col === col && u.row === row)
          const champion = unit ? championsMap?.[unit.champion_key] : null
          const key = `${col}-${row}`
          return (
            <div
              key={key}
              className={`vdlt-board-slot ${unit ? 'filled' : ''} ${readOnly ? 'vdlt-board-slot-readonly' : ''}`}
              onClick={
                readOnly && !onChampionInfo
                  ? undefined
                  : () => (unit && onChampionInfo ? onChampionInfo(col, row, unit) : onSlotClick?.(col, row, unit))
              }
              onDragOver={readOnly ? undefined : handleDragOver}
              onDragLeave={readOnly ? undefined : handleDragLeave}
              onDrop={readOnly ? undefined : (e) => handleDrop(e, col, row)}
              role="button"
              tabIndex={readOnly && !onChampionInfo ? -1 : 0}
              onKeyDown={
                readOnly && !onChampionInfo
                  ? undefined
                  : (e) =>
                      (e.key === 'Enter' || e.key === ' ') &&
                      (unit && onChampionInfo ? onChampionInfo(col, row, unit) : onSlotClick?.(col, row, unit))
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
                            JSON.stringify({ source: 'board', sourceCol: col, sourceRow: row, unit })
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
                    currentHp={typeof unit.current_hp === 'number' ? unit.current_hp : undefined}
                    maxHp={typeof unit.max_hp === 'number' ? unit.max_hp : undefined}
                    isAttacker={!!unit._isAttacker}
                    isTarget={!!unit._isTarget}
                    isDead={!!unit.dead || unit.current_hp <= 0}
                    imageUrlOverride={useMonsterImage ? MONSTER_IMAGE_URL : undefined}
                    onClick={
                      unit && onChampionInfo
                        ? () => onChampionInfo(col, row, unit)
                        : readOnly
                          ? undefined
                          : () => onSlotClick?.(col, row, unit)
                    }
                  />
                  {!readOnly && onSell && (
                    <button
                      type="button"
                      className="vdlt-sell-btn"
                      title="Bán tướng"
                      onClick={(ev) => {
                        ev.stopPropagation()
                        onSell(col, row, unit)
                      }}
                      aria-label="Bán tướng"
                    >
                      <span className="material-symbols-outlined">sell</span>
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          )
        })
      )}
    </div>
  )
}
