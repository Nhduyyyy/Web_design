import React from 'react'
import ChampionCard from './ChampionCard'

const OPPONENT_NAMES = ['Đối thủ 1', 'Đối thủ 2', 'Đối thủ 3', 'Đối thủ 4', 'Đối thủ 5', 'Đối thủ 6', 'Đối thủ 7']

export default function OpponentsPanel({ opponents = [], lastOpponentBoard = [], championsMap, selectedOpponentIndex, onSelectOpponent, onChampionClick }) {
  const alive = opponents.filter((o) => o.hp > 0)
  const total = 7

  return (
    <div className="vdlt-opponents-panel">
      <header className="vdlt-opponents-header">
        <span className="vdlt-opponents-header-icon" aria-hidden>
          <span className="material-symbols-outlined">group</span>
        </span>
        <span className="vdlt-opponents-header-title">Đối thủ ({alive.length}/{total})</span>
      </header>

      <ul className="vdlt-opponent-list">
        {opponents.slice(0, total).map((opp, i) => (
          <li key={opp.id}>
            <button
              type="button"
              className={`vdlt-opponent-list-item ${opp.hp <= 0 ? 'dead' : ''} ${selectedOpponentIndex === i ? 'selected' : ''}`}
              onClick={() => onSelectOpponent?.(selectedOpponentIndex === i ? null : i)}
              title={`${OPPONENT_NAMES[i] ?? `Đối thủ ${i + 1}`}: ${opp.hp} HP`}
            >
              <span className="vdlt-opponent-hp-circle">
                <span className="vdlt-opponent-hp-value">{opp.hp}</span>
              </span>
              <span className="vdlt-opponent-list-label">{OPPONENT_NAMES[i] ?? `Đối thủ ${i + 1}`}</span>
              <span className="vdlt-opponent-list-hp">{opp.hp}</span>
            </button>
          </li>
        ))}
      </ul>

      <section className="vdlt-opponent-board-preview">
        <h4 className="vdlt-opponent-board-heading">Đội hình đối thủ vừa đấu</h4>
        {lastOpponentBoard.length > 0 ? (
          <div className="vdlt-opponent-champs-grid">
            {lastOpponentBoard.map((u, i) => {
              const c = u?.champion_key ? championsMap?.[u.champion_key] : null
              if (!c) return null
              return (
                <button
                  key={i}
                  type="button"
                  className="vdlt-opponent-champ-btn"
                  onClick={() => onChampionClick?.(u)}
                  title="Xem thông tin tướng"
                >
                  <div className="vdlt-opponent-champ">
                    <ChampionCard champion={c} star={u.star ?? 1} maskColor={u.mask_color} compact />
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <p className="vdlt-opponent-empty">Chưa đấu vòng nào. Kết thúc mua để vào combat.</p>
        )}
      </section>
    </div>
  )
}
