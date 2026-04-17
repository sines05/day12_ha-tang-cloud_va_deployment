# 🚀 Hướng dẫn Deploy dự án lên Railway

Dự án đã được cấu hình sẵn với Docker Compose và Nginx API Gateway, giúp việc triển khai lên Railway trở nên cực kỳ đơn giản.

## Bước 1: Chuẩn bị mã nguồn
Đảm bảo bạn đã đẩy toàn bộ mã nguồn của thư mục `document-sharing` lên một Repository GitHub cá nhân.

```bash
git init
git add .
git commit -m "Initial commit: Production-ready Document Sharing with AI Agent"
git remote add origin <your-github-repo-url>
git push -u origin main
```

## Bước 2: Khởi tạo dự án trên Railway
1. Truy cập [Railway.app](https://railway.app/) và đăng nhập bằng GitHub.
2. Nhấn **+ New Project** -> **Deploy from GitHub repo**.
3. Chọn Repository bạn vừa đẩy lên.
4. Railway sẽ tự động nhận diện file `docker-compose.yml`.

## Bước 3: Cấu hình Biến môi trường (Variables)
Railway sẽ tạo ra 2 dịch vụ: `frontend` và `backend`. Bạn cần cấu hình biến môi trường cho từng dịch vụ:

### 1. Cho dịch vụ Backend (`exam-worker`):
Vào mục **Variables** của dịch vụ Backend và nạp các giá trị từ file `.dev.vars`:
- `SUPABASE_URL`: (Lấy từ tài khoản Supabase của bạn)
- `SUPABASE_ANON_KEY`: (Lấy từ tài khoản Supabase của bạn)
- `GOOGLE_AI_API_KEY`: (Khóa Gemini API của bạn)
- `JWT_SECRET`: (Một chuỗi ký tự bất kỳ để bảo mật)
- `TELEGRAM_BOT_TOKEN`: (Nếu có)
- `TELEGRAM_CHANNEL_ID`: (Nếu có)

### 2. Cho dịch vụ Frontend (`vnu`):
Trong mục **Variables** của Frontend, hãy thêm:
- `VITE_API_URL`: `/api` (Chúng ta dùng đường dẫn tương đối vì Nginx đã làm API Gateway).

## Bước 4: Thiết lập Networking
1. **Frontend:** Vào mục **Settings** -> **Public Networking** -> Nhấn **Generate Domain**. Đây sẽ là địa chỉ website chính thức của bạn.
2. **Backend:** Railway sẽ tự động cấp một hostname nội bộ (ví dụ: `backend.railway.internal`). 
   - **Lưu ý:** Bạn cần cập nhật file `nginx.conf` phần `proxy_pass http://backend:3000` thành `proxy_pass http://<tên-dịch-vụ-backend-trên-railway>:3000` nếu Railway đổi tên dịch vụ của bạn.

## Bước 5: Kiểm tra thành quả
Sau khi Railway build xong (màu xanh), bạn truy cập vào Domain của Frontend:
- Website sẽ hiện ra.
- Chatbot AI sẽ hoạt động và có thể truy xuất dữ liệu từ Supabase.
- Mọi yêu cầu `/api` sẽ được Nginx tự động điều hướng về Backend một cách bảo mật.

---

### 💡 Mẹo nhỏ:
Nếu bạn gặp lỗi liên quan đến `npm install` khi deploy, hãy đảm bảo rằng bạn đã xóa thư mục `node_modules` và file `package-lock.json` trước khi push lên GitHub để Railway tự tạo bản mới tương thích với môi trường Linux của họ.
