import React from 'react'
import ChampionCard from './ChampionCard'

export default function OpponentsPanel({ opponents = [], lastOpponentBoard = [], championsMap, selectedOpponentIndex, onSelectOpponent }) {
  const alive = opponents.filter((o) => o.hp > 0)

  return (
    <div className="vdlt-opponents-panel">
      <h3 className="vdlt-panel-title">
        <span className="material-symbols-outlined">group</span>
        Đối thủ ({alive.length}/7)
      </h3>

      <div className="vdlt-opponent-avatars">
        {opponents.map((opp, i) => (
          <button
            key={opp.id}
            type="button"
            className={`vdlt-opponent-avatar ${opp.hp <= 0 ? 'dead' : ''} ${selectedOpponentIndex === i ? 'selected' : ''}`}
            onClick={() => onSelectOpponent?.(selectedOpponentIndex === i ? null : i)}
            title={`HP: ${opp.hp}`}
          >
            <span className="vdlt-opponent-hp">{opp.hp}</span>
          </button>
        ))}
      </div>

      <div className="vdlt-opponent-board-preview">
        <h4>Đội hình đối thủ vừa đấu</h4>
        {lastOpponentBoard.length > 0 ? (
          <div className="vdlt-opponent-champs">
            {lastOpponentBoard.map((u, i) => {
              const c = u?.champion_key ? championsMap?.[u.champion_key] : null
              if (!c) return null
              return (
                <div key={i} className="vdlt-opponent-champ">
                  <ChampionCard champion={c} star={u.star ?? 1} maskColor={u.mask_color} compact />
                </div>
              )
            })}
          </div>
        ) : (
          <p className="vdlt-muted">Chưa đấu vòng nào. Kết thúc mua để vào combat.</p>
        )}
      </div>
    </div>
  )
}
