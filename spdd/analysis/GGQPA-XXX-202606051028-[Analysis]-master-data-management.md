# SPDD Analysis: Master Data Management (Categories, Units, Suppliers)

## Original Business Requirement
```markdown
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
```

## Domain Concept Identification

#### Existing Concepts (from codebase)
- **Product**: The central entity representing items in inventory. It relies on Categories, Units, and Suppliers as foreign keys.
- **GlobalExceptionHandler & BusinessException**: Existing error management pattern in Express to return uniform HTTP 400 responses for business logic violations.

#### New Concepts Required
- **Category (Danh mục)**: Organizes products into logical groupings. Must be unique by name.
- **Unit (Đơn vị tính)**: Defines the measurement metric for stock (e.g., pieces, kg). Must be unique by name.
- **Supplier (Nhà cung cấp)**: Represents the vendor providing the products. Identified uniquely by email (if provided).

#### Key Business Rules
- **Referential Integrity on Deletion**: A Category, Unit, or Supplier cannot be soft-deleted if at least one Product is actively referencing its ID.
- **Uniqueness constraints**: `category_name`, `unit_name`, and `supplier.email` must remain unique globally to prevent data anomalies.
- **Soft Deletion**: Records must be hidden from normal queries by setting `deleted_at`, preserving historical transaction integrity.

## Strategic Approach

#### Solution Direction
- **Backend Architecture**: Replicate the existing 4-tier architecture (`Route` -> `Controller` -> `Service` -> `Repository`) for each of the three new entities. This ensures consistency with the `Product` module.
- **Validation**: Use Zod schemas in the controller layer to validate incoming POST/PUT payloads before reaching the service layer.
- **Frontend Navigation**: Since `react-router-dom` is not fully configured for page switching in `App.jsx`, implement a lightweight state-based router (`activePage`) inside `App.jsx` to swap between `ProductDashboard`, `CategoryDashboard`, `UnitDashboard`, and `SupplierDashboard` while keeping the `Sidebar` static.
- **Frontend Components**: Reuse the `MainLayout`, `Sidebar`, and `Topbar` components recently created. Construct three new Dashboard components closely mirroring the UI patterns (tables, filter bars, action buttons) of `ProductDashboard.jsx`.

#### Key Design Decisions
- **Deletion Check in Service vs Repository**: 
  - *Decision*: The check for "is used by product" should happen in the `Service` layer. The service will inject/use `ProductRepository` (or a direct Supabase query) to check for existence of products with the given ID. 
  - *Rationale*: Keeps business logic (validation of deletability) in the Service, keeping Repositories focused strictly on direct data access for their specific table.
- **Primary Key Mapping**:
  - *Decision*: The REST API routes will use standard `/:id` parameters, but the internal Repositories will map these to `category_id`, `unit_id`, and `supplier_id` to match the exact `TEXT` column names in Supabase.
- **Category Product Count (Hiển thị số lượng sản phẩm)**:
  - *Decision*: Since Supabase JS doesn't support grouping/aggregation easily without RPCs, the backend will fetch the categories, then perform a secondary count query on the `products` table, or use a `.select('*, products(count)')` relational query if PostgREST supports it.
  - *Rationale*: `.select('*, products(count)')` is supported by Supabase and allows fetching the related product count natively without custom SQL functions.

#### Alternatives Considered
- **Implementing React Router immediately**: 
  - *Why rejected*: Modifying the entire frontend to use `react-router-dom` adds overhead and risk of breaking the current layout. A simple state-based view switcher inside `App.jsx` satisfies the requirement "dùng state/page switching đơn giản trước" efficiently.

## Risk & Gap Analysis

#### Requirement Ambiguities
- **ID Generation logic**: The schema uses `TEXT` for IDs (e.g., `CAT01`, `SP01`), but the requirement doesn't specify if the user inputs this ID manually during creation or if the backend auto-generates it. 
  - *Recommendation*: Allow optional manual input for ID in the payload. If missing, generate a simple prefix-based ID (e.g., `CAT-` + Date.now()).

#### Edge Cases
- **Soft-deleted Products referencing Master Data**: If a Category is only referenced by *soft-deleted* products, can it be deleted? 
  - *Why it matters*: Strict data integrity might demand keeping the category, but practical usage might not. We should default to checking ALL products (active and deleted) to prevent historical data corruption when viewing old orders.
- **Empty Email for Suppliers**: The requirement says "Không cho tạo trùng supplier email *nếu email có nhập*".
  - *Why it matters*: The database schema has `email TEXT UNIQUE`. In PostgreSQL, multiple `NULL` values are allowed in a UNIQUE column, but multiple empty strings `""` will cause a unique constraint violation. The backend must sanitize empty strings to `null` before inserting into Supabase.

#### Technical Risks
- **Supabase Unique Constraint Errors**: When creating a duplicate category name, Supabase will throw a constraint error. The backend `Repository` must catch this specific Postgres error code (e.g., `23505`) and the `Service` must translate it into a friendly `BusinessException` rather than returning a generic 500 error.

#### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1-3 | Xem danh sách các danh mục, ĐVT, NCC | Yes | Handled by GET APIs and frontend tables. |
| 4-6 | Thêm mới dữ liệu | Yes | Handled by POST APIs and modal UI placeholders. |
| 7 | Sửa dữ liệu | Yes | Handled by PUT APIs. |
| 8 | Xóa mềm không ảnh hưởng SP | Yes | Service layer will enforce this rule before updating `deleted_at`. |
| 9 | Chống trùng lặp dữ liệu | Yes | Enforced by DB UNIQUE constraints and Repository error parsing. |
| 10 | API response thống nhất | Yes | Will follow `{ success: true, data: ... }` format. |
| 11 | Frontend hiện dữ liệu Supabase | Yes | Axios integration. |
| 12-14 | Không phá vỡ hệ thống hiện tại | Yes | Isolated module additions. |
