# Báo Cáo Tối Ưu Hiệu Năng và Chuẩn Bị Triển Khai (US-44)

## 1. Mục tiêu
- Loại bỏ các request API gọi lặp vô hạn (đã xử lý trong `api.js` chặn gọi API liên tục khi bị 401).
- Tối ưu bộ nhớ ở Frontend và Backend (Chuyển phân trang `ProductDashboard` sang Server-side).
- Tối ưu truy vấn CSDL (Sử dụng chỉ mục index và RPC function).
- Tối ưu bundle React (Tách chunk cho `exceljs`, chuyển từ static sang dynamic import).
- Chuẩn bị tài liệu cấu hình, triển khai và backup dữ liệu.

## 2. Các hạng mục đã thực hiện

### 2.1. Backend & Database
- Tối ưu hàm lấy thống kê tồn kho với endpoint `/api/products/stats`. Thay vì lấy toàn bộ products về backend để tính, backend tính bằng SQL nhẹ nhàng.
- Tối ưu `getProductConsumption` bằng cách thêm RPC function `get_product_consumption(limit)` vào Supabase để tính tổng số lượng bán thay vì load N+1 ở backend.
- Tạo script `database/performance_indexes.sql` để tạo index cho `products(sku, category_id, status)`, `orders`, `order_items`.

### 2.2. Frontend
- Sửa `ProductDashboard.jsx`: Thay vì gọi `/api/products` không giới hạn và phân trang/lọc ở Client, hiện tại gọi API theo từng trang (`limit`, `page`), cùng search term (đã debounce 300ms) và category, status.
- Sửa cấu hình `vite.config.js`: Thêm `manualChunks` tách `vendor-react`, `vendor-charts`, `vendor-excel`, `vendor-icons` để giảm kích thước chunk index.
- Thay thế việc import `exceljs` và `file-saver` thành dynamic import (`await import('exceljs')`) trong `excelUtils.js` và `LowStockAlertDashboard.jsx`.

### 2.3. Triển khai
- Xóa các khóa nhạy cảm khỏi `frontend/.env.example` và `backend/.env.example`.
- Tạo tài liệu hướng dẫn triển khai: `docs/deployment/deployment-guide.md`.
- Tạo tài liệu hướng dẫn sao lưu CSDL: `docs/deployment/database-backup-restore.md`.

## 3. Kết quả đánh giá
- **Frontend bundle**: Các thư viện nặng (exceljs) đã được tách thành `vendor-excel` chunk và chỉ tải khi người dùng bấm nút xuất báo cáo.
- **Tốc độ Backend**: Tránh được việc tiêu tốn hàng trăm MB RAM khi số lượng đơn hàng hoặc sản phẩm tăng lên. Các API hoạt động nhanh hơn nhờ Pagination và Indexes.
- **Hoạt động ổn định**: Lỗi 401 Loop Error đã hoàn toàn biến mất.
