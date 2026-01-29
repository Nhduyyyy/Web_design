#!/usr/bin/env bash
# Script cài đặt mọi thứ cần cho dự án Tuồng (Mac / Linux)

set -e
cd "$(dirname "$0")"

echo "=========================================="
echo "  Tuồng - Cài đặt dự án"
echo "=========================================="
echo ""

# Kiểm tra Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Chưa có Node.js. Vui lòng cài:"
  echo "   https://nodejs.org/ (khuyến nghị bản LTS)"
  echo ""
  exit 1
fi

echo "✓ Node.js: $(node -v)"
echo "✓ npm:     $(npm -v)"
echo ""

# Cài đặt dependencies
echo "Đang cài đặt dependencies (npm install)..."
echo ""
npm install

echo ""
echo "=========================================="
echo "  ✅ Cài đặt xong!"
echo "=========================================="
echo ""
echo "Chạy ứng dụng:  npm run dev"
echo "Build production: npm run build"
echo ""
