import React from 'react'
import {
  STAR_MULTIPLIERS,
  CHAMPION_DAMAGE_TYPE,
  MASK_MODIFIERS,
  unitStatsFromChampion
} from './utils/combatResolver'
import { getTraitBuffsForBoard, applyTraitBuffsToUnit, countTraitsOnBoard, TRIBE_BUFFS, CLASS_BUFFS } from './constants/traitBuffs'
import { getTribeByKey } from './constants/tribes'
import { getClassByKey } from './constants/classes'
import { getChampionImageUrl } from './constants/championImages'

const DAMAGE_TYPE_LABELS = { physical: 'Vật lý', magic: 'Phép', true: 'Chân thật' }

export default function ChampionDetailModal({
  champion,
  unit = {},
  boardState = [],
  championsMap = {},
  source,
  shopIndex,
  slot,
  benchIndex,
  onClose,
  onBuy,
  onSelectForBoard
}) {
  if (!champion) return null
  const star = unit.star ?? 1
  const maskColor = unit.mask_color ?? champion.default_mask_color ?? 'red'
  const tribe = getTribeByKey(champion.tribe_key)
  const cls = getClassByKey(champion.class_key)
  const imageUrl = getChampionImageUrl(champion.key, champion.tribe_key)

  const baseHp = Number(champion.base_hp) || 0
  const baseAttack = Number(champion.base_attack) || 0
  const baseArmor = Number(champion.base_armor) || 0
  const baseMR = Number(champion.base_magic_resist) || 0
  const damageType = CHAMPION_DAMAGE_TYPE[champion.key] || 'physical'
  const maskMod = MASK_MODIFIERS[maskColor] || MASK_MODIFIERS.red

  const stats1 = unitStatsFromChampion(champion, 1, maskColor)
  const stats2 = unitStatsFromChampion(champion, 2, maskColor)
  const stats3 = unitStatsFromChampion(champion, 3, maskColor)
  const buffs = getTraitBuffsForBoard(boardState, championsMap)
  const currentUnit = unitStatsFromChampion(champion, star, maskColor)
  const unitWithBuffs = applyTraitBuffsToUnit(currentUnit, buffs)

  const tribeBuffs = champion.tribe_key && TRIBE_BUFFS[champion.tribe_key]
  const classBuffs = champion.class_key && CLASS_BUFFS[champion.class_key]
  const { tribeCount = {}, classCount = {} } = countTraitsOnBoard(boardState, championsMap)
  const activeTribeTier = champion.tribe_key && tribeCount[champion.tribe_key] != null
    ? [2, 4, 6].filter((t) => tribeCount[champion.tribe_key] >= t).pop()
    : null
  const activeClassTier = champion.class_key && classCount[champion.class_key] != null
    ? [2, 4, 6].filter((t) => classCount[champion.class_key] >= t).pop()
    : null
  const hasTeamBuffs = (buffs.armor ?? 0) > 0 || (buffs.magicResist ?? 0) > 0 || (buffs.damagePercent ?? 0) > 0

  return (
    <div className="vdlt-detail-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Thông tin tướng">
      <div className="vdlt-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="vdlt-detail-close" onClick={onClose} aria-label="Đóng">
          ×
        </button>

        <header className="vdlt-detail-header">
          {imageUrl && (
            <div className="vdlt-detail-portrait">
              <img src={imageUrl} alt="" />
              <span className="vdlt-detail-star-badge">{star}★</span>
            </div>
          )}
          <div className="vdlt-detail-title-wrap">
            <h2 className="vdlt-detail-name">{champion.name}</h2>
            <p className="vdlt-detail-meta">
              {champion.cost} vàng · {tribe?.name ?? champion.tribe_key} · {cls?.name ?? champion.class_key}
            </p>
            {champion.skill_name && (
              <p className="vdlt-detail-skill">
                <strong>{champion.skill_name}:</strong> {champion.skill_description || ''}
              </p>
            )}
          </div>
        </header>

        <div className="vdlt-detail-final-row">
          <p className="vdlt-detail-final-title">Chỉ số cuối cùng (đã cộng tất cả buff)</p>
          <div className="vdlt-detail-final-stats">
            <span>Máu <strong>{unitWithBuffs.current_hp}</strong></span>
            <span>Tấn công <strong>{unitWithBuffs.attack}</strong></span>
            <span>Giáp <strong>{unitWithBuffs.armor}</strong></span>
            <span>Kháng phép <strong>{unitWithBuffs.magic_resist}</strong></span>
            <span>Loại ST <strong>{DAMAGE_TYPE_LABELS[damageType] ?? damageType}</strong></span>
            <span>Chí mạng <strong>{(unitWithBuffs.crit_chance * 100).toFixed(0)}%</strong> ×<strong>{(unitWithBuffs.crit_damage * 100).toFixed(0)}%</strong></span>
          </div>
        </div>

        <section className="vdlt-detail-section">
          <h3>Phase A – Chỉ số & Loại sát thương</h3>
          <p className="vdlt-detail-damage-type">
            <strong>Loại sát thương:</strong> {DAMAGE_TYPE_LABELS[damageType] ?? damageType}
            {damageType === 'physical' && ' (giảm theo Giáp địch)'}
            {damageType === 'magic' && ' (giảm theo Kháng phép địch)'}
            {damageType === 'true' && ' (bỏ qua Giáp & Kháng phép)'}
          </p>
          <p className="vdlt-detail-scaling">
            <strong>Nhân theo sao:</strong> 1★ = 1× · 2★ = 1.8× · 3★ = 3.2×
          </p>
          <div className="vdlt-detail-stats-table-wrap">
            <table className="vdlt-detail-stats-table">
              <thead>
                <tr>
                  <th>Sao</th>
                  <th>Máu</th>
                  <th>Tấn công</th>
                  <th>Giáp</th>
                  <th>Kháng phép</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1★</td>
                  <td>{stats1.current_hp}</td>
                  <td>{stats1.attack}</td>
                  <td>{stats1.armor}</td>
                  <td>{stats1.magic_resist}</td>
                </tr>
                <tr>
                  <td>2★</td>
                  <td>{stats2.current_hp}</td>
                  <td>{stats2.attack}</td>
                  <td>{stats2.armor}</td>
                  <td>{stats2.magic_resist}</td>
                </tr>
                <tr>
                  <td>3★</td>
                  <td>{stats3.current_hp}</td>
                  <td>{stats3.attack}</td>
                  <td>{stats3.armor}</td>
                  <td>{stats3.magic_resist}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={`vdlt-detail-current ${hasTeamBuffs ? 'vdlt-detail-buff-active' : ''}`}>
            <strong>Chỉ số hiện tại ({star}★ + buff đội):</strong> Máu {unitWithBuffs.current_hp} · Tấn công {unitWithBuffs.attack} · Giáp {unitWithBuffs.armor} · Kháng phép {unitWithBuffs.magic_resist}
          </p>
        </section>

        <section className="vdlt-detail-section">
          <h3>Phase B – Hóa trang (Mặt nạ)</h3>
          <p className={`vdlt-detail-mask-name vdlt-detail-buff-active`} style={{ color: maskColor === 'red' ? '#c62828' : maskColor === 'black' ? '#546e7a' : maskColor === 'white' ? '#eceff1' : '#1565c0' }}>
            {maskMod.label}
          </p>
          <ul className="vdlt-detail-mask-list vdlt-detail-buff-active">
            {maskMod.attackPercent !== undefined && maskMod.attackPercent !== 1 && (
              <li>Tấn công: ×{(maskMod.attackPercent * 100).toFixed(0)}%</li>
            )}
            {(maskMod.armor ?? 0) > 0 && <li>+{maskMod.armor} Giáp</li>}
            {(maskMod.magicResist ?? 0) > 0 && <li>+{maskMod.magicResist} Kháng phép</li>}
            {(maskMod.critChance ?? 0) > 0 && <li>+{(maskMod.critChance * 100).toFixed(0)}% Tỷ lệ chí mạng</li>}
            {maskMod.critDamage !== undefined && maskMod.critDamage > 1 && (
              <li>Sát thương chí mạng: ×{(maskMod.critDamage * 100).toFixed(0)}%</li>
            )}
          </ul>
          {((currentUnit.crit_chance ?? 0.25) !== 0.25 || (currentUnit.crit_damage ?? 1) !== 1) && (
            <p className="vdlt-detail-crit vdlt-detail-buff-active">
              <strong>Bạo kích hiện tại:</strong> {(currentUnit.crit_chance * 100).toFixed(0)}% tỷ lệ, ×{(currentUnit.crit_damage * 100).toFixed(0)}% sát thương
            </p>
          )}
        </section>

        <section className="vdlt-detail-section">
          <h3>Phase C – Buff Tộc & Hệ (2/4/6 tướng)</h3>
          {tribeBuffs && (
            <div className="vdlt-detail-trait">
              <strong>Tộc: {tribe?.name ?? champion.tribe_key}</strong>
              <ul>
                {[2, 4, 6].map((tier) => {
                  const b = tribeBuffs[tier]
                  if (!b) return null
                  const parts = []
                  if (b.armor) parts.push(`+${b.armor} Giáp`)
                  if (b.magicResist) parts.push(`+${b.magicResist} Kháng phép`)
                  if (b.damagePercent) parts.push(`+${(b.damagePercent * 100).toFixed(0)}% Sát thương`)
                  const isActive = activeTribeTier != null && tier <= activeTribeTier
                  return <li key={tier} className={isActive ? 'vdlt-detail-buff-active' : ''}>{tier} tướng: {parts.join(', ')}</li>
                })}
              </ul>
            </div>
          )}
          {classBuffs && (
            <div className="vdlt-detail-trait">
              <strong>Hệ: {cls?.name ?? champion.class_key}</strong>
              <ul>
                {[2, 4, 6].map((tier) => {
                  const b = classBuffs[tier]
                  if (!b) return null
                  const parts = []
                  if (b.armor) parts.push(`+${b.armor} Giáp`)
                  if (b.magicResist) parts.push(`+${b.magicResist} Kháng phép`)
                  if (b.damagePercent) parts.push(`+${(b.damagePercent * 100).toFixed(0)}% Sát thương`)
                  const isActive = activeClassTier != null && tier <= activeClassTier
                  return <li key={tier} className={isActive ? 'vdlt-detail-buff-active' : ''}>{tier} tướng: {parts.join(', ')}</li>
                })}
              </ul>
            </div>
          )}
          <p className={`vdlt-detail-buff-current ${hasTeamBuffs ? 'vdlt-detail-buff-active' : ''}`}>
            <strong>Buff đội hiện tại (theo bàn cờ):</strong> +{(buffs.damagePercent ?? 0) * 100}% sát thương, +{buffs.armor ?? 0} Giáp, +{buffs.magicResist ?? 0} Kháng phép
          </p>
        </section>

        <footer className="vdlt-detail-footer">
          {source === 'shop' && typeof shopIndex === 'number' && slot && onBuy && (
            <button type="button" className="vdlt-detail-btn-buy" onClick={() => onBuy(shopIndex, slot)}>
              Mua ({champion.cost} vàng)
            </button>
          )}
          {source === 'bench' && onSelectForBoard && (
            <button type="button" className="vdlt-detail-btn-buy" onClick={onSelectForBoard}>
              Chọn để đặt lên sân
            </button>
          )}
          <button type="button" className="vdlt-detail-btn-close" onClick={onClose}>
            Đóng
          </button>
        </footer>
      </div>
    </div>
  )
}
