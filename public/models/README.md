# Hướng Dẫn Sử Dụng File 3D

## Cấu Trúc Thư Mục

```
public/
  models/
    masks/          # File 3D cho mặt nạ
    characters/     # File 3D cho nhân vật/trang phục
    objects/        # File 3D cho vật thể trong cảnh
```

## Định Dạng File Hỗ Trợ

- **GLB** (khuyến nghị): `.glb` - Binary GLTF, nhẹ và nhanh
- **GLTF**: `.gltf` - Text-based GLTF, cần file `.bin` và textures đi kèm
- **OBJ**: `.obj` - Cần file `.mtl` cho materials

## Cách Thêm File 3D

### 1. Đặt File 3D Vào Thư Mục

- **Mặt nạ**: Đặt vào `public/models/masks/`
- **Nhân vật/Trang phục**: Đặt vào `public/models/characters/`
- **Vật thể**: Đặt vào `public/models/objects/`

### 2. Cập Nhật Data

#### Cho Mặt Nạ (tuongData.js):

```javascript
{
  id: 1,
  name: 'Mặt Nạ Quan Văn',
  emoji: '👑',
  modelPath: '/models/masks/mask-quan-van.glb', // Thêm dòng này
  // ... các trường khác
}
```

#### Cho Trang Phục (costumeData.js):

```javascript
{
  id: 1,
  name: 'Trang Phục Quan Văn',
  modelPath: '/models/characters/costume-quan-van.glb', // Thêm dòng này
  // ... các trường khác
}
```

#### Cho Vật Thể (sceneData.js):

```javascript
{
  id: 'sword',
  name: 'Kiếm',
  modelPath: '/models/objects/sword.glb', // Thêm dòng này
  // ... các trường khác
}
```

## Lưu Ý

1. **Đường dẫn**: Luôn bắt đầu với `/models/` (tương đối từ thư mục `public`)
2. **Tên file**: Nên dùng tên rõ ràng, không có khoảng trắng (dùng dấu gạch ngang `-`)
3. **Kích thước**: Nên tối ưu file 3D để tải nhanh (compress textures, giảm polygons)
4. **Fallback**: Nếu không có file 3D, hệ thống sẽ tự động dùng procedural model

## Ví Dụ

### Ví dụ 1: Thêm mặt nạ 3D

1. Đặt file `mask-quan-van.glb` vào `public/models/masks/`
2. Cập nhật `src/data/tuongData.js`:

```javascript
export const maskData = [
  {
    id: 1,
    name: 'Mặt Nạ Quan Văn',
    emoji: '👑',
    modelPath: '/models/masks/mask-quan-van.glb', // ← Thêm dòng này
    description: 'Mặt nạ đại diện cho các quan văn trong Tuồng',
    color: '#4a90e2',
    // ...
  }
]
```

### Ví dụ 2: Thêm trang phục 3D

1. Đặt file `costume-quan-vo.glb` vào `public/models/characters/`
2. Cập nhật `src/data/costumeData.js`:

```javascript
export const costumeData = [
  {
    id: 2,
    name: 'Trang Phục Quan Võ',
    modelPath: '/models/characters/costume-quan-vo.glb', // ← Thêm dòng này
    color: '#e74c3c',
    // ...
  }
]
```

## Tối Ưu File 3D

- **Compress textures**: Sử dụng JPEG/WebP thay vì PNG khi có thể
- **Giảm polygons**: Loại bỏ các chi tiết không cần thiết
- **Merge meshes**: Gộp các mesh nhỏ lại để giảm draw calls
- **Tools**: Sử dụng Blender, glTF-Pipeline để tối ưu

## Troubleshooting

- **File không hiển thị**: Kiểm tra đường dẫn và định dạng file
- **File quá lớn**: Nén file hoặc giảm độ phân giải textures
- **Materials không đúng**: Đảm bảo textures được embed trong GLB hoặc đặt đúng đường dẫn


