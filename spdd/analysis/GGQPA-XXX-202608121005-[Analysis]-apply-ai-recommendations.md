# SPDD Analysis: Apply AI Recommendations

## Original Business Requirement
Hoàn thiện toàn bộ logic "Áp dụng đề xuất AI" trong module AI Dự báo của:
Smart Retail Inventory AI

HIỆN TRẠNG:
- Bấm "Áp dụng" hiện chỉ hiển thị Toast thành công.
- Không có thay đổi nghiệp vụ thật.
- Sau khi bấm vẫn có thể bấm lại.
- Không có liên kết giữa AI Recommendation và trang Nhập/Xuất kho.
- Nút "Áp dụng tất cả đề xuất" chưa có business meaning rõ ràng.

MỤC TIÊU:
1. Áp dụng recommendation phải tạo hành động nghiệp vụ thật.
2. Không tự tăng tồn kho khi bấm Apply.
3. Recommendation nhập hàng phải chuyển thành phiếu/kế hoạch nhập NHÁP.
4. Người dùng kiểm tra lại trước khi nhập kho thật.
5. Sau khi Apply, button không được tiếp tục tạo duplicate.
6. Recommendation phải có status.
7. Có thể truy vết recommendation -> phiếu nhập -> stock movement.
8. "Áp dụng tất cả" chỉ áp dụng những recommendation có thể tự động chuyển thành nghiệp vụ.
9. Không áp dụng tự động các lời khuyên mang tính tham khảo như nghiên cứu thị trường.
10. Có ConfirmDialog trước khi tạo draft.

## Domain Concept Identification

### Existing Concepts (from codebase)
- **AI Recommendation (`ai_recommendations`)**: Lời khuyên do AI sinh ra (chứa `product_id`, `suggested_import_quantity`, `status`). Hiện tại `status` mặc định là `PENDING`.
- **Stock Movement (`stock_movements`)**: Hành động nhập/xuất kho thực tế làm thay đổi `stock_quantity`.
- **Product (`products`)**: Thông tin sản phẩm, bao gồm `stock_quantity` (tồn kho hiện tại).

### New Concepts Required
- **Import Plan / Import Draft (`import_plans` / `import_plan_items`)**: Một khái niệm mới (hoặc bảng/bản ghi mới) lưu trữ các đề xuất nhập hàng đang ở trạng thái Nháp (Draft), chờ người dùng duyệt. Hệ thống hiện chưa có phiếu nhập nháp thực sự trong DB (chỉ đang lưu ở sessionStorage UI).
- **Action Type (`action_type` in `ai_recommendations`)**: Phân loại loại hành động của recommendation (ví dụ: `REORDER_STOCK`, `REVIEW_SLOW_MOVING`).
- **Application Traceability**: Cần các field `applied_by`, `applied_at`, `application_type`, `application_id` trong `ai_recommendations` để liên kết từ Recommendation sang Import Draft.

### Key Business Rules
- **Không tự động tăng tồn kho**: Apply recommendation KHÔNG BAO GIỜ cộng dồn vào `stock_quantity`. Nó chỉ tạo ra Import Draft.
- **Trạng thái một chiều (One-way Transition)**: Recommendation từ `PENDING` -> `APPLIED` -> `COMPLETED` (đã nhập kho thành công). Không được Apply một recommendation không phải `PENDING`.
- **Duplicate Protection**: Backend phải từ chối nếu request Apply một recommendation đã ở trạng thái khác `PENDING`.
- **Bulk Apply Filter**: Chỉ áp dụng những recommendation có thể tự động chuyển thành nghiệp vụ (cụ thể là `REORDER_STOCK`).
- **Người dùng chốt số lượng**: Số lượng từ AI chỉ là gợi ý, người dùng có toàn quyền sửa số lượng trong Import Draft trước khi chốt nhập kho.

## Strategic Approach

### Solution Direction
1. **Mở rộng Schema AI**: Thêm các cột `action_type`, `applied_by`, `applied_at`, `application_type`, `application_id` vào bảng `ai_recommendations`.
2. **Khái niệm Import Draft**: Vì hệ thống Inventory hiện tại không có bảng `import_drafts` (frontend chỉ đang sử dụng `sessionStorage`), ta có 2 hướng:
   - Hướng A: Tạo một entity/bảng `import_plans` mới trong DB để backend lưu trữ bản nháp.
   - Hướng B: Sử dụng tính năng "điều hướng kèm tham số" (query params / router state) để chuyển thẳng dữ liệu sang giao diện Nhập kho hiện có và lưu vào `sessionStorage` cho user.
3. **API Apply Recommendation**: 
   - Backend sẽ cung cấp API `POST /api/ai/recommendations/:id/apply` và `POST /api/ai/recommendations/apply-bulk`.
   - API này sẽ cập nhật trạng thái recommendation thành `APPLIED` và tạo liên kết đến Draft.

### Key Design Decisions
- **Decision 1: Lưu trữ Import Draft ở đâu?**
  - *Trade-offs*: Việc tạo mới bảng `import_plans` & `import_plan_items` tốn effort tạo migration nhưng dữ liệu không bị mất nếu user tải lại trang. Hướng truyền state qua query parameter nhanh nhưng dễ mất dữ liệu nếu apply bulk và không có DB traceability.
  - *Recommendation*: **Tạo mới bảng `import_plans` và `import_plan_items` (hoặc `inventory_drafts`)**. Phù hợp với yêu cầu "truy vết recommendation -> phiếu nhập -> stock movement".
- **Decision 2: UI Bulk Apply Action**
  - *Trade-offs*: Frontend phải lọc các recommendation (lấy `action_type = REORDER_STOCK` & `status = PENDING`) để gửi lên API apply-bulk.
  - *Recommendation*: Frontend đảm nhận việc lọc dữ liệu và chuyển đổi giao diện, sau đó điều hướng tới trang Nhập Kho. Trang Nhập Kho sẽ được cập nhật để cho phép fetch từ một `draft_id`.
  
### Alternatives Considered
- *Sử dụng `stock_movements` với `status = DRAFT`*: Bị loại vì `stock_movements` hiện tại đại diện cho dòng di chuyển thực tế. Thay đổi ý nghĩa của nó có thể làm hỏng các logic tính toán báo cáo (Dashboard, Báo Cáo Nhập Xuất).

## Risk & Gap Analysis

### Requirement Ambiguities
- **Role Permission**: Ai được phép Apply? Yêu cầu nói "Backend kiểm tra quyền". Cần xác định cụ thể role `Nhân viên kho` và `Quản trị viên` có chung quyền tạo Draft không.

### Edge Cases
- **Duplicate AI Run**: Nếu AI chạy phân tích lại và đề xuất nhập hàng cho cùng 1 sản phẩm đã có Draft (chưa duyệt), có nên tạo thêm Plan không? => Business rule ghi rõ: Recommendation mới sinh ra theo run mới, hệ thống cần UI hint "Đã có trong kế hoạch nhập" thay vì cho phép Apply tiếp mù quáng.

### Technical Risks
- **Cấu trúc InventoryOpsDashboard**: Component Nhập xuất kho (`InventoryOpsDashboard.jsx`) đang viết rất nguyên khối. Việc chèn logic "Load từ Import Draft DB" cần được thực hiện khéo léo để không làm vỡ luồng Import bằng tay thông thường.
- **Race conditions**: Hai user cùng nhấn "Apply" một recommendation. (Mitigation: Check status = PENDING kèm transaction / khóa bản ghi).

### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Áp dụng phải tạo nghiệp vụ thật | Yes | Sẽ tạo `import_plans`. |
| 2 | Không tự tăng tồn kho | Yes | Chỉ tạo Draft. |
| 5 | Không tạo duplicate | Yes | Chặn bằng DB và API validation. |
| 7 | Truy vết Recommendation -> Stock | Yes | Cần link `recommendation_id` vào bảng `stock_movements`. |
| 8 | Bulk Apply lọc hành động | Yes | Lọc dựa trên `action_type`. |
