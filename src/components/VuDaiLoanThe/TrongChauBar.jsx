import React from 'react'

export default function TrongChauBar({ energy = 0, daiVuDaiActive = false }) {
  const percent = Math.min(100, Math.max(0, energy))

  return (
    <div className={`vdlt-trong-chau ${daiVuDaiActive ? 'dai-vu-dai' : ''}`}>
      <div className="vdlt-trong-chau-label">
        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>music_note</span>
        Trống Chầu {daiVuDaiActive && '— Đại Vũ Đài!'}
      </div>
      <div className="vdlt-trong-chau-bar-wrap">
        <div className="vdlt-trong-chau-bar" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
