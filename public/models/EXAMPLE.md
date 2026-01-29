# Ví Dụ Cách Thêm File 3D

## Ví Dụ 1: Thêm Mặt Nạ 3D

### Bước 1: Đặt file vào thư mục
```
public/models/masks/mask-quan-van.glb
```

### Bước 2: Cập nhật `src/data/tuongData.js`

```javascript
{
  id: 1,
  name: 'Mặt Nạ Quan Văn',
  emoji: '👑',
  modelPath: '/models/masks/mask-quan-van.glb', // ← Thêm dòng này
  description: 'Mặt nạ đại diện cho các quan văn trong Tuồng',
  color: '#4a90e2',
  // ...
}
```

## Ví Dụ 2: Thêm Trang Phục 3D

### Bước 1: Đặt file vào thư mục
```
public/models/characters/costume-quan-vo.glb
```

### Bước 2: Cập nhật `src/data/costumeData.js`

```javascript
{
  id: 2,
  name: 'Trang Phục Quan Võ',
  modelPath: '/models/characters/costume-quan-vo.glb', // ← Thêm dòng này
  color: '#e74c3c',
  description: 'Áo giáp đỏ, mũ quan, râu dài',
  emoji: '⚔️',
  type: 'quan-vo',
  // ...
}
```

## Ví Dụ 3: Thêm Vật Thể 3D

### Bước 1: Đặt file vào thư mục
```
public/models/objects/sword.glb
```

### Bước 2: Cập nhật `src/data/sceneData.js`

```javascript
{
  id: 'sword',
  name: 'Thanh Kiếm',
  emoji: '⚔️',
  modelPath: '/models/objects/sword.glb', // ← Thêm dòng này
  position: { x: 20, y: 30 },
  description: 'Thanh kiếm của Quan Công...',
  // ...
}
```

## Lưu Ý Quan Trọng

1. **Đường dẫn phải bắt đầu với `/models/`** - đây là đường dẫn từ thư mục `public`
2. **Tên file không nên có khoảng trắng** - dùng dấu gạch ngang `-` thay vì khoảng trắng
3. **Nếu không có file 3D**, hệ thống sẽ tự động dùng procedural model (model tạo bằng code)
4. **File GLB được khuyến nghị** vì nó nhẹ và nhanh hơn GLTF

## Kiểm Tra

Sau khi thêm file và cập nhật data:
1. Restart dev server: `npm run dev`
2. Kiểm tra console để xem có lỗi load model không
3. Nếu file 3D không hiển thị, hệ thống sẽ tự động fallback về procedural model


