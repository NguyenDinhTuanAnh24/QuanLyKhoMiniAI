# Tổng quan dự án

Tên đề tài: Hệ thống hỗ trợ quản lý kho mini cho cửa hàng bán lẻ tích hợp AI dự báo tồn kho.

Tech stack:
- Frontend: React + Tailwind CSS + Lucide React
- Backend: Node.js + Express
- Database: Supabase PostgreSQL
- AI: dùng để phân tích bán hàng, dự báo nhu cầu và gợi ý nhập hàng

Cấu trúc project:
- frontend: chứa giao diện React
- backend: chứa API Node.js Express
- database: chứa schema SQL, seed SQL, CSV import
- docs: chứa tài liệu thiết kế, API, database

Các chức năng chính:
1. Đăng nhập, phân quyền người dùng.
2. Quản lý sản phẩm, danh mục, đơn vị tính, nhà cung cấp.
3. Quản lý nhập kho, xuất kho, điều chỉnh tồn kho.
4. Quản lý đơn bán hàng cơ bản.
5. Tự động cập nhật tồn kho khi nhập/xuất/bán hàng.
6. Lưu lịch sử thay đổi tồn kho.
7. Cảnh báo sản phẩm tồn kho thấp.
8. Dashboard báo cáo tồn kho, doanh thu, sản phẩm bán chạy.
9. AI dự báo nhu cầu bán ra và gợi ý nhập hàng.

Yêu cầu code:
- Frontend và backend tách riêng.
- Code rõ ràng, dễ bảo trì.
- Backend chia routes, controllers, services, repositories.
- Frontend chia pages, components, services, hooks.
- Database thiết kế chuẩn, có khóa ngoại.
- Không code quá phức tạp, ưu tiên dễ hiểu và dễ bảo vệ đồ án.