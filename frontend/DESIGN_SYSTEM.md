# DESIGN_SYSTEM.md - Smart Retail Inventory AI

## Design Goal

The frontend should look like a clean, modern admin dashboard for a mini retail inventory system.

The UI should feel close to the Figma screenshots:

- Bright, simple, professional
- Light gray background
- White content cards
- Blue primary color
- Left sidebar navigation
- Topbar with search/user actions
- Tables and cards for data-heavy management screens
- Rounded corners and soft borders

Pixel-perfect accuracy is not required. Prioritize matching the overall layout, spacing, colors, and visual feeling.

## Color System

Use Tailwind utilities. Recommended visual direction:

### Primary

```txt
Blue: #2563EB / Tailwind blue-600
Hover blue: #1D4ED8 / Tailwind blue-700
Light blue active: #EFF6FF / Tailwind blue-50
```

Use primary blue for:
- Main buttons
- Active sidebar item
- Important icons
- Links
- Focus states

### Background

```txt
App background: #F8FAFC / slate-50
Card background: #FFFFFF
Sidebar background: #FFFFFF
Border: #E5E7EB / gray-200
Text main: #0F172A / slate-900
Text muted: #64748B / slate-500
```

### Status Colors

Use badges consistently:

```txt
Active / Đang bán:
- background: green-50
- text: green-700
- border: green-200

Low stock / Cần nhập:
- background: red-50
- text: red-700
- border: red-200

Warning / Sắp hết:
- background: amber-50
- text: amber-700
- border: amber-200

Disabled / Ngừng bán:
- background: gray-100
- text: gray-600
- border: gray-200

Info / AI suggestion:
- background: blue-50
- text: blue-700
- border: blue-200
```

## Layout

### App Layout

Use a fixed sidebar and main content area:

```txt
MainLayout
├── Sidebar: fixed left, white background
├── Topbar: top area inside main content
└── Page content: gray background, padded
```

Recommended sizes:

```txt
Sidebar width: 240px
Content padding: 24px
Card radius: 12px or 16px
Card border: 1px solid gray-200
Card shadow: very soft, not heavy
```

### Page Width

For admin pages:
- Content should use full available width.
- Avoid narrow centered layouts for dashboard pages.
- Tables should be inside white cards.

## Sidebar

Sidebar items:

```txt
Dashboard
Sản phẩm
Danh mục
Nhà cung cấp
Nhập kho
Bán hàng
Tồn kho
Báo cáo
AI Insights
Người dùng
Cài đặt
```

Sidebar style:
- White background
- Small logo area at top
- Menu item height around 40px
- Active item: light blue background + blue text/icon
- Inactive item: slate/gray text
- Icons from Lucide React
- User block at bottom if needed

## Topbar

Topbar should include:
- Optional global search input
- Notification icon
- User/avatar icon

Style:
- White or transparent over gray background
- Height around 56px to 64px
- Search input with rounded corners and light border

## Cards

Use cards for:
- Statistics
- Forms
- Tables
- AI insights
- Reports

Card style:

```txt
bg-white
rounded-xl or rounded-2xl
border border-gray-200
shadow-sm
p-4 or p-5
```

## Page Header

Each page should have:
- Title
- Short description
- Optional main action button on the right

Example:

```txt
Title: Sản phẩm
Description: Quản lý thông tin sản phẩm trong kho
Action: + Thêm sản phẩm
```

## Stat Cards

Use stat cards at the top of management pages.

For Product page:

```txt
Tổng sản phẩm
Đang bán
Cần nhập
Tổng giá trị tồn kho
```

Stat card content:
- Small label
- Large value
- Optional trend or status text
- Optional icon

## Tables

Tables are central to this project.

Table style:
- White card wrapper
- Header background: gray-50 or white
- Header text: small, medium weight, slate-500/600
- Body text: slate-700/900
- Row height: around 52px to 60px
- Row border: gray-100/200
- Hover: gray-50
- Actions on right

Recommended product table columns:

```txt
SKU
Tên sản phẩm
Danh mục
Đơn vị
Giá bán
Tồn kho
Trạng thái
Hành động
```

Use compact but readable spacing.

## Forms

Form style:
- Labels above inputs
- Inputs height around 40px
- Rounded-md or rounded-lg
- Light gray border
- Focus ring blue
- Validation text below input

Buttons:
- Primary: blue background, white text
- Secondary: white/gray border
- Danger: red

## Modals

Modal style:
- Centered overlay
- White panel
- Rounded-xl
- Shadow-lg
- Title at top
- Form body
- Footer actions: Hủy / Lưu

Use modals for simple add/edit actions when a full page is not necessary.

## Product Page Rules

The product page must use real API data from:

```txt
GET http://localhost:5000/api/products
```

Important fields:

```txt
product_id
sku
product_name
category_name
unit_name
selling_price
stock_quantity
reorder_level
status
suggested_import_quantity
```

Low stock logic:

```txt
stock_quantity <= reorder_level
```

Badge display:
- If low stock: `Cần nhập`
- Otherwise: `Đang bán`

Do not use old field names:

```txt
name
retail_price
min_stock_level
expiry_date
```

## Inventory / Stock Rules

Inventory pages should emphasize:
- Current stock
- Low stock
- Reorder quantity
- Stock movement history
- Expiration date when available

Use warning indicators for:
- Low stock
- Expired or near-expired goods
- High suggested import quantity

## AI Insights Page Rules

AI Insights should look slightly more highlighted than regular pages.

Recommended sections:
- AI summary cards
- Low stock alerts
- Reorder suggestions
- Demand forecast chart area
- Product priority list

Visual style:
- Blue or purple gradient header area if appropriate
- Insight cards with colored icons
- Clear call-to-action button like `Phân tích lại`

## Responsive Rules

The project is mainly desktop admin dashboard, but should not break on smaller screens.

Minimum requirements:
- Sidebar can collapse or stack later if needed
- Table container should allow horizontal scroll
- Cards should wrap on smaller width

## Component Naming

Prefer these reusable components:

```txt
MainLayout.jsx
Sidebar.jsx
Topbar.jsx
PageHeader.jsx
StatCard.jsx
DataTable.jsx
StatusBadge.jsx
Modal.jsx
Button.jsx
Input.jsx
Select.jsx
```

Component rules:
- Keep components small and reusable.
- Avoid duplicating table/card/badge styles across pages.
- Keep API calls in service files, not directly scattered across UI components.

## Tailwind Rules

Use Tailwind CSS utilities consistently.

Do:

```txt
bg-slate-50
bg-white
border border-gray-200
rounded-xl
shadow-sm
text-slate-900
text-slate-500
text-blue-600
```

Avoid:
- Random one-off colors everywhere
- Heavy shadows
- Overly large spacing
- Dark theme unless requested
- Mixing many unrelated UI styles

## Development Rules

When adjusting UI:

1. Do not change backend unless explicitly asked.
2. Do not change API response field names.
3. Do not change ports.
4. Do not break working data fetching.
5. If a feature is not implemented yet, create clean UI placeholders and mark them clearly.
6. Keep code readable for graduation project review.
7. Prefer stable, simple React state over overly complex abstractions.

## Agent Prompt Pattern

When asking an agent to edit UI without Figma MCP, use this pattern:

```txt
Không dùng /spdd-analysis vì đây là task chỉnh UI trực tiếp.
Có dùng @ để đọc design rules và code hiện tại.

@AGENTS.md
@frontend/DESIGN_SYSTEM.md
@frontend/src/components/<ComponentName>.jsx

Hãy chỉnh giao diện màn <tên màn> theo Figma screenshots và design system.
Không đổi backend, không đổi API field, không phá phần đang chạy ổn.
```

For Codex, use the same file references. Only use `$spdd-analysis` for large new modules.

For Antigravity, only use `/spdd-analysis` for large new modules.
