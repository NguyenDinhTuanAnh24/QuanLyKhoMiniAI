# AGENTS.md - Smart Retail Inventory AI

## Project Context

Project name: **Smart Retail Inventory AI**

This is a graduation/project system for a **mini retail inventory management website integrated with AI inventory forecasting**.

Core purpose:
- Manage products, categories, units, suppliers, stock, sales orders, inventory movements, reports, and AI insights.
- Help a small retail store monitor stock levels, avoid out-of-stock situations, identify best-selling products, and receive AI-based reorder suggestions.

## Tech Stack

Frontend:
- React
- Tailwind CSS
- Lucide React
- Vite

Backend:
- Node.js
- Express
- Supabase JS SDK

Database:
- Supabase PostgreSQL

Local ports:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Frontend API base URL: `http://localhost:5000/api`

## Important Data Source

The project uses the processed CSV dataset located in:

```txt
database/seed/
```

CSV files:

```txt
categories.csv
units.csv
suppliers.csv
products_clean.csv
orders_sample.csv
order_items_sample.csv
stock_movements_sample.csv
```

The database schema, backend repositories/services/controllers, and frontend fields must stay aligned with these CSV files.

Do **not** rename database columns casually. If a field name must be changed, provide a clear mapping and update all related files.

## Main Database Tables

Expected tables:

```txt
categories
units
suppliers
products
orders
order_items
stock_movements
```

Important product fields:

```txt
product_id
sku
product_name
product_name_en
category_id
category_name
unit_id
unit_name
supplier_id
stock_quantity
reorder_level
reorder_quantity
import_price
selling_price
date_received
expiration_date
warehouse_location
sales_90d
avg_daily_sales_90d
forecast_14d
suggested_import_quantity
status
source_row_count
deleted_at
```

Do not use old field names unless explicitly mapped:

```txt
id              -> product_id
name            -> product_name
retail_price    -> selling_price
min_stock_level -> reorder_level
recommended_reorder_quantity -> reorder_quantity
expiry_date     -> expiration_date
```

## Backend Rules

When editing backend code:

1. Keep the existing layered structure:

```txt
routes -> controllers -> services -> repositories -> Supabase
```

2. Keep backend port `5000`.
3. Do not expose Supabase service role key in logs or frontend.
4. Use `.env` variables:

```env
PORT=5000
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

5. Use the existing global error handler if available.
6. Validate request body before writing to database.
7. Do not break working APIs when adding new modules.
8. Prefer soft delete with `deleted_at` instead of hard delete where possible.
9. For product stock warning logic, use:

```txt
stock_quantity <= reorder_level
```

10. Keep API responses consistent with the current product module.

## Frontend Rules

When editing frontend code:

1. Keep frontend port `5173`.
2. Keep API base URL as:

```txt
http://localhost:5000/api
```

3. Do not break the working product list API connection.
4. Use React + Tailwind CSS + Lucide React.
5. Avoid adding heavy UI libraries unless explicitly requested.
6. Prefer reusable components:

```txt
MainLayout
Sidebar
Topbar
PageHeader
StatCard
DataTable
StatusBadge
Button
Input
Select
Modal
```

7. Keep UI aligned with the Figma style described in `frontend/DESIGN_SYSTEM.md`.
8. If editing UI, prefer improving existing components instead of rewriting the whole app.
9. When implementing a page, use real backend data if the API exists; otherwise use clearly marked temporary mock data.
10. Do not rename API fields in frontend unless backend has been updated too.

## UI/UX Direction

The UI should follow the provided Figma design screenshots:

- Clean admin dashboard
- Light theme
- Left sidebar
- Topbar
- Light gray app background
- White cards
- Rounded corners
- Soft borders and shadows
- Blue primary color
- Dense but readable tables
- Status badges with clear colors

## Project Pages

Expected screens:

```txt
Login
Dashboard
Products
Product Add/Edit
Categories
Suppliers
Import Stock
Sales / Orders
Inventory
Reports
AI Insights
Users
Settings
```

## Prompt Usage Rules for Agents

For Antigravity:
- Use `/spdd-analysis` only for new large modules or business requirement analysis.
- Do **not** use `/spdd-analysis` for small UI fixes, bug fixes, or config changes.
- Use `@file` references when asking the agent to edit or inspect files.

For Codex:
- Use `$spdd-analysis` only for new large modules or structured SPDD workflows.
- Do **not** use `$spdd-analysis` for small direct fixes.
- Use `@file` references when asking the agent to edit or inspect files.

Examples:

```txt
@AGENTS.md
@frontend/DESIGN_SYSTEM.md
@frontend/src/components/ProductDashboard.jsx

Improve ProductDashboard UI according to the design system. Do not change backend or API fields.
```

For larger modules:

```txt
/spdd-analysis @requirements/02-master-data-management.md
```

or in Codex:

```txt
$spdd-analysis @requirements/02-master-data-management.md
```

## Safety Rules

Never commit or expose:

```txt
.env
Supabase service role key
API keys
Database passwords
```

Recommended `.gitignore` entries:

```gitignore
.env
backend/.env
frontend/.env
node_modules/
dist/
```

CSV seed files may be kept in the repository because they are sample data for the project.
