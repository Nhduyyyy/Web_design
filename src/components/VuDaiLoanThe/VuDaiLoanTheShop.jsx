import React from 'react'
import ChampionCard from './ChampionCard'
import { getTribeByKey } from './constants/tribes'
import { getClassByKey } from './constants/classes'
import { CHAMPIONS_STATIC } from '../../data/vuDaiLoanTheChampions'
import { getShopOddsForLevel } from './constants/shopOdds'

export default function VuDaiLoanTheShop({ shopSlots = [], championsMap, gold, level = 1, onRoll, onBuy }) {
  const odds = getShopOddsForLevel(level, 10)
  return (
    <div className="vdlt-shop">
      <div className="vdlt-shop-odds" title="Tỷ lệ xuất hiện từng giá tướng khi Roll">
        <span className="vdlt-shop-odds-label">Tỷ lệ ra tướng (Cấp {level}):</span>
        {[1, 2, 3, 4, 5].map((cost) => (
          <span key={cost} className="vdlt-shop-odds-item">
            <span className="vdlt-shop-odds-cost">{cost}v</span>
            <span className="vdlt-shop-odds-pct">{odds[cost - 1]}%</span>
          </span>
        ))}
      </div>
      <div className="vdlt-shop-main">
        <button
          type="button"
          className="vdlt-btn-roll"
          onClick={onRoll}
          disabled={gold < 1}
          title="Roll 1 vàng"
        >
          Roll (1)
        </button>
        <div className="vdlt-shop-slots">
        {shopSlots.map((slot, i) => {
          const champion = slot ? championsMap?.[slot.champion_key] : null
          const staticChamp = slot?.champion_key ? CHAMPIONS_STATIC.find((c) => c.key === slot.champion_key) : null
          const tribe = staticChamp?.tribe_key ? getTribeByKey(staticChamp.tribe_key) : null
          const cls = staticChamp?.class_key ? getClassByKey(staticChamp.class_key) : null
          const cost = champion?.cost ?? 0
          const canBuy = gold >= cost
          return (
            <div key={i} className="vdlt-shop-slot">
              {champion ? (
                <button
                  type="button"
                  className={`vdlt-shop-slot-btn ${canBuy ? '' : 'disabled'}`}
                  onClick={() => canBuy && onBuy?.(i, slot)}
                  disabled={!canBuy}
                >
                  <div className="vdlt-shop-slot-card">
                    <ChampionCard
                      champion={champion}
                      star={slot?.star ?? 1}
                      maskColor={slot.mask_color}
                      tribeName={tribe?.name}
                      classRole={cls?.role}
                      compact
                    />
                  </div>
                  <div className="vdlt-shop-slot-info">
                    <span className="vdlt-shop-cost">
                      <span className="material-symbols-outlined">monetization_on</span>
                      {cost}
                    </span>
                    {tribe && <span className="vdlt-shop-tribe" style={{ color: tribe.color_hex }}>Tộc: {tribe.name}</span>}
                    {cls && <span className="vdlt-shop-class">Hệ: {cls.name}</span>}
                  </div>
                </button>
              ) : (
                <div className="vdlt-shop-slot-empty" />
              )}
            </div>
          )
        })}
        </div>
      </div>
    </div>
  )
}
