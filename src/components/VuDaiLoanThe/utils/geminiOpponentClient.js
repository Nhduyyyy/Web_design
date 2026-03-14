/**
 * Vũ Đại Loạn Thế - Gemini AI opponent client (frontend-only)
 * Gọi Gemini API trực tiếp từ browser, dùng VITE_GEMINI_API_KEY_1..7
 * Lưu ý: API key sẽ nằm trong bundle client - chỉ dùng cho demo/cá nhân.
 */
import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'

const placementSchema = z.object({
  champion_key: z.string().describe('Key của tướng (phải có trong bench sau khi mua và ghép)'),
  star: z.number().min(1).max(3).describe('Sao của tướng: 1, 2, hoặc 3'),
  col: z.number().min(0).max(3).describe('Cột trên bàn cờ 4x4 (0-3)'),
  row: z.number().min(0).max(3).describe('Hàng trên bàn cờ 4x4 (0-3)'),
  mask_color: z.enum(['red', 'black', 'white', 'blue']).describe('Màu mặt nạ: red, black, white, blue')
})

const itemPlacementSchema = z.object({
  item_id: z.string().describe('ID mảnh item trong kho (ví dụ comp_kiem_son_hau)'),
  champion_key: z.string().describe('Tướng nhận item'),
  star: z.number().min(1).max(3).describe('Sao của tướng')
})

const actionsSchema = z.object({
  purchases: z.array(z.number().min(0).max(4)).describe('Index các ô shop cần mua (0-4). Ô trống bỏ qua.'),
  level_up: z.boolean().describe('Có mua 4 XP (tốn 4 vàng) không'),
  placements: z.array(placementSchema).describe('Đội hình cuối cùng trên bàn cờ. Số lượng <= level.'),
  item_placements: z
    .array(itemPlacementSchema)
    .optional()
    .describe('Gắn item từ kho lên tướng. Tank/carry nhận item phù hợp (defense/offense).')
})

const augmentChoiceSchema = z.object({
  choice: z.number().min(0).max(2).describe('Index lõi chọn: 0, 1, hoặc 2')
})

function buildPrompt(state) {
  const { round, gold, level, xp, bench, board, shop, winStreak, loseStreak, champions, traitBuffs, items = [], augments = [] } = state

  const itemsDesc =
    items.length > 0
      ? items.map((id, i) => `  [${i}] ${id}`).join('\n')
      : '  (trống)'
  const augmentsDesc =
    augments.length > 0
      ? augments.map((a) => `  - ${a.name}: ${a.effectDescription || ''}`).join('\n')
      : '  (chưa có)'

  const shopDesc = (shop || [])
    .map((s, i) => (s ? `  [${i}] ${s.champion_key} (cost ${s.cost})` : `  [${i}] trống`))
    .join('\n')

  const benchDesc = (bench || [])
    .map((u) => `  - ${u.champion_key} ${u.star}★`)
    .join('\n') || '  (trống)'

  const boardDesc = (board || [])
    .map((u) => `  - ${u.champion_key} ${u.star}★ tại (${u.col},${u.row})`)
    .join('\n') || '  (trống)'

  return `Bạn là AI chơi game Vũ Đại Loạn Thế (auto battler TFT-style). Mục tiêu: tối ưu đội hình để thắng combat.

## Luật game
- Mua tướng: tốn vàng = cost tướng (1-5). Tướng vào ghế dự bị.
- Mua level: 4 vàng = +4 XP. Level = số ô tối đa trên bàn (1-10).
- Ghép: 3 tướng cùng champion_key và cùng sao → 1 tướng lên 1 sao (1★→2★→2★→3★).
- Bàn cờ: 4x4, col và row từ 0-3. Tối đa "level" tướng trên bàn.
- Buff tộc/hệ: 2/4/6 tướng cùng tộc hoặc hệ kích hoạt buff (armor, magic resist, damage%).

## Trạng thái hiện tại
- Vòng: ${round}
- Vàng: ${gold}
- Level: ${level} (tối đa ${level} tướng trên bàn)
- XP: ${xp}
- Win streak: ${winStreak}, Lose streak: ${loseStreak}

## Ghế dự bị (bench)
${benchDesc}

## Bàn cờ hiện tại
${boardDesc}

## Shop (5 ô, index 0-4)
${shopDesc}

## Buff tộc/hệ (traitBuffs)
${JSON.stringify(traitBuffs, null, 2)}

## Kho item (items)
${itemsDesc}

## Lõi đã chọn (augments)
${augmentsDesc}

## Danh sách tướng (champion_key, cost, tribe_key, class_key)
${JSON.stringify(champions?.slice?.(0, 15) ?? champions, null, 2)}
... (còn ${(champions?.length ?? 0) - 15} tướng nữa)

## Nhiệm vụ
Quyết định hành động cho vòng này:
1. purchases: mua những ô shop nào (index 0-4)? Chỉ mua nếu đủ vàng. Tổng cost <= gold.
2. level_up: có mua 4 XP không? Chỉ nếu gold >= 4.
3. placements: sau khi mua và ghép, đặt đội hình lên bàn. Mỗi placement phải có champion_key tồn tại trong bench+board sau bước 1-2. Số lượng <= level. Tank đặt hàng sau (row 2-3), DPS hàng trước (row 0-1). Tối ưu trait buff 2/4/6.
4. item_placements (nếu có item trong kho): gắn item lên tướng phù hợp. Item defense (armor, magic_resist) → tank. Item offense (attack, crit) → carry. Mỗi tướng tối đa 3 item. item_id phải có trong kho.

Trả về JSON đúng schema.`
}

/** Lấy API key cho opponent 1-7 từ env (VITE_GEMINI_API_KEY_1 .. VITE_GEMINI_API_KEY_7) */
function getApiKeyForOpponent(opponentId) {
  const id = Math.max(1, Math.min(7, Math.floor(opponentId)))
  const key = import.meta.env[`VITE_GEMINI_API_KEY_${id}`]
  return key || null
}

/**
 * Gọi Gemini trực tiếp từ frontend để lấy quyết định của opponent
 * @param {number} opponentId - 1-7
 * @param {Object} state - game state
 * @returns {Promise<{ purchases: number[], level_up: boolean, placements: Array }>}
 */
export async function getOpponentActionsFromClient(opponentId, state) {
  const id = Math.max(1, Math.min(7, Math.floor(opponentId)))
  const apiKey = getApiKeyForOpponent(id)

  if (!apiKey) {
    throw new Error(`Thiếu VITE_GEMINI_API_KEY_${id} trong .env.local`)
  }

  const ai = new GoogleGenAI({ apiKey })
  const prompt = buildPrompt(state)

  let response
  try {
    response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: zodToJsonSchema(actionsSchema)
      }
    })
  } catch (apiErr) {
    console.error('[Gemini] API call failed:', {
      opponentId: id,
      message: apiErr?.message,
      name: apiErr?.name,
      stack: apiErr?.stack
    })
    throw apiErr
  }

  const text = response?.text
  if (!text) {
    console.error('[Gemini] Empty response:', { opponentId: id, response })
    throw new Error('Empty response from Gemini')
  }

  try {
    const parsed = JSON.parse(text)
    return actionsSchema.parse(parsed)
  } catch (parseErr) {
    console.error('[Gemini] Parse/validation failed:', {
      opponentId: id,
      rawText: text,
      parseError: parseErr?.message,
      stack: parseErr?.stack
    })
    throw parseErr
  }
}

/**
 * AI chọn 1 trong 3 lõi (augment) phù hợp với đội hình
 * @param {number} opponentId - 1-7
 * @param {Array} options - 3 augments từ rollAugmentOptions
 * @param {Object} state - { bench, board, augments }
 * @returns {Promise<number>} index 0, 1, hoặc 2
 */
export async function getOpponentAugmentChoice(opponentId, options, state) {
  const id = Math.max(1, Math.min(7, Math.floor(opponentId)))
  const apiKey = getApiKeyForOpponent(id)

  if (!apiKey || !options?.length) {
    return Math.floor(Math.random() * Math.min(3, options?.length || 1))
  }

  const benchDesc = (state?.bench || [])
    .map((u) => `  - ${u.champion_key} ${u.star ?? 1}★`)
    .join('\n') || '  (trống)'
  const boardDesc = (state?.board || [])
    .map((u) => `  - ${u.champion_key} ${u.star ?? 1}★ tại (${u.col},${u.row})`)
    .join('\n') || '  (trống)'
  const augmentsDesc = (state?.augments || [])
    .map((a) => `  - ${a.name}`)
    .join('\n') || '  (chưa có)'

  const optionsDesc = options
    .map(
      (a, i) =>
        `[${i}] ${a.name} (${a.tier}): ${a.effectDescription || a.flavorDescription || ''}${a.grantChampions ? ` Nhận tướng: ${a.grantChampions.join(', ')}` : ''}`
    )
    .join('\n')

  const prompt = `Bạn là AI chơi Vũ Đại Loạn Thế. Chọn 1 trong 3 lõi phù hợp nhất với đội hình hiện tại.

## Đội hình
Bench: ${benchDesc}
Board: ${boardDesc}
Lõi đã có: ${augmentsDesc}

## 3 lựa chọn lõi
${optionsDesc}

## Nhiệm vụ
Chọn index (0, 1, hoặc 2) của lõi phù hợp nhất. Ưu tiên: lõi tribe_special nếu đội hình có tộc tương ứng; lõi econ nếu đang thiếu vàng; lõi combat nếu đội hình đã ổn.

Trả về JSON: { "choice": 0 } hoặc { "choice": 1 } hoặc { "choice": 2 }`

  const ai = new GoogleGenAI({ apiKey })
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: zodToJsonSchema(augmentChoiceSchema)
      }
    })
    const text = response?.text
    if (!text) throw new Error('Empty response')
    const parsed = JSON.parse(text)
    const validated = augmentChoiceSchema.parse(parsed)
    return Math.max(0, Math.min(2, validated.choice))
  } catch (err) {
    console.warn('[Gemini] Augment choice failed, using random:', err?.message)
    return Math.floor(Math.random() * 3)
  }
}

/** Kiểm tra có đủ API key để dùng frontend-only không */
export function hasFrontendGeminiKeys() {
  for (let i = 1; i <= 7; i++) {
    if (getApiKeyForOpponent(i)) return true
  }
  return false
}
