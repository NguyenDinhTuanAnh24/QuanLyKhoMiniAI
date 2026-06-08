# Module quản lý danh mục, đơn vị tính và nhà cung cấp

Dự án: Smart Retail Inventory AI - hệ thống quản lý kho mini cho cửa hàng bán lẻ tích hợp AI dự báo tồn kho.

## Bối cảnh hiện tại

Dự án đã có:
- Supabase schema đã tạo xong.
- Đã import dữ liệu CSV vào Supabase.
- Backend chạy tại http://localhost:5000.
- Frontend chạy tại http://localhost:5173.
- API base URL frontend là http://localhost:5000/api.
- Module Sản phẩm đã chạy ổn.
- Trang Sản phẩm đã hiển thị dữ liệu thật từ Supabase.
- Giao diện đã có Sidebar, Topbar, Card thống kê, Filter, Table theo style Figma.

Dữ liệu dự án sử dụng các CSV trong thư mục database/seed:
- categories.csv
- units.csv
- suppliers.csv
- products_clean.csv
- orders_sample.csv
- order_items_sample.csv
- stock_movements_sample.csv

## Tech stack

- Frontend: React + Tailwind CSS + Lucide React
- Backend: Node.js + Express
- Database: Supabase PostgreSQL

## Mục tiêu module

Xây dựng chức năng quản lý dữ liệu nền gồm:

1. Danh mục sản phẩm
2. Đơn vị tính
3. Nhà cung cấp

Các dữ liệu này được dùng cho:
- Quản lý sản phẩm
- Nhập kho
- Bán hàng
- Tồn kho
- Báo cáo
- AI Insights

## Bảng dữ liệu liên quan

### categories

Các cột:
- category_id
- category_name
- category_name_en
- description
- created_at
- updated_at
- deleted_at

### units

Các cột:
- unit_id
- unit_name
- description
- created_at
- updated_at
- deleted_at

### suppliers

Các cột:
- supplier_id
- supplier_name
- phone
- email
- address
- note
- status
- created_at
- updated_at
- deleted_at

### products

Dùng để kiểm tra dữ liệu nền có đang được sản phẩm sử dụng hay không.

## Yêu cầu backend

Tạo đầy đủ routes, controllers, services, repositories cho:

- categories
- units
- suppliers

### API danh mục

- GET /api/categories
- GET /api/categories/:id
- POST /api/categories
- PUT /api/categories/:id
- DELETE /api/categories/:id

### API đơn vị tính

- GET /api/units
- GET /api/units/:id
- POST /api/units
- PUT /api/units/:id
- DELETE /api/units/:id

### API nhà cung cấp

- GET /api/suppliers
- GET /api/suppliers/:id
- POST /api/suppliers
- PUT /api/suppliers/:id
- DELETE /api/suppliers/:id

## Quy tắc backend

1. Danh sách cần hỗ trợ tìm kiếm và phân trang cơ bản.
2. Xóa dùng soft delete bằng deleted_at, không xóa cứng.
3. Không cho tạo trùng category_name.
4. Không cho tạo trùng unit_name.
5. Không cho tạo trùng supplier email nếu email có nhập.
6. Không cho xóa mềm danh mục nếu đang có sản phẩm sử dụng category_id đó.
7. Không cho xóa mềm đơn vị tính nếu đang có sản phẩm sử dụng unit_id đó.
8. Không cho xóa mềm nhà cung cấp nếu đang có sản phẩm sử dụng supplier_id đó.
9. Nếu không thể xóa thì trả lỗi rõ ràng.
10. Dùng chung error handler hiện có.
11. Dùng Supabase client hiện có.
12. Validate dữ liệu đầu vào bằng Zod nếu dự án đang dùng Zod.
13. Response format thống nhất với module Sản phẩm hiện tại.
14. Không phá API /api/products đang chạy ổn.

## Yêu cầu frontend

Tạo hoặc cập nhật các trang:

1. CategoryDashboard
2. UnitDashboard
3. SupplierDashboard

Các trang phải dùng style giống trang Sản phẩm hiện tại và Figma:

- Sidebar trái
- Topbar
- Nền xám nhạt
- Card trắng
- Bo góc mềm
- Shadow nhẹ
- Màu chủ đạo xanh dương
- Bảng dữ liệu sạch
- Badge trạng thái nếu phù hợp
- Button chính màu xanh
- Input search bo góc
- Modal thêm/sửa

## Trang Danh mục

Chức năng:
1. Hiển thị danh sách danh mục.
2. Tìm kiếm theo tên danh mục.
3. Hiển thị số lượng sản phẩm thuộc danh mục nếu làm được.
4. Thêm danh mục.
5. Sửa danh mục.
6. Xóa mềm danh mục.
7. Nút Xem/Sửa/Xóa ở mỗi dòng.

Cột bảng:
- Mã danh mục
- Tên danh mục
- Tên tiếng Anh
- Mô tả
- Số sản phẩm
- Hành động

## Trang Đơn vị tính

Chức năng:
1. Hiển thị danh sách đơn vị tính.
2. Tìm kiếm theo tên đơn vị.
3. Thêm đơn vị.
4. Sửa đơn vị.
5. Xóa mềm đơn vị.
6. Nút Xem/Sửa/Xóa ở mỗi dòng.

Cột bảng:
- Mã đơn vị
- Tên đơn vị
- Mô tả
- Hành động

## Trang Nhà cung cấp

Chức năng:
1. Hiển thị danh sách nhà cung cấp.
2. Tìm kiếm theo tên, số điện thoại hoặc email.
3. Lọc trạng thái nếu có.
4. Thêm nhà cung cấp.
5. Sửa nhà cung cấp.
6. Xóa mềm nhà cung cấp.
7. Nút Xem/Sửa/Xóa ở mỗi dòng.

Cột bảng:
- Mã nhà cung cấp
- Tên nhà cung cấp
- Số điện thoại
- Email
- Địa chỉ
- Trạng thái
- Hành động

## Routing/sidebar

Cập nhật sidebar để bấm được:

- Danh mục
- Nhà cung cấp
- Đơn vị tính nếu có menu riêng

Nếu chưa có router rõ ràng, có thể dùng state/page switching đơn giản trước, miễn là giao diện hoạt động.

## Acceptance Criteria

1. Xem được danh sách danh mục từ Supabase.
2. Xem được danh sách đơn vị tính từ Supabase.
3. Xem được danh sách nhà cung cấp từ Supabase.
4. Thêm mới được danh mục.
5. Thêm mới được đơn vị tính.
6. Thêm mới được nhà cung cấp.
7. Sửa được dữ liệu.
8. Xóa mềm được dữ liệu nếu không bị sản phẩm sử dụng.
9. Không tạo được dữ liệu trùng theo rule.
10. API trả response thống nhất.
11. Frontend hiển thị dữ liệu thật từ Supabase.
12. Không phá trang Sản phẩm đang chạy ổn.
13. npm run dev không lỗi.
14. node server.js không lỗi.