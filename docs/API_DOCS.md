# Tài Liệu Đặc Tả API (API Documentation)
**Dự án**: Smart Retail Inventory AI
**Phiên bản API**: v1.0

Tài liệu này đặc tả các điểm cuối (endpoints) của Backend (Node.js/Express) để Frontend (React) giao tiếp. Tất cả các API yêu cầu xác thực đều phải truyền token trong header:
`Authorization: Bearer <JWT_TOKEN>`

---

## 1. Authentication (`/api/auth`)

### 1.1. Đăng nhập
- **Endpoint**: `POST /api/auth/login`
- **Mô tả**: Xác thực người dùng và trả về JWT token.
- **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "password123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
  ```

---

## 2. Products (`/api/products`)

### 2.1. Lấy danh sách sản phẩm
- **Endpoint**: `GET /api/products`
- **Query Params**: `page` (int), `limit` (int), `search` (string), `categoryId` (int)
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": 101,
        "sku": "SP001",
        "name": "Nước giải khát Coca Cola",
        "price": 10000,
        "stock_quantity": 150,
        "reorder_level": 20
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10
    }
  }
  ```

### 2.2. Thêm mới sản phẩm
- **Endpoint**: `POST /api/products`
- **Yêu cầu Quyền**: `admin`, `manager`
- **Request Body**:
  ```json
  {
    "name": "Sản phẩm A",
    "sku": "SP-A",
    "price": 50000,
    "category_id": 2,
    "unit_id": 1
  }
  ```

---

## 3. Inventory & Movements (`/api/inventory`)

### 3.1. Nhập / Xuất Kho
- **Endpoint**: `POST /api/inventory/movement`
- **Mô tả**: Tạo phiếu nhập (IN) hoặc xuất (OUT) hàng hóa.
- **Request Body**:
  ```json
  {
    "type": "IN", 
    "product_id": 101,
    "quantity": 50,
    "supplier_id": 5,
    "notes": "Nhập hàng đầu tháng"
  }
  ```
- **Response (201 Created)**: Cập nhật tự động `stock_quantity` trong bảng products.

---

## 4. Orders (`/api/orders`)

### 4.1. Tạo đơn bán hàng (Checkout)
- **Endpoint**: `POST /api/orders`
- **Mô tả**: Tạo hóa đơn thanh toán cho khách hàng, hỗ trợ tiền mặt hoặc PayOS.
- **Request Body**:
  ```json
  {
    "payment_method": "qr_payos",
    "items": [
      { "product_id": 101, "quantity": 2, "price": 10000 }
    ]
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "order_id": 502,
    "total_amount": 20000,
    "payment_url": "https://payos.vn/..."
  }
  ```

---

## 5. AI Forecast (`/api/ai`)

### 5.1. Phân tích dự báo tồn kho
- **Endpoint**: `POST /api/ai/forecast`
- **Mô tả**: Gọi Google Gemini API để phân tích dữ liệu bán hàng và đưa ra gợi ý nhập hàng.
- **Request Body**:
  ```json
  {
    "days_to_predict": 30,
    "category_id": null
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "insights": "Dựa trên dữ liệu 30 ngày qua, Coca Cola có xu hướng bán mạnh vào cuối tuần. Đề xuất nhập thêm 200 thùng.",
    "recommendations": [
      { "product_id": 101, "suggested_qty": 200, "priority": "HIGH" }
    ]
  }
  ```

---
*Tài liệu được tạo tự động để hỗ trợ team Frontend và Tester trong quá trình tích hợp.*
