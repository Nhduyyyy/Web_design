import React from 'react'
import ChampionCard from './ChampionCard'

const OPPONENT_NAMES = ['Đối thủ 1', 'Đối thủ 2', 'Đối thủ 3', 'Đối thủ 4', 'Đối thủ 5', 'Đối thủ 6', 'Đối thủ 7']

/** id: 'player' | 0..6 */
export default function OpponentsPanel({
  myPlayer,
  opponents = [],
  championsMap,
  selectedId,
  onSelect,
  onChampionClick,
  phase
}) {
  const playerItem = myPlayer
    ? { id: 'player', hp: myPlayer.hp ?? 0, name: 'Tôi', isPlayer: true }
    : null
  const opponentItems = opponents.slice(0, 7).map((o, i) => ({
    id: i,
    hp: o.hp ?? 0,
    name: OPPONENT_NAMES[i] ?? `Đối thủ ${i + 1}`,
    isPlayer: false
  }))
  const allItems = [playerItem, ...opponentItems].filter(Boolean)
  const sorted = [...allItems].sort((a, b) => (b.hp ?? 0) - (a.hp ?? 0))

  return (
    <div className="vdlt-opponents-panel">
      <header className="vdlt-opponents-header">
        <span className="vdlt-opponents-header-icon" aria-hidden>
          <span className="material-symbols-outlined">group</span>
        </span>
        <span className="vdlt-opponents-header-title">
          Đối thủ ({opponents.filter((o) => o.hp > 0).length}/7)
        </span>
      </header>

      <ul className="vdlt-opponent-list">
        {sorted.map((item) => (
          <li key={item.isPlayer ? 'player' : item.id}>
            <button
              type="button"
              className={`vdlt-opponent-list-item ${item.hp <= 0 && !item.isPlayer ? 'dead' : ''} ${(item.isPlayer ? selectedId === null : selectedId === item.id) ? 'selected' : ''} ${item.isPlayer ? 'vdlt-opponent-me' : ''}`}
              onClick={() =>
                onSelect?.(item.isPlayer ? null : selectedId === item.id ? null : item.id)
              }
              title={`${item.name}: ${item.hp} HP`}
            >
              <span className="vdlt-opponent-hp-circle">
                <span className="vdlt-opponent-hp-value">{item.hp}</span>
              </span>
              <span className="vdlt-opponent-list-label">{item.name}</span>
              <span className="vdlt-opponent-list-hp">{item.hp}</span>
            </button>
          </li>
        ))}
      </ul>

      {phase === 'buying' && selectedId !== null && (
        <p className="vdlt-opponent-hint">Click &quot;Tôi&quot; để chỉnh sửa đội hình.</p>
      )}
    </div>
  )
}
