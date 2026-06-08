# SPDD Analysis: Product Management

## Original Business Requirement
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

## Domain Concept Identification

*(Note: The project is currently a greenfield, so there are no existing domain concepts or schemas in the codebase.)*

#### Existing Concepts (from codebase)
- None (Greenfield project).

#### New Concepts Required
- **Product**: The central entity representing a physical item in the warehouse. Relates to Category, Unit, and Supplier.
- **Category**: A classification grouping for Products. A Product belongs to one Category.
- **Unit**: The unit of measurement for a Product (e.g., box, piece, kg). A Product uses one Unit.
- **Supplier**: The source provider of the Product. A Product is supplied by one Supplier.

#### Key Business Rules
- **Price Validity**: Product's retail price (`giá bán`) must be greater than or equal to its import price (`giá nhập`).
- **Stock Integrity**: Product's stock quantity (`số lượng tồn kho`) cannot be negative.
- **Low Stock Threshold**: A low stock alert is triggered when a Product's stock quantity is less than or equal to its minimum stock level (`mức tồn kho tối thiểu`).
- **Data Retention**: Products must be soft-deleted to preserve historical references (e.g., past sales or inventory movements).
- **SKU Uniqueness**: SKU must be unique across all Products.

## Strategic Approach

#### Solution Direction
- Implement a structured, layered backend architecture (`routes` -> `controllers` -> `services` -> `repositories`) using Node.js and Express, connected to a Supabase PostgreSQL database.
- Utilize Supabase to enforce relational integrity (Foreign Keys from Product to Category, Unit, and Supplier) and data constraints (e.g., price check, non-negative stock) at the schema level.
- Build the frontend as a React Single Page Application (SPA) with Tailwind CSS for styling. Develop a unified Product Dashboard that integrates a data table, search/filter controls, pagination, and a modal/drawer for CRUD operations.

#### Key Design Decisions
- **Database Schema (Soft Deletion)**: 
  - *Trade-offs*: Soft deletion increases query complexity (must always filter out deleted items) but is strictly required to maintain referential integrity with historical inventory and sales records.
  - *Recommendation*: Use a `deleted_at` timestamp column in the `products` table instead of physically deleting rows.
- **Data Validation Layer**: 
  - *Trade-offs*: Validating strictly at the DB level is robust but provides poor UX. Validating at the API layer allows for tailored error messages.
  - *Recommendation*: Implement request validation middleware at the API route layer (e.g., Zod, Joi) to catch errors (like price constraints and non-negative values) before they hit the service/repository layers, alongside DB-level constraints as a fallback.
- **List API Design (Search, Filter, Pagination)**: 
  - *Trade-offs*: Client-side filtering is fast but doesn't scale with large datasets. Server-side filtering scales well but requires more complex query logic.
  - *Recommendation*: Implement server-side pagination and filtering in the backend to ensure scalability as the mini-warehouse grows.

#### Alternatives Considered
- **Hard Deletion**: Rejected. Physically deleting products would break foreign key constraints on future tables like `inventory_transactions` or `sales_orders`, compromising historical data integrity.

## Risk & Gap Analysis

#### Requirement Ambiguities
- **Related Entities Management**: Are `categories`, `units`, and `suppliers` to be managed (CRUD) within this module, or should we assume they are pre-seeded or managed elsewhere? The requirement focuses on `Product` management.
- **Recommended Reorder Quantity**: Is the `số lượng đề xuất nhập lại` a manually entered static field, or is it expected to be dynamically calculated (e.g., by the AI mentioned in the project overview)? 
- **Product Status Values**: What are the precise allowed values for the `trạng thái` field? (e.g., "Active", "Inactive", "Discontinued").

#### Edge Cases
- **SKU Duplication**: Attempting to create a product with an existing SKU should be gracefully rejected with a clear error message.
- **Price Updates with Existing Stock**: Changing the import price of a product that already has stock in the warehouse. Does this affect the valuation of existing inventory?
- **Filtering Combinations**: Applying multiple filters (e.g., specific supplier + category + text search) that yield no results should be handled with a proper empty state UI.

#### Technical Risks
- **Supabase Connectivity**: Handling potential connection issues or timeouts with the Supabase PostgreSQL database cleanly in the Express backend.
- **Data Consistency**: Ensuring the frontend accurately reflects the backend state, especially after create/update/delete operations or when multiple users are working simultaneously.

#### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| F1-F6 | Frontend list, search, filter, pagination | Yes | Need to define page size and filter parameters shape. |
| F7-F9 | Frontend CRUD & soft delete | Yes | Relies on backend APIs supporting these operations. |
| F10 | Low stock alert | Yes | Can be implemented visually using Tailwind badges. |
| B1-B2 | Get APIs | Yes | Must ensure related data (Category/Supplier names) is joined or included. |
| B3-B5 | Mutation APIs (Create, Update, Delete) | Yes | Soft delete requires updating the `deleted_at` field. |
| B6-B8 | Backend validation & constraints | Yes | Will be handled by middleware and DB-level checks. |
