# SPDD Analysis: Final Testing Phase

## Original Business Requirement
Thực hiện đợt kiểm thử tổng thể cuối cùng cho đồ án "SMART RETAIL INVENTORY AI". Mục tiêu không chỉ tìm lỗi mà còn sinh đầy đủ Evidence và tài liệu cho Chương 3 (Kết quả nghiên cứu và thảo luận).
Bao gồm thiết lập framework (Vitest, Supertest, Playwright), kiểm thử tất cả các module chính (Auth, Role, Product, Inventory, Sales, AI, Notifications, Reports, Settings), xuất báo cáo 3.1.1, 3.1.2, 3.1.3, 3.2.1, 3.2.2. Không được phá dữ liệu production, và phải có kết quả test execution thực tế.

## Domain Concept Identification

### Existing Concepts (from codebase)
- **Test Framework**: The project currently lacks automated testing frameworks. Testing structures need to be scaffolded (Unit, Integration, E2E).
- **Authentication & RBAC**: Core authorization mechanisms (ADMIN, OWNER, WAREHOUSE_STAFF, SALES_STAFF).
- **Core Modules**: Products, Categories, Suppliers, Units.
- **Inventory & Sales**: Import/Export plans, stock movements, order processing with atomic updates.
- **AI Integration**: Forecast models (Rule-based vs Gemini), AI Import Plans (Draft -> Applied -> Completed).
- **Alerts & Notifications**: Realtime stock warnings (Low stock, Out of stock).

### New Concepts Required
- **Test Artifacts**: JUnit XML, JSON/HTML reports, E2E traces.
- **Test Documentation**: Chapter 3 Markdown documents describing the objectives, test plans, test cases, and results.
- **Mock Services**: Mocked Gemini API responses to avoid quota usage during CI/automated runs.
- **Performance Baselines**: Response time metrics for standard APIs and AI endpoints.

### Key Business Rules
- **Non-destructive Testing**: Test data must be prefixed (`TEST_`, `E2E_`) and must not delete or corrupt existing seed/production data.
- **Atomic Stock Rules**: Inventory cannot be negative. Failed orders must rollback entirely without partial updates.
- **AI Plan Lifecycle**: AI Draft plans must be completed explicitly to impact stock.
- **Role Isolation**: Users must only access features permitted by their specific roles (e.g., Sales cannot access Admin settings).

## Strategic Approach

### Solution Direction
- **Phase 1: Environment Setup**: Install and configure `vitest` and `supertest` in the backend, and `@playwright/test` for E2E testing in the frontend. Configure mock environments for external integrations (Gemini, PayOS).
- **Phase 2: Test Documentation (3.1.x)**: Generate the foundational Chapter 3 documents (Objectives, Test Plan, Test Cases) based on the current codebase structure.
- **Phase 3: Test Implementation**: Write critical automated tests across the defined scope (Auth, Inventory, AI, Sales, etc.).
- **Phase 4: Test Execution & Reporting (3.2.x)**: Run the test suites, collect metrics (Pass/Fail, Performance), and generate the final result reports (Functional and Non-Functional).

### Key Design Decisions
- **Testing Frameworks**: Use `vitest` + `supertest` for backend (fast, easy config) and `playwright` for frontend E2E. *Rationale: Avoids overlapping frameworks while covering both unit/integration APIs and full browser flows.*
- **Database Testing**: Use isolated test records with prefix matching for cleanup rather than transaction rollbacks, to ensure database state is preserved for manual verification. *Rationale: Allows easy debugging without wiping the entire DB, meeting the non-destructive requirement.*
- **Mocking Strategy**: External APIs (Gemini) will be fully mocked in automated tests to prevent flakiness and billing issues.

### Alternatives Considered
- *Using Cypress for E2E*: Rejected in favor of Playwright due to Playwright's better multi-tab support and modern architecture.
- *Running tests on a separate shadow database*: Rejected due to the complexity of spinning up a separate Supabase PostgreSQL instance locally just for this phase. Isolated prefixed records are sufficient.

## Risk & Gap Analysis

### Requirement Ambiguities
- The exact mapping of the existing database to the tests (e.g., whether to use a specific test user or create one on the fly). *Mitigation: Automated tests will dynamically create and teardown test accounts/data.*
- The extent of "Performance target" measuring. *Mitigation: Will use Playwright traces and API response time assertions to capture baseline metrics.*

### Edge Cases
- **Concurrent AI Plan Generation**: Applying multiple AI plans simultaneously might result in race conditions.
- **Stock Edge Cases**: Updating stock precisely to 0 or negative quantities concurrently.

### Technical Risks
- **Supabase Realtime**: Testing realtime notifications in CI/Playwright can be flaky. *Mitigation: Use generous timeouts and explicit waits for DOM elements reflecting notifications.*
- **Resource Constraints**: Running a full suite of Playwright E2E tests locally might tax the system running the backend and frontend simultaneously.

### Acceptance Criteria Coverage
| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Non-destructive testing | Yes | Will use strict data cleanup scripts |
| 2 | Setup missing frameworks | Yes | Vitest, Supertest, Playwright |
| 3 | Chapter 3 Doc Generation | Yes | Will be written to `docs/testing/chapter-3/` |
| 4 | Comprehensive Module Testing | Yes | Will cover Auth, Inventory, AI, etc. |
| 5 | Performance & Security NFRs | Yes | Measured and reported |
