import React from 'react'
import {
  STAR_MULTIPLIERS,
  CHAMPION_DAMAGE_TYPE,
  MASK_MODIFIERS,
  unitStatsFromChampion,
  applyItemStatsToUnit
} from './utils/combatResolver'
import { getTraitBuffsForBoard, applyTraitBuffsToUnit, countTraitsOnBoard, TRIBE_BUFFS, CLASS_BUFFS } from './constants/traitBuffs'
import { getTribeByKey } from './constants/tribes'
import { getClassByKey } from './constants/classes'
import { getChampionImageUrl } from './constants/championImages'
import { getItemById } from './constants/items'
import { applyAugmentBuffsToUnits, getActiveAugmentsForUnit } from './utils/augmentEffects'

const DAMAGE_TYPE_LABELS = { physical: 'Vật lý', magic: 'Phép', true: 'Chân thật' }

function formatItemStats(stats) {
  if (!stats) return []
  const parts = []
  if (stats.hp_flat) parts.push(`+${stats.hp_flat} Máu`)
  if (stats.attack_flat) parts.push(`+${stats.attack_flat} Tấn công`)
  if (stats.attack_percent) parts.push(`+${Math.round(stats.attack_percent * 100)}% Tấn công`)
  if (stats.armor_flat) parts.push(`+${stats.armor_flat} Giáp`)
  if (stats.magic_resist_flat) parts.push(`+${stats.magic_resist_flat} Kháng phép`)
  if (stats.crit_chance) parts.push(`+${Math.round(stats.crit_chance * 100)}% Tỉ lệ chí mạng`)
  if (stats.crit_damage) parts.push(`+${Math.round(stats.crit_damage * 100)}% Sát thương chí mạng`)
  return parts
}

export default function ChampionDetailModal({
  champion,
  unit = {},
  boardState = [],
  championsMap = {},
  playerAugments = [],
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
  const unitWithItems = applyItemStatsToUnit(unitWithBuffs, unit.items || [])
  const unitForAugment = {
    ...unitWithItems,
    champion_key: champion.key,
    col: typeof unit.col === 'number' ? unit.col : 2,
    row: typeof unit.row === 'number' ? unit.row : 2
  }
  const [unitWithAugments] = playerAugments.length
    ? applyAugmentBuffsToUnits([unitForAugment], boardState, championsMap, playerAugments)
    : [unitForAugment]
  const activeAugments = getActiveAugmentsForUnit(unitForAugment, boardState, championsMap, playerAugments)

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
  const itemDetails = (unit.items || [])
    .map((id) => getItemById(id))
    .filter((it) => it && !(it.tags || []).includes('tool'))

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
          <p className="vdlt-detail-final-title">
            Chỉ số cuối cùng (sao + mặt nạ + buff tộc/hệ + đồ + lõi)
          </p>
          <div className="vdlt-detail-final-stats">
            <span>Máu <strong>{unitWithAugments.current_hp}</strong></span>
            <span>Tấn công <strong>{unitWithAugments.attack}</strong></span>
            <span>Giáp <strong>{unitWithAugments.armor}</strong></span>
            <span>Kháng phép <strong>{unitWithAugments.magic_resist}</strong></span>
            {unitWithAugments.shield > 0 && (
              <span className="vdlt-detail-buff-active">Khiên <strong>{unitWithAugments.shield}</strong></span>
            )}
            <span>Loại ST <strong>{DAMAGE_TYPE_LABELS[damageType] ?? damageType}</strong></span>
            <span>Chí mạng <strong>{(unitWithAugments.crit_chance * 100).toFixed(0)}%</strong> ×<strong>{(unitWithAugments.crit_damage * 100).toFixed(0)}%</strong></span>
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
          <p className={`vdlt-detail-current ${hasTeamBuffs || itemDetails.length || activeAugments.length ? 'vdlt-detail-buff-active' : ''}`}>
            <strong>Chỉ số hiện tại ({star}★ + buff đội + đồ + lõi):</strong> Máu {unitWithAugments.current_hp} · Tấn công {unitWithAugments.attack} · Giáp {unitWithAugments.armor} · Kháng phép {unitWithAugments.magic_resist}
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
          {((unitWithAugments.crit_chance ?? 0.25) !== 0.25 || (unitWithAugments.crit_damage ?? 1) !== 1) && (
            <p className="vdlt-detail-crit vdlt-detail-buff-active">
              <strong>Bạo kích hiện tại:</strong> {(unitWithAugments.crit_chance * 100).toFixed(0)}% tỷ lệ, ×{(unitWithAugments.crit_damage * 100).toFixed(0)}% sát thương
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

        {itemDetails.length > 0 && (
          <section className="vdlt-detail-section">
            <h3>Phase D – Vật phẩm (Đồ)</h3>
            <ul>
              {itemDetails.map((it, idx) => {
                const statParts = formatItemStats(it.stats)
                return (
                  <li key={`${it.id}-${idx}`} className="vdlt-detail-buff-active">
                    <strong>{it.name}</strong>
                    {statParts.length > 0 && (
                      <span className="vdlt-detail-item-stats">: {statParts.join(', ')}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {playerAugments.length > 0 && (
          <section className="vdlt-detail-section">
            <h3>Phase E – Lõi (Augment)</h3>
            {activeAugments.length > 0 ? (
              <ul>
                {activeAugments.map(({ augment, effectText, pending, pendingReason }) => (
                  <li key={augment.id} className={pending ? 'vdlt-detail-augment-pending' : 'vdlt-detail-buff-active'}>
                    <strong>{augment.name}</strong>
                    {pending && pendingReason ? (
                      <span className="vdlt-detail-augment-pending-reason">: {effectText}. {pendingReason}</span>
                    ) : (
                      <span className="vdlt-detail-augment-effect">: {effectText}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="vdlt-detail-muted">Chưa có lõi nào kích hoạt cho tướng này.</p>
            )}
            {playerAugments.length > 0 && activeAugments.length === 0 && (
              <p className="vdlt-detail-augment-hint">
                Các lõi đã chọn: {playerAugments.map((a) => a.name).join(', ')}
              </p>
            )}
          </section>
        )}

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
