# Hướng dẫn Triển khai Smart Retail Inventory AI

Tài liệu này cung cấp các bước để triển khai hệ thống lên môi trường production.

## 1. Yêu cầu hệ thống
- Node.js (v18+)
- Trình quản lý package: npm hoặc yarn
- Database: Supabase PostgreSQL (hoặc self-hosted PostgreSQL)

## 2. Cấu hình Backend
1. Chuyển đến thư mục `backend/`
2. Cài đặt dependencies: `npm install`
3. Copy `.env.example` thành `.env` và điền đầy đủ các thông tin:
   ```env
   PORT=5000
   SUPABASE_URL=https://<your-project-id>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   JWT_SECRET=<your-jwt-secret>
   GEMINI_API_KEY=<your-gemini-api-key>
   ```
4. Khởi động backend bằng lệnh: `npm start` (hoặc dùng PM2: `pm2 start server.js --name "retail-backend"`)

## 3. Cấu hình Frontend
1. Chuyển đến thư mục `frontend/`
2. Cài đặt dependencies: `npm install`
3. Copy `.env.example` thành `.env` và thiết lập biến môi trường trỏ về backend production:
   ```env
   VITE_API_BASE_URL=https://api.yourdomain.com
   VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
   VITE_SUPABASE_KEY=<your-publishable-anon-key>
   ```
4. Build bundle tối ưu: `npm run build`
5. Thư mục `dist/` sẽ được sinh ra. Bạn có thể sử dụng Nginx, Vercel, hoặc Netlify để host nội dung tĩnh trong thư mục này.

## 4. Tối ưu Nginx cho Frontend (Ví dụ)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /path/to/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```
