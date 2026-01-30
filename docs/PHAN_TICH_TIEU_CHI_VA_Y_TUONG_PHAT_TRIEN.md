# Phân tích tiêu chí vòng loại & ý tưởng phát triển

## 1. Tiêu chí WEB DESIGN INNOVATION 2026 (từ file PPTX)

### Bắt buộc
- **Ý tưởng sáng tạo**: Vấn đề thực tế rõ ràng, không sao chép, hướng tiếp cận mới hoặc ngách cụ thể.
- **Tính khả thi**: Cách sử dụng rõ ràng, đối tượng người dùng xác định, chức năng có thể triển khai.
- **Concept**: Theme, màu sắc, cảm xúc rõ ràng; có storytelling / thông điệp.
- **UI**: 3–5 màn hình chính, bố cục cân đối, màu sắc & typography nhất quán, design system.
- **UX**: Dễ sử dụng (hiểu trong vài giây), user flow rõ, navigation không lạc; **desktop bắt buộc**, mobile khuyến khích.
- **Trình bày**: Rõ ràng, logic.

### Khuyến khích mạnh
- **Ứng dụng AI**: Gợi ý, chatbot, cá nhân hóa, tìm kiếm. Có thể **mockup / flow / demo**, không bắt buộc chạy thật.
- Video 3–5 phút, mobile responsive.

### Không bắt buộc
- Backend hoàn chỉnh.

---

## 2. Công nghệ chụp ảnh hiện tại trong hệ thống

| Thành phần | Công nghệ | Chức năng |
|------------|-----------|-----------|
| Camera | `getUserMedia` | Live stream video mặt người dùng |
| Tách nền người | MediaPipe Tasks Vision (DeepLab v3) | Segment "person" → mask alpha để giữ người, thay nền |
| Face tracking | face-api.js (TinyFaceDetector + 68 landmarks) | Vị trí & góc mặt để đặt mặt nạ |
| Mặt nạ | Ảnh PNG (maskData.imagePath) hoặc vẽ 2D | Overlay lên mặt theo face box/landmarks |
| Nền ảnh | Danh sách ảnh tĩnh (`BACKGROUND_IMAGES`) | Vẽ nền → vẽ người (alpha từ segment) → vẽ mặt nạ |
| Chụp ảnh | Canvas 2D → `toDataURL('image/png')` | Export 1 ảnh, lật mirror, download |

**Điểm mạnh đã có**: Pipeline “camera → tách nền → thay nền → mặt nạ theo mặt → chụp” đã hoạt động, phù hợp để làm **trải nghiệm chụp ảnh** (photo booth) Tuồng.

**Điểm khó**: AR face mask + segment person + nhiều màn hình (Gallery, AI Explainer, 3D, Performance) khiến scope rộng, khó bảo trì và trình bày “ý tưởng rõ, khả thi”.

---

## 3. Vấn đề với ý tưởng hiện tại (tại sao “không oke”)

- **Scope quá rộng**: Nền tảng Tuồng với nhiều tính năng (bộ sưu tập, nhân vật, AI giải thích, AR, 3D, xem biểu diễn) → khó làm sâu từng phần, khó kể câu chuyện “một vấn đề – một giải pháp”.
- **Phụ thuộc nhiều**: Face detection (CDN/weights), MediaPipe (WASM, model), 3D (Three.js, GLB) → dễ lỗi môi trường, khó demo ổn định.
- **AI “giả”**: AI Explainer dùng dữ liệu tĩnh, không thực sự AI → khó thuyết phục tiêu chí “ứng dụng AI” dù cho phép mock.
- **Thông điệp chưa gắn với “chụp ảnh”**: Giá trị chính lại là trải nghiệm chụp ảnh (AR + thay nền), nhưng sản phẩm lại trình bày như “nền tảng đa tính năng”.

---

## 4. Đề xuất: Thu gọn thành “Tuồng Photo Booth” + AI gợi ý (mock được)

### 4.1 Ý tưởng trong một câu
**“Một trải nghiệm chụp ảnh hóa thân nhân vật Tuồng (mặt nạ + nền đẹp), tải/chia sẻ ảnh, kèm gợi ý mặt nạ bằng AI (mock) và câu chuyện văn hóa ngắn.”**

### 4.2 Vấn đề thực tế
- Giới trẻ ít biết Tuồng, cảm thấy xa lạ.
- Thiếu trải nghiệm “cá nhân hóa” dễ chia sẻ (ảnh đẹp, viral được).

### 4.3 Giải pháp (tận dụng đúng công nghệ hiện có)
- **Một luồng chính**: Vào web → Bật camera → Chọn mặt nạ Tuồng → Chọn nền (phong cảnh / sân khấu) → Chụp → Xem / Tải / Chia sẻ.
- **Không cần thêm**: 3D viewer, “xem Tuồng”, AI explainer phức tạp; có thể gộp “giới thiệu Tuồng” vào 1 màn hình đơn giản (About / Từ điển ngắn).

### 4.4 UI – 3–5 màn hình rõ ràng
1. **Trang chủ**: Hero + thông điệp (“Chụp ảnh hóa thân Tuồng”) + CTA “Bắt đầu chụp”.
2. **Chụp ảnh**: Camera + chọn mặt nạ + chọn nền + nút chụp (đúng flow hiện tại).
3. **Kết quả**: Xem ảnh vừa chụp, nút “Tải ảnh”, “Chụp lại”, gợi ý hashtag (#TuongVietNam).
4. **Giới thiệu Tuồng (ngắn)**: 1 màn hình: vài dòng về Tuồng + 6 loại mặt nạ (emoji + tên + 1 câu), không cần gallery phức tạp.
5. **Tuỳ chọn – “Bạn là vai nào?”**: Quiz 2–3 câu (mock AI) → gợi ý mặt nạ → dẫn vào màn chụp.

### 4.5 Ứng dụng AI (khuyến khích, có thể mock)
- **Gợi ý mặt nạ**: “Bạn thích vai anh hùng hay hài?” → Quan Võ / Hề. “Bạn thích nữ tính hay uy quyền?” → Nữ / Quan Văn. Implement bằng **rule + text sẵn**, trình bày như “AI gợi ý cá nhân hóa”.
- **Caption cho ảnh**: Sau khi chụp, hiển thị 1 câu kiểu “Hôm nay tôi là [Quan Công] – Tuồng Việt Nam” (template theo mặt nạ đã chọn) → copy để share.

Như vậy đáp ứng tiêu chí “định hướng ứng dụng AI” mà không cần backend hay model thật.

### 4.6 Giá trị thương mại (Business)
- **Target**: Giới trẻ, khách du lịch, trường học, event.
- **Value**: Trải nghiệm văn hóa dễ tiếp cận; UGC (ảnh Tuồng) lan truyền; có thể đặt booth tại lễ hội, bảo tàng, điểm du lịch.

### 4.7 Lợi ích so với ý tưởng hiện tại
- **Đơn giản**: Tập trung vào 1 luồng “chụp ảnh”, đúng với công nghệ đã có.
- **Dễ demo**: Bật camera → chọn mặt nạ + nền → chụp → tải ảnh; ổn định hơn khi bỏ bớt 3D và nhiều tính năng.
- **Ý tưởng rõ**: “Tuồng Photo Booth” – vấn đề (xa lạ) + giải pháp (trải nghiệm chụp ảnh vui, dễ share).
- **AI rõ ràng**: Gợi ý mặt nạ (rule-based) + caption ảnh, dễ trình bày trong slide và phản biện.

---

## 5. Các bước triển khai gợi ý

1. **Thu gọn route/màn hình**: Giữ Home, Experience (chụp ảnh), có thể gộp Mask Gallery + Character vào 1 trang “Giới thiệu Tuồng”. Ẩn hoặc bỏ tạm: 3D Viewer, TuongPerformance, AIExplainer dạng cũ.
2. **Thêm màn “Kết quả”**: Sau khi chụp → chuyển sang view “Xem ảnh + Tải + Chụp lại + caption mẫu”.
3. **Thêm “Bạn là vai nào?”**: 1 trang quiz đơn giản (2–3 câu, nút chọn) → set `selectedMask` theo kết quả → chuyển sang màn chụp với mặt nạ đã gợi ý.
4. **Caption theo mặt nạ**: Trong `tuongData` thêm field `captionTemplate` (ví dụ `"Hôm nay tôi là {name} – Tuồng Việt Nam"`), sau khi chụp hiển thị + nút copy.
5. **Chuẩn bị trình bày**: Slide nhấn mạnh “Tuồng Photo Booth”, vấn đề (giới trẻ xa lạ Tuồng), giải pháp (chụp ảnh hóa thân), công nghệ (tách nền + face + thay nền), AI (gợi ý mặt nạ + caption).

---

## 6. Tóm tắt

| Tiêu chí | Cách đáp ứng với ý tưởng mới |
|----------|------------------------------|
| Ý tưởng độc đáo | Tuồng Photo Booth – ngách rõ, không sao chép |
| Tính khả thi | Một luồng chính, dùng đúng pipeline camera/segment/mask hiện có |
| UI/UX | 3–5 màn: Home, Chụp ảnh, Kết quả, Giới thiệu Tuồng, (Quiz) |
| AI | Gợi ý mặt nạ (rule) + caption ảnh; có thể mock |
| Giá trị | Giáo dục văn hóa qua trải nghiệm vui, UGC, có thể gắn du lịch/event |

File này dùng để tham chiếu khi chỉnh lại ý tưởng và cấu trúc sản phẩm cho phù hợp tiêu chí vòng loại và dễ triển khai hơn.

---

## 7. Ý tưởng hiện đại hơn (không liên quan Tuồng, hấp dẫn hơn)

Các ý tưởng dưới đây **tận dụng đúng pipeline hiện có**: camera → tách nền người → thay nền → overlay (face/body) → chụp ảnh. Chỉ đổi nội dung (nền, overlay, storytelling) và đối tượng người dùng.

---

### 7.1 🎯 AI Profile Photo / Headshot Generator

**Một câu:** Chụp ảnh chân dung → tách nền → thay nền chuyên nghiệp (văn phòng, trung tính, gradient) → tải ảnh dùng cho LinkedIn, CV, email.

**Vì sao hiện đại & hấp dẫn:**
- Ai cũng cần ảnh đại diện đẹp; đi studio tốn tiền, selfie thường kém chất lượng.
- Trend "LinkedIn headshot", "professional photo" rất rõ, đặc biệt Gen Z đi xin việc / freelance.
- Giá trị thương mại rõ: freemium (vài nền free, nền premium), hoặc B2B (công ty mua cho nhân viên).

**Tech fit:** Giữ nguyên: camera, segment person, thay nền. **Bỏ face mask**; có thể thêm crop/zoom mặt cho tỷ lệ “headshot”. Nền: ảnh văn phòng, tường trung tính, gradient.

**AI (mock):** “Gợi ý nền phù hợp tính cách” (quiz 1–2 câu → chọn nền), hoặc “Gợi ý tỷ lệ crop” (rule đơn giản).

**UI:** Trang chủ → Chụp / Upload ảnh → Chọn nền → Crop (optional) → Tải. 3–4 màn là đủ.

---

### 7.2 👓 Virtual Try-On (Kính / Mũ / Phụ kiện)

**Một câu:** Bật camera → chọn kính râm / mũ / băng đô (ảnh PNG overlay lên mặt theo face tracking) → chọn nền đẹp → chụp → tải / chia sẻ.

**Vì sao hiện đại & hấp dẫn:**
- E-commerce và social commerce đang đẩy “try before you buy”; Gen Z quen filter Instagram, TikTok.
- Rất dễ kể câu chuyện: “Thử kính ảo trước khi mua”, “Tạo ảnh style mới”.
- Có thể mở rộng: link đến shop, affiliate.

**Tech fit:** **Giống hệt hiện tại**: face tracking + overlay PNG lên mặt. Chỉ đổi từ “mặt nạ Tuồng” sang “kính / mũ” (PNG trong suốt). Segment person + thay nền giữ nguyên.

**AI (mock):** “Gợi ý phụ kiện theo khuôn mặt” (face shape → gợi ý kính tròn/vuông), hoặc “Style của bạn là gì?” → gợi ý 3–4 item.

**UI:** Trang chủ → Chụp → Chọn phụ kiện (grid) → Chọn nền → Chụp → Kết quả + CTA “Mua sản phẩm tương tự” (link out).

---

### 7.3 🎭 Meme & Sticker Generator (Face in Meme)

**Một câu:** User chụp mặt → đặt mặt vào template meme (Drake, Distracted Boyfriend, “This is fine”, custom) hoặc sticker (khung + nền đẹp) → tải / share.

**Vì sao hiện đại & hấp dẫn:**
- Meme và sticker là ngôn ngữ của Gen Z; share cao, viral dễ.
- Không cần “văn hóa” nặng, dễ vào, dễ kể: “Tạo meme của riêng bạn trong 10 giây”.
- Có thể gắn trend (sự kiện, lễ, năm mới) → làm seasonal campaign.

**Tech fit:** Camera + face detection → crop mặt (hoặc toàn thân nếu dùng segment) → paste vào ô trống trong template meme (canvas 2D). Thay nền cho “sticker” style: segment person + nền đẹp + khung. **Không bắt buộc face mask**; chủ yếu là composite mặt vào template.

**AI (mock):** “Gợi ý meme theo tâm trạng” (chọn emoji/1 câu → gợi ý template), hoặc “Caption tự động” cho sticker (template theo thời gian/event).

**UI:** Trang chủ → Chọn “Meme” hoặc “Sticker” → Chụp / Upload → Chọn template → Chụp → Tải / Share.

---

### 7.4 🎪 Event Photo Booth (Web cho tiệc / sự kiện)

**Một câu:** Khách vào link → bật camera → chọn khung + nền theo chủ đề sự kiện (sinh nhật, wedding, conference, năm mới) → chụp → tải ảnh (có thể có logo công ty / hashtag event).

**Vì sao hiện đại & hấp dẫn:**
- Event offline luôn cần photo booth; làm phiên bản web = không cần thiết bị, chỉ cần điện thoại/laptop.
- B2B rõ: công ty tổ chức event, wedding planner, trường học. Có thể thu phí theo event hoặc subscription.
- Storytelling: “Photo booth cho mọi sự kiện, không cần máy móc”.

**Tech fit:** Giống hiện tại: camera, segment person, thay nền. Overlay = **khung** (frame) quanh ảnh, có thể có logo/text. Nền = bộ ảnh theo chủ đề (birthday, wedding, corporate). Không cần face mask phức tạp.

**AI (mock):** “Gợi ý khung theo loại sự kiện” (chọn: sinh nhật / cưới / họp → gợi ý 3–4 combo nền + khung).

**UI:** Trang chủ (có thể có “Nhập mã event”) → Chụp → Chọn chủ đề / khung → Chụp → Kết quả (logo event, hashtag).

---

### 7.5 🧩 “Alter Ego” Photo Booth (Personality → Style ảnh)

**Một câu:** Làm quiz “Bạn là nhân vật / vibe nào?” (Marvel, anime, aesthetic, KOL…) → “AI” gợi ý style (khung + nền + caption) → chụp ảnh với style đó → tải / share.

**Vì sao hiện đại & hấp dẫn:**
- Personality quiz cực kỳ viral trên social; kết hợp với ảnh đẹp = share cao.
- Không gắn văn hóa cụ thể (Tuồng), dễ đa dạng: pop culture, aesthetic, music, movie.
- Có thể cập nhật trend (phim mới, idol, season).

**Tech fit:** Camera + segment + thay nền. Overlay có thể **nhẹ**: khung + text caption (không cần face mask). Mỗi “personality” = 1 bộ (nền + khung + caption). Quiz chỉ map câu trả lời → bộ đó.

**AI (mock):** Quiz 3–5 câu (“Bạn thích thể loại gì?”, “Tâm trạng hôm nay?”) → rule-based gợi ý “Alter Ego” + bộ nền/khung tương ứng. Trình bày là “AI phân tích tính cách”.

**UI:** Trang chủ → Làm quiz → Kết quả “Bạn là…” + CTA “Chụp ảnh Alter Ego” → Chụp (nền + khung đã set) → Kết quả + Share.

---

## 8. So sánh nhanh – chọn ý tưởng

| Ý tưởng | Hiện đại / Viral | Tech tái dùng | Giá trị thương mại | Độ khó |
|---------|------------------|---------------|---------------------|--------|
| **AI Profile Photo** | ⭐⭐⭐ Rất thực tế | Cao (bỏ mask, thêm crop) | Cao (B2C/B2B) | Thấp |
| **Virtual Try-On** | ⭐⭐⭐ Trend e-commerce | Rất cao (đổi PNG mask) | Cao (e-commerce, affiliate) | Thấp |
| **Meme & Sticker** | ⭐⭐⭐ Rất viral | Cao (composite mặt + template) | Trung (ads, brand) | Trung bình |
| **Event Photo Booth** | ⭐⭐ Rõ B2B | Rất cao (khung + nền) | Cao (event, wedding) | Thấp |
| **Alter Ego** | ⭐⭐⭐ Viral quiz + ảnh | Cao (nền + khung + quiz) | Trung (engagement, brand) | Thấp |

**Gợi ý:** Nếu muốn **hấp dẫn + dễ làm + tận dụng tối đa code hiện tại** → ưu tiên **Virtual Try-On** hoặc **AI Profile Photo**. Nếu muốn **viral mạnh, dễ kể chuyện** → **Meme & Sticker** hoặc **Alter Ego**.
