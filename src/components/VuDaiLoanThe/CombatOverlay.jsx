import React from 'react'

export default function CombatOverlay({ result, onClose }) {
  const won = result?.winner === 'player'
  const text = won ? 'Thắng!' : 'Thua'

  return (
    <div className="vdlt-combat-overlay" onClick={onClose} role="dialog" aria-label="Kết quả combat">
      <div className="vdlt-combat-box" onClick={(e) => e.stopPropagation()}>
        <h3>{text}</h3>
        <p>Damage nhận: {result?.damageTaken ?? 0}</p>
        {result?.damageDealt != null && (
          <p>Damage gây ra: {result.damageDealt}</p>
        )}
        <button type="button" className="vdlt-btn-start" onClick={onClose}>
          Tiếp tục
        </button>
      </div>
    </div>
  )
}
