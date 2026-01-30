# Hướng dẫn dữ liệu & triển khai (thiên về code, ít phụ thuộc design)

Tài liệu này giúp mở rộng hoặc chỉnh nội dung app **chủ yếu bằng cách sửa dữ liệu**, không cần thay đổi nhiều giao diện hay đồ họa.

---

## 1. Nguyên tắc: Data-driven

- **Nội dung** (vở diễn, cảnh, mặt nạ, nhân vật, đạo cụ) nằm trong các file data.
- **UI** chỉ đọc data và hiển thị; thêm/sửa nội dung = sửa file data, không cần design mới.
- **Khám Phá Cảnh** dùng danh sách cảnh + đạo cụ từ data, không dùng 3D canvas → dễ bảo trì, dễ thêm cảnh mới.

---

## 2. Cấu trúc dữ liệu chính

### 2.1 Vở diễn (Xem Tuồng)

**File:** `src/components/TuongPerformance.jsx` (mảng `performances`), hoặc nên tách ra `src/data/performanceData.js`.

Mỗi vở có:

- `id`: số, duy nhất (1, 2, 3, …).
- `title`, `description`, `duration`, `category`.
- `content`, `meaning`: đoạn văn mô tả.
- **`scenes`**: mảng **các cảnh chính** (khớp với nội dung video):
  - `name`: tên cảnh (vd: "Vua mất, gian thần cướp ngôi").
  - `time`: thời điểm (vd: "0:00", "25:00").

Khi thêm vở mới: thêm 1 object vào `performances` và đảm bảo có `scenes` với `name` + `time`.

---

### 2.2 Cảnh & đạo cụ (Khám Phá Cảnh)

**File:** `src/data/sceneData.js`

- **`performanceSceneIdMap`**: object `{ [performanceId]: [sceneId, sceneId, ...] }`.  
  Số phần tử = số cảnh chính của vở đó. Mỗi phần tử là `sceneId` (1–5) dùng để lấy đạo cụ và mô tả cảnh.

- **`sceneBackgrounds`**: `{ [sceneId]: { name, description, sceneType } }`.  
  Mô tả ngắn cho từng loại cảnh (Chiến Trường, Doanh Trại, Triều Đình, …).

- **`sceneObjects`**: `{ [sceneId]: [ { id, name, emoji, description, details: { material, meaning, history, usage } }, ... ] }`.  
  Danh sách đạo cụ hiển thị khi chọn cảnh đó.

**Thêm cảnh mới / đạo cụ mới:**

1. Thêm hoặc tái dùng `sceneId` trong `sceneBackgrounds` và `sceneObjects`.
2. Cập nhật `performanceSceneIdMap[performanceId]` để cảnh chính của vở trỏ đúng `sceneId` (theo thứ tự).

---

### 2.3 Mặt nạ & nhân vật

**File:** `src/data/tuongData.js`

- **`maskData`**: mảng mặt nạ (id, name, imagePath, description, …).  
  Thêm mặt nạ = thêm object + ảnh trong `public/masks/`.

- **`characterData`**: mảng nhân vật (id, name, type, emoji, maskId, costume, story).  
  `maskId` trỏ tới mặt nạ trong `maskData`.

---

## 3. Luồng kỹ thuật Khám Phá Cảnh (không 3D)

1. User chọn **vở** (video) → `performanceId` + `performance.scenes`.
2. **Các cảnh chính** = `performance.scenes` (đúng tên + thời gian như bên cạnh video).
3. Với mỗi cảnh (index `i`), **sceneId** = `performanceSceneIdMap[performanceId][i]`.
4. **Đạo cụ** = `sceneObjects[sceneId]` → hiển thị dạng card; click card → modal chi tiết (description + details).

Không dùng Three.js, Canvas 3D hay asset 3D; mọi thứ đều từ `sceneData.js` và `performances`.

---

## 4. Gợi ý mở rộng thiên về code

- **Tìm kiếm:** filter mặt nạ / vở / thuật ngữ theo từ khóa (đọc từ `maskData`, `performances`, `glossaryData`).
- **Từ điển Tuồng:** trang hoặc modal liệt kê `glossaryData`, có ô tìm kiếm.
- **Tách data ra file riêng:** `performanceData.js` cho vở diễn để dễ chỉnh và tái sử dụng.
- **Schema rõ ràng:** giữ cấu trúc object (id, name, scenes, …) nhất quán; có thể bổ sung JSDoc hoặc TypeScript types sau.

Như vậy app vẫn thú vị (khám phá cảnh, đạo cụ, vở) nhưng **dễ triển khai và mở rộng bằng code và dữ liệu**, ít phụ thuộc vào graphic design hay 3D.
