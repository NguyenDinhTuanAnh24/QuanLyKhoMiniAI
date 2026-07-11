# SPDD Analysis: AI Inventory Forecast Module

## Original Business Requirement
Mục tiêu:
Xây dựng module AI Dự báo tồn kho hoàn chỉnh cho dự án. AI phải đọc dữ liệu thật từ Supabase, phân tích lịch sử bán hàng và tồn kho, dự báo nhu cầu 14 ngày tới, gợi ý số lượng nên nhập và hiển thị trên trang AI Dự báo.

Quan điểm triển khai:
Không fine-tune model.
Không gửi toàn bộ database thô cho AI.
Backend sẽ lấy dữ liệu từ DB, tổng hợp thành dữ liệu sạch, tính toán dự báo bằng ForecastService, sau đó mới gửi dữ liệu đã xử lý cho Gemini để sinh insight dạng JSON.

==================================================
1. AI SETTINGS
==================================================

Hoàn thiện phần Cài đặt AI trong trang Settings.

Các field cần có:
- ai_enabled
- ai_provider
- ai_model
- ai_forecast_days
- ai_sales_history_days
- ai_auto_analysis_enabled
- ai_analysis_schedule
- ai_last_run_at

Frontend:
- Cho bật/tắt AI
- Chọn nhà cung cấp AI: Google Gemini
- Chọn model:
  - gemini-2.5-flash
  - gemini-2.5-pro
  - gemini-3.5-flash nếu hỗ trợ
- Nhập số ngày dự báo, mặc định 14
- Nhập số ngày lịch sử bán hàng, mặc định 90
- Nút Kiểm tra kết nối AI

Backend:
- API key Gemini không được hiển thị frontend.
- API key lấy từ backend .env:
  GEMINI_API_KEY=...
  GEMINI_MODEL=gemini-2.5-flash

Tạo API:
GET /api/ai/settings
PUT /api/ai/settings
POST /api/ai/test-connection

==================================================
2. DATABASE CHO AI
==================================================

Tạo migration hoặc SQL nếu chưa có:

ai_analysis_runs:
- run_id text primary key
- run_type text
- provider text
- model text
- status text
- summary text
- total_products integer
- total_recommendations integer
- created_at timestamp with time zone default now()

ai_recommendations:
- recommendation_id text primary key
- run_id text references ai_analysis_runs(run_id)
- product_id text references products(product_id)
- product_name text
- sku text
- category_name text
- supplier_name text
- unit_name text
- stock_quantity numeric
- reorder_level numeric
- sales_90d numeric
- avg_daily_sales_90d numeric
- forecast_14d numeric
- suggested_import_quantity numeric
- priority text
- reason text
- status text default 'PENDING'
- created_at timestamp with time zone default now()

Nếu không muốn sửa schema ngay, có thể làm Forecast API trước rồi lưu DB ở bước sau. Nhưng ưu tiên có 2 bảng này.

==================================================
3. BACKEND DATA COLLECTOR
==================================================

Tạo:

backend/src/repositories/AIRepository.js

Nhiệm vụ:
- Lấy products chưa xóa mềm: deleted_at IS NULL
- Lấy orders trong 90 ngày gần nhất
- Chỉ tính đơn hàng đã thành công nếu hệ thống có status
- Lấy order_items
- Lấy stock_movements nhập/xuất gần đây
- Map category_name, supplier_name, unit_name
- Không lấy sản phẩm đã xóa mềm

Dữ liệu trả ra phải sạch, không null gây lỗi.

==================================================
4. FORECAST SERVICE
==================================================

Tạo:

backend/src/services/ForecastService.js

Tính cho từng sản phẩm:
- sales_7d
- sales_30d
- sales_90d
- avg_daily_sales_90d
- forecast_14d hoặc forecast theo ai_forecast_days
- stock_days_remaining
- suggested_import_quantity
- priority
- inventory_status

Logic:
avg_daily_sales_90d = sales_90d / 90
forecast_14d = avg_daily_sales_90d * forecast_days
required_stock = forecast_14d + reorder_level
suggested_import_quantity = max(0, required_stock - stock_quantity)

Priority:
- Cao nếu stock_quantity <= 0
- Cao nếu stock_quantity <= reorder_level và forecast_14d > 0
- Trung bình nếu stock_quantity <= reorder_level
- Trung bình nếu forecast_14d > stock_quantity
- Thấp nếu chưa cần nhập

Nếu sản phẩm chưa có lịch sử bán:
- forecast = 0
- suggested_import_quantity chỉ dựa vào reorder_level nếu stock_quantity thấp
- reason nên ghi: Chưa có nhiều dữ liệu bán hàng, gợi ý dựa trên mức tồn tối thiểu.

==================================================
5. GEMINI AI SERVICE
==================================================

Tạo:

backend/src/services/GeminiAIService.js

Dùng Gemini API để phân tích dữ liệu forecast.

Yêu cầu:
- Không gửi toàn bộ DB thô.
- Chỉ gửi dữ liệu đã tổng hợp.
- Chỉ gửi top N sản phẩm cần nhập, top bán chạy, bán chậm, hết hàng.
- Ép model trả về JSON.
- Validate JSON trước khi lưu DB.
- Nếu Gemini lỗi, fallback sang kết quả ForecastService.

Prompt gửi AI phải có context:
Bạn là trợ lý phân tích tồn kho cho hệ thống Smart Retail Inventory AI.
Dữ liệu gồm sản phẩm, tồn kho hiện tại, lịch sử bán hàng 90 ngày, dự báo 14 ngày và mức tồn tối thiểu.
Hãy trả về JSON đúng schema, không markdown.

JSON schema mong muốn:
{
  "summary": "string",
  "revenue_comment": "string",
  "inventory_comment": "string",
  "recommendations": [
    {
      "product_id": "string",
      "product_name": "string",
      "suggested_quantity": number,
      "priority": "Cao|Trung bình|Thấp",
      "reason": "string"
    }
  ],
  "warnings": [
    {
      "product_id": "string",
      "product_name": "string",
      "level": "Cao|Trung bình|Thấp",
      "message": "string"
    }
  ],
  "actions": [
    {
      "type": "CREATE_IMPORT|REVIEW_PRODUCT|CHECK_SUPPLIER",
      "label": "string",
      "description": "string"
    }
  ]
}

==================================================
6. AI CONTROLLER / ROUTES
==================================================

Tạo hoặc hoàn thiện:

backend/src/routes/aiRoutes.js
backend/src/controllers/AIController.js
backend/src/services/AIInsightService.js
backend/src/repositories/AIRepository.js

API cần có:
GET /api/ai/forecast
POST /api/ai/analyze
GET /api/ai/recommendations
POST /api/ai/recommendations/:id/apply
POST /api/ai/recommendations/:id/ignore
POST /api/ai/test-connection

GET /api/ai/forecast:
- Không gọi Gemini
- Trả dữ liệu forecast rule-based

POST /api/ai/analyze:
- Chạy ForecastService
- Gọi GeminiAIService nếu ai_enabled = true
- Lưu ai_analysis_runs
- Lưu ai_recommendations
- Trả kết quả mới nhất

GET /api/ai/recommendations:
- Lấy gợi ý mới nhất, status PENDING/APPLIED/IGNORED

POST /api/ai/recommendations/:id/apply:
- Đổi status thành APPLIED
- Trả dữ liệu để frontend có thể chuyển sang trang Nhập kho

POST /api/ai/recommendations/:id/ignore:
- Đổi status thành IGNORED

==================================================
7. FRONTEND AI PAGE
==================================================

Làm lại trang:

frontend/src/pages/AIInsightsPage.jsx

Giao diện phải đồng bộ với các trang trước:
- Nền sáng
- Card trắng
- Button xanh dương
- Icon lucide-react
- Không dùng emoji
- Không đổi sidebar/header

Header:
AI Dự báo
Phân tích dữ liệu bán hàng và tồn kho để gợi ý nhập hàng

Button:
Phân tích mới

Khi bấm Phân tích mới:
- Hiện ConfirmDialog:
  Title: Xác nhận phân tích AI
  Message: Hệ thống sẽ đọc dữ liệu bán hàng và tồn kho hiện tại để tạo dự báo mới. Bạn có muốn tiếp tục không?
- Confirm xong gọi POST /api/ai/analyze
- Loading
- Toast thành công hoặc lỗi

Card thống kê:
- Sản phẩm cần nhập
- Sản phẩm bán chạy
- Sản phẩm bán chậm
- Cảnh báo tồn kho

Card Báo cáo AI hôm nay:
- summary
- inventory_comment
- revenue_comment
- actions

Bảng Dự báo từng sản phẩm:
Cột:
- Sản phẩm
- Danh mục
- Tồn hiện tại
- Đã bán 90 ngày
- TB/ngày
- Dự báo 14 ngày
- AI gợi ý nhập
- Ưu tiên
- Hành động

Gợi ý nhập hàng từ AI:
- Card mỗi sản phẩm
- Hiển thị số lượng đề xuất
- Lý do
- Nhà cung cấp
- Nút Áp dụng gợi ý
- Nút Bỏ qua

Khi bấm Áp dụng gợi ý:
- Gọi POST /api/ai/recommendations/:id/apply
- Toast: Đã áp dụng gợi ý nhập hàng
- Có thể chuyển sang /inventory-ops với state/query để prefill sản phẩm, nhà cung cấp, số lượng.

==================================================
8. FRONTEND SERVICE
==================================================

Tạo:

frontend/src/services/aiService.js

Hàm:
- getAIForecast()
- runAIAnalysis()
- getAIRecommendations()
- applyAIRecommendation(id)
- ignoreAIRecommendation(id)
- testAIConnection()
- getAISettings()
- updateAISettings(payload)

Không hard-code dữ liệu nếu API có dữ liệu thật.

==================================================
9. SETTINGS LIÊN KẾT AI
==================================================

Trong SettingsPage, tab Cài đặt AI:
- Nút Kiểm tra kết nối AI gọi POST /api/ai/test-connection
- Lưu model/provider/forecast_days vào DB settings
- Không hiển thị API key
- Nếu thiếu GEMINI_API_KEY, toast:
  Chưa cấu hình GEMINI_API_KEY trong backend .env

==================================================
10. ERROR / FALLBACK
==================================================

Nếu Gemini lỗi:
- Không làm app trắng màn hình
- Hiển thị toast:
  AI chưa phản hồi, hệ thống đang hiển thị dự báo theo dữ liệu nội bộ.
- Vẫn hiển thị dữ liệu từ ForecastService

Nếu không có đơn hàng:
- Không báo lỗi
- Hiển thị dự báo dựa trên tồn kho và reorder_level
- Ghi rõ lý do: Chưa có đủ dữ liệu bán hàng

Nếu thiếu API key:
- Trang vẫn dùng ForecastService
- Nút phân tích AI báo thiếu cấu hình

==================================================
11. KHÔNG ĐƯỢC LÀM
==================================================

Không được:
- Không gửi API key xuống frontend
- Không hard-code dữ liệu AI
- Không gửi toàn bộ database thô cho AI
- Không sửa schema products/orders nếu không cần
- Không phá trang Sản phẩm
- Không phá trang Nhập / Xuất kho
- Không phá trang Báo cáo
- Không phá Settings
- Không dùng alert/confirm trình duyệt
- Không dùng emoji
- Không làm app trắng màn hình
- Không để AI trả text tự do rồi frontend parse bừa

==================================================
12. KIỂM TRA SAU KHI LÀM
==================================================

1. Backend chạy không lỗi.
2. GET /api/ai/forecast trả dữ liệu forecast thật từ DB.
3. POST /api/ai/test-connection báo đúng trạng thái Gemini.
4. POST /api/ai/analyze chạy được.
5. Nếu có GEMINI_API_KEY, AI trả insight JSON và lưu DB.
6. Nếu không có GEMINI_API_KEY, hệ thống fallback rule-based.
7. Trang AI Dự báo hiển thị card thống kê, báo cáo AI, bảng dự báo, gợi ý nhập.
8. Bấm Phân tích mới có popup xác nhận.
9. Bấm Áp dụng gợi ý đổi trạng thái và có toast.
10. Settings tab AI lưu được model, provider, forecast days.
11. Console không lỗi.


## Domain Concept Identification

### Existing Concepts (from codebase)
- Product: Hàng hóa tồn kho cần được quản lý nhập/xuất/bán. Chứa thông tin về `stock_quantity`, `reorder_level`.
- Order / OrderItem: Dữ liệu giao dịch lịch sử dùng để tính toán tốc độ tiêu thụ (`sales_90d`, `avg_daily_sales`).
- StockMovement: Lịch sử nhập/xuất kho.
- Settings: Lưu trữ các cấu hình chung của hệ thống (trong DB `settings` table), bao gồm cả tham số cho AI (`ai_enabled`, `forecast_days`, v.v.).

### New Concepts Required
- AIAnalysisRun: Đại diện cho một lần hệ thống (hoặc người dùng) kích hoạt luồng phân tích tồn kho bằng AI. Lưu trữ tổng quan kết quả (summary) và metadata (thời gian, model, trạng thái).
- AIRecommendation: Đại diện cho một đề xuất nhập hàng (cấp độ từng sản phẩm) do AI sinh ra (hoặc do Rule-based sinh ra làm fallback), liên kết với một `AIAnalysisRun`. Có vòng đời trạng thái (`PENDING`, `APPLIED`, `IGNORED`).

### Key Business Rules
- Quyền riêng tư Dữ liệu: Không bao giờ gửi toàn bộ CSDL thô cho API của LLM. Chỉ gửi dữ liệu đã được làm sạch và tổng hợp.
- Fallback Rule-based: Nếu AI thất bại (hoặc chưa cấu hình API Key), hệ thống phải tự động fallback về dự báo nội bộ sử dụng công thức toán học (`ForecastService`).
- Tính toán Đề xuất Nhập: `suggested_import_quantity = max(0, (forecast_14d + reorder_level) - stock_quantity)`.
- Xác thực API Key: `GEMINI_API_KEY` chỉ tồn tại ở lớp Backend (biến môi trường `.env`), tuyệt đối không rò rỉ ra Frontend.


## Strategic Approach

### Solution Direction
- Xây dựng một đường ống (pipeline) Xử lý Dữ liệu -> Phân tích -> Trình bày:
  1. `AIRepository`: Lấy và join dữ liệu thô từ DB (`products`, `orders`, `stock_movements`), loại bỏ sản phẩm đã xóa mềm.
  2. `ForecastService`: Tính toán các chỉ số phái sinh (bán trong 7/30/90 ngày, trung bình mỗi ngày) và tạo dự báo sơ bộ (rule-based).
  3. `GeminiAIService`: Chấp nhận tập dữ liệu phái sinh trên, gọi Google Gemini API yêu cầu trả về định dạng JSON (JSON schema enforce), parse và validate kết quả.
  4. `AIController`: Phối hợp các services trên, nhận JSON, ghi log vào bảng `ai_analysis_runs` và lưu chi tiết vào bảng `ai_recommendations`.
  5. `Frontend (AIInsightsPage)`: Fetch dữ liệu từ DB (thay vì tự sinh dummy data) và cung cấp UI cho phép người dùng `APPLY` hoặc `IGNORE` các khuyến nghị.

### Key Design Decisions
- Tách biệt `ForecastService` và `GeminiAIService` thay vì gộp chung.
  - *Trade-offs*: Tăng số lượng file, nhưng dễ dàng maintain. Có thể sử dụng `ForecastService` độc lập làm Fallback khi `GeminiAIService` gặp sự cố mạng hoặc API quota limit.
  - *Recommendation*: Chấp nhận tách biệt, phù hợp với kiến trúc phân lớp hiện có.
- Lưu lịch sử phân tích vào CSDL (`ai_analysis_runs` & `ai_recommendations`).
  - *Trade-offs*: Cần tạo thêm schema mới. Tuy nhiên, nếu không lưu, mỗi khi f5 trang sẽ phải gọi lại Gemini (gây tốn token, thời gian chờ lâu, trải nghiệm kém).
  - *Recommendation*: Bắt buộc tạo 2 bảng này để cache kết quả và quản lý lifecycle của đề xuất (`PENDING` -> `APPLIED`).
- Bắt buộc Gemini trả về JSON Schema Strict.
  - *Trade-offs*: Có rủi ro model hallucinate format hoặc trả về markdown block ` ```json ... ``` `.
  - *Recommendation*: Backend cần sử dụng tính năng Structured Outputs của Gemini (nếu model hỗ trợ) hoặc dùng system prompt chặt chẽ, kèm theo regex làm sạch (strip markdown) và `JSON.parse` có try/catch an toàn.

### Alternatives Considered
- *Xử lý dữ liệu (Aggregation) trực tiếp trên DB bằng SQL View thay vì Node.js Repository*: Có thể tối ưu tốc độ, nhưng làm luồng code phức tạp và khó mở rộng nếu thêm logic phức tạp. Bị loại bỏ vì `AIRepository` trong Nodejs dễ debug và kiểm soát.


## Risk & Gap Analysis

### Requirement Ambiguities
- "Chỉ gửi top N sản phẩm cần nhập, top bán chạy..." - Không chỉ rõ N là bao nhiêu (ví dụ: top 50, top 100?). Nếu số lượng sản phẩm lớn, payload gửi lên AI có thể vượt qua context window. Sẽ cần giới hạn hợp lý (vd: Top 100 sản phẩm có doanh thu hoặc độ rủi ro cao nhất).
- Quản lý trạng thái `APPLIED`: Khi bấm "Áp dụng", sản phẩm được đánh dấu là `APPLIED` và chuyển sang trang Nhập kho. Nếu người dùng không thực sự nhập kho mà thoát ra thì sao? Trạng thái `APPLIED` có thể bị sai lệch. 

### Edge Cases
- Trường hợp CSDL chưa có bất kỳ đơn hàng nào (Sản phẩm mới hoàn toàn): AI có thể trả về lỗi hoặc số lượng gợi ý là 0 hoặc số ảo. Cần fallback fallback rule-based dựa trên cấu hình tồn tối thiểu.
- Gemini trả về `product_id` không tồn tại trong danh sách gửi đi (Hallucination). Backend phải đối chiếu (filter) các recommendation trả về khớp với ID thực tế.

### Technical Risks
- *Gemini API Timeout/Rate Limits*: Giao tiếp với API ngoài luồng (HTTP request to Google) có thể tốn 5s - 15s.
  - *Mitigation*: Cần hiển thị Loading Indicator rõ ràng ở Frontend (`recalculating` state đã có). Cần set Timeout hợp lý ở Axios/Fetch backend, nếu timeout thì fallback sang Rule-based.
- *LLM JSON Parsing Failure*: LLM thi thoảng trả về syntax lỗi.
  - *Mitigation*: Bọc Try/Catch khi parse. Nếu lỗi, ghi log và trả về fallback data.

### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Hoàn thiện AI Settings (DB & UI) | Yes | N/A |
| 2 | Tạo migration/bảng DB cho AI | Yes | Cần chạy raw SQL trong setup. |
| 3 | Xây dựng AIRepository (Lấy data sạch) | Yes | Dễ dàng query trên Supabase JS. |
| 4 | Xây dựng ForecastService (Rule-based) | Yes | Công thức toán học đã rõ ràng. |
| 5 | Xây dựng GeminiAIService (JSON Schema) | Yes | Cần chú ý bóc tách markdown block ` ```json `. |
| 6 | Tạo AIController & Routes | Yes | Theo đúng chuẩn MVC hiện có. |
| 7 | Cập nhật UI AIInsightsPage | Yes | Đã có sẵn template, cần nối dây Data thật. |
| 8 | Cập nhật frontend `aiService` | Yes | Gọi API axios. |
| 9 | Xử lý Fallback/Error an toàn | Yes | Bọc try/catch toàn cục ở Controller. |
