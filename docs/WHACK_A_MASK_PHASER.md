# Whack-a-Mask Phaser Version

## Tổng Quan

Phiên bản game Whack-a-Mask được viết lại bằng PhaserJS với animation mượt mà và hiệu ứng đẹp mắt hơn.

## Tính Năng Mới

### 1. Animation Mượt Mà
- **Tween System**: Sử dụng Phaser Tween với ease functions (Back.easeOut, Cubic.easeIn)
- **Smooth Movement**: Mặt nạ nhô lên/xuống với animation tự nhiên
- **Bounce Effect**: Hiệu ứng nảy khi mặt nạ xuất hiện

### 2. Hiệu Ứng Đặc Biệt
- **Particle Effects**: Hiệu ứng hạt khi đập trúng mặt nạ
- **Camera Shake**: Rung màn hình khi đập và khi bắt đầu game
- **Smash Effect**: Hiệu ứng búa xuất hiện khi đập trúng
- **Hover Effect**: Mặt nạ sáng lên khi di chuột qua

### 3. Layering System
Giữ nguyên cơ chế layering 3 lớp như phiên bản CSS:
```
Layer 0 (Depth 0): Hố dưới (hole-bottom)
Layer 1 (Depth 1): Mặt nạ (mask) - có thể click
Layer 2 (Depth 2): Viền hố trên (hole-top)
Layer 3 (Depth 3): Hiệu ứng smash
```

### 4. Performance
- **WebGL Rendering**: Tận dụng GPU acceleration
- **Object Pooling**: Phaser tự động quản lý objects
- **Optimized Tweens**: Animation được tối ưu bởi Phaser engine

## Cấu Trúc Code

### WhackAMaskScene (Phaser Scene)
- Quản lý game logic
- Tạo 9 holes trong grid 3x3
- Spawn moles ngẫu nhiên
- Tracking score và game state

### MoleHole Class
- Quản lý từng hole riêng lẻ
- Handle animations (popup/hide)
- Click detection
- Visual effects

### WhackAMaskPhaser (React Component)
- Wrapper component cho Phaser game
- Quản lý UI state (isPlaying, score, gameOver)
- Integration với React lifecycle

## Routes

- **Phiên bản CSS**: `/game/kiem-lua`
- **Phiên bản Phaser**: `/game/kiem-lua-phaser`

## Cách Chạy

```bash
# Đã cài đặt Phaser
npm install phaser

# Chạy dev server
npm run dev

# Truy cập
http://localhost:5173/game/kiem-lua-phaser
```

## Assets Cần Thiết

Game sử dụng các assets có sẵn:
- `/game-assets/mole-hole.png` - Hố dưới
- `/game-assets/mole-hole-2.png` - Viền hố trên
- `/game-assets/mole.png` - Mặt nạ/chuột
- `/game-assets/smash.png` - Hiệu ứng đập

## So Sánh Với Phiên Bản CSS

| Tính Năng | CSS Version | Phaser Version |
|-----------|-------------|----------------|
| Animation | CSS Transform | Phaser Tweens |
| Ease Functions | CSS ease | 20+ ease types |
| Particle Effects | ❌ | ✅ |
| Camera Shake | Manual | Built-in |
| Performance | Good | Excellent |
| Mobile Support | Good | Excellent |
| Extensibility | Limited | High |

## Tính Năng Có Thể Mở Rộng

### 1. Multiple Mask Types
```javascript
const maskTypes = ['mask1', 'mask2', 'mask3']
const randomMask = Phaser.Utils.Array.GetRandom(maskTypes)
this.mask = scene.add.sprite(x, y, randomMask)
```

### 2. Combo System
```javascript
if (consecutiveHits >= 3) {
  this.showComboText('COMBO x3!')
  score += bonusPoints
}
```

### 3. Power-ups
```javascript
// Slow motion power-up
scene.time.timeScale = 0.5
```

### 4. Sound Effects
```javascript
this.load.audio('hit', '/sounds/hit.mp3')
this.load.audio('miss', '/sounds/miss.mp3')
this.sound.play('hit')
```

### 5. Difficulty Levels
```javascript
const spawnDelay = difficulty === 'easy' ? 1000 : 500
const popupDuration = difficulty === 'hard' ? 400 : 800
```

## Troubleshooting

### Game không hiển thị
- Kiểm tra console có lỗi load assets không
- Đảm bảo các file assets tồn tại trong `/public/game-assets/`

### Performance chậm
- Giảm số lượng particles
- Tắt camera shake nếu cần
- Kiểm tra WebGL có được enable không

### Click không hoạt động
- Kiểm tra `.setInteractive()` đã được gọi
- Verify depth/z-index của các sprites
- Kiểm tra pointer events không bị block

## Credits

- **Game Engine**: PhaserJS 3
- **Framework**: React 18
- **Original Design**: WhackAMaskIntro component
- **Assets**: Tuồng traditional masks

## License

Part of Tuồng Interactive Platform
