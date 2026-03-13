/**
 * Vũ Đại Loạn Thế - Combat resolution (pure functions)
 * Input: two boards of champion instances with stats; optional seed for determinism.
 * Output: damage dealt, surviving units, winner.
 * TFT-style: star scaling 1/1.8/3.2, physical/magic/true damage, crit, mask roles.
 */

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

  const clone = (board) => board.map((u) => ({ ...u, current_hp: u.current_hp }))
  let a = clone(boardA).filter((u) => u.current_hp > 0)
  let b = clone(boardB).filter((u) => u.current_hp > 0)
  const log = []

  while (a.length > 0 && b.length > 0) {
    const attackerA = a[Math.floor(next() * a.length)]
    const attackerB = b[Math.floor(next() * b.length)]
    const targetA = b[Math.floor(next() * b.length)]
    const targetB = a[Math.floor(next() * a.length)]

    const dmgAtoB = computeDamage(attackerA, targetB, next)
    const dmgBtoA = computeDamage(attackerB, targetA, next)

    targetB.current_hp = Math.max(0, targetB.current_hp - dmgAtoB)
    targetA.current_hp = Math.max(0, targetA.current_hp - dmgBtoA)
    log.push(`A deals ${dmgAtoB} to B, B deals ${dmgBtoA} to A`)

    a = a.filter((u) => u.current_hp > 0)
    b = b.filter((u) => u.current_hp > 0)
  }

  const winner = a.length > 0 ? 'A' : b.length > 0 ? 'B' : null
  return {
    boardA: a,
    boardB: b,
    winner,
    log
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
