/**
 * Vũ Đại Loạn Thế - Combat resolution (pure functions)
 * Input: two boards of champion instances with stats; optional seed for determinism.
 * Output: damage dealt, surviving units, winner.
 * TFT-style: star scaling 1/1.8/3.2, physical/magic/true damage, crit, mask roles.
 */
import { getItemById } from '../constants/items'

/** TFT star multipliers: 1★ = 1.0, 2★ = 1.8, 3★ = 3.2 */
export const STAR_MULTIPLIERS = { 1: 1, 2: 1.8, 3: 3.2 }

/** Champion key → damage type for mitigation (physical → armor, magic → MR, true → none) */
export const CHAMPION_DAMAGE_TYPE = {
  phàn_lê_huê: 'magic',
  tạ_ôn_đình: 'magic',
  hình_quan: 'magic',
  trịnh_ân: 'magic',
  hộ_giá_trung_thần: 'magic',
  thiên_lý_kiếm: 'true'
}

export const MASK_MODIFIERS = {
  red: { attackPercent: 1.15, armor: 0, magicResist: 0, critChance: 0, critDamage: 1, label: 'Đỏ: +Sát thương' },
  black: { attackPercent: 1, armor: 15, magicResist: 15, critChance: 0, critDamage: 1, label: 'Đen: +Giáp & Kháng phép' },
  white: { attackPercent: 1.05, armor: 5, magicResist: 5, critChance: 0, critDamage: 1, label: 'Trắng: +Cân bằng' },
  blue: { attackPercent: 1.2, armor: 0, magicResist: 0, critChance: 0.15, critDamage: 1.4, label: 'Xanh: +Tỷ lệ & Sát thương bạo kích' }
}

function physicalDamage(attack, armor, maskMod = 1) {
  const effectiveArmor = Math.max(0, armor)
  const multiplier = 100 / (100 + effectiveArmor)
  return Math.max(1, Math.floor(attack * multiplier * maskMod))
}

function magicDamage(amount, magicResist, maskMod = 1) {
  const effectiveMR = Math.max(0, magicResist)
  const multiplier = 100 / (100 + effectiveMR)
  return Math.max(1, Math.floor(amount * multiplier * maskMod))
}

const DEFAULT_CRIT_CHANCE = 0.25
const DEFAULT_CRIT_DAMAGE = 1.4

function computeDamage(attacker, target, nextRng) {
  let base = attacker.attack ?? 0
  const critChance = attacker.crit_chance ?? DEFAULT_CRIT_CHANCE
  const critDamage = attacker.crit_damage ?? DEFAULT_CRIT_DAMAGE
  const isCrit = critChance > 0 && nextRng() < critChance
  if (isCrit) base = Math.floor(base * critDamage)
  const damageType = attacker.damage_type || 'physical'
  if (damageType === 'true') return Math.max(1, base)
  if (damageType === 'magic') return magicDamage(base, target.magic_resist ?? 0, 1)
  return physicalDamage(base, target.armor ?? 0, 1)
}

/**
 * Resolve one round of combat between two boards.
 * Pipeline: base → crit → armor/MR or true.
 * @param {Array} boardA - units with champion_key, star, mask_color, current_hp, attack, armor, magic_resist, damage_type?, crit_chance?, crit_damage?
 * @param {Array} boardB - same shape
 * @param {number} seed - optional for deterministic RNG
 */
export function resolveCombat(boardA, boardB, seed = Date.now()) {
  let rng = seed
  const next = () => {
    rng = (rng * 9301 + 49297) % 233280
    return rng / 233280
  }

  const cloneSide = (board, isA) =>
    (board || [])
      .filter((u) => u && typeof u.current_hp === 'number')
      .map((u, idx) => {
        const col = typeof u.col === 'number' ? u.col : idx
        const row = typeof u.row === 'number' ? u.row : isA ? 0 : 3
        const hp = u.current_hp
        return {
          ...u,
          current_hp: hp,
          max_hp: hp,
          shield: u.shield ?? 0,
          col,
          row,
          dead: false,
          _target: null,
          _index: idx
        }
      })

  const DEFAULT_RANGE = 1
  let a = cloneSide(boardA, true)
  let b = cloneSide(boardB, false)
  // Ảnh chụp trạng thái ban đầu để frontend animate từ full máu
  const initialA = a.map((u) => ({ ...u }))
  const initialB = b.map((u) => ({ ...u }))
  const log = []
  const events = []
  const deathOrder = []

  const dist2 = (u1, u2) => {
    const dx = (u1.col ?? 0) - (u2.col ?? 0)
    const dy = (u1.row ?? 0) - (u2.row ?? 0)
    return dx * dx + dy * dy
  }

  const pickNearest = (unit, enemies) => {
    const alive = enemies.filter((e) => e && !e.dead && (e.current_hp ?? 0) > 0)
    if (!alive.length) return null
    let best = null
    let bestD2 = Infinity
    alive.forEach((e) => {
      const d2 = dist2(unit, e)
      if (d2 < bestD2) {
        bestD2 = d2
        best = e
      }
    })
    return best
  }

  const stepTowards = (u, target) => {
    if (!target) return
    if (u.col < target.col) u.col += 1
    else if (u.col > target.col) u.col -= 1
    else if (u.row < target.row) u.row += 1
    else if (u.row > target.row) u.row -= 1
  }

  const actSide = (side, enemies, label, targetLabel) => {
    side.forEach((u) => {
      if (!u || u.current_hp <= 0 || u.dead) return
      if (!u._target || !enemies.includes(u._target) || u._target.current_hp <= 0) {
        u._target = pickNearest(u, enemies)
      }
      const target = u._target
      if (!target || target.current_hp <= 0 || target.dead) return
      const d2 = dist2(u, target)
      const range = u.range ?? DEFAULT_RANGE
      if (d2 <= range * range) {
        let dmg = computeDamage(u, target, next)
        if (dmg <= 0) return
        const shield = target.shield ?? 0
        if (shield > 0) {
          const dmgToShield = Math.min(dmg, shield)
          target.shield = shield - dmgToShield
          dmg -= dmgToShield
        }
        if (dmg > 0) {
          target.current_hp = Math.max(0, target.current_hp - dmg)
        }
        if (target.current_hp === 0) {
          target.dead = true
          deathOrder.push({ side: targetLabel, index: target._index, tick })
        }
        log.push(
          `${label} ${u.name ?? u.champion_key ?? ''} deals ${dmg} to ${target.name ?? target.champion_key ?? ''}`
        )
        events.push({
          side: label === 'A' ? 'A' : 'B',
          attackerIndex: u._index,
          targetIndex: target._index,
          damage: dmg,
          nextHp: target.current_hp
        })
      } else {
        stepTowards(u, target)
      }
    })
  }

  const MAX_TICKS = 200
  let tick = 0
  while (a.length > 0 && b.length > 0 && tick < MAX_TICKS) {
    actSide(a, b, 'A', 'B')
    actSide(b, a, 'B', 'A')
    if (!a.some((u) => u && !u.dead && u.current_hp > 0)) break
    if (!b.some((u) => u && !u.dead && u.current_hp > 0)) break
    tick += 1
  }

  const aliveA = a.filter((u) => u && !u.dead && u.current_hp > 0)
  const aliveB = b.filter((u) => u && !u.dead && u.current_hp > 0)
  const winner = aliveA.length > 0 ? (aliveB.length > 0 ? null : 'A') : aliveB.length > 0 ? 'B' : null
  return {
    boardA: aliveA,
    boardB: aliveB,
    winner,
    log,
    events,
    deathOrder,
    initialA,
    initialB
  }
}

/**
 * Build unit stats for combat from champion template + star + mask.
 * TFT star scaling (1 / 1.8 / 3.2); mask adds flat armor/MR and crit for blue.
 */
export function unitStatsFromChampion(champion, star = 1, maskColor = null) {
  const mult = STAR_MULTIPLIERS[star] ?? STAR_MULTIPLIERS[1]
  const mask = maskColor || champion.default_mask_color
  const mod = MASK_MODIFIERS[mask] || MASK_MODIFIERS.red
  const baseHp = Math.floor(Number(champion.base_hp) * mult)
  const baseAttack = Number(champion.base_attack) * mult
  const baseArmor = Math.floor(Number(champion.base_armor) * mult)
  const baseMR = Math.floor(Number(champion.base_magic_resist) * mult)
  return {
    champion_key: champion.key,
    name: champion.name,
    star,
    mask_color: mask,
    damage_type: CHAMPION_DAMAGE_TYPE[champion.key] || 'physical',
    current_hp: baseHp,
    attack: Math.floor(baseAttack * (mod.attackPercent ?? 1)),
    armor: baseArmor + (mod.armor ?? 0),
    magic_resist: baseMR + (mod.magicResist ?? 0),
    crit_chance: DEFAULT_CRIT_CHANCE + (mod.critChance ?? 0),
    crit_damage: mod.critDamage ?? DEFAULT_CRIT_DAMAGE
  }
}

/**
 * Phase D – áp dụng stat từ item vào unit sau khi đã tính mask + buff tộc/hệ.
 * items: mảng itemId hoặc object item có trường stats.
 */
export function applyItemStatsToUnit(unit, items = []) {
  if (!items || !items.length) return unit
  let hpFlat = 0
  let attackFlat = 0
  let attackPercent = 0
  let armorFlat = 0
  let mrFlat = 0
  let critChance = 0
  let critDamage = 0

  items.forEach((it) => {
    const def = typeof it === 'string' ? getItemById(it) : it
    const s = def?.stats
    if (!s) return
    hpFlat += s.hp_flat ?? 0
    attackFlat += s.attack_flat ?? 0
    attackPercent += s.attack_percent ?? 0
    armorFlat += s.armor_flat ?? 0
    mrFlat += s.magic_resist_flat ?? 0
    critChance += s.crit_chance ?? 0
    critDamage += s.crit_damage ?? 0
  })

  const out = { ...unit }
  if (hpFlat) out.current_hp = (out.current_hp ?? 0) + hpFlat
  const baseAttack = (out.attack ?? 0) + attackFlat
  out.attack = Math.floor(baseAttack * (1 + attackPercent))
  if (armorFlat) out.armor = (out.armor ?? 0) + armorFlat
  if (mrFlat) out.magic_resist = (out.magic_resist ?? 0) + mrFlat
  if (critChance) out.crit_chance = (out.crit_chance ?? DEFAULT_CRIT_CHANCE) + critChance
  if (critDamage) out.crit_damage = (out.crit_damage ?? DEFAULT_CRIT_DAMAGE) + critDamage
  return out
}
