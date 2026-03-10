# 🎮 Hướng Dẫn Game Whack-a-Mask Phaser

## ✅ Đã Hoàn Thành

Game Whack-a-Mask đã được làm lại bằng PhaserJS với các tính năng nâng cao!

## 🚀 Cách Truy Cập

### 1. Chạy Development Server
```bash
npm run dev
```

### 2. Truy Cập Các Routes

- **Trang chọn game**: http://localhost:5173/game
- **Phiên bản CSS (cũ)**: http://localhost:5173/game/kiem-lua
- **Phiên bản Phaser (mới)**: http://localhost:5173/game/kiem-lua-phaser

## 🎯 Tính Năng Mới Trong Phiên Bản Phaser

### 1. Animation Mượt Mà
- ✨ Tween system với ease functions (Back.easeOut, Cubic.easeIn)
- ✨ Mặt nạ nhô lên/xuống với hiệu ứng bounce tự nhiên
- ✨ Smooth transitions cho mọi chuyển động

### 2. Hiệu Ứng Đặc Biệt
- 💥 **Particle Effects**: Hạt bay ra khi đập trúng mặt nạ
- 📷 **Camera Shake**: Rung màn hình khi đập và bắt đầu game
- 🔨 **Smash Effect**: Hiệu ứng búa xuất hiện khi đập trúng
- ✨ **Hover Effect**: Mặt nạ sáng lên khi di chuột qua

### 3. Layering System (Giữ Nguyên Cơ Chế)
```
Layer 0: Hố dưới (hole-bottom)
Layer 1: Mặt nạ (mask) - có thể click
Layer 2: Viền hố trên (hole-top) - tạo hiệu ứng "chui ra"
Layer 3: Hiệu ứng smash
```

### 4. Performance
- ⚡ WebGL rendering (GPU acceleration)
- ⚡ 60 FPS smooth gameplay
- ⚡ Optimized object pooling

## 📁 Files Đã Tạo

```
src/components/
├── WhackAMaskPhaser.jsx      # Component chính (Phaser + React)
├── WhackAMaskPhaser.css       # Styles cho Phaser version
├── GameSelector.jsx           # Trang chọn phiên bản game
└── GameSelector.css           # Styles cho selector

docs/
└── WHACK_A_MASK_PHASER.md    # Documentation chi tiết
```

## 🎮 Cách Chơi

1. Truy cập http://localhost:5173/game/kiem-lua-phaser
2. Click nút "CHƠI NGAY"
3. Đập vào mặt nạ khi chúng nhô lên
4. Ghi điểm càng cao càng tốt trong 16 lượt

## 🔧 Cấu Trúc Code

### WhackAMaskScene (Phaser Scene)
```javascript
class WhackAMaskScene extends Phaser.Scene {
  - preload(): Load assets
  - create(): Setup game board (3x3 grid)
  - startGame(): Bắt đầu game
  - spawnMole(): Spawn mole ngẫu nhiên
  - endGame(): Kết thúc game
}
```

### MoleHole Class
```javascript
class MoleHole {
  - popup(): Animation nhô lên
  - hide(): Animation xuống
  - onHit(): Xử lý khi đập trúng
}
```

### WhackAMaskPhaser (React Component)
```javascript
- Wrapper cho Phaser game
- Quản lý UI state
- Integration với React
```

## 🎨 Customization

### Thay Đổi Tốc Độ Game
```javascript
// Trong WhackAMaskScene.spawnMole()
this.time.delayedCall(700, () => {  // Thay đổi 700 thành giá trị khác
  this.spawnMole()
})
```

### Thay Đổi Số Lượt
```javascript
// Trong WhackAMaskScene.startGame()
this.roundsLeft = 16  // Thay đổi số lượt
```

### Thêm Mặt Nạ Mới
```javascript
// Trong preload()
this.load.image('mask2', '/masks/new-mask.png')

// Trong MoleHole constructor
const masks = ['mask', 'mask2', 'mask3']
const randomMask = Phaser.Utils.Array.GetRandom(masks)
this.mask = scene.add.sprite(x, y, randomMask)
```

## 🐛 Troubleshooting

### Game không hiển thị
- Kiểm tra console có lỗi không
- Đảm bảo assets tồn tại trong `/public/game-assets/`
- Verify Phaser đã được cài đặt: `npm list phaser`

### Click không hoạt động
- Kiểm tra `.setInteractive()` đã được gọi
- Verify depth/z-index của sprites
- Kiểm tra pointer events

### Performance chậm
- Giảm số lượng particles
- Tắt camera shake
- Kiểm tra WebGL có được enable

## 📊 So Sánh Phiên Bản

| Tính Năng | CSS | Phaser |
|-----------|-----|--------|
| Animation | CSS Transform | Phaser Tweens ✨ |
| Ease Functions | 4 types | 20+ types ✨ |
| Particle Effects | ❌ | ✅ ✨ |
| Camera Shake | Manual | Built-in ✨ |
| Performance | Good | Excellent ✨ |
| Extensibility | Limited | High ✨ |

## 🚀 Tính Năng Có Thể Thêm

1. **Multiple Mask Types**: Nhiều loại mặt nạ khác nhau
2. **Combo System**: Điểm thưởng khi đập liên tiếp
3. **Power-ups**: Slow motion, freeze time, etc.
4. **Sound Effects**: Âm thanh khi đập, miss, combo
5. **Difficulty Levels**: Easy, Normal, Hard
6. **Leaderboard**: Lưu điểm cao nhất
7. **Mobile Touch**: Tối ưu cho mobile

## 📚 Tài Liệu Tham Khảo

- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/)
- [Phaser Examples](https://phaser.io/examples)
- [Tween Documentation](https://photonstorm.github.io/phaser3-docs/Phaser.Tweens.Tween.html)

## 🎉 Kết Luận

Game đã được làm lại thành công với PhaserJS! Animation mượt mà hơn, nhiều hiệu ứng đẹp mắt, và performance tốt hơn. Cơ chế layering 3 lớp được giữ nguyên như bạn yêu cầu.

Chúc bạn chơi game vui vẻ! 🎮✨
