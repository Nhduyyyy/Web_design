import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getChampions } from '../../services/vuDaiLoanTheService'
import { createMatch, updateMatchPlayer, finishMatch } from '../../services/vuDaiLoanTheService'
import { CHAMPIONS_STATIC, getChampionsMap } from '../../data/vuDaiLoanTheChampions'
import { SHOP_ODDS_BY_LEVEL } from './constants/shopOdds'
import { resolveCombat, unitStatsFromChampion } from './utils/combatResolver'
import VuDaiLoanTheBoard from './VuDaiLoanTheBoard'
import VuDaiLoanTheBench from './VuDaiLoanTheBench'
import VuDaiLoanTheShop from './VuDaiLoanTheShop'
import TrongChauBar from './TrongChauBar'
import CombatOverlay from './CombatOverlay'
import TribeClassPanel from './TribeClassPanel'
import OpponentsPanel from './OpponentsPanel'
import './VuDaiLoanThe.css'

const BOARD_SLOTS_MAX = 9
const BENCH_SLOTS = 9
const SHOP_SLOTS = 5
const INITIAL_HP = 100
const GOLD_PER_ROUND = 3
const TRONG_CHAU_PER_ROUND = 15
const MAX_ROUNDS = 30
const DAMAGE_PER_SURVIVING = 2
const LEVEL_UP_COST = 4
const MAX_LEVEL = 10

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
    gold: GOLD_PER_ROUND,
    level: 1,
    board_state: [],
    bench_state: []
  }
}

function buildCombatUnits(boardState, championsMap) {
  return boardState
    .filter((u) => u && u.champion_key)
    .map((u) => {
      const c = championsMap[u.champion_key]
      if (!c) return null
      return unitStatsFromChampion(c, u.star ?? 1, u.mask_color)
    })
    .filter(Boolean)
}

function botRandomBoard(championsMap, rng = Math.random) {
  const list = Object.values(championsMap)
  const count = 3 + Math.floor(rng() * 4)
  const units = []
  for (let i = 0; i < count; i++) {
    const c = randomFromArray(list, rng)
    if (c) units.push(unitStatsFromChampion(c, 1, c.default_mask_color))
  }
  return units
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
  const [selectedOpponentIndex, setSelectedOpponentIndex] = useState(null)

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
            default_mask_color: c.default_mask_color ?? 'red'
          }
        })
        setChampionsMap((prev) => (Object.keys(map).length ? map : prev))
      }
    })
  }, [])

  const startGame = useCallback(async () => {
    const players = [createInitialPlayer(false, user?.id ?? null)]
    for (let i = 0; i < 7; i++) players.push(createInitialPlayer(true))

    if (user?.id) {
      const { data, error } = await createMatch(user.id, { initialGold: GOLD_PER_ROUND })
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
    setPhase('buying')
    setFinalPlacement(null)
  }, [user?.id])

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
      bench.push({ champion_key: champion.key, star: 1, mask_color: champion.default_mask_color })
      setMyPlayer((p) => ({ ...p, gold: p.gold - champion.cost, bench_state: bench }))
      setShopSlots((s) => s.map((sl, i) => (i === shopIndex ? null : sl)))
    },
    [championsMap, myPlayer]
  )

  const placeOnBoard = useCallback(
    (slotIndex, existingUnit) => {
      if (selectedBenchIndex !== null) {
        const bench = [...(myPlayer.bench_state || [])]
        const unit = bench[selectedBenchIndex]
        if (!unit) return
        const board = [...(myPlayer.board_state || [])]
        const already = board.find((u) => u.slotIndex === slotIndex)
        if (already) return
        board.push({ ...unit, slotIndex })
        bench.splice(selectedBenchIndex, 1)
        setMyPlayer((p) => ({ ...p, board_state: board, bench_state: bench }))
        setSelectedBenchIndex(null)
        return
      }
      if (existingUnit) {
        const board = (myPlayer.board_state || []).filter((u) => u.slotIndex !== slotIndex)
        const bench = [...(myPlayer.bench_state || [])]
        if (bench.length >= BENCH_SLOTS) return
        const { slotIndex: _, ...rest } = existingUnit
        bench.push(rest)
        setMyPlayer((p) => ({ ...p, board_state: board, bench_state: bench }))
      }
    },
    [myPlayer, selectedBenchIndex]
  )

  const selectBench = useCallback((index) => {
    setSelectedBenchIndex((prev) => (prev === index ? null : index))
  }, [])

  const buyLevel = useCallback(() => {
    setMyPlayer((p) => {
      if (!p || p.gold < LEVEL_UP_COST || p.level >= MAX_LEVEL) return p
      return { ...p, gold: p.gold - LEVEL_UP_COST, level: Math.min(MAX_LEVEL, p.level + 1) }
    })
  }, [])

  const sellChampionFromBoard = useCallback(
    (slotIndex, unit) => {
      const champion = unit?.champion_key ? championsMap[unit.champion_key] : null
      const refund = champion?.cost ?? 0
      setMyPlayer((p) => ({
        ...p,
        gold: p.gold + refund,
        board_state: (p.board_state || []).filter((u) => u.slotIndex !== slotIndex)
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
    (slotIndex, { source, sourceIndex, unit }) => {
      if (!unit) return
      setMyPlayer((p) => {
        const board = [...(p.board_state || [])]
        const bench = [...(p.bench_state || [])]
        if (source === 'bench') {
          const u = bench[sourceIndex]
          if (!u) return p
          const existingAtSlot = board.find((x) => x.slotIndex === slotIndex)
          const newBoard = board.filter((x) => x.slotIndex !== slotIndex)
          newBoard.push({ ...u, slotIndex })
          const newBench = bench.filter((_, i) => i !== sourceIndex)
          if (existingAtSlot) {
            const { slotIndex: _, ...rest } = existingAtSlot
            newBench.splice(sourceIndex, 0, rest)
          }
          return { ...p, board_state: newBoard, bench_state: newBench }
        }
        if (source === 'board') {
          if (sourceIndex === slotIndex) return p
          const atTarget = board.find((x) => x.slotIndex === slotIndex)
          const newBoard = board.filter((x) => x.slotIndex !== sourceIndex && x.slotIndex !== slotIndex)
          newBoard.push({ ...unit, slotIndex })
          if (atTarget) newBoard.push({ ...atTarget, slotIndex: sourceIndex })
          return { ...p, board_state: newBoard }
        }
        return p
      })
      setSelectedBenchIndex(null)
    },
    []
  )

  const onDropToBench = useCallback(
    (benchIndex, { source, sourceIndex, unit }) => {
      if (!unit) return
      setMyPlayer((p) => {
        const board = [...(p.board_state || [])]
        const bench = [...(p.bench_state || [])]
        if (source === 'board') {
          const { slotIndex: _, ...rest } = unit
          const newBoard = board.filter((x) => x.slotIndex !== sourceIndex)
          if (bench.length >= BENCH_SLOTS) {
            const newBench = bench.map((b, i) => (i === benchIndex ? rest : b))
            return { ...p, board_state: newBoard, bench_state: newBench }
          }
          const newBench = bench.slice(0, benchIndex).concat([rest]).concat(bench.slice(benchIndex))
          return { ...p, board_state: newBoard, bench_state: newBench }
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
    []
  )

  const endBuyingPhase = useCallback(() => {
    setPhase('combat')
    const alive = opponents.filter((o) => o.hp > 0)
    if (alive.length === 0) {
          setFinalPlacement(1)
          setPhase('result')
          return
        }
    const opponent = alive[Math.floor(Math.random() * alive.length)]
    const myUnits = buildCombatUnits(myPlayer.board_state, championsMap)
    const oppUnits = botRandomBoard(championsMap)
    setLastOpponentBoard(oppUnits)
    const { winner, boardA, boardB } = resolveCombat(myUnits, oppUnits)
    const damageTaken = boardA.length === 0 ? Math.max(2, oppUnits.length * DAMAGE_PER_SURVIVING) : 0
    const damageDealt = boardB.length === 0 ? Math.max(2, myUnits.length * DAMAGE_PER_SURVIVING) : 0
    setMyPlayer((p) => ({ ...p, hp: Math.max(0, p.hp - damageTaken) }))
    setOpponents((list) =>
      list.map((o) =>
        o.id === opponent.id ? { ...o, hp: Math.max(0, o.hp - damageDealt) } : o
      )
    )
    setCombatResult({
      winner: winner === 'A' ? 'player' : 'opponent',
      damageTaken,
      damageDealt
    })
  }, [myPlayer, opponents, championsMap])

  const closeCombatOverlay = useCallback(() => {
    setCombatResult(null)
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

    setRound((r) => r + 1)
    setMyPlayer((p) => ({ ...p, gold: p.gold + GOLD_PER_ROUND }))
    setShopSlots(rollShop(championsMap, myPlayer?.level ?? 1))
    setPhase('buying')
  }, [trongChauEnergy, opponents, myPlayer, round, matchId, user?.id, championsMap])

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

  return (
    <div className="vdlt-root">
      <div className="vdlt-layout">
        <aside className="vdlt-sidebar vdlt-sidebar-left">
          <TribeClassPanel boardState={myPlayer?.board_state ?? []} championsMap={championsMap} />
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
              <span className="vdlt-level">Cấp: {myPlayer?.level ?? 1}</span>
              <button
                type="button"
                className="vdlt-btn-level"
                onClick={buyLevel}
                disabled={(myPlayer?.gold ?? 0) < LEVEL_UP_COST || (myPlayer?.level ?? 1) >= MAX_LEVEL}
                title={`Mua Level (${LEVEL_UP_COST} vàng)`}
              >
                Mua Level ({LEVEL_UP_COST})
              </button>
              <span>Vòng {round}</span>
            </div>
          </header>

          <TrongChauBar energy={trongChauEnergy} daiVuDaiActive={daiVuDaiActive} />

          <div className="vdlt-stage-wrap">
            <p className="vdlt-drag-hint">Kéo tướng từ ghế dự bị lên sân khấu, hoặc click chọn tướng rồi click ô trống.</p>
            <VuDaiLoanTheBoard
              boardState={myPlayer?.board_state ?? []}
              championsMap={championsMap}
              maxSlots={myPlayer?.level ?? 1}
              onSlotClick={placeOnBoard}
              onDropToBoard={onDropToBoard}
              onSell={sellChampionFromBoard}
            />
            <VuDaiLoanTheBench
              benchState={myPlayer?.bench_state ?? []}
              championsMap={championsMap}
              onSlotClick={(idx) => selectBench(idx)}
              onDropToBench={onDropToBench}
              onSell={sellChampionFromBench}
            />
          </div>

          <VuDaiLoanTheShop
            shopSlots={shopSlots}
            championsMap={championsMap}
            gold={myPlayer?.gold ?? 0}
            level={myPlayer?.level ?? 1}
            onRoll={rollShopHandler}
            onBuy={buyFromShop}
          />

          {phase === 'buying' && (
            <button type="button" className="vdlt-btn-start" onClick={endBuyingPhase}>
              Kết thúc mua → Combat
            </button>
          )}
        </div>

        <aside className="vdlt-sidebar vdlt-sidebar-right">
          <OpponentsPanel
            opponents={opponents}
            lastOpponentBoard={lastOpponentBoard}
            championsMap={championsMap}
            selectedOpponentIndex={selectedOpponentIndex}
            onSelectOpponent={setSelectedOpponentIndex}
          />
        </aside>
      </div>

      {combatResult && (
        <CombatOverlay result={combatResult} onClose={closeCombatOverlay} />
      )}
    </div>
  )
}
