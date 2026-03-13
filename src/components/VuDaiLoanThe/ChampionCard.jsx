import React from 'react'
import { getChampionImageUrl } from './constants/championImages'

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
  const championKey = champion?.key ?? champion?.champion_key
  const tribeKey = champion?.tribe_key ?? champion?.tribe?.key
  const imageUrl = championKey ? getChampionImageUrl(championKey, tribeKey) : null

  const isHorizontal = imageUrl && compact

  return (
    <div
      className={`vdlt-champ-card ${maskClass(mask)} ${imageUrl ? 'has-image' : ''} ${isHorizontal ? 'layout-horizontal' : ''}`}
      title={title}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.()}
    >
      <span className="vdlt-champ-mask-badge" aria-hidden title={MASK_LABELS[mask]} />
      <span className="vdlt-champ-star-badge" aria-label={`${star} sao`} title={`${star} sao`}>
        {star}★
      </span>
      {imageUrl && (
        <div className="vdlt-champ-image-wrap">
          <img
            src={imageUrl}
            alt=""
            className="vdlt-champ-image"
            loading="lazy"
          />
        </div>
      )}
      <div className="vdlt-champ-content">
        <span className="vdlt-champ-name">{name}</span>
        <span className="vdlt-champ-cost">{cost} vàng</span>
        {tribeName && <span className="vdlt-champ-tribe">Tộc: {tribeName}</span>}
        {classRole && <span className="vdlt-champ-class">Hệ: {classRole}</span>}
      </div>
    </div>
  )
}
