# Hướng Dẫn Hệ Thống Cửa Hàng (Shop System)

## Tổng Quan

Hệ thống cửa hàng cho phép người chơi mua các vật phẩm bằng coin kiếm được từ game. Bao gồm:
- Mặt nạ (Masks)
- Emote (Biểu cảm)
- Theme (Giao diện)
- Voucher (Phiếu quà)
- Booster (Tăng điểm)

## Cấu Trúc Database

### 1. Bảng `shop_categories`
Quản lý danh mục sản phẩm.

**Cột chính:**
- `id`: UUID (Primary Key)
- `name`: Tên danh mục
- `slug`: Slug cho URL (unique)
- `icon`: Icon Material Symbols
- `is_active`: Trạng thái hoạt động

**Ví dụ:**
```sql
SELECT * FROM shop_categories WHERE is_active = true;
```

### 2. Bảng `shop_items`
Lưu trữ tất cả sản phẩm trong cửa hàng.

**Cột chính:**
- `id`: UUID (Primary Key)
- `category_id`: Liên kết với shop_categories
- `name`: Tên sản phẩm
- `slug`: Slug cho URL (unique)
- `description`: Mô tả sản phẩm
- `price`: Giá bằng coin
- `image_url`: Link hình ảnh
- `badge`: Nhãn đặc biệt ('Limited', 'Rare', etc.)
- `item_type`: Loại vật phẩm ('mask', 'emote', 'theme', etc.)
- `is_limited`: Có giới hạn không
- `stock_quantity`: Số lượng tồn kho (NULL = không giới hạn)
- `max_purchase_per_user`: Giới hạn mua/người (NULL = không giới hạn)

**Ví dụ:**
```sql
-- Lấy tất cả sản phẩm đang bán
SELECT * FROM shop_items WHERE is_active = true ORDER BY display_order;

-- Lấy sản phẩm theo danh mục
SELECT si.* 
FROM shop_items si
JOIN shop_categories sc ON si.category_id = sc.id
WHERE sc.slug = 'collectibles' AND si.is_active = true;
```

### 3. Bảng `user_inventory`
Quản lý vật phẩm người dùng sở hữu.

**Cột chính:**
- `id`: UUID (Primary Key)
- `user_id`: ID người dùng
- `item_id`: ID sản phẩm
- `quantity`: Số lượng
- `is_equipped`: Đang trang bị
- `expires_at`: Ngày hết hạn (cho item có thời hạn)

**Ví dụ:**
```sql
-- Xem kho đồ của user
SELECT ui.*, si.name, si.item_type
FROM user_inventory ui
JOIN shop_items si ON ui.item_id = si.id
WHERE ui.user_id = 'user-uuid-here'
  AND ui.quantity > 0;
```

### 4. Bảng `shop_transactions`
Lịch sử giao dịch mua bán.

**Cột chính:**
- `id`: UUID (Primary Key)
- `user_id`: ID người dùng
- `item_id`: ID sản phẩm
- `quantity`: Số lượng mua
- `price_paid`: Số coin đã trả
- `transaction_type`: Loại giao dịch ('purchase', 'gift', 'refund')
- `status`: Trạng thái ('completed', 'pending', 'failed')

**Ví dụ:**
```sql
-- Xem lịch sử mua hàng
SELECT st.*, si.name
FROM shop_transactions st
JOIN shop_items si ON st.item_id = si.id
WHERE st.user_id = 'user-uuid-here'
ORDER BY st.created_at DESC
LIMIT 20;
```

## Functions

### 1. `purchase_shop_item()`
Mua sản phẩm từ cửa hàng.

**Parameters:**
- `p_user_id`: UUID của user
- `p_item_id`: UUID của sản phẩm
- `p_quantity`: Số lượng (mặc định = 1)

**Returns:** JSONB
```json
{
  "success": true,
  "transaction_id": "uuid",
  "inventory_id": "uuid",
  "coins_spent": 2500,
  "remaining_coins": 7500
}
```

**Kiểm tra:**
- User có đủ coin không
- Sản phẩm còn hàng không (nếu có giới hạn)
- User đã mua quá giới hạn chưa
- Tự động trừ coin và cập nhật inventory

**Ví dụ:**
```sql
SELECT purchase_shop_item(
  'user-uuid',
  'item-uuid',
  1
);
```

### 2. `get_user_inventory()`
Lấy danh sách vật phẩm trong kho của user.

**Parameters:**
- `p_user_id`: UUID của user

**Returns:** Table với các cột:
- `inventory_id`
- `item_id`
- `item_name`
- `item_type`
- `quantity`
- `is_equipped`
- `image_url`
- `acquired_at`
- `expires_at`

**Ví dụ:**
```sql
SELECT * FROM get_user_inventory('user-uuid');
```

## Sử Dụng Service (JavaScript)

### Import Service
```javascript
import {
  getShopItems,
  getShopCategories,
  purchaseItem,
  getUserInventory,
  getTransactionHistory
} from '../services/shopService'
```

### 1. Lấy Danh Sách Sản Phẩm
```javascript
// Lấy tất cả sản phẩm
const { data: items, error } = await getShopItems()

// Lấy sản phẩm theo danh mục
const { data: masks, error } = await getShopItems('collectibles')
```

### 2. Lấy Danh Mục
```javascript
const { data: categories, error } = await getShopCategories()
```

### 3. Mua Sản Phẩm
```javascript
const { data, error } = await purchaseItem(userId, itemId, quantity)

if (data && data.success) {
  console.log('Mua thành công!')
  console.log('Coin còn lại:', data.remaining_coins)
} else {
  console.error('Lỗi:', error || data.error)
}
```

### 4. Xem Kho Đồ
```javascript
const { data: inventory, error } = await getUserInventory(userId)

inventory.forEach(item => {
  console.log(`${item.item_name} x${item.quantity}`)
})
```

### 5. Xem Lịch Sử Giao Dịch
```javascript
const { data: history, error } = await getTransactionHistory(userId, 20)

history.forEach(transaction => {
  console.log(`Mua ${transaction.item.name} - ${transaction.price_paid} coin`)
})
```

## Tích Hợp Vào Component

### Ví Dụ: Shop Component
```javascript
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getShopItems, purchaseItem } from '../services/shopService'

const Shop = () => {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadShopItems()
  }, [])

  const loadShopItems = async () => {
    const { data, error } = await getShopItems()
    if (data) setItems(data)
  }

  const handlePurchase = async (itemId, price) => {
    setLoading(true)
    const { data, error } = await purchaseItem(user.id, itemId, 1)
    
    if (data && data.success) {
      alert('Mua thành công!')
      // Cập nhật UI
    } else {
      alert('Lỗi: ' + (error?.message || data?.error))
    }
    setLoading(false)
  }

  return (
    <div>
      {items.map(item => (
        <div key={item.id}>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <p>Giá: {item.price} coin</p>
          <button 
            onClick={() => handlePurchase(item.id, item.price)}
            disabled={loading}
          >
            Mua
          </button>
        </div>
      ))}
    </div>
  )
}
```

## Chạy Migration

### 1. Chạy Migration File
```bash
# Sử dụng Supabase CLI
supabase db push

# Hoặc copy nội dung file và chạy trong Supabase SQL Editor
```

### 2. Kiểm Tra Tables
```sql
-- Kiểm tra tables đã tạo
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'shop%';

-- Kiểm tra sample data
SELECT * FROM shop_items;
SELECT * FROM shop_categories;
```

## Security & Permissions

### Row Level Security (RLS)
Tất cả bảng đều có RLS enabled:

1. **shop_categories & shop_items**: Public read (chỉ xem)
2. **user_inventory**: User chỉ xem/sửa inventory của mình
3. **shop_transactions**: User chỉ xem/tạo transaction của mình

### Best Practices
- Luôn kiểm tra `auth.uid()` trước khi thao tác
- Sử dụng functions để xử lý logic phức tạp
- Validate input ở cả client và server
- Log tất cả transactions để audit

## Mở Rộng

### Thêm Sản Phẩm Mới
```sql
INSERT INTO shop_items (
  category_id,
  name,
  slug,
  description,
  price,
  image_url,
  item_type
) VALUES (
  (SELECT id FROM shop_categories WHERE slug = 'collectibles'),
  'Phoenix Mask',
  'phoenix-mask',
  'Legendary phoenix mask with fire effects',
  5000,
  'https://example.com/phoenix-mask.png',
  'mask'
);
```

### Thêm Danh Mục Mới
```sql
INSERT INTO shop_categories (name, slug, description, icon)
VALUES ('Boosters', 'boosters', 'Power-ups and boosters', 'bolt');
```

### Tạo Sale/Discount
Thêm cột `discount_percentage` và `sale_price` vào `shop_items`:
```sql
ALTER TABLE shop_items 
ADD COLUMN discount_percentage INTEGER DEFAULT 0,
ADD COLUMN sale_price INTEGER;

-- Tạo sale 20%
UPDATE shop_items 
SET discount_percentage = 20,
    sale_price = FLOOR(price * 0.8)
WHERE id = 'item-uuid';
```

## Troubleshooting

### Lỗi: "Insufficient coins"
- Kiểm tra `player_stats.total_coins`
- Đảm bảo user đã chơi game và có coin

### Lỗi: "Item not found"
- Kiểm tra `shop_items.is_active = true`
- Kiểm tra item_id có đúng không

### Lỗi: "Maximum purchase limit reached"
- Kiểm tra `shop_items.max_purchase_per_user`
- Xem `user_inventory` để biết đã mua bao nhiêu

## Liên Hệ & Hỗ Trợ

Nếu có vấn đề, kiểm tra:
1. Supabase logs
2. Browser console
3. Network tab (DevTools)
4. Database logs trong Supabase Dashboard
