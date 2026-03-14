import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getChampions } from '../../services/vuDaiLoanTheService'
import { createMatch, updateMatchPlayer, finishMatch } from '../../services/vuDaiLoanTheService'
import { CHAMPIONS_STATIC, getChampionsMap, getChampionsByCost } from '../../data/vuDaiLoanTheChampions'
import { SHOP_ODDS_BY_LEVEL } from './constants/shopOdds'
import { resolveCombat, unitStatsFromChampion, applyItemStatsToUnit } from './utils/combatResolver'
import { getTraitBuffsForBoard, applyTraitBuffsToUnit, TRIBE_BUFFS, CLASS_BUFFS } from './constants/traitBuffs'
import VuDaiLoanTheBoard from './VuDaiLoanTheBoard'
import VuDaiLoanTheBench from './VuDaiLoanTheBench'
import VuDaiLoanTheShop from './VuDaiLoanTheShop'
import TrongChauBar from './TrongChauBar'
import CombatOverlay from './CombatOverlay'
import TribeClassPanel from './TribeClassPanel'
import OpponentsPanel from './OpponentsPanel'
import ChampionDetailModal from './ChampionDetailModal'
import CarouselRound from './CarouselRound'
import NumberSelectRound from './NumberSelectRound'
import PvERound from './PvERound'
import AugmentSelectModal from './AugmentSelectModal'
import { rollAugmentOptions } from './constants/augments'
import { applyAugmentBuffsToUnits } from './utils/augmentEffects'
import { applyOpponentActions } from './utils/opponentSimulator'
import { getOpponentActionsFromClient, getOpponentAugmentChoice } from './utils/geminiOpponentClient'
import {
  getRandomItemComponent,
  getRandomItemComponentId,
  getItemById,
  getCompletedFromComponents,
  ITEM_COMPONENTS,
  COMPLETED_ITEMS
} from './constants/items'
import './VuDaiLoanThe.css'

const BOARD_SLOTS_MAX = 9
const BOARD_COLS = 4
const BOARD_ROWS = 4
const BENCH_SLOTS = 9
const OPPONENT_NAMES = ['Đối thủ 1', 'Đối thủ 2', 'Đối thủ 3', 'Đối thủ 4', 'Đối thủ 5', 'Đối thủ 6', 'Đối thủ 7']
const SHOP_SLOTS = 5
const INITIAL_HP = 100
const BASE_GOLD_PER_ROUND = 5
const TRONG_CHAU_PER_ROUND = 15
const MAX_ROUNDS = 30
const MAX_LEVEL = 10
const PLANNING_SECONDS = 30

/** EXP cần để lên level tiếp theo (TFT chuẩn). Level 9→10 cần 84. */
const XP_REQUIRED_BY_LEVEL = { 1: 2, 2: 2, 3: 6, 4: 10, 5: 20, 6: 36, 7: 56, 8: 80, 9: 84 }
const AUTO_XP_PER_ROUND = 2
const XP_GOLD_COST = 4
const XP_PER_PURCHASE = 4

/** Cộng EXP và tự động lên level khi đủ. EXP dư được giữ lại. */
function applyXpGain(player, xpGain) {
  if (!player || xpGain <= 0) return player
  let xp = (player.xp ?? 0) + xpGain
  let level = player.level ?? 1
  while (level < MAX_LEVEL) {
    const required = XP_REQUIRED_BY_LEVEL[level] ?? 84
    if (xp < required) break
    xp -= required
    level += 1
  }
  return { ...player, xp, level }
}

/** EXP cần từ level hiện tại lên level tiếp theo. */
function getXpRequiredForNextLevel(level) {
  const l = Math.min(level ?? 1, MAX_LEVEL - 1)
  return XP_REQUIRED_BY_LEVEL[l] ?? 84
}

/** Cập nhật gold/xp cho opponents khi bắt đầu vòng mới (trước khi vào buying). */
function updateOpponentsForNewRound(opponentsList) {
  return (opponentsList || []).map((o) => {
    if (o.hp <= 0) return o
    const interest = getInterest(o.gold ?? 0)
    const sb = Math.max(getStreakBonus(o.winStreak ?? 0), getStreakBonus(o.loseStreak ?? 0))
    const goldToAdd = BASE_GOLD_PER_ROUND + interest + sb
    const withGold = { ...o, gold: (o.gold ?? 0) + goldToAdd }
    return applyXpGain(withGold, AUTO_XP_PER_ROUND)
  })
}

/** Thưởng item cho opponents khi vào augment round (5, 13, 20). Round 5: 2-3 items, 13/20: 1 item. */
function giveOpponentsItemRewards(opponentsList, round, rng = Math.random) {
  if (!opponentsList?.length) return opponentsList
  const count = round === 5 ? 2 + Math.floor(rng() * 2) : 1
  return opponentsList.map((o) => {
    if (o.hp <= 0) return o
    const items = [...(o.items || [])]
    for (let i = 0; i < count; i++) {
      const compId = getRandomItemComponentId(rng)
      if (compId) items.push(compId)
    }
    return { ...o, items }
  })
}

function getItemComponentById(id) {
  return ITEM_COMPONENTS.find((i) => i.id === id || i.key === id) || null
}

function buildItemHoverInfo(itemId) {
  // Ưu tiên: nếu là mảnh (component) thì hiển thị mảnh + các công thức ghép
  const comp = getItemComponentById(itemId)
  if (comp) {
    const combos = COMPLETED_ITEMS
      .filter((it) => Array.isArray(it.from) && it.from.includes(comp.id))
      .map((it) => {
        const otherId = it.from.find((fid) => fid !== comp.id)
        const other = otherId ? getItemComponentById(otherId) : null
        return { completed: it, other }
      })
    return { component: comp, combos, isCompleted: false }
  }

  // Nếu là đồ hoàn chỉnh thì chỉ cần hiện chỉ số và (tuỳ chọn) thông tin mảnh ghép
  const completed =
    COMPLETED_ITEMS.find((it) => it.id === itemId) ||
    COMPLETED_ITEMS.find((it) => (Array.isArray(it.from) && it.from.includes(itemId)))
  if (!completed) return null
  return { component: completed, combos: null, isCompleted: true }
}

/** TFT-style: round number → { stage, roundInStage }. Stage 1 = rounds 1–4, Stage 2+ = 7 rounds each. */
function getStageRound(roundNumber) {
  if (roundNumber <= 0) return { stage: 1, roundInStage: 1 }
  if (roundNumber <= 4) return { stage: 1, roundInStage: roundNumber }
  const afterStage1 = roundNumber - 4
  const stage = 2 + Math.floor((afterStage1 - 1) / 7)
  const roundInStage = ((afterStage1 - 1) % 7) + 1
  return { stage, roundInStage }
}

/** Stage modifier for player damage (TFT-style). */
function getStageDamageModifier(stage) {
  if (stage <= 2) return 1
  if (stage <= 4) return 2
  return 3
}

/** Interest gold: 10→+1, 20→+2, ... 50+→+5 (cap 5). */
function getInterest(gold) {
  if (gold < 10) return 0
  return Math.min(5, Math.floor(gold / 10))
}

/** Streak bonus gold: 2→+1, 3→+2, 4+→+3. */
function getStreakBonus(streak) {
  if (streak < 2) return 0
  if (streak === 2) return 1
  if (streak === 3) return 2
  return 3
}

/** TFT round type for display / future Carousel-PvE-Neutral. */
function getRoundType(stage, roundInStage) {
  if (stage === 1) {
    if (roundInStage === 1) return 'number-select'
    return 'pve'
  }
  if (roundInStage === 4) return 'carousel'
  if (roundInStage === 7) return 'neutral'
  return 'pvp'
}

/** Generate 8 carousel options: random champion + random item component. */
function generateCarouselOptions(championsMap, rng = Math.random) {
  const list = Object.values(championsMap).filter((c) => c && c.key)
  if (!list.length) return []
  const out = []
  for (let i = 0; i < 8; i++) {
    const c = list[Math.floor(rng() * list.length)]
    out.push({
      champion_key: c.key,
      itemKey: getRandomItemComponent(rng)?.key ?? 'giap'
    })
  }
  return out
}

function randomFromArray(arr, rng = Math.random) {
  return arr[Math.floor(rng() * arr.length)]
}

function pickCostByLevel(level, rng = Math.random) {
  const odds = SHOP_ODDS_BY_LEVEL[Math.max(1, Math.min(MAX_LEVEL, level))] ?? SHOP_ODDS_BY_LEVEL[1]
  const cum = [odds[0], odds[0] + odds[1], odds[0] + odds[1] + odds[2], odds[0] + odds[1] + odds[2] + odds[3], 100]
  const r = rng() * 100
  if (r < cum[0]) return 1
  if (r < cum[1]) return 2
  if (r < cum[2]) return 3
  if (r < cum[3]) return 4
  return 5
}

function rollShop(championsMap, level = 1, rng = Math.random) {
  const list = Object.values(championsMap)
  const byCost = { 1: [], 2: [], 3: [], 4: [], 5: [] }
  list.forEach((c) => { if (c && c.cost >= 1 && c.cost <= 5) byCost[c.cost].push(c) })
  const slots = []
  for (let i = 0; i < SHOP_SLOTS; i++) {
    const cost = pickCostByLevel(level, rng)
    const pool = byCost[cost].length ? byCost[cost] : list
    const c = randomFromArray(pool, rng)
    slots.push(c ? { champion_key: c.key, star: 1, mask_color: c.default_mask_color } : null)
  }
  return slots
}

function createInitialPlayer(isBot = false, userId = null) {
  return {
    id: crypto.randomUUID?.() ?? `p-${Date.now()}-${Math.random()}`,
    user_id: userId,
    is_bot: isBot,
    hp: INITIAL_HP,
    gold: BASE_GOLD_PER_ROUND,
    level: 1,
    xp: 0,
    board_state: [],
    bench_state: [],
    winStreak: 0,
    loseStreak: 0,
    augments: [],
    items: []
  }
}

/** Ghép 3 tướng cùng champion_key và cùng sao trên bench thành 1 tướng lên sao. */
function combineBenchUnits(bench) {
  const valid = (bench || []).filter((u) => u && u.champion_key)
  if (valid.length < 3) return valid
  let out = [...valid]
  let changed = true
  while (changed) {
    changed = false
    const keyToIndices = {}
    out.forEach((u, i) => {
      if (!u || u.champion_key == null) return
      const k = `${u.champion_key}|${u.star ?? 1}`
      if (!keyToIndices[k]) keyToIndices[k] = []
      keyToIndices[k].push(i)
    })
    for (const indices of Object.values(keyToIndices)) {
      if (indices.length >= 3) {
        const [i0, i1, i2] = indices.slice(0, 3).sort((a, b) => b - a)
        const u = out[i0]
        const star = Math.min(3, (u.star ?? 1) + 1)
        const items = []
        ;[i0, i1, i2].forEach((idx) => {
          const src = out[idx]
          if (src?.items && Array.isArray(src.items)) items.push(...src.items)
        })
        const newUnit = {
          champion_key: u.champion_key,
          star,
          mask_color: u.mask_color ?? 'red',
          items: items.slice(0, 3)
        }
        out.splice(i0, 1)
        out.splice(i1, 1)
        out.splice(i2, 1)
        out.push(newUnit)
        changed = true
        break
      }
    }
  }
  return out
}

/** Tự động ghép 3 cùng loại cùng sao trên cả bench + board thành 1 lên sao (ưu tiên lấy từ bench). */
function combineBenchAndBoard(bench, board) {
  let b = (bench || []).filter((u) => u && u.champion_key)
  let brd = (board || []).filter((u) => u && u.champion_key)
  for (;;) {
    const keyCount = {}
    b.forEach((u) => {
      if (!u || u.champion_key == null) return
      const k = `${u.champion_key}|${u.star ?? 1}`
      keyCount[k] = (keyCount[k] || 0) + 1
    })
    brd.forEach((u) => {
      if (!u || u.champion_key == null) return
      const k = `${u.champion_key}|${u.star ?? 1}`
      keyCount[k] = (keyCount[k] || 0) + 1
    })
    const keyWith3 = Object.keys(keyCount).find((k) => keyCount[k] >= 3)
    if (!keyWith3) break
    const star = parseInt(keyWith3.split('|')[1], 10)
    const champion_key = keyWith3.split('|')[0]
    const benchIndices = b
      .map((u, i) => i)
      .filter((i) => b[i].champion_key === champion_key && (b[i].star ?? 1) === star)
      .slice(0, 3)
    const nFromBench = benchIndices.length
    const nFromBoard = 3 - nFromBench
    const boardIndices = brd
      .map((u, i) => ({ u, i }))
      .filter(({ u }) => u.champion_key === champion_key && (u.star ?? 1) === star)
      .map(({ i }) => i)
      .slice(0, nFromBoard)
    if (benchIndices.length + boardIndices.length < 3) break
    const benchSources = benchIndices.map((i) => b[i]).filter(Boolean)
    const boardSources = boardIndices.map((i) => brd[i]).filter(Boolean)
    const firstSource = benchSources[0] || boardSources[0]
    const mask = firstSource?.mask_color ?? 'red'
    const items = []
    benchSources.forEach((u) => {
      if (u?.items && Array.isArray(u.items)) items.push(...u.items)
    })
    boardSources.forEach((u) => {
      if (u?.items && Array.isArray(u.items)) items.push(...u.items)
    })
    b = b.filter((_, i) => !benchIndices.includes(i))
    brd = brd.filter((_, i) => !boardIndices.includes(i))
    b.push({
      champion_key,
      star: Math.min(3, star + 1),
      mask_color: mask,
      items: items.slice(0, 3)
    })
  }
  return { bench: b, board: brd }
}

/** Chạy combat giữa các đối thủ (trừ opponent đang đấu với player), áp dụng damage. TFT round-robin. */
function runOpponentVsOpponentCombats(opponentsList, excludeOpponentId, round, championsMap) {
  const others = (opponentsList || []).filter((o) => o.hp > 0 && o.id !== excludeOpponentId)
  if (others.length < 2) return opponentsList

  const { stage } = getStageRound(round)
  const stageMod = getStageDamageModifier(stage)
  const damageMap = {} // opponentId -> damage to apply

  const toPair = others.length % 2 === 1 ? others.slice(0, -1) : others
  for (let i = 0; i < toPair.length; i += 2) {
    const o1 = toPair[i]
    const o2 = toPair[i + 1]
    if (!o1 || !o2) continue
    let u1 = buildCombatUnits(o1.board_state ?? [], championsMap)
    let u2 = buildCombatUnits(o2.board_state ?? [], championsMap)
    if (o1.augments?.length) {
      u1 = applyAugmentBuffsToUnits(u1, o1.board_state ?? [], championsMap, o1.augments ?? [])
    }
    if (o2.augments?.length) {
      u2 = applyAugmentBuffsToUnits(u2, o2.board_state ?? [], championsMap, o2.augments ?? [])
    }
    const { winner, boardA, boardB } = resolveCombat(u1, u2, Date.now() + i * 1000)
    const costSumA = boardA.reduce((s, u) => s + (championsMap[u.champion_key]?.cost ?? 1), 0)
    const costSumB = boardB.reduce((s, u) => s + (championsMap[u.champion_key]?.cost ?? 1), 0)
    const dmg1 = winner === 'A' ? 0 : stageMod * costSumB
    const dmg2 = winner === 'A' ? stageMod * costSumA : 0
    damageMap[o1.id] = (damageMap[o1.id] ?? 0) + dmg1
    damageMap[o2.id] = (damageMap[o2.id] ?? 0) + dmg2
  }

  return opponentsList.map((o) => {
    if (!(o.id in damageMap)) return o
    const dmg = damageMap[o.id]
    const won = dmg === 0
    return {
      ...o,
      hp: Math.max(0, (o.hp ?? 0) - dmg),
      winStreak: won ? (o.winStreak ?? 0) + 1 : 0,
      loseStreak: dmg > 0 ? (o.loseStreak ?? 0) + 1 : 0
    }
  })
}

/** Đảo ngược sàn đối thủ để hiển thị đúng góc nhìn (đối diện nhau như TFT) */
function mirrorBoardForOpponentView(boardState, cols = BOARD_COLS, rows = BOARD_ROWS) {
  return (boardState || []).map((u) => ({
    ...u,
    col: (cols - 1) - (u.col ?? 0),
    row: (rows - 1) - (u.row ?? 0)
  }))
}

function buildCombatUnits(boardState, championsMap) {
  const buffs = getTraitBuffsForBoard(boardState, championsMap)
  return boardState
    .filter((u) => u && u.champion_key)
    .map((u) => {
      const c = championsMap[u.champion_key]
      if (!c) return null
      const baseUnit = unitStatsFromChampion(c, u.star ?? 1, u.mask_color)
      const withBuffs = applyTraitBuffsToUnit(baseUnit, buffs)
      const withItems = applyItemStatsToUnit(withBuffs, u.items || [])
      // Giữ lại vị trí trên board để combat có thể dùng cho cơ chế focus
      return {
        ...withItems,
        champion_key: u.champion_key,
        col: typeof u.col === 'number' ? u.col : 0,
        row: typeof u.row === 'number' ? u.row : 0
      }
    })
    .filter(Boolean)
}

/** Đội quái cho vòng 1.2, 1.3, 1.4 – mỗi vòng quái khác nhau, dễ thắng. */
function createPveMonsterBoard(championsMap, roundInStage) {
  const list = Object.values(championsMap || {}).filter((c) => c?.key)
  if (!list.length) return []

  const makeWeakUnit = (c, hp, attack) => {
    const unit = unitStatsFromChampion(c, 1, c.default_mask_color)
    return { ...unit, current_hp: hp, attack, champion_key: c.key }
  }

  const byTribe = {}
  list.forEach((c) => {
    const t = c.tribe_key || 'other'
    if (!byTribe[t]) byTribe[t] = []
    byTribe[t].push(c)
  })
  const tribes = Object.keys(byTribe)

  if (roundInStage === 2) {
    const pool = list.filter((c) => c.cost === 1)
    const c = pool.length ? pool[Math.floor(Math.random() * pool.length)] : list[0]
    return [
      { ...makeWeakUnit(c, 40, 10), col: 0, row: 3 }
    ]
  }
  if (roundInStage === 3) {
    const pick = (t) => {
      const arr = byTribe[t] || list
      return arr[Math.floor(Math.random() * arr.length)]
    }
    const c1 = pick(tribes[0])
    const c2 = tribes.length > 1 ? pick(tribes[1]) : pick(tribes[0])
    return [
      { ...makeWeakUnit(c1, 55, 12), col: 0, row: 3 },
      { ...makeWeakUnit(c2, 55, 12), col: 1, row: 3 }
    ]
  }
  if (roundInStage === 4) {
    const pick = (t) => {
      const arr = byTribe[t] || list
      return arr[Math.floor(Math.random() * arr.length)]
    }
    const c1 = pick(tribes[0])
    const c2 = tribes.length > 1 ? pick(tribes[1]) : pick(tribes[0])
    const c3 = tribes.length > 2 ? pick(tribes[2]) : pick(tribes[0])
    return [
      { ...makeWeakUnit(c1, 60, 14), col: 0, row: 3 },
      { ...makeWeakUnit(c2, 60, 14), col: 1, row: 3 },
      { ...makeWeakUnit(c3, 60, 14), col: 2, row: 3 }
    ]
  }
  return []
}

function botRandomBoard(championsMap, level = 1, roundNumber = 1, rng = Math.random) {
  const list = Object.values(championsMap)
  if (!list.length) return []

  // Số lượng tướng địch = level (số ô tối đa trên bàn), tăng dần theo vòng nhưng không vượt level
  const baseUnits = 2 + Math.min(level, 3)
  const bonusFromRound = Math.floor(Math.max(0, roundNumber - 1) / 3)
  const count = Math.min(baseUnits + bonusFromRound, level, 7)

  // Chia champion theo cost để pick giống shop (công bằng hơn)
  const byCost = { 1: [], 2: [], 3: [], 4: [], 5: [] }
  list.forEach((c) => {
    if (c && c.cost >= 1 && c.cost <= 5) byCost[c.cost].push(c)
  })

  const picks = []
  for (let i = 0; i < count; i++) {
    const cost = pickCostByLevel(level, rng)
    const pool = byCost[cost].length ? byCost[cost] : list
    const c = randomFromArray(pool, rng)
    if (c) picks.push({ champion_key: c.key, star: 1, mask_color: c.default_mask_color })
  }
  const buffs = getTraitBuffsForBoard(picks, championsMap)
  return picks
    .map((p, idx) => {
      const c = championsMap[p.champion_key]
      if (!c) return null
      const unit = unitStatsFromChampion(c, p.star, p.mask_color)
      const withBuffs = applyTraitBuffsToUnit(unit, buffs)
      // Gán tạm vị trí theo index để dùng cho cơ chế focus combat
      const col = idx % BOARD_COLS
      const row = Math.floor(idx / BOARD_COLS)
      return {
        ...withBuffs,
        champion_key: p.champion_key,
        col,
        row
      }
    })
    .filter(Boolean)
}

export default function VuDaiLoanThe() {
  const { user } = useAuth()
  const [championsMap, setChampionsMap] = useState(() => getChampionsMap())
  const [phase, setPhase] = useState('lobby')
  const [round, setRound] = useState(0)
  const [myPlayer, setMyPlayer] = useState(null)
  const [opponents, setOpponents] = useState([])
  const [shopSlots, setShopSlots] = useState([])
  const [trongChauEnergy, setTrongChauEnergy] = useState(0)
  const [daiVuDaiActive, setDaiVuDaiActive] = useState(false)
  const [combatResult, setCombatResult] = useState(null)
  const [finalPlacement, setFinalPlacement] = useState(null)
  const [selectedBenchIndex, setSelectedBenchIndex] = useState(null)
  const [matchId, setMatchId] = useState(null)
  const [lastOpponentBoard, setLastOpponentBoard] = useState([])
  const [selectedViewId, setSelectedViewId] = useState(null)
  const [championDetail, setChampionDetail] = useState(null)
  const [planningTimeLeft, setPlanningTimeLeft] = useState(0)
  const [carouselOptions, setCarouselOptions] = useState([])
  const [playerItems, setPlayerItems] = useState([])
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [combatUnitsA, setCombatUnitsA] = useState(null)
  const [combatUnitsB, setCombatUnitsB] = useState(null)
  const [combatEvents, setCombatEvents] = useState([])
  const [combatEventIndex, setCombatEventIndex] = useState(0)
  const [hoveredItemInfo, setHoveredItemInfo] = useState(null)
  const [inventoryCombinePreview, setInventoryCombinePreview] = useState(null)
  const [draggingItemId, setDraggingItemId] = useState(null)
  const [playerAugments, setPlayerAugments] = useState([])
  const [augmentOptions, setAugmentOptions] = useState([])
  const [hoveredAugment, setHoveredAugment] = useState(null)
  const [firstAugmentTier, setFirstAugmentTier] = useState(null)
  const [firstPveChampionGranted, setFirstPveChampionGranted] = useState(false)
  const [opponentsReady, setOpponentsReady] = useState(false)
  const [lastOpponentId, setLastOpponentId] = useState(null)
  const opponentAugmentChoicesRef = useRef({})

  // Bàn cờ địch (hiển thị lại lần combat gần nhất) – ánh xạ sang grid 2D (col,row)
  const opponentBoardState = (lastOpponentBoard || []).map((u, idx) => {
    const col = idx % BOARD_COLS
    const row = Math.floor(idx / BOARD_COLS)
    return {
      ...u,
      col,
      row
    }
  })

  useEffect(() => {
    getChampions().then(({ data }) => {
      if (data && data.length) {
        const map = {}
        data.forEach((c) => {
          const tribe = c.tribe
          const cls = c.class
          map[c.key] = {
            key: c.key,
            name: c.name,
            cost: c.cost,
            base_hp: c.base_hp,
            base_attack: c.base_attack,
            base_armor: c.base_armor,
            base_magic_resist: c.base_magic_resist,
            default_mask_color: c.default_mask_color ?? 'red',
            tribe_key: tribe?.key,
            tribe,
            class_key: cls?.key,
            class: cls
          }
        })
        setChampionsMap((prev) => (Object.keys(map).length ? map : prev))
      }
    })
  }, [])

  // Opponent augment selection khi vào augment-select (round 5, 13, 20)
  useEffect(() => {
    if (phase !== 'augment-select' || ![5, 13, 20].includes(round) || !opponents?.length || !championsMap) return
    opponentAugmentChoicesRef.current = {}
    const tierOpts = round === 5 && firstAugmentTier ? { tier: firstAugmentTier } : {}
    const alive = opponents.filter((o) => o.hp > 0)
    alive.forEach((opponent, idx) => {
      const globalIdx = opponents.indexOf(opponent)
      const opts = rollAugmentOptions(tierOpts)
      if (!opts.length) return
      getOpponentAugmentChoice(globalIdx + 1, opts, {
        bench: opponent.bench_state ?? [],
        board: opponent.board_state ?? [],
        augments: opponent.augments ?? []
      })
        .then((choice) => {
          const aug = opts[Math.max(0, Math.min(2, choice))]
          if (aug) opponentAugmentChoicesRef.current[globalIdx] = aug
        })
        .catch(() => {
          opponentAugmentChoicesRef.current[globalIdx] = opts[Math.floor(Math.random() * opts.length)]
        })
    })
  }, [phase, round, opponents, championsMap, firstAugmentTier])

  const startGame = useCallback(async () => {
    const players = [createInitialPlayer(false, user?.id ?? null)]
    for (let i = 0; i < 7; i++) players.push(createInitialPlayer(true))

    if (user?.id) {
      const { data, error } = await createMatch(user.id, { initialGold: BASE_GOLD_PER_ROUND })
      if (!error && data?.match) {
        setMatchId(data.match.id)
      }
    }

    setMyPlayer(players[0])
    setOpponents(players.slice(1))
    setRound(1)
    setTrongChauEnergy(0)
    setDaiVuDaiActive(false)
    setShopSlots(rollShop(getChampionsMap(), 1))
    setFinalPlacement(null)
    setPlayerItems([])
    setSelectedItemId(null)
    setPlayerAugments([])
    setAugmentOptions([])
    setFirstAugmentTier(null)
    setFirstPveChampionGranted(false)
    setSelectedViewId(null)
    setLastOpponentId(null)
    const { stage, roundInStage } = getStageRound(1)
    const round1Type = getRoundType(stage, roundInStage)
    if (round1Type === 'number-select') {
      setPhase('number-select')
    } else if (round1Type === 'carousel') {
      setPhase('carousel')
      setCarouselOptions(generateCarouselOptions(getChampionsMap()))
    } else {
      setPhase('buying')
      setPlanningTimeLeft(PLANNING_SECONDS)
    }
  }, [user?.id])

  const onNumberSelect = useCallback(
    (tier) => {
      setFirstAugmentTier(tier)
      setRound(2)
      setPhase('pve-placement')
    },
    []
  )

  // Cấp 1 tướng 1 vàng khi vào pve-placement vòng 2 (chỉ lần đầu)
  useEffect(() => {
    if (phase !== 'pve-placement' || round !== 2 || firstPveChampionGranted || !myPlayer || !championsMap) return
    const cost1 = getChampionsByCost(1).filter((c) => championsMap[c.key])
    if (!cost1.length) return
    const champion = cost1[Math.floor(Math.random() * cost1.length)]
    setMyPlayer((p) => {
      const bench = [...(p?.bench_state ?? [])]
      if (bench.length >= BENCH_SLOTS) return p
      bench.push({
        champion_key: champion.key,
        star: 1,
        mask_color: champion.default_mask_color ?? 'red',
        items: []
      })
      const board = p?.board_state ?? []
      const { bench: combinedBench, board: combinedBoard } = combineBenchAndBoard(bench, board)
      return { ...p, bench_state: combinedBench, board_state: combinedBoard }
    })
    setFirstPveChampionGranted(true)
  }, [phase, firstPveChampionGranted, myPlayer, championsMap])

  const endPvePlacementPhase = useCallback(() => {
    const { roundInStage } = getStageRound(round)
    let myUnits = buildCombatUnits(myPlayer?.board_state ?? [], championsMap)
    if (!myUnits.length) {
      const bench = myPlayer?.bench_state ?? []
      const first = bench.find((u) => u?.champion_key)
      if (first) {
        const c = championsMap[first.champion_key]
        if (c) {
          const unit = unitStatsFromChampion(c, first.star ?? 1, first.mask_color ?? 'red')
          myUnits = [{ ...unit, champion_key: first.champion_key, col: 0, row: 0 }]
        }
      }
    }
    myUnits = applyAugmentBuffsToUnits(myUnits, myPlayer?.board_state ?? [], championsMap, playerAugments)
    const oppUnits = createPveMonsterBoard(championsMap, roundInStage)
    setLastOpponentBoard(oppUnits)
    const { winner, boardA, boardB, events, initialA, initialB } = resolveCombat(myUnits, oppUnits)
    setCombatUnitsA(initialA)
    setCombatUnitsB(initialB)
    setCombatEvents(events || [])
    setCombatEventIndex(0)
    setCombatResult({ winner: 'player', damageTaken: 0, damageDealt: 0, opponentId: null, isGhost: false, isPveRound: true, pveRound: round })
    setPhase('combat-anim')
  }, [myPlayer, championsMap, playerAugments, round])

  const onCarouselSelect = useCallback(
    (index) => {
      const opt = carouselOptions[index]
      if (!opt?.champion_key || !championsMap[opt.champion_key]) return
      const champion = championsMap[opt.champion_key]
      const bench = [...(myPlayer?.bench_state ?? [])]
      if (bench.length >= BENCH_SLOTS) return
      bench.push({
        champion_key: champion.key,
        star: 1,
        mask_color: champion.default_mask_color ?? 'red',
        items: opt.itemKey ? [opt.itemKey] : []
      })
      const board = myPlayer?.board_state ?? []
      const { bench: combinedBench, board: combinedBoard } = combineBenchAndBoard(bench, board)
      setMyPlayer((p) => ({ ...p, bench_state: combinedBench, board_state: combinedBoard }))
      const nextRound = round + 1
      setRound(nextRound)
      const { stage: s, roundInStage: r } = getStageRound(nextRound)
      const nextType = getRoundType(s, r)
      if (nextType === 'carousel') {
        setCarouselOptions(generateCarouselOptions(championsMap))
        setPhase('carousel')
      } else if (nextType === 'pve' || nextType === 'neutral') {
        setPhase('pve')
      } else {
        setOpponents((list) => updateOpponentsForNewRound(list))
        setOpponentsReady(false)
        setPhase('buying')
        setPlanningTimeLeft(PLANNING_SECONDS)
        setShopSlots(rollShop(championsMap, myPlayer?.level ?? 1))
      }
    },
    [carouselOptions, championsMap, myPlayer, round]
  )

  const onPveComplete = useCallback(() => {
    const goldReward = 3 + Math.floor(Math.random() * 3)
    setMyPlayer((p) => ({ ...p, gold: (p.gold ?? 0) + goldReward }))
    setPlayerItems((items) => {
      const compId = getRandomItemComponentId()
      return compId ? [...items, compId] : items
    })
    const nextRound = round + 1
    setRound(nextRound)
    if (nextRound === 5 || nextRound === 13 || nextRound === 20) {
      setOpponents((list) => giveOpponentsItemRewards(list, nextRound))
      const tierOpts = nextRound === 5 && firstAugmentTier ? { tier: firstAugmentTier } : {}
      setAugmentOptions(rollAugmentOptions(tierOpts))
      setPhase('augment-select')
      return
    }
    const { stage: s, roundInStage: r } = getStageRound(nextRound)
    const nextType = getRoundType(s, r)
    if (nextType === 'carousel') {
      setCarouselOptions(generateCarouselOptions(championsMap))
      setPhase('carousel')
    } else if (nextType === 'pve' || nextType === 'neutral') {
      setPhase('pve')
    } else {
      setOpponents((list) => updateOpponentsForNewRound(list))
      setOpponentsReady(false)
      setPhase('buying')
      setPlanningTimeLeft(PLANNING_SECONDS)
      setShopSlots(rollShop(championsMap, myPlayer?.level ?? 1))
    }
  }, [round, championsMap, myPlayer?.level, firstAugmentTier])

  const onAugmentSelect = useCallback(
    (augment) => {
      setPlayerAugments((prev) => [...prev, augment])
      setAugmentOptions([])
      setMyPlayer((p) => {
        if (!p || !augment.grantChampions?.length) return p
        const bench = [...(p.bench_state ?? [])]
        const board = p.board_state ?? []
        for (const championKey of augment.grantChampions) {
          if (bench.length >= BENCH_SLOTS) break
          const champion = championsMap[championKey]
          if (!champion) continue
          bench.push({
            champion_key: champion.key,
            star: 1,
            mask_color: champion.default_mask_color ?? 'red',
            items: []
          })
        }
        const { bench: combinedBench, board: combinedBoard } = combineBenchAndBoard(bench, board)
        return { ...p, bench_state: combinedBench, board_state: combinedBoard }
      })
      const tierOpts = round === 5 && firstAugmentTier ? { tier: firstAugmentTier } : {}
      setOpponents((list) =>
        list.map((o, i) => {
          if (o.hp <= 0) return o
          let aug = opponentAugmentChoicesRef.current[i]
          if (!aug) {
            const opts = rollAugmentOptions(tierOpts)
            aug = opts[Math.floor(Math.random() * (opts.length || 1))] || null
          }
          if (!aug) return o
          let bench = [...(o.bench_state ?? [])]
          const board = o.board_state ?? []
          if (aug.grantChampions?.length) {
            for (const championKey of aug.grantChampions) {
              if (bench.length >= BENCH_SLOTS) break
              const champion = championsMap[championKey]
              if (!champion) continue
              bench.push({
                champion_key: champion.key,
                star: 1,
                mask_color: champion.default_mask_color ?? 'red',
                items: []
              })
            }
          }
          const { bench: combinedBench, board: combinedBoard } = combineBenchAndBoard(bench, board)
          return {
            ...o,
            augments: [...(o.augments ?? []), aug],
            bench_state: combinedBench,
            board_state: combinedBoard
          }
        })
      )
      opponentAugmentChoicesRef.current = {}
      const nextRound = round + 1
      setRound(nextRound)
      const { stage: s, roundInStage: r } = getStageRound(nextRound)
      const nextType = getRoundType(s, r)
      if (nextType === 'carousel') {
        setCarouselOptions(generateCarouselOptions(championsMap))
        setPhase('carousel')
      } else if (nextType === 'pve' || nextType === 'neutral') {
        setPhase('pve')
      } else {
        setOpponents((list) => updateOpponentsForNewRound(list))
        setOpponentsReady(false)
        setShopSlots(rollShop(championsMap, myPlayer?.level ?? 1))
        setPhase('buying')
        setPlanningTimeLeft(PLANNING_SECONDS)
      }
    },
    [round, championsMap, myPlayer?.level, firstAugmentTier]
  )

  const tryGiveItemToUnit = useCallback(
    (location, index, unit, itemIdOverride = null) => {
      const itemId = itemIdOverride ?? selectedItemId
      if (!itemId || !unit?.champion_key) return false
      const itemDef = getItemById(itemId)
      const isMagnet = itemDef?.id === 'tool_nam_cham_vu_dai'
      // #region agent log
      fetch('http://127.0.0.1:7715/ingest/8d859c82-057d-484c-a5dd-2ded90cf0758', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': 'dad688'
        },
        body: JSON.stringify({
          sessionId: 'dad688',
          runId: 'items-debug',
          hypothesisId: 'H-all',
          location: 'VuDaiLoanThe/index.jsx:tryGiveItemToUnit:entry',
          message: 'tryGiveItemToUnit called',
          data: { location, index, itemId, isMagnet, hasUnit: !!unit, unitItems: unit.items || [] },
          timestamp: Date.now()
        })
      }).catch(() => {})
      // #endregion
      const p = myPlayer
      if (!p) return false
      const board = [...(p.board_state || [])]
      const bench = [...(p.bench_state || [])]

      const combineItems = (items) => {
        let current = [...items]
        let changed = true
        while (changed) {
          changed = false
          if (current.length < 2) break
          let foundIndexA = -1
          let foundIndexB = -1
          let completed = null
          for (let i = 0; i < current.length && !completed; i++) {
            for (let j = i + 1; j < current.length && !completed; j++) {
              const compA = current[i]
              const compB = current[j]
              const res = getCompletedFromComponents(compA, compB)
              if (res) {
                completed = res
                foundIndexA = i
                foundIndexB = j
              }
            }
          }
          if (completed && foundIndexA !== -1 && foundIndexB !== -1) {
            const next = current.filter((_, idx) => idx !== foundIndexA && idx !== foundIndexB)
            next.push(completed.id)
            current = next
            changed = true
          }
        }
        return current.slice(0, 3)
      }
      let removedFromUnit = []
      let applied = false
      if (location === 'board') {
        const pos = index || {}
        const i = board.findIndex((u) => u.col === pos.col && u.row === pos.row)
        if (i === -1) return false
        const u = board[i]
        let items = (u.items || []).slice(0, 3)
        if (isMagnet) {
          if (!items.length) return false
          applied = true
          removedFromUnit = items
          board[i] = { ...u, items: [] }
        } else {
          if (items.length >= 3) return false
          applied = true
          items = [...items, itemId]
          items = combineItems(items)
          board[i] = { ...u, items }
        }
      } else if (location === 'bench') {
        const i = index
        if (i < 0 || i >= bench.length) return false
        const u = bench[i]
        let items = (u.items || []).slice(0, 3)
        if (isMagnet) {
          if (!items.length) return false
          applied = true
          removedFromUnit = items
          bench[i] = { ...u, items: [] }
        } else {
          if (items.length >= 3) return false
          applied = true
          items = [...items, itemId]
          items = combineItems(items)
          bench[i] = { ...u, items }
        }
      }
      if (!applied) return false
      setMyPlayer({ ...p, board_state: board, bench_state: bench })
      setPlayerItems((items) => {
        const next = [...items]
        if (!isMagnet) {
          const idx = next.indexOf(itemId)
          if (idx !== -1) next.splice(idx, 1)
        }
        if (removedFromUnit.length) {
          next.push(...removedFromUnit)
        }
        // #region agent log
        fetch('http://127.0.0.1:7715/ingest/8d859c82-057d-484c-a5dd-2ded90cf0758', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': 'dad688'
          },
          body: JSON.stringify({
            sessionId: 'dad688',
            runId: 'items-debug',
            hypothesisId: 'H-all',
            location: 'VuDaiLoanThe/index.jsx:tryGiveItemToUnit:setPlayerItems',
            message: 'Updated playerItems in tryGiveItemToUnit',
            data: { itemId, isMagnet, applied, removedFromUnit, beforeLength: items.length, afterLength: next.length },
            timestamp: Date.now()
          })
        }).catch(() => {})
        // #endregion
        return next
      })
      if (!itemIdOverride) {
        setSelectedItemId(null)
      }
      return true
    },
    [selectedItemId, myPlayer]
  )

  const rollShopHandler = useCallback(() => {
    const level = myPlayer?.level ?? 1
    setMyPlayer((p) => {
      if (!p || p.gold < 1) return p
      return { ...p, gold: p.gold - 1 }
    })
    setShopSlots(rollShop(championsMap, level))
  }, [championsMap, myPlayer?.level])

  const buyFromShop = useCallback(
    (shopIndex, slot) => {
      const champion = slot?.champion_key ? championsMap[slot.champion_key] : null
      if (!champion || myPlayer.gold < champion.cost) return
      const bench = [...(myPlayer.bench_state || [])]
      if (bench.length >= BENCH_SLOTS) return
      bench.push({ champion_key: champion.key, star: 1, mask_color: champion.default_mask_color, items: [] })
      const board = myPlayer.board_state || []
      const { bench: combinedBench, board: combinedBoard } = combineBenchAndBoard(bench, board)
      setMyPlayer((p) => ({ ...p, gold: p.gold - champion.cost, bench_state: combinedBench, board_state: combinedBoard }))
      setShopSlots((s) => s.map((sl, i) => (i === shopIndex ? null : sl)))
    },
    [championsMap, myPlayer]
  )

  const placeOnBoard = useCallback(
    (col, row, existingUnit) => {
      const level = myPlayer?.level ?? 1
      if (selectedBenchIndex !== null) {
        const bench = [...(myPlayer.bench_state || [])]
        const unit = bench[selectedBenchIndex]
        if (!unit) return
        const board = [...(myPlayer.board_state || [])]
        const existingAtSlot = board.find((u) => u.col === col && u.row === row)
        const currentOnBoard = board.length
        // Nếu ô trống và đã đủ số tướng theo level thì không cho đặt thêm
        if (!existingAtSlot && currentOnBoard >= level) return
        // Di chuyển từ bench lên board (có thể overwrite ô đang có)
        const newBoard = board.filter((u) => !(u.col === col && u.row === row))
        newBoard.push({ ...unit, col, row })
        const newBench = bench.filter((_, i) => i !== selectedBenchIndex)
        const { bench: combinedBench, board: combinedBoard } = combineBenchAndBoard(newBench, newBoard)
        setMyPlayer((p) => ({ ...p, board_state: combinedBoard, bench_state: combinedBench }))
        setSelectedBenchIndex(null)
        return
      }
      // Nếu không chọn bench mà click vào ô đang có tướng → nhặt xuống bench
      if (existingUnit) {
        const board = (myPlayer.board_state || []).filter((u) => !(u.col === col && u.row === row))
        const bench = [...(myPlayer.bench_state || [])]
        if (bench.length >= BENCH_SLOTS) return
        const { col: _col, row: _row, ...rest } = existingUnit
        bench.push(rest)
        const { bench: combinedBench, board: combinedBoard } = combineBenchAndBoard(bench, board)
        setMyPlayer((p) => ({ ...p, board_state: combinedBoard, bench_state: combinedBench }))
      }
    },
    [myPlayer, selectedBenchIndex]
  )

  const selectBench = useCallback((index) => {
    setSelectedBenchIndex((prev) => (prev === index ? null : index))
  }, [])

  const openChampionDetail = useCallback((payload) => {
    if (!payload?.champion) return
    setChampionDetail(payload)
  }, [])
  const closeChampionDetail = useCallback(() => setChampionDetail(null), [])

  const buyXp = useCallback(() => {
    setMyPlayer((p) => {
      if (!p || p.gold < XP_GOLD_COST || p.level >= MAX_LEVEL) return p
      const next = { ...p, gold: p.gold - XP_GOLD_COST }
      return applyXpGain(next, XP_PER_PURCHASE)
    })
  }, [])

  const sellChampionFromBoard = useCallback(
    (col, row, unit) => {
      const champion = unit?.champion_key ? championsMap[unit.champion_key] : null
      const refund = champion?.cost ?? 0
      setMyPlayer((p) => ({
        ...p,
        gold: p.gold + refund,
        board_state: (p.board_state || []).filter((u) => !(u.col === col && u.row === row))
      }))
    },
    [championsMap]
  )

  const sellChampionFromBench = useCallback(
    (benchIndex, unit) => {
      const champion = unit?.champion_key ? championsMap[unit.champion_key] : null
      const refund = champion?.cost ?? 0
      setMyPlayer((p) => {
        const bench = [...(p.bench_state || [])]
        bench.splice(benchIndex, 1)
        return { ...p, gold: p.gold + refund, bench_state: bench }
      })
    },
    [championsMap]
  )

  const onDropToBoard = useCallback(
    (col, row, data) => {
      if (!data) return
      if (data.source === 'item') {
        const unitAtSlot = (myPlayer?.board_state || []).find((u) => u.col === col && u.row === row)
        // #region agent log
        fetch('http://127.0.0.1:7715/ingest/8d859c82-057d-484c-a5dd-2ded90cf0758', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': 'dad688'
          },
          body: JSON.stringify({
            sessionId: 'dad688',
            runId: 'items-debug',
            hypothesisId: 'H-all',
            location: 'VuDaiLoanThe/index.jsx:onDropToBoard',
            message: 'Drop item on board',
            data: { col, row, itemId: data.itemId, hasUnit: !!unitAtSlot },
            timestamp: Date.now()
          })
        }).catch(() => {})
        // #endregion
        tryGiveItemToUnit('board', { col, row }, unitAtSlot, data.itemId)
        // Sau khi kéo–thả item thành công lên tướng, bỏ chọn item
        setSelectedItemId(null)
        setSelectedBenchIndex(null)
        return
      }
      const { source, sourceIndex, unit, sourceCol, sourceRow } = data
      if (!unit) return
      setMyPlayer((p) => {
        const board = [...(p.board_state || [])]
        const bench = [...(p.bench_state || [])]
        if (source === 'bench') {
          const u = bench[sourceIndex]
          if (!u) return p
          const existingAtSlot = board.find((x) => x.col === col && x.row === row)
          const currentOnBoard = board.length
          const level = p.level ?? 1
          if (!existingAtSlot && currentOnBoard >= level) return p
          const newBoard = board.filter((x) => !(x.col === col && x.row === row))
          newBoard.push({ ...u, col, row })
          let newBench = bench.filter((_, i) => i !== sourceIndex)
          if (existingAtSlot) {
            const { col: _c, row: _r, ...rest } = existingAtSlot
            newBench.splice(sourceIndex, 0, rest)
          }
          const { bench: combinedBench, board: combinedBoard } = combineBenchAndBoard(newBench, newBoard)
          return { ...p, board_state: combinedBoard, bench_state: combinedBench }
        }
        if (source === 'board') {
          if (sourceCol === col && sourceRow === row) return p
          const atTarget = board.find((x) => x.col === col && x.row === row)
          const newBoard = board.filter(
            (x) => !(x.col === sourceCol && x.row === sourceRow) && !(x.col === col && x.row === row)
          )
          newBoard.push({ ...unit, col, row })
          if (atTarget) newBoard.push({ ...atTarget, col: sourceCol, row: sourceRow })
          return { ...p, board_state: newBoard }
        }
        return p
      })
      setSelectedBenchIndex(null)
    },
    [myPlayer, tryGiveItemToUnit]
  )

  const onDropToBench = useCallback(
    (benchIndex, data) => {
      if (!data) return
      if (data.source === 'item') {
        const unitAtBench = (myPlayer?.bench_state || [])[benchIndex]
        // #region agent log
        fetch('http://127.0.0.1:7715/ingest/8d859c82-057d-484c-a5dd-2ded90cf0758', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': 'dad688'
          },
          body: JSON.stringify({
            sessionId: 'dad688',
            runId: 'items-debug',
            hypothesisId: 'H-all',
            location: 'VuDaiLoanThe/index.jsx:onDropToBench',
            message: 'Drop item on bench',
            data: { benchIndex, itemId: data.itemId, hasUnit: !!unitAtBench },
            timestamp: Date.now()
          })
        }).catch(() => {})
        // #endregion
        tryGiveItemToUnit('bench', benchIndex, unitAtBench, data.itemId)
        // Sau khi kéo–thả item thành công lên tướng, bỏ chọn item
        setSelectedItemId(null)
        setSelectedBenchIndex(null)
        return
      }
      const { source, sourceIndex, unit } = data
      if (!unit) return
      setMyPlayer((p) => {
        const board = [...(p.board_state || [])]
        const bench = [...(p.bench_state || [])]
        if (source === 'board') {
          const { col, row, ...rest } = unit
          const newBoard = board.filter((x) => !(x.col === col && x.row === row))
          let newBench
          if (bench.length >= BENCH_SLOTS) {
            newBench = bench.map((b, i) => (i === benchIndex ? rest : b))
          } else {
            newBench = bench.slice(0, benchIndex).concat([rest]).concat(bench.slice(benchIndex))
          }
          const { bench: combinedBench, board: combinedBoard } = combineBenchAndBoard(newBench, newBoard)
          return { ...p, board_state: combinedBoard, bench_state: combinedBench }
        }
        if (source === 'bench' && sourceIndex !== benchIndex) {
          const newBench = [...bench]
          ;[newBench[sourceIndex], newBench[benchIndex]] = [newBench[benchIndex], newBench[sourceIndex]]
          return { ...p, bench_state: newBench }
        }
        return p
      })
      setSelectedBenchIndex(null)
    },
    [myPlayer, tryGiveItemToUnit]
  )

  const endBuyingPhase = useCallback(() => {
    const alive = opponents.filter((o) => o.hp > 0)
    if (alive.length === 0) {
      setFinalPlacement(1)
      setPhase('result')
      return
    }
    const pool =
      alive.length >= 2 && lastOpponentId != null
        ? alive.filter((o) => o.id !== lastOpponentId)
        : alive
    const pickPool = pool.length > 0 ? pool : alive
    const opponent = pickPool[Math.floor(Math.random() * pickPool.length)]
    setLastOpponentId(opponent.id)

    const updatedOpponents = runOpponentVsOpponentCombats(opponents, opponent.id, round, championsMap)
    setOpponents(updatedOpponents)

    const totalAlive = 1 + alive.length
    const useGhost = totalAlive % 2 === 1
    const isGhost = useGhost && Math.random() < 1 / totalAlive
    let myUnits = buildCombatUnits(myPlayer.board_state, championsMap)
    myUnits = applyAugmentBuffsToUnits(
      myUnits,
      myPlayer.board_state,
      championsMap,
      playerAugments
    )
    const oppBoardState = opponent.board_state ?? []
    let oppUnits =
      oppBoardState.length > 0
        ? buildCombatUnits(oppBoardState, championsMap)
        : botRandomBoard(championsMap, myPlayer.level ?? 1, round)
    if (oppUnits.length > 0 && opponent.augments?.length) {
      oppUnits = applyAugmentBuffsToUnits(
        oppUnits,
        oppBoardState,
        championsMap,
        opponent.augments ?? []
      )
    }
    setLastOpponentBoard(oppUnits)
    const { winner, boardA, boardB, events, initialA, initialB } = resolveCombat(myUnits, oppUnits)
    // Lưu trạng thái combat ban đầu để animate từ full máu
    setCombatUnitsA(initialA)
    setCombatUnitsB(initialB)
    setCombatEvents(events || [])
    setCombatEventIndex(0)
    // Tính toán damage sẽ áp dụng sau khi animate xong
    const { stage } = getStageRound(round)
    const stageMod = getStageDamageModifier(stage)
    const costSumA = boardA.reduce((s, u) => s + (championsMap[u.champion_key]?.cost ?? 1), 0)
    const costSumB = boardB.reduce((s, u) => s + (championsMap[u.champion_key]?.cost ?? 1), 0)
    const damageTaken = boardA.length === 0 ? stageMod * costSumB : 0
    const damageDealt = isGhost ? 0 : (boardB.length === 0 ? stageMod * costSumA : 0)
    const won = winner === 'A'
    // Tạm lưu kết quả để áp dụng sau khi animate
    setCombatResult({
      winner: won ? 'player' : 'opponent',
      damageTaken,
      damageDealt,
      opponentId: opponent.id,
      isGhost
    })
    setSelectedViewId(opponents.findIndex((o) => o.id === opponent.id))
    setPhase('combat-anim')
  }, [myPlayer, opponents, championsMap, round, playerAugments, lastOpponentId])

  useEffect(() => {
    if (phase !== 'buying' || planningTimeLeft <= 0) return
    const id = setInterval(() => {
      setPlanningTimeLeft((prev) => {
        if (prev <= 1) {
          endBuyingPhase()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase, planningTimeLeft, endBuyingPhase])

  // Animate combat events: mỗi vài trăm ms apply 1 hit
  useEffect(() => {
    if (phase !== 'combat-anim') return
    if (!combatUnitsA || !combatUnitsB) return
    if (!combatEvents || combatEvents.length === 0) {
      // Không có event → áp dụng kết quả ngay
      if (combatResult) {
        const { damageTaken, damageDealt, opponentId, isGhost } = combatResult
        setMyPlayer((p) => ({
          ...p,
          hp: Math.max(0, (p?.hp ?? 0) - (damageTaken ?? 0)),
          winStreak: combatResult.winner === 'player' ? (p?.winStreak ?? 0) + 1 : 0,
          loseStreak: combatResult.winner === 'player' ? 0 : (p?.loseStreak ?? 0) + 1
        }))
        if (opponentId && !isGhost) {
          setOpponents((list) =>
            list.map((o) =>
              o.id === opponentId
                ? {
                    ...o,
                    hp: Math.max(0, o.hp - (damageDealt ?? 0)),
                    winStreak: combatResult.winner === 'opponent' ? (o.winStreak ?? 0) + 1 : 0,
                    loseStreak: combatResult.winner === 'opponent' ? 0 : (o.loseStreak ?? 0) + 1
                  }
                : o
            )
          )
        }
        setPhase('combat')
      }
      return
    }
    if (combatEventIndex >= combatEvents.length) {
      // Kết thúc animation, áp dụng damage & show overlay
      if (combatResult) {
        const { damageTaken, damageDealt, opponentId, isGhost } = combatResult
        setMyPlayer((p) => ({
          ...p,
          hp: Math.max(0, (p?.hp ?? 0) - (damageTaken ?? 0)),
          winStreak: combatResult.winner === 'player' ? (p?.winStreak ?? 0) + 1 : 0,
          loseStreak: combatResult.winner === 'player' ? 0 : (p?.loseStreak ?? 0) + 1
        }))
        if (opponentId && !isGhost) {
          setOpponents((list) =>
            list.map((o) =>
              o.id === opponentId
                ? {
                    ...o,
                    hp: Math.max(0, o.hp - (damageDealt ?? 0)),
                    winStreak: combatResult.winner === 'opponent' ? (o.winStreak ?? 0) + 1 : 0,
                    loseStreak: combatResult.winner === 'opponent' ? 0 : (o.loseStreak ?? 0) + 1
                  }
                : o
            )
          )
        }
      }
      setPhase('combat')
      return
    }
    const timeout = setTimeout(() => {
      const evt = combatEvents[combatEventIndex]
      if (!evt) {
        setCombatEventIndex((i) => i + 1)
        return
      }
      const { side, attackerIndex, targetIndex, damage, nextHp } = evt
      if (side === 'A') {
        setCombatUnitsA((prev) =>
          (prev || []).map((u, idx) => ({
            ...u,
            _isAttacker: idx === attackerIndex,
            _isTarget: false
          }))
        )
        setCombatUnitsB((prev) =>
          (prev || []).map((u, idx) => ({
            ...u,
            current_hp: idx === targetIndex ? nextHp : u.current_hp,
            _isAttacker: false,
            _isTarget: idx === targetIndex
          }))
        )
      } else {
        setCombatUnitsB((prev) =>
          (prev || []).map((u, idx) => ({
            ...u,
            _isAttacker: idx === attackerIndex,
            _isTarget: false
          }))
        )
        setCombatUnitsA((prev) =>
          (prev || []).map((u, idx) => ({
            ...u,
            current_hp: idx === targetIndex ? nextHp : u.current_hp,
            _isAttacker: false,
            _isTarget: idx === targetIndex
          }))
        )
      }
      setCombatEventIndex((i) => i + 1)
    }, 400)
    return () => clearTimeout(timeout)
  }, [phase, combatUnitsA, combatUnitsB, combatEvents, combatEventIndex, combatResult])

  // Chạy AI cho 7 opponents khi vào buying phase (PvP)
  useEffect(() => {
    if (phase !== 'buying' || opponentsReady || !opponents?.length || !championsMap) return
    const { stage, roundInStage } = getStageRound(round)
    if (getRoundType(stage, roundInStage) !== 'pvp') {
      setOpponentsReady(true)
      return
    }

    const championsList = Object.values(championsMap).filter((c) => c?.key)
    const traitBuffs = { TRIBE_BUFFS, CLASS_BUFFS }

    const runOpponent = async (opponent, idx) => {
      if (opponent.hp <= 0) return opponent
      const shop = rollShop(championsMap, opponent.level ?? 1)
      const shopWithCost = shop.map((s) =>
        s ? { ...s, cost: championsMap[s.champion_key]?.cost ?? 1 } : null
      )
      const payload = {
        round,
        gold: opponent.gold ?? 0,
        level: opponent.level ?? 1,
        xp: opponent.xp ?? 0,
        bench: opponent.bench_state ?? [],
        board: opponent.board_state ?? [],
        shop: shopWithCost,
        items: opponent.items ?? [],
        augments: opponent.augments ?? [],
        winStreak: opponent.winStreak ?? 0,
        loseStreak: opponent.loseStreak ?? 0,
        champions: championsList,
        traitBuffs
      }

      try {
        const actions = await getOpponentActionsFromClient(idx + 1, payload)
        return applyOpponentActions(opponent, actions, shopWithCost, championsMap)
      } catch (err) {
        console.error(`[Opponent ${idx + 1}] AI failed, using fallback:`, {
          message: err?.message,
          name: err?.name,
          stack: err?.stack,
          opponentId: idx + 1,
          round,
          opponentLevel: opponent.level
        })
        const fallbackBoard = botRandomBoard(championsMap, opponent.level ?? 1, round)
        const maxSlots = opponent.level ?? 1
        const boardState = fallbackBoard
          .slice(0, maxSlots)
          .map((u, i) => ({
            champion_key: u.champion_key,
            star: u.star ?? 1,
            mask_color: u.mask_color ?? 'red',
            col: i % BOARD_COLS,
            row: Math.floor(i / BOARD_COLS)
          }))
        return { ...opponent, board_state: boardState }
      }
    }

    Promise.all(opponents.map((o, i) => runOpponent(o, i)))
      .then((results) => {
        setOpponents(results)
        setOpponentsReady(true)
      })
      .catch(() => setOpponentsReady(true))
  }, [phase, opponentsReady, opponents, championsMap, round])

  const closeCombatOverlay = useCallback(() => {
    const won = combatResult?.winner === 'player'
    const isPveRound = combatResult?.isPveRound === true
    const pveRound = combatResult?.pveRound ?? 0
    setCombatResult(null)

    if (isPveRound) {
      const goldReward = 3 + Math.floor(Math.random() * 3)
      setMyPlayer((p) => ({ ...p, gold: (p.gold ?? 0) + goldReward }))
      setPlayerItems((items) => {
        const compId = getRandomItemComponentId()
        return compId ? [...items, compId] : items
      })
      const nextRound = pveRound + 1
      setRound(nextRound)
      if (nextRound === 5) {
        const tierOpts = firstAugmentTier ? { tier: firstAugmentTier } : {}
        setAugmentOptions(rollAugmentOptions(tierOpts))
        setPhase('augment-select')
      } else {
        setPhase('pve-placement')
      }
      return
    }

    let newEnergy = trongChauEnergy + TRONG_CHAU_PER_ROUND
    let daiVuDai = false
    if (newEnergy >= 100) {
      newEnergy = 0
      daiVuDai = true
    }
    setTrongChauEnergy(newEnergy)
    setDaiVuDaiActive(daiVuDai)

    const aliveCount = opponents.filter((o) => o.hp > 0).length
    const myDead = myPlayer.hp <= 0
    if (myDead || (aliveCount === 0 && myPlayer.hp > 0)) {
      const placement = myDead ? 8 - opponents.filter((o) => o.hp <= 0).length : 1
      setFinalPlacement(placement)
      setPhase('result')
      if (matchId && user?.id) {
        finishMatch(matchId, myDead ? null : user.id, [{ playerId: myPlayer.id, placement }]).catch(() => {})
      }
      return
    }
    if (round >= MAX_ROUNDS) {
      const placement = 1 + opponents.filter((o) => o.hp > 0).length
      setFinalPlacement(Math.min(8, placement))
      setPhase('result')
      return
    }

    const nextRound = round + 1
    setRound(nextRound)
    const p = myPlayer
    const interest = getInterest(p.gold)
    const streakBonus = Math.max(
      getStreakBonus(p.winStreak ?? 0),
      getStreakBonus(p.loseStreak ?? 0)
    )
    let goldToAdd = BASE_GOLD_PER_ROUND + interest + streakBonus
    for (const aug of playerAugments) {
      const eff = aug.effect
      if (!eff) continue
      if (eff.type === 'gold_on_win' && won && eff.goldBonus) goldToAdd += eff.goldBonus
      if (eff.type === 'win_streak_gold' && won && (p.winStreak ?? 0) >= (eff.roundsPerTrigger ?? 3)) {
        if ((p.winStreak ?? 0) % (eff.roundsPerTrigger ?? 3) === 0) goldToAdd += eff.goldBonus ?? 0
      }
    }
    const withGold = { ...p, gold: p.gold + goldToAdd }
    const updatedPlayer = applyXpGain(withGold, AUTO_XP_PER_ROUND)
    setMyPlayer(updatedPlayer)
    if (nextRound === 5 || nextRound === 13 || nextRound === 20) {
      setOpponents((list) => giveOpponentsItemRewards(list, nextRound))
      const tierOpts = nextRound === 5 && firstAugmentTier ? { tier: firstAugmentTier } : {}
      setAugmentOptions(rollAugmentOptions(tierOpts))
      setPhase('augment-select')
      return
    }
    const { stage: s, roundInStage: r } = getStageRound(nextRound)
    if (getRoundType(s, r) === 'carousel') {
      setCarouselOptions(generateCarouselOptions(championsMap))
      setPhase('carousel')
    } else {
      setOpponents((list) => updateOpponentsForNewRound(list))
      setOpponentsReady(false)
      setSelectedViewId(null)
      setShopSlots(rollShop(championsMap, updatedPlayer.level ?? 1))
      setPhase('buying')
      setPlanningTimeLeft(PLANNING_SECONDS)
    }
  }, [trongChauEnergy, opponents, myPlayer, round, matchId, user?.id, championsMap, playerAugments, combatResult, firstAugmentTier])

  if (phase === 'lobby') {
    return (
      <div className="vdlt-root">
        <div className="vdlt-container">
          <div className="vdlt-lobby">
            <h2>Vũ Đại Loạn Thế</h2>
            <p>Auto Battler 8 người – Sân khấu tuồng. Ghép tướng, kích hoạt tộc & hệ, chiến thắng!</p>
            <button type="button" className="vdlt-btn-start" onClick={startGame}>
              <span className="material-symbols-outlined">play_arrow</span>
              Bắt đầu
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'result') {
    return (
      <div className="vdlt-root">
        <div className="vdlt-container">
          <div className="vdlt-result">
            <h2>Kết thúc trận</h2>
            <p>Hạng của bạn</p>
            <div className={`vdlt-result-placement place-${Math.min(3, finalPlacement)}`}>{finalPlacement}</div>
            <button type="button" className="vdlt-btn-again" onClick={startGame}>
              Chơi lại
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'augment-select') {
    return (
      <div className="vdlt-root">
        <AugmentSelectModal
          options={augmentOptions}
          onSelect={onAugmentSelect}
          championsMap={championsMap}
        />
      </div>
    )
  }

  if (phase === 'number-select') {
    return (
      <div className="vdlt-root">
        <div className="vdlt-layout">
          <div className="vdlt-main">
            <header className="vdlt-header">
              <div className="vdlt-title">Vũ Đại Loạn Thế</div>
              <div className="vdlt-round-info">
                <span className="vdlt-gold">{myPlayer?.gold ?? 0}</span>
                <span className="vdlt-hp">HP: {myPlayer?.hp ?? 0}</span>
                <span className="vdlt-stage-round">
                  Vòng 1 (1-1) – Chọn số
                </span>
              </div>
            </header>
            <NumberSelectRound onSelect={onNumberSelect} />
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'carousel') {
    return (
      <div className="vdlt-root">
        <div className="vdlt-layout">
          <div className="vdlt-main">
            <header className="vdlt-header">
              <div className="vdlt-title">Vũ Đại Loạn Thế</div>
              <div className="vdlt-round-info">
                <span className="vdlt-gold">{myPlayer?.gold ?? 0}</span>
                <span className="vdlt-hp">HP: {myPlayer?.hp ?? 0}</span>
                <span className="vdlt-stage-round">
                  Vòng {round} ({getStageRound(round).stage}-{getStageRound(round).roundInStage}) CAROUSEL
                </span>
                {playerAugments.length > 0 && (
                  <span className="vdlt-augments-inline">
                    Lõi: {playerAugments.map((a) => a.name).join(', ')}
                  </span>
                )}
              </div>
            </header>
            <CarouselRound
              options={carouselOptions}
              championsMap={championsMap}
              onSelect={onCarouselSelect}
            />
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'pve') {
    const { stage: s, roundInStage: r } = getStageRound(round)
    const pveType = getRoundType(s, r)
    return (
      <div className="vdlt-root">
        <div className="vdlt-layout">
          <div className="vdlt-main">
            <header className="vdlt-header">
              <div className="vdlt-round-info">
                <span className="vdlt-gold">{myPlayer?.gold ?? 0}</span>
                <span className="vdlt-hp">HP: {myPlayer?.hp ?? 0}</span>
                <span className="vdlt-stage-round">Vòng {round} ({s}-{r})</span>
                {playerAugments.length > 0 && (
                  <span className="vdlt-augments-inline">
                    Lõi: {playerAugments.map((a) => a.name).join(', ')}
                  </span>
                )}
              </div>
            </header>
            <PvERound
              stage={s}
              roundInStage={r}
              roundType={pveType}
              onComplete={onPveComplete}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="vdlt-root">
      <div className="vdlt-layout">
        <aside className="vdlt-sidebar vdlt-sidebar-left">
          {(() => {
            const isViewingOpponent = selectedViewId != null && selectedViewId >= 0
            const viewedOpponent = isViewingOpponent ? opponents[selectedViewId] : null
            const displayBoardState = isViewingOpponent && viewedOpponent
              ? viewedOpponent.board_state ?? []
              : myPlayer?.board_state ?? []
            const displayAugments = isViewingOpponent && viewedOpponent
              ? viewedOpponent.augments ?? []
              : playerAugments
            const displayItems = isViewingOpponent && viewedOpponent
              ? viewedOpponent.items ?? []
              : playerItems
            return (
              <>
                <TribeClassPanel boardState={displayBoardState} championsMap={championsMap} />
                {displayAugments.length > 0 && (
            <div className="vdlt-augments-panel">
              <p className="vdlt-panel-title">
                <span className="material-symbols-outlined">auto_awesome</span>
                Lõi đã chọn
              </p>
              <div className="vdlt-augments-list">
                {displayAugments.map((aug) => (
                  <div
                    key={aug.id}
                    className={`vdlt-augment-chip vdlt-augment-${aug.tier ?? 'silver'}`}
                    onMouseEnter={() => setHoveredAugment(aug)}
                    onMouseLeave={() => setHoveredAugment(null)}
                  >
                    <span className="vdlt-augment-chip-name">{aug.name}</span>
                  </div>
                ))}
              </div>
              {hoveredAugment && (
                <div className="vdlt-augment-tooltip">
                  <div className="vdlt-augment-tooltip-name">{hoveredAugment.name}</div>
                  {hoveredAugment.flavorDescription && (
                    <p className="vdlt-augment-tooltip-flavor">{hoveredAugment.flavorDescription}</p>
                  )}
                  <div className="vdlt-augment-tooltip-effect">
                    {hoveredAugment.effectDescription || 'Chưa có mô tả chi tiết.'}
                  </div>
                </div>
              )}
            </div>
          )}
          {displayItems.length > 0 && (
            <div className="vdlt-item-inventory">
              <p className="vdlt-item-inventory-title">
                {isViewingOpponent ? 'Vật phẩm đối thủ' : 'Vật phẩm (item) đang có'}
              </p>
              <div className="vdlt-item-inventory-list">
                {displayItems.map((id, idx) => {
                  const it = getItemById(id)
                  if (!it) return null
                  const isSelected = !isViewingOpponent && selectedItemId === id && idx === playerItems.indexOf(id)
                  if (isViewingOpponent) {
                    return (
                      <span
                        key={`${id}-${idx}`}
                        className="vdlt-item-chip"
                        title={it.name}
                        onMouseEnter={() => setHoveredItemInfo(buildItemHoverInfo(id))}
                        onMouseLeave={() => setHoveredItemInfo(null)}
                      >
                        {it.name}
                      </span>
                    )
                  }
                  return (
                    <button
                      key={`${id}-${idx}`}
                      type="button"
                      className={`vdlt-item-chip ${isSelected ? 'vdlt-item-chip-selected' : ''}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(
                          'application/json',
                          JSON.stringify({ source: 'item', itemId: id })
                        )
                        e.dataTransfer.effectAllowed = 'move'
                        setSelectedItemId(id)
                        setDraggingItemId(id)
                        setInventoryCombinePreview(null)
                      }}
                      onDragEnd={() => {
                        setDraggingItemId(null)
                        setInventoryCombinePreview(null)
                      }}
                      onDragOver={(e) => {
                        // Cho phép thả item lên item khác trong kho
                        e.preventDefault()
                      }}
                      onDragEnter={(e) => {
                        // Khi kéo một item đè lên item khác: preview món ghép nếu có
                        const draggedId = draggingItemId
                        if (!draggedId || draggedId === id) return
                        const completed = getCompletedFromComponents(draggedId, id)
                        if (!completed) {
                          setInventoryCombinePreview(null)
                          return
                        }
                        setInventoryCombinePreview({
                          sourceId: draggedId,
                          targetId: id,
                          resultId: completed.id
                        })
                      }}
                      onDrop={(e) => {
                        e.preventDefault()
                        try {
                          const draggedId = draggingItemId
                          if (!draggedId) return
                          const completed = getCompletedFromComponents(draggedId, id)
                          if (!completed) return
                          setPlayerItems((prev) => {
                            const src = draggedId
                            const tgt = id
                            const resultId = completed.id
                            const next = [...prev]
                            let idxSrc = next.indexOf(src)
                            if (idxSrc === -1) return prev
                            let idxTgt
                            if (src === tgt) {
                              idxTgt = next.indexOf(tgt, idxSrc + 1)
                              if (idxTgt === -1) return prev
                            } else {
                              idxTgt = next.indexOf(tgt)
                              if (idxTgt === -1) return prev
                            }
                            const toRemove = [idxSrc, idxTgt].sort((a, b) => b - a)
                            toRemove.forEach((removeIndex) => {
                              next.splice(removeIndex, 1)
                            })
                            next.push(resultId)
                            return next
                          })
                          setSelectedItemId(null)
                          setDraggingItemId(null)
                          setInventoryCombinePreview(null)
                        } catch {
                          // ignore
                        }
                      }}
                      onClick={() => setSelectedItemId(id)}
                      onMouseEnter={() => setHoveredItemInfo(buildItemHoverInfo(id))}
                      onMouseLeave={() => setHoveredItemInfo(null)}
                    >
                      {it.name}
                    </button>
                  )
                })}
              </div>
              {!isViewingOpponent && inventoryCombinePreview && (
                <div className="vdlt-item-combine-preview">
                  {(() => {
                    const src = getItemById(inventoryCombinePreview.sourceId)
                    const tgt = getItemById(inventoryCombinePreview.targetId)
                    const res =
                      getItemById(inventoryCombinePreview.resultId) ||
                      COMPLETED_ITEMS.find((it) => it.id === inventoryCombinePreview.resultId)
                    if (!src || !tgt || !res) return null
                    const s = res.stats || {}
                    const statLines = []
                    if (s.hp_flat) statLines.push(`+${s.hp_flat} Máu`)
                    if (s.attack_flat) statLines.push(`+${s.attack_flat} Sát thương vật lý`)
                    if (s.attack_percent)
                      statLines.push(`+${Math.round(s.attack_percent * 100)}% Sát thương vật lý`)
                    if (s.armor_flat) statLines.push(`+${s.armor_flat} Giáp`)
                    if (s.magic_resist_flat) statLines.push(`+${s.magic_resist_flat} Kháng phép`)
                    if (s.crit_chance)
                      statLines.push(`+${Math.round(s.crit_chance * 100)}% Tỉ lệ chí mạng`)
                    if (s.crit_damage)
                      statLines.push(`+${Math.round(s.crit_damage * 100)}% Sát thương chí mạng`)
                    return (
                      <>
                        <div>
                          Kết hợp{' '}
                          <span className="vdlt-item-tooltip-highlight">{src.name}</span> +{' '}
                          <span className="vdlt-item-tooltip-highlight">{tgt.name}</span> →{' '}
                          <span className="vdlt-item-tooltip-highlight">{res.name}</span>
                        </div>
                        {statLines.length > 0 && (
                          <ul className="vdlt-item-tooltip-stats vdlt-item-tooltip-stats-small">
                            {statLines.map((t) => (
                              <li key={t}>{t}</li>
                            ))}
                          </ul>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}
              {hoveredItemInfo && hoveredItemInfo.component && (
                <div className="vdlt-item-tooltip">
                  <div className="vdlt-item-tooltip-header">
                    <div className="vdlt-item-tooltip-name">{hoveredItemInfo.component.name}</div>
                    <div className="vdlt-item-tooltip-tagline">Mảnh đơn & công thức ghép</div>
                  </div>
                  <div className="vdlt-item-tooltip-section">
                    <div className="vdlt-item-tooltip-section-title">Khi đứng một mình</div>
                    <ul className="vdlt-item-tooltip-stats">
                      {(() => {
                        const s = hoveredItemInfo.component.stats || {}
                        const lines = []
                        if (s.hp_flat) lines.push(`+${s.hp_flat} Máu`)
                        if (s.attack_flat) lines.push(`+${s.attack_flat} Sát thương vật lý`)
                        if (s.attack_percent)
                          lines.push(`+${Math.round(s.attack_percent * 100)}% Sát thương vật lý`)
                        if (s.armor_flat) lines.push(`+${s.armor_flat} Giáp`)
                        if (s.magic_resist_flat) lines.push(`+${s.magic_resist_flat} Kháng phép`)
                        if (s.crit_chance)
                          lines.push(`+${Math.round(s.crit_chance * 100)}% Tỉ lệ chí mạng`)
                        if (s.crit_damage)
                          lines.push(`+${Math.round(s.crit_damage * 100)}% Sát thương chí mạng`)
                        if (!lines.length) lines.push('Không tăng chỉ số trực tiếp.')
                        return lines.map((text) => <li key={text}>{text}</li>)
                      })()}
                    </ul>
                  </div>
                  {hoveredItemInfo.combos && hoveredItemInfo.combos.length > 0 && (
                    <div className="vdlt-item-tooltip-section">
                      <div className="vdlt-item-tooltip-section-title">
                        Kết hợp với mảnh khác sẽ thành
                      </div>
                      <ul className="vdlt-item-tooltip-combos">
                        {hoveredItemInfo.combos.map(({ completed, other }) => {
                          const statLines = []
                          const s = completed.stats || {}
                          if (s.hp_flat) statLines.push(`+${s.hp_flat} Máu`)
                          if (s.attack_flat) statLines.push(`+${s.attack_flat} Sát thương vật lý`)
                          if (s.attack_percent)
                            statLines.push(
                              `+${Math.round(s.attack_percent * 100)}% Sát thương vật lý`
                            )
                          if (s.armor_flat) statLines.push(`+${s.armor_flat} Giáp`)
                          if (s.magic_resist_flat) statLines.push(`+${s.magic_resist_flat} Kháng phép`)
                          if (s.crit_chance)
                            statLines.push(`+${Math.round(s.crit_chance * 100)}% Tỉ lệ chí mạng`)
                          if (s.crit_damage)
                            statLines.push(
                              `+${Math.round(s.crit_damage * 100)}% Sát thương chí mạng`
                            )
                          return (
                            <li key={completed.id} className="vdlt-item-tooltip-combo">
                              <div className="vdlt-item-tooltip-combo-title">
                                {other ? (
                                  <>
                                    Kết hợp với <span className="vdlt-item-tooltip-highlight">
                                      {other.name}
                                    </span>{' '}
                                    → <span className="vdlt-item-tooltip-highlight">
                                      {completed.name}
                                    </span>
                                  </>
                                ) : (
                                  <span className="vdlt-item-tooltip-highlight">
                                    {completed.name}
                                  </span>
                                )}
                              </div>
                              {statLines.length > 0 && (
                                <ul className="vdlt-item-tooltip-stats vdlt-item-tooltip-stats-small">
                                  {statLines.map((t) => (
                                    <li key={t}>{t}</li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                  {hoveredItemInfo.combos && hoveredItemInfo.combos.length === 0 &&
                    (hoveredItemInfo.component.tags || []).includes('tool') && (
                      <div className="vdlt-item-tooltip-section">
                        <div className="vdlt-item-tooltip-section-title">Công dụng đặc biệt</div>
                        <p className="vdlt-item-tooltip-text">
                          {hoveredItemInfo.component.description ||
                            'Dùng để tương tác đặc biệt, không ghép thành vật phẩm hoàn chỉnh.'}
                        </p>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
              </>
            )
          })()}
        </aside>
        <div className="vdlt-main">
          <header className="vdlt-header">
            <div className="vdlt-title">
              <span className="material-symbols-outlined">theater_comedy</span>
              Vũ Đại Loạn Thế
            </div>
            <div className="vdlt-round-info">
              <span className="vdlt-gold">
                <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>monetization_on</span>
                {myPlayer?.gold ?? 0}
              </span>
              <span className="vdlt-hp">HP: {myPlayer?.hp ?? 0}</span>
              <span className="vdlt-level">
                Cấp: {myPlayer?.level ?? 1}
                {(myPlayer?.level ?? 1) < MAX_LEVEL ? (
                  <span className="vdlt-xp-bar-wrap">
                    <span className="vdlt-xp-info">
                      ({myPlayer?.xp ?? 0}/{getXpRequiredForNextLevel(myPlayer?.level ?? 1)})
                    </span>
                    <span className="vdlt-xp-bar" title={`${myPlayer?.xp ?? 0} / ${getXpRequiredForNextLevel(myPlayer?.level ?? 1)} EXP`}>
                      <span
                        className="vdlt-xp-bar-inner"
                        style={{
                          width: `${Math.min(100, (100 * (myPlayer?.xp ?? 0)) / getXpRequiredForNextLevel(myPlayer?.level ?? 1))}%`
                        }}
                      />
                    </span>
                  </span>
                ) : (
                  <span className="vdlt-xp-info"> MAX</span>
                )}
              </span>
              <button
                type="button"
                className="vdlt-btn-level"
                onClick={buyXp}
                disabled={(myPlayer?.gold ?? 0) < XP_GOLD_COST || (myPlayer?.level ?? 1) >= MAX_LEVEL}
                title={`Mua EXP (+${XP_PER_PURCHASE} EXP / ${XP_GOLD_COST} vàng)`}
              >
                Mua EXP (+{XP_PER_PURCHASE} / {XP_GOLD_COST})
              </button>
              <span className="vdlt-stage-round">
                Vòng {round} ({getStageRound(round).stage}-{getStageRound(round).roundInStage}){' '}
                <span className="vdlt-round-type">
                  {phase === 'pve-placement' ? 'Đánh quái' : getRoundType(getStageRound(round).stage, getStageRound(round).roundInStage).toUpperCase()}
                </span>
              </span>
              {playerAugments.length > 0 && (
                <span className="vdlt-augments-inline" title={playerAugments.map((a) => a.name).join(' • ')}>
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>auto_awesome</span>
                  {playerAugments.map((a) => a.name).join(', ')}
                </span>
              )}
              {phase === 'buying' && planningTimeLeft > 0 && (
                <span className="vdlt-planning-timer" title="Thời gian mua sắm">
                  {planningTimeLeft}s
                </span>
              )}
            </div>
          </header>

          <TrongChauBar energy={trongChauEnergy} daiVuDaiActive={daiVuDaiActive} />

          <div className="vdlt-stage-wrap">
            {(() => {
              const isCombat = phase === 'combat-anim' || phase === 'combat'
              const isPveCombat = combatResult?.isPveRound === true
              const foughtOpponentIndex =
                combatResult?.opponentId != null
                  ? opponents.findIndex((o) => o.id === combatResult.opponentId)
                  : -1
              const viewingOpponentIndex = selectedViewId != null ? selectedViewId : foughtOpponentIndex
              const opponentToShow = viewingOpponentIndex >= 0 ? opponents[viewingOpponentIndex] : null

              const playerBoardState = isCombat && combatUnitsA ? combatUnitsA : myPlayer?.board_state ?? []
              const playerBenchState = myPlayer?.bench_state ?? []
              const opponentBoardState = isPveCombat
                ? combatUnitsB ?? []
                : isCombat && viewingOpponentIndex === foughtOpponentIndex && combatUnitsB
                  ? combatUnitsB
                  : opponentToShow?.board_state ?? []
              const opponentBenchState = opponentToShow?.bench_state ?? []

              const useMonsterImgOpponent = isPveCombat

              if (isCombat) {
                return (
                  <div className="vdlt-combat-boards">
                    <div className="vdlt-combat-board-section">
                      <p className="vdlt-opponent-board-title">
                        {isPveCombat
                          ? 'Quái'
                          : `Đội hình ${OPPONENT_NAMES[viewingOpponentIndex] ?? `Đối thủ ${viewingOpponentIndex + 1}`}`}
                      </p>
                      <VuDaiLoanTheBoard
                        boardState={mirrorBoardForOpponentView(opponentBoardState)}
                        championsMap={championsMap}
                        cols={BOARD_COLS}
                        rows={BOARD_ROWS}
                        readOnly
                        useMonsterImage={useMonsterImgOpponent}
                        onChampionInfo={(col, row, unit) => {
                          if (unit?.champion_key) {
                            openChampionDetail({
                              champion: championsMap[unit.champion_key],
                              unit: {
                                star: unit.star ?? 1,
                                mask_color: unit.mask_color,
                                items: unit.items || []
                              },
                              source: 'opponent'
                            })
                          }
                        }}
                      />
                      <VuDaiLoanTheBench
                        benchState={opponentBenchState}
                        championsMap={championsMap}
                        onChampionInfo={(index, unit) => {
                          if (unit?.champion_key) {
                            openChampionDetail({
                              champion: championsMap[unit.champion_key],
                              unit: {
                                star: unit.star ?? 1,
                                mask_color: unit.mask_color,
                                items: unit.items || []
                              },
                              source: 'opponent'
                            })
                          }
                        }}
                      />
                    </div>
                    <div className="vdlt-combat-board-section">
                      <p className="vdlt-opponent-board-title">Đội hình của bạn</p>
                      <VuDaiLoanTheBoard
                        boardState={playerBoardState}
                        championsMap={championsMap}
                        cols={BOARD_COLS}
                        rows={BOARD_ROWS}
                        readOnly
                        useMonsterImage={false}
                        onChampionInfo={(col, row, unit) => {
                          if (unit?.champion_key) {
                            openChampionDetail({
                              champion: championsMap[unit.champion_key],
                              unit: {
                                star: unit.star ?? 1,
                                mask_color: unit.mask_color,
                                items: unit.items || []
                              },
                              source: 'board'
                            })
                          }
                        }}
                      />
                      <VuDaiLoanTheBench
                        benchState={playerBenchState}
                        championsMap={championsMap}
                        onChampionInfo={(index, unit) => {
                          if (unit?.champion_key) {
                            openChampionDetail({
                              champion: championsMap[unit.champion_key],
                              unit: {
                                star: unit.star ?? 1,
                                mask_color: unit.mask_color,
                                items: unit.items || []
                              },
                              source: 'bench',
                              benchIndex: index
                            })
                          }
                        }}
                      />
                    </div>
                  </div>
                )
              }

              const isViewingPlayer = selectedViewId === null
              const buyingOpponent = !isViewingPlayer && selectedViewId >= 0 ? opponents[selectedViewId] : null

              if (!isViewingPlayer && buyingOpponent) {
                return (
                  <>
                    <p className="vdlt-opponent-board-title">
                      Đội hình {OPPONENT_NAMES[selectedViewId] ?? `Đối thủ ${selectedViewId + 1}`}
                    </p>
                    <VuDaiLoanTheBoard
                      boardState={mirrorBoardForOpponentView(buyingOpponent?.board_state ?? [])}
                      championsMap={championsMap}
                      cols={BOARD_COLS}
                      rows={BOARD_ROWS}
                      readOnly
                      useMonsterImage={false}
                      onChampionInfo={(col, row, unit) => {
                        if (unit?.champion_key) {
                          openChampionDetail({
                            champion: championsMap[unit.champion_key],
                            unit: {
                              star: unit.star ?? 1,
                              mask_color: unit.mask_color,
                              items: unit.items || []
                            },
                            source: 'opponent'
                          })
                        }
                      }}
                    />
                    <VuDaiLoanTheBench
                      benchState={buyingOpponent?.bench_state ?? []}
                      championsMap={championsMap}
                      onChampionInfo={(index, unit) => {
                        if (unit?.champion_key) {
                          openChampionDetail({
                            champion: championsMap[unit.champion_key],
                            unit: {
                              star: unit.star ?? 1,
                              mask_color: unit.mask_color,
                              items: unit.items || []
                            },
                            source: 'opponent'
                          })
                        }
                      }}
                    />
                  </>
                )
              }

              return (
                <>
                  <p className="vdlt-opponent-board-title">Đội hình của bạn</p>
                  <p className="vdlt-drag-hint">
                    Kéo tướng từ ghế dự bị lên sân khấu, hoặc click chọn tướng rồi click ô trống.
                  </p>
                  <VuDaiLoanTheBoard
                    boardState={playerBoardState}
                    championsMap={championsMap}
                    cols={BOARD_COLS}
                    rows={BOARD_ROWS}
                    readOnly={false}
                    useMonsterImage={false}
                    onSlotClick={placeOnBoard}
                    onChampionInfo={(col, row, unit) => {
                      if (selectedItemId && tryGiveItemToUnit('board', { col, row }, unit)) return
                      if (unit?.champion_key) {
                        openChampionDetail({
                          champion: championsMap[unit.champion_key],
                          unit: {
                            star: unit.star ?? 1,
                            mask_color: unit.mask_color,
                            items: unit.items || []
                          },
                          source: 'board'
                        })
                      }
                    }}
                    onDropToBoard={onDropToBoard}
                    onSell={sellChampionFromBoard}
                  />
                  <VuDaiLoanTheBench
                    benchState={playerBenchState}
                    championsMap={championsMap}
                    onSlotClick={(idx) => selectBench(idx)}
                    onChampionInfo={(index, unit) => {
                      if (selectedItemId && tryGiveItemToUnit('bench', index, unit)) return
                      if (unit?.champion_key) {
                        openChampionDetail({
                          champion: championsMap[unit.champion_key],
                          unit: {
                            star: unit.star ?? 1,
                            mask_color: unit.mask_color,
                            items: unit.items || []
                          },
                          source: 'bench',
                          benchIndex: index
                        })
                      }
                    }}
                    onDropToBench={onDropToBench}
                    onSell={sellChampionFromBench}
                  />
                </>
              )
            })()}
          </div>

          {phase === 'buying' && selectedViewId === null && (
            <VuDaiLoanTheShop
              shopSlots={shopSlots}
              championsMap={championsMap}
              gold={myPlayer?.gold ?? 0}
              level={myPlayer?.level ?? 1}
              onRoll={rollShopHandler}
              onBuy={buyFromShop}
            />
          )}

          {phase === 'buying' && (
            <button
              type="button"
              className="vdlt-btn-start"
              onClick={endBuyingPhase}
              disabled={!opponentsReady}
              title={!opponentsReady ? 'Đang chuẩn bị đối thủ...' : ''}
            >
              {opponentsReady ? 'Kết thúc mua → Combat' : 'Đang chuẩn bị đối thủ...'}
            </button>
          )}
          {phase === 'pve-placement' && (
            <button type="button" className="vdlt-btn-start" onClick={endPvePlacementPhase}>
              Đánh quái
            </button>
          )}
        </div>

        <aside className="vdlt-sidebar vdlt-sidebar-right">
          <OpponentsPanel
            myPlayer={myPlayer}
            opponents={opponents}
            championsMap={championsMap}
            selectedId={selectedViewId}
            onSelect={setSelectedViewId}
            phase={phase}
          />
        </aside>
      </div>

      {championDetail?.champion && (
        <ChampionDetailModal
          champion={championDetail.champion}
          unit={championDetail.unit}
          boardState={
            championDetail.source === 'opponent'
              ? ((phase === 'combat-anim' || phase === 'combat') && combatResult?.opponentId
                  ? opponents.find((o) => o.id === combatResult.opponentId)?.board_state ?? []
                  : opponents[selectedViewId]?.board_state ?? [])
              : (myPlayer?.board_state ?? [])
          }
          championsMap={championsMap}
          playerAugments={
            championDetail.source === 'opponent'
              ? ((phase === 'combat-anim' || phase === 'combat') && combatResult?.opponentId
                  ? opponents.find((o) => o.id === combatResult.opponentId)?.augments ?? []
                  : opponents[selectedViewId]?.augments ?? [])
              : (playerAugments ?? [])
          }
          source={championDetail.source}
          shopIndex={championDetail.shopIndex}
          slot={championDetail.slot}
          benchIndex={championDetail.benchIndex}
          onClose={closeChampionDetail}
          onBuy={championDetail.source === 'shop' ? buyFromShop : undefined}
          onSelectForBoard={
            championDetail.source === 'bench' && championDetail.benchIndex != null
              ? () => {
                  setSelectedBenchIndex(championDetail.benchIndex)
                  closeChampionDetail()
                }
              : undefined
          }
        />
      )}

      {phase === 'combat' && combatResult && (
        <CombatOverlay result={combatResult} onClose={closeCombatOverlay} />
      )}
    </div>
  )
}
