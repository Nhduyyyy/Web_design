import React from 'react'

export default function PvERound({ stage, roundInStage, roundType, onComplete }) {
  const label = roundType === 'neutral' ? `Neutral (${stage}-${roundInStage})` : `PvE (${stage}-${roundInStage})`
  return (
    <div className="vdlt-pve-wrap">
      <h3 className="vdlt-pve-title">{label} – Đánh quái</h3>
      <p className="vdlt-pve-desc">Nhận vàng và item từ quái.</p>
      <button type="button" className="vdlt-btn-start" onClick={onComplete}>
        Nhận thưởng
      </button>
    </div>
  )
}
