# Hướng dẫn thiết lập và sử dụng Server (NestJS + Prisma + PostgreSQL)

## Thiết lập môi trường

### 1. Cài đặt dependencies

```bash
pnpm install
```

### 2. Thiết lập biến môi trường

- Sao chép file `.env.example` thành `.env`
- Điền thông tin kết nối cơ sở dữ liệu PostgreSQL

### 3. Khởi động cơ sở dữ liệu PostgreSQL

```bash
# Từ thư mục gốc của dự án
turbo db:up

# Hoặc từ thư mục apps/server
pnpm db:up
```

### 4. Tạo Prisma Client

```bash
turbo db:generate
```

## Các lệnh cơ sở dữ liệu

### Khởi động/dừng cơ sở dữ liệu

```bash
# Khởi động PostgreSQL
turbo db:up

# Dừng PostgreSQL (giữ dữ liệu)
turbo db:down

# Dừng và xóa dữ liệu
turbo db:down:volumes
```

#### Giao diện web pgAdmin

Sau khi khởi động DB, truy cập pgAdmin tại: http://localhost:8080

- Email: admin@mebike.com
- Password: admin

Để kết nối đến PostgreSQL:

- Host: postgres
- Port: 5432
- Database: mebike
- Username: user
- Password: password

### Quản lý schema và migration

```bash
# Tạo migration mới và áp dụng
turbo db:migrate

# Đẩy schema trực tiếp vào DB (không tạo migration)
turbo db:push

# Reset cơ sở dữ liệu và migration
turbo db:reset

# Mở Prisma Studio (GUI quản lý DB)
turbo db:studio

# Tạo lại Prisma Client sau khi thay đổi schema
turbo db:generate
```

## Chạy ứng dụng

### Chế độ phát triển

```bash
# Từ thư mục gốc
turbo dev --filter server

# Hoặc từ thư mục apps/server
pnpm start:dev
```

### Build và chạy production

```bash
pnpm clean
pnpm build
pnpm start:prod
```

## Kiểm tra và định dạng code

```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Chạy test
pnpm test

# Chạy test với watch mode
pnpm test:watch

# Coverage test
pnpm test:cov

# E2E test
pnpm test:e2e
```

## Cấu hình Prisma

### Chia tách schema (Schema Splitting)

Dự án sử dụng `prisma.config.ts` để hỗ trợ chia tách schema thành nhiều file:

- Schema được lưu trong thư mục `prisma/`
- Có thể tạo nhiều file `.prisma` (ví dụ: `user.prisma`, `post.prisma`)
- `prisma.config.ts` chỉ định đường dẫn schema để Prisma đọc tất cả file

Ví dụ cấu trúc:

```
prisma/
├── config.prisma    # Generator và datasource
├── user.prisma      # Model User
├── post.prisma      # Model Post
└── ...
```

Sau khi thay đổi schema, chạy:

```bash
turbo db:generate
turbo db:push
```

### Từ Docker Compose

Trong file `docker-compose.yml`:

- Database: `mebike`
- User: `user`
- Password: `password`
- Port: `5432`

Chuỗi kết nối: `postgresql://user:password@localhost:5432/mebike?schema=public`

### Tùy chỉnh

- Thay đổi thông tin trong `docker-compose.yml` nếu cần
- Cập nhật `DATABASE_URL` trong `.env` tương ứng
- Khởi động lại DB: `turbo db:down && turbo db:up`

## Ghi chú

- Đảm bảo Docker và Docker Compose đã được cài đặt
- Turbo được cài đặt cục bộ trong monorepo, không cần cài đặt toàn cục
- Sử dụng `turbo` từ thư mục gốc để chạy lệnh trên toàn bộ monorepo
- Sử dụng `pnpm` từ thư mục `apps/server` để chạy lệnh cục bộ
