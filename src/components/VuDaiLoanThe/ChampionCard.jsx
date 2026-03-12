import React from 'react'

const maskClass = (color) => {
  if (!color) return 'mask-red'
  return `mask-${color}`
}

const MASK_LABELS = { red: 'Đỏ: +Sát thương', black: 'Đen: +Chống chịu', white: 'Trắng: +Hiệu ứng', blue: 'Xanh: Sát thủ' }

export default function ChampionCard({ champion, star = 1, maskColor, compact = false, onClick, tribeName, classRole }) {
  const name = champion?.name ?? champion?.champion_key ?? '?'
  const cost = champion?.cost ?? 0
  const mask = maskColor ?? champion?.default_mask_color ?? 'red'
  const skill = champion?.skill_name ? `${champion.skill_name}: ${champion.skill_description || ''}` : ''
  const title = [tribeName, classRole, MASK_LABELS[mask], skill].filter(Boolean).join(' · ')

  return (
    <div
      className={`vdlt-champ-card ${maskClass(mask)}`}
      title={title}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
    >
      <span className="vdlt-champ-mask-badge" aria-hidden title={MASK_LABELS[mask]} />
      <span className="vdlt-champ-name">{name}</span>
      {!compact && <span className="vdlt-champ-cost">{cost} vàng</span>}
      {star > 1 && <span className="vdlt-champ-cost">★{star}</span>}
    </div>
  )
}
