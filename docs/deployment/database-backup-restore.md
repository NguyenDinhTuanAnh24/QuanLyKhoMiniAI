# Hướng dẫn Backup & Restore Database

Dự án Smart Retail Inventory AI sử dụng Supabase PostgreSQL. Dưới đây là các bước để backup và restore an toàn.

## 1. Backup thông qua Supabase Dashboard (Đề xuất)
1. Đăng nhập vào trang quản trị Supabase.
2. Chọn dự án của bạn -> **Database** -> **Backups**.
3. Tại đây bạn có thể cấu hình PITR (Point-in-Time Recovery) hoặc tải xuống Logical Backup hằng ngày.

## 2. Backup thủ công bằng pg_dump
Sử dụng công cụ `pg_dump` đi kèm PostgreSQL để backup toàn bộ cơ sở dữ liệu.

### Câu lệnh Backup:
```bash
pg_dump "postgres://[db-user]:[db-password]@[db-host]:5432/postgres" \
  -n public \
  -F c \
  -f backup_retail_db_$(date +%Y%m%d).dump
```

*Lưu ý:*
- Thay `[db-user]`, `[db-password]`, `[db-host]` bằng thông tin từ mục Database Settings trên Supabase.
- Tùy chọn `-n public` chỉ backup schema public chứa dữ liệu ứng dụng.

## 3. Restore bằng pg_restore
Để phục hồi dữ liệu từ file dump:

```bash
pg_restore -d "postgres://[db-user]:[db-password]@[db-host]:5432/postgres" \
  -1 \
  --clean \
  -n public \
  backup_retail_db_[date].dump
```

*Lưu ý:*
- Tùy chọn `--clean` sẽ xóa các bảng cũ trước khi tạo lại.
- Tùy chọn `-1` (số một) bọc toàn bộ quá trình phục hồi trong 1 transaction, đảm bảo tính toàn vẹn.

## 4. Cập nhật các Function & Indexes (Post-Restore)
Sau khi restore, nếu bạn đã tạo thêm các index hay RPC function (vd: `get_product_consumption`), hãy đảm bảo chúng được tái tạo bằng cách chạy script:
```bash
psql "postgres://[db-user]:[db-password]@[db-host]:5432/postgres" -f database/performance_indexes.sql
```
