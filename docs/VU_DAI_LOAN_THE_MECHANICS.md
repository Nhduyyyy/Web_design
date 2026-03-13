# Vũ Đại Loạn Thế – Toàn bộ cơ chế hiện tại

Tài liệu mô tả đầy đủ luật chơi, combat, shop, ghép sao, buff và data (cập nhật theo code hiện tại).

---

## 1. Tổng quan vòng chơi

| Phase   | Mô tả |
|--------|--------|
| **Lobby** | Màn hình bắt đầu, nhấn "Bắt đầu" để vào trận. |
| **Carousel** | Vòng 1-1, 2-4, 3-4, 4-4, 5-4, 6-4: chọn 1 tướng + item từ 8 ô; tướng vào bench. |
| **PvE** | Vòng 1-2, 1-3, 1-4 (và neutral 2-7, 3-7, 4-7, 5-7): màn "Đánh quái", nhận vàng (và sau này item). |
| **Buying** | Mua tướng từ shop, đặt lên bàn/ghế, roll shop, nâng level. **30 giây** planning; hết giờ hoặc nhấn "Kết thúc mua → Combat" để sang combat. |
| **Combat** | Auto đấu 1 đối thủ ngẫu nhiên; hiện overlay kết quả. Khi số người sống lẻ có thể đánh **ghost** (không trừ HP đối phương). |
| **Result** | Hết máu hoặc hết vòng → hiện hạng; có nút "Chơi lại". |

- **8 người ảo:** 1 người chơi + 7 bot (đối thủ). Mỗi đối thủ có HP = 100.
- **Tối đa 30 vòng.** Vòng có format Stage-Round (1-1, 1-2, …, 2-4 Carousel, 2-7 Neutral, …). Sau combat PvP, thắng/thua quyết định trừ HP; hết HP hoặc hết 30 vòng thì kết thúc và tính hạng.

---

## 2. Kinh tế & Level (TFT-style)

| Hằng số | Giá trị | Ý nghĩa |
|--------|---------|---------|
| `BASE_GOLD_PER_ROUND` | 5 | Vàng cơ bản mỗi đầu phase mua. |
| **Interest** | 10→+1, 20→+2, …, 50+→+5 (tối đa 5) | Cộng thêm theo vàng đang giữ (trước khi nhận base). |
| **Streak** | 2→+1, 3→+2, 4+→+3 | Win streak hoặc lose streak (chỉ lấy một, không cộng cả hai). |
| `LEVEL_UP_COST` | 4 | Vàng để mua 1 level. |
| `MAX_LEVEL` | 10 | Level tối đa. |
| `INITIAL_HP` | 100 | HP ban đầu của người chơi và mỗi đối thủ. |
| `PLANNING_SECONDS` | 30 | Thời gian mua sắm mỗi vòng PvP; hết giờ tự động vào combat. |

- **Vàng:** Bắt đầu = 5; mỗi đầu vòng mới = base 5 + interest + streak. Dùng để: mua tướng (theo cost), roll shop (1 vàng/lần), mua level (4 vàng/lần).
- **Level:** Bắt đầu 1; mua tối đa 10. Level = **số ô tối đa trên bàn cờ** (level 1 → 1 ô, level 10 → 10 ô).

---

## 3. Shop (Cửa hàng)

- **5 ô shop** mỗi lần; mỗi ô 1 tướng (hoặc trống).
- **Roll:** Tốn 1 vàng; làm mới 5 ô theo tỷ lệ cost của level hiện tại.
- **Mua:** Click ô tướng → trừ vàng đúng `champion.cost`, tướng vào **ghế dự bị** (bench). Ô đó thành trống (không refill đến khi roll).
- **Tỷ lệ cost theo level** (`SHOP_ODDS_BY_LEVEL`): level càng cao càng dễ ra tướng 3–5 vàng.

Ví dụ (phần trăm xuất hiện từng cost 1v→5v):

| Level | 1v   | 2v   | 3v   | 4v   | 5v   |
|-------|------|------|------|------|------|
| 1     | 100  | 0    | 0    | 0    | 0    |
| 5     | 45   | 33   | 20   | 2    | 0    |
| 10    | 5    | 10   | 20   | 40   | 25   |

- Mỗi ô roll độc lập: chọn cost theo bảng trên, rồi chọn ngẫu nhiên 1 tướng có đúng cost đó.

---

## 4. Bàn cờ & Ghế dự bị

- **Bàn cờ (board):** Tối đa **level** ô (1–10). Chỉ tướng trên bàn mới tham gia combat.
- **Ghế dự bị (bench):** 9 ô cố định. Tướng trên ghế không đánh; dùng để chứa và ghép sao.
- **Đặt tướng:** Chọn 1 tướng trên ghế (click) rồi click ô trống trên bàn → tướng lên bàn. Hoặc kéo thả từ ghế lên bàn.
- **Bỏ tướng khỏi bàn:** Click tướng trên bàn (hoặc kéo về ghế) → tướng xuống ghế. Nếu ghế đầy có thể đổi chỗ (kéo đè lên ô ghế).
- **Bán tướng:** Nút bán trên thẻ (bàn hoặc ghế) → trả lại vàng = `champion.cost`, xóa tướng khỏi bàn/ghế.

---

## 5. Ghép sao (Combine)

- **Luật:** Có **ít nhất 3** tướng cùng `champion_key` và cùng **sao** (1★, 2★ hoặc 3★) → tự động gộp thành **1** tướng **lên 1 sao** (1★→2★, 2★→3★).
- **Nơi áp dụng:** Cả **ghế** và **bàn**: đếm chung. Ưu tiên lấy từ ghế trước, thiếu mới lấy từ bàn. Tướng mới (sau ghép) luôn xuất hiện trên **ghế**.
- **Thời điểm:** Sau mỗi thao tác làm thay đổi ghế/bàn: mua tướng, đặt lên bàn, kéo từ bàn xuống ghế, kéo từ ghế lên bàn (kể cả khi có hoán đổi).
- **Sao tối đa:** 3★. Ghép 3 con 3★ vẫn chỉ còn 1 con 3★ (không lên 4★).
- **Mặt nạ khi ghép:** Giữ `mask_color` của một trong 3 con (ưu tiên từ bench).

---

## 6. Dữ liệu tướng (Champion)

Mỗi tướng có:

- `key`, `name`
- `tribe_key`, `class_key` (Tộc & Hệ – dùng cho buff 2/4/6)
- `cost` (1–5 vàng)
- `skill_name`, `skill_description`
- `base_hp`, `base_attack`, `base_armor`, `base_magic_resist`
- `default_mask_color`: `red` | `black` | `white` | `blue` (Hóa trang mặc định)

**Nguồn:** `src/data/vuDaiLoanTheChampions.js` (CHAMPIONS_STATIC). Có thể đồng bộ từ Supabase nếu bật.

---

## 7. Combat (Chiến đấu)

### 7.1. Cách chọn trận

- Mỗi vòng buying kết thúc → vào combat với **1 đối thủ còn sống** chọn **ngẫu nhiên** trong 7 bot.
- **Ghost:** Khi tổng số người còn sống (1 người chơi + đối thủ) là **lẻ**, với xác suất 1/totalAlive trận đấu là "ghost": vẫn đánh bảng địch bình thường nhưng **không trừ HP** đối thủ khi thắng.
- Đội hình địch: sinh bởi `botRandomBoard(championsMap, level, round)` (số lượng và cost gần giống shop theo level, tướng 1★, có áp trait buff).

### 7.2. Pipeline chỉ số (trước khi đánh)

Với mỗi tướng trên bàn (của mình hoặc địch):

1. **Base từ champion + sao:**  
   `mult = STAR_MULTIPLIERS[star]` (1★=1, 2★=1.8, 3★=3.2)  
   Máu, Tấn công, Giáp, Kháng phép = base × mult (làm tròn theo quy tắc trong code).
2. **Hóa trang (mặt nạ):** Áp `MASK_MODIFIERS[mask_color]` (xem bảng dưới).
3. **Buff Tộc & Hệ:** Đếm Tộc/Hệ trên **bàn** (2/4/6), cộng Giáp/Kháng phép và nhân (1 + damagePercent) cho Tấn công (theo `traitBuffs.js`).

### 7.3. Nhân theo sao (Phase A)

| Sao | Hệ số |
|-----|--------|
| 1★  | 1.0   |
| 2★  | 1.8   |
| 3★  | 3.2   |

Áp cho: `base_hp`, `base_attack`, `base_armor`, `base_magic_resist`.

### 7.4. Loại sát thương (Phase A)

- **Vật lý (physical):** Mặc định. Sát thương bị giảm bởi **Giáp** địch: `damage = attack * 100/(100 + armor)` (và floor, tối thiểu 1).
- **Phép (magic):** Giảm bởi **Kháng phép** địch: `damage = attack * 100/(100 + magic_resist)`.
- **Chân thật (true):** Không giảm theo Giáp/Kháng; damage = attack (tối thiểu 1).

**Tướng phép hiện tại (trong code):** Phàn Lê Huê, Tạ Ôn Đình, Hình Quan, Trịnh Ân, Hộ Giá Trung Thần.  
**Tướng chân thật:** Thiên Lý Kiếm. Còn lại là vật lý.

### 7.5. Hóa trang – Mặt nạ (Phase B)

| Màu  | Hiệu ứng (số trong code) |
|------|---------------------------|
| **Đỏ**   | Tấn công ×115%. |
| **Đen**  | +15 Giáp, +15 Kháng phép. |
| **Trắng**| Tấn công ×105%, +5 Giáp, +5 Kháng phép. |
| **Xanh** | Tấn công ×120%, +15% tỷ lệ chí mạng, sát thương chí mạng ×140%. |

- Mặt nạ mặc định theo `champion.default_mask_color`; khi ghép 3→1 giữ mask một trong ba con. Người chơi **không đổi** được mặt nạ trong UI.

### 7.6. Chí mạng (Bạo kích)

- **Mặc định:** 25% tỷ lệ, ×100% sát thương (tức khi crit = 1× attack, không cộng thêm).
- **Mặt nạ Xanh:** +15% tỷ lệ (→ 40%), ×140% sát thương khi crit.
- Trong combat: mỗi đòn có xác suất crit; nếu crit thì damage = attack × crit_damage rồi mới áp công thức Giáp/Kháng/True.

### 7.7. Diễn tiến 1 round combat

- Hai đội: A (người chơi), B (địch). Mỗi bên danh sách unit đã có `current_hp`, `attack`, `armor`, `magic_resist`, `damage_type`, `crit_chance`, `crit_damage`.
- Lặp đến khi một bên hết unit:
  - Chọn ngẫu nhiên 1 unit A đánh, 1 unit B làm mục tiêu.
  - Chọn ngẫu nhiên 1 unit B đánh, 1 unit A làm mục tiêu.
  - Tính damage A→B và B→A (qua `computeDamage`: crit → loại sát thương → giảm theo armor hoặc magic_resist hoặc true).
  - Trừ `current_hp` hai mục tiêu; loại unit chết (hp ≤ 0).
- **Thắng/thua:** Bên còn ít nhất 1 unit sống thắng. Nếu người chơi thua (A hết unit): trừ HP người chơi. Nếu địch thua (B hết unit): trừ HP đối thủ đó.

### 7.8. Sát thương lên người chơi / đối thủ (TFT-style)

- **Công thức:** Damage = **stage modifier** × **tổng cost** của từng tướng còn sống (sau combat). Cost 1 vàng → 1 damage, 2 vàng → 2, …, 5 vàng → 5.
- **Stage modifier:** Stage 1–2 → 1; Stage 3–4 → 2; Stage 5+ → 3.
- **Người chơi thua (A hết unit):**  
  `damageTaken = stageMod × (tổng cost các tướng địch còn sống)` → trừ HP người chơi.
- **Địch thua (B hết unit):**  
  `damageDealt = stageMod × (tổng cost các tướng mình còn sống)` → trừ HP đối thủ đó (trừ khi trận ghost thì damageDealt = 0 cho địch).

---

## 8. Buff Tộc & Hệ (Phase C)

- **Đếm:** Trên **bàn cờ** (board), đếm số tướng theo từng `tribe_key` và từng `class_key`.
- **Ngưỡng:** 2 / 4 / 6 tướng. Mỗi Tộc và mỗi Hệ có bảng buff riêng cho từng ngưỡng (trong `TRIBE_BUFFS`, `CLASS_BUFFS`).
- **Áp dụng:** Cộng flat Giáp/Kháng phép, cộng `damagePercent` rồi nhân Tấn công: `attack *= (1 + damagePercent)`. Buff của tất cả Tộc/Hệ đạt ngưỡng được **cộng dồn** (armor + armor, damagePercent + damagePercent, v.v.).
- **Thời điểm:** Tính **một lần** theo bàn cờ hiện tại, áp lên từng unit trước khi combat (trong `buildCombatUnits` và `botRandomBoard`).

Ví dụ Tộc/Hệ (chi tiết đủ 2/4/6 xem trong `constants/traitBuffs.js`):

- **Tộc:** Sơn Hậu (giáp + kháng), Tam Nữ Đồ Vương (% sát thương), Trảm Trịnh Ân (% sát thương), Tiết Đinh San (giáp + kháng + % sát thương), Lưu Kim Đính (giáp + kháng).
- **Hệ:** Võ Tướng, Đào Võ, Văn Quan, Trung Thần, Nịnh Thần, Hoàng Tộc, Sát Thủ, Phản Tặc – mỗi hệ có bảng 2/4/6 riêng (armor, magicResist, damagePercent).

---

## 9. Đối thủ (Bot)

- **7 đối thủ**, mỗi đối thủ 100 HP, không có bàn/ghế thật – mỗi combat đội hình sinh lại bằng `botRandomBoard`.
- **Số lượng tướng địch:** `baseUnits = 2 + min(level, 3)` + thêm mỗi 3 vòng (+1), tối đa 7. Level và round dùng level **người chơi** và **số vòng hiện tại**.
- **Cost tướng địch:** Dùng chung bảng tỷ lệ cost theo level như shop (`pickCostByLevel(level)`), nên level 1 địch chủ yếu 1 vàng, level cao mới nhiều 3–5 vàng.
- **Bàn cờ địch vừa đấu:** Lưu lại để hiển thị (trên màn hình và panel đối thủ); có thể click từng tướng để xem thông tin chi tiết.

---

## 10. Kết thúc trận & Hạng

- **Người chơi hết HP:** Thua. Hạng = `8 - số đối thủ đã chết` (ví dụ 7 đối thủ còn sống → hạng 8).
- **Tất cả đối thủ chết (trước khi người chơi chết):** Người chơi thắng. Hạng = 1.
- **Hết 30 vòng mà chưa ai hết:** Hạng = `1 + số đối thủ còn sống`, tối đa 8.

---

## 11. UI & Tính năng phụ

- **Xem thông tin tướng:** Click tướng trên **bàn**, **ghế**, **bàn cờ đối thủ** (trên sàn hoặc panel bên phải) → mở modal chi tiết (Phase A/B/C, chỉ số cuối sau buff, buff đang áp dụng tô màu). Shop không mở modal (click = mua).
- **Trong Châu / Đại Vũ Đại:** Có thanh năng lượng; mỗi combat +15, đủ 100 thì kích hoạt (logic đặc biệt có thể mở rộng sau).
- **Panel Tộc/Hệ:** Hiển thị số tướng từng Tộc/Hệ trên bàn.
- **Panel đối thủ:** Danh sách dọc 7 đối thủ (HP, tên); phần "Đội hình đối thủ vừa đấu" hiển thị lưới tướng địch vừa đấu.

---

## 12. File tham chiếu nhanh

| Cơ chế        | File chính |
|---------------|------------|
| Vòng chơi, shop, mua, đặt, bán, combat, HP | `src/components/VuDaiLoanThe/index.jsx` |
| Ghép sao (bench + board) | `index.jsx` (combineBenchAndBoard, combineBenchUnits) |
| Combat: damage, sao, mặt nạ, crit, loại ST | `src/components/VuDaiLoanThe/utils/combatResolver.js` |
| Buff Tộc/Hệ 2/4/6 | `src/components/VuDaiLoanThe/constants/traitBuffs.js` |
| Tỷ lệ shop theo level | `src/components/VuDaiLoanThe/constants/shopOdds.js` |
| Data 30 tướng | `src/data/vuDaiLoanTheChampions.js` |
| Tộc/Hệ (tên, key) | `src/components/VuDaiLoanThe/constants/tribes.js`, `classes.js` |

---

*Tài liệu sinh từ code, cập nhật lần cuối theo codebase hiện tại.*
