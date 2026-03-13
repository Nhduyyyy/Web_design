import React from 'react'

const TIER_LABELS = { silver: 'Bạc', gold: 'Vàng', prismatic: 'Lăng kính' }
const TIER_CLASS = { silver: 'vdlt-augment-silver', gold: 'vdlt-augment-gold', prismatic: 'vdlt-augment-prismatic' }

export default function AugmentSelectModal({ options = [], onSelect, championsMap = {} }) {
  return (
    <div className="vdlt-augment-modal-overlay">
      <div className="vdlt-augment-modal">
        <h2 className="vdlt-augment-modal-title">Chọn Lõi – Nghệ thuật tuồng</h2>
        <p className="vdlt-augment-modal-subtitle">Chọn 1 trong 3 lõi để nhận buff vĩnh viễn trong trận</p>
        <div className="vdlt-augment-options">
          {options.map((aug) => (
            <button
              key={aug.id}
              type="button"
              className={`vdlt-augment-option ${TIER_CLASS[aug.tier] || ''}`}
              onClick={() => onSelect?.(aug)}
            >
              <span className="vdlt-augment-tier">{TIER_LABELS[aug.tier] || aug.tier}</span>
              <span className="vdlt-augment-name">{aug.name}</span>
              {aug.flavorDescription && (
                <p className="vdlt-augment-flavor">{aug.flavorDescription}</p>
              )}
              {aug.effectDescription && (
                <p className="vdlt-augment-effect vdlt-augment-effect-detail">{aug.effectDescription}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
