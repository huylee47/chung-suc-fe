# chungsucliqi-fe

React + Vite frontend cho dịch vụ Chung Sức Liên Quân.

## Chạy local

```powershell
pnpm i
copy .env.example .env
pnpm dev
```

Frontend dùng API Fastify tại `VITE_API_URL`. Trang mockup tham chiếu nằm trong `public/reference`; nếu API chưa chạy, một số dữ liệu public vẫn dùng fallback demo.

```env
VITE_API_URL=http://localhost:4000/api
```

## Kết nối backend production

Khi BE được deploy lên VPS, đổi `.env` của FE thành domain HTTPS của API:

```env
VITE_API_URL=https://api.<domain>/api
```

Sau đó build lại frontend:

```powershell
pnpm build
```

`VITE_API_URL` được nhúng lúc build, nên đổi biến môi trường xong phải build lại. FE không lưu Turso token, SePay API key, webhook secret hoặc thông tin tài khoản ngân hàng.

## Checklist kết nối đầy đủ

- BE đã có `DATABASE_URL` và `DATABASE_AUTH_TOKEN` của Turso.
- BE đã có `SEPAY_ACCOUNT_NUMBER`, `SEPAY_BANK_CODE` và webhook secret.
- SePay webhook trỏ về `https://api.<domain>/api/webhooks/sepay`.
- BE `CORS_ORIGIN` chứa đúng domain FE.
- FE gọi được `GET https://api.<domain>/health`.
- Test login user/admin, tạo lệnh nạp, nhận số dư, tạo đơn UID và admin cập nhật trạng thái.

## Deploy static FE trên VPS

Có thể build FE rồi phục vụ thư mục `dist` bằng Nginx hoặc dịch vụ static khác:

```bash
pnpm i --frozen-lockfile
pnpm build
```

Nginx cần bật SPA fallback để các route `/login`, `/account`, `/admin` không bị 404:

```nginx
server {
    server_name <domain-fe>;
    root /var/www/chungsucliqi-fe/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

HTTPS FE và API nên dùng hai subdomain riêng, ví dụ `app.<domain>` và `api.<domain>`. Chi tiết Turso, SePay, PM2 và Nginx API nằm trong README của repo BE.

## Deploy trên Render

Nếu dùng Render Static Site:

- Build command: `pnpm install --frozen-lockfile && pnpm build`
- Publish directory: `dist`
- Rewrite: `/*` → `/index.html` để các route React không bị 404.

Nếu dùng Render Web Service chạy Vite Preview:

- Build command: `pnpm install --frozen-lockfile && pnpm build`
- Start command: `pnpm exec vite preview --host 0.0.0.0 --port $PORT`

`vite.config.ts` đã whitelist hostname `chung-suc-fe.onrender.com`. Khi đổi tên service/domain Render, thêm hostname mới vào `server.allowedHosts` và `preview.allowedHosts`, sau đó redeploy.
