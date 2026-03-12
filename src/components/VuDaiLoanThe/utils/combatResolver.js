/**
 * Vũ Đại Loạn Thế - Combat resolution (pure functions)
 * Input: two boards of champion instances with stats; optional seed for determinism.
 * Output: damage dealt, surviving units, winner.
 */

const MASK_MODIFIERS = {
  red: { attackPercent: 1.15, armor: 0 },
  black: { attackPercent: 1, armor: 15 },
  white: { attackPercent: 1.05, armor: 5 },
  blue: { attackPercent: 1.2, armor: 0 } // assassin-style
}

function physicalDamage(attack, armor, maskMod = 1) {
  const effectiveArmor = Math.max(0, armor)
  const multiplier = 100 / (100 + effectiveArmor)
  return Math.max(1, Math.floor(attack * multiplier * maskMod))
}

/**
 * Resolve one round of combat between two boards.
 * @param {Array} boardA - [{ champion_key, star, mask_color, current_hp, attack, armor, magic_resist }, ...]
 * @param {Array} boardB - same shape
 * @param {number} seed - optional for deterministic RNG
 * @returns { { boardA: updated units, boardB: updated units, winner: 'A'|'B'|null, log: string[] } }
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

    const modA = MASK_MODIFIERS[attackerA.mask_color] || MASK_MODIFIERS.red
    const modB = MASK_MODIFIERS[attackerB.mask_color] || MASK_MODIFIERS.red
    const dmgAtoB = physicalDamage(attackerA.attack, targetB.armor, modA.attackPercent)
    const dmgBtoA = physicalDamage(attackerB.attack, targetA.armor, modB.attackPercent)

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
 */
export function unitStatsFromChampion(champion, star = 1, maskColor = null) {
  const mult = 0.7 + star * 0.3
  const mask = maskColor || champion.default_mask_color
  const mod = MASK_MODIFIERS[mask] || MASK_MODIFIERS.red
  return {
    champion_key: champion.key,
    name: champion.name,
    star,
    mask_color: mask,
    current_hp: Math.floor(Number(champion.base_hp) * mult),
    attack: Math.floor(Number(champion.base_attack) * mult * mod.attackPercent),
    armor: Math.floor(Number(champion.base_armor) * mult) + (mod.armor || 0),
    magic_resist: Math.floor(Number(champion.base_magic_resist) * mult)
  }
}
