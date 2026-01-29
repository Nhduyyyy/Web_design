# Tuồng Việt Nam - Nền Tảng Tương Tác

Nền tảng web tương tác tích hợp AI nhằm số hoá và truyền tải nghệ thuật Tuồng Việt Nam theo cách hiện đại, trực quan và cá nhân hoá.

## Cấu trúc thư mục

```
TestYTuongEXE/
├── public/                 # Tài nguyên tĩnh (Vite serve từ /)
│   ├── masks/              # Ảnh mặt nạ (PNG)
│   ├── models/             # File 3D (GLB, STL)
│   │   ├── masks/          # Mô hình mặt nạ
│   │   └── objects/        # Vật thể trong cảnh
│   └── README.md
├── src/
│   ├── components/         # React components (.jsx + .css)
│   ├── data/               # Dữ liệu (tuongData, sceneData, costumeData)
│   ├── styles/             # CSS toàn cục (index.css, App.css)
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Tính năng

- 🎭 **Bộ Sưu Tập Mặt Nạ**: Khám phá các loại mặt nạ Tuồng với thông tin chi tiết
- 👤 **Nhân Vật Tuồng**: Tìm hiểu về các nhân vật nổi tiếng và trang phục của họ
- 🤖 **AI Giải Thích**: Tương tác với AI để hiểu sâu hơn về ý nghĩa, lịch sử và vai trò
- 📷 **Trải Nghiệm AR**: Thử nghiệm mặt nạ Tuồng với camera của bạn

## Cài đặt (một lệnh)

**Mac / Linux:** mở terminal trong thư mục dự án, chạy:

```bash
./setup.sh
```

**Windows:** double-click file `setup.bat` hoặc mở CMD trong thư mục dự án và chạy `setup.bat`.

Script sẽ kiểm tra Node.js và chạy `npm install` để cài toàn bộ dependencies. Nếu chưa có Node.js, cài từ [nodejs.org](https://nodejs.org/) (bản LTS).

Cách khác (khi đã có Node/npm):

```bash
npm install
# hoặc
npm run setup
```

## Chạy ứng dụng

```bash
npm run dev
```

Ứng dụng chạy tại `http://localhost:5173`

## Build

```bash
npm run build
```

## Công nghệ

- React 18
- Vite
- Framer Motion (animations)
- Three.js / React Three Fiber (3D)
- CSS3 với backdrop-filter

## Lưu ý

- Đây là demo; AI được mô phỏng với dữ liệu tĩnh
- Tính năng AR dùng camera trình duyệt; cần cấp quyền camera
