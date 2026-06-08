# Module quản lý sản phẩm

Mục tiêu:
Xây dựng chức năng quản lý sản phẩm cho hệ thống quản lý kho mini.

Dữ liệu liên quan:
- products
- categories
- units
- suppliers

Thông tin sản phẩm gồm:
- mã sản phẩm / SKU
- tên sản phẩm
- danh mục
- đơn vị tính
- nhà cung cấp
- giá nhập
- giá bán
- số lượng tồn kho
- mức tồn kho tối thiểu
- số lượng đề xuất nhập lại
- hạn sử dụng
- trạng thái

Chức năng frontend:
1. Hiển thị danh sách sản phẩm.
2. Tìm kiếm theo tên hoặc SKU.
3. Lọc theo danh mục.
4. Lọc theo nhà cung cấp.
5. Lọc theo trạng thái.
6. Phân trang.
7. Thêm sản phẩm.
8. Sửa sản phẩm.
9. Xóa mềm sản phẩm.
10. Hiển thị cảnh báo nếu tồn kho <= mức tồn tối thiểu.

Chức năng backend:
1. API lấy danh sách sản phẩm.
2. API lấy chi tiết sản phẩm.
3. API thêm sản phẩm.
4. API sửa sản phẩm.
5. API xóa mềm sản phẩm.
6. Validate dữ liệu đầu vào.
7. Không cho giá bán nhỏ hơn giá nhập.
8. Không cho số lượng tồn kho âm.

Yêu cầu UI:
- Giao diện sáng, gọn, giống dashboard quản lý.
- Có bảng sản phẩm.
- Có ô tìm kiếm.
- Có bộ lọc.
- Có nút thêm sản phẩm.
- Có badge trạng thái.
- Có cảnh báo tồn kho thấp.

Yêu cầu kỹ thuật:
- Frontend dùng React + Tailwind + Lucide.
- Backend dùng Node.js + Express.
- Database dùng Supabase PostgreSQL.
- Tách code rõ ràng theo routes, controllers, services, repositories.