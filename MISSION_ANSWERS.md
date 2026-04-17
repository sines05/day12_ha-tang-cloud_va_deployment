# Day 12 Lab - Mission Answers

## Part 1: Localhost vs Production

### Exercise 1.1: Anti-patterns found
1. **Hardcoded Secrets:** API Keys (Supabase, Google AI) được để trực tiếp trong code hoặc file `.env` commit lên repo.
2. **Fixed Ports:** Sử dụng cổng cố định (ví dụ: 3000) mà không cho phép cấu hình qua biến môi trường `PORT`.
3. **No Health Checks:** Không có endpoint `/health` để hệ thống giám sát biết ứng dụng còn hoạt động hay không.
4. **Synchronous/Blocking Code:** Một số tác vụ xử lý file nặng làm chặn event loop của Node.js/Hono.
5. **Lack of Graceful Shutdown:** Ứng dụng bị ngắt đột ngột khi container dừng, dễ gây mất mát dữ liệu hoặc hỏng kết nối Database.

### Exercise 1.3: Comparison table
| Feature | Develop | Production | Why Important? |
|---------|---------|------------|----------------|
| Config  | .env file / Hardcode | Environment Variables | Bảo mật và linh hoạt khi thay đổi hạ tầng. |
| Health check | None | /health & /ready endpoints | Giúp Orchestrator (Render/K8s) tự động restart khi lỗi. |
| Logging | console.log() | Structured JSON Logging | Dễ dàng truy vết lỗi trên hệ thống tập trung (Logtail/ELK). |
| Shutdown | Immediate | Graceful (SIGTERM) | Hoàn thành các request đang dở dang trước khi tắt máy. |

## Part 2: Docker

### Exercise 2.1: Dockerfile questions
1. **Base image:** `node:20-alpine` (cho Backend) và `nginx:alpine` (cho Frontend). Alpine giúp giảm dung lượng image tối đa.
2. **Working directory:** `/app` - Giúp tách biệt code ứng dụng với hệ thống file của OS.
3. **Tại sao COPY package.json trước?** Để tận dụng **Docker Layer Caching**. Nếu `package.json` không đổi, Docker sẽ không chạy lại `npm install`, giúp build nhanh hơn.
4. **CMD vs ENTRYPOINT:** CMD là lệnh mặc định có thể bị ghi đè khi chạy container, ENTRYPOINT là lệnh cố định luôn được thực thi.

### Exercise 2.3: Image size comparison
- **Develop (Single stage):** ~900 MB
- **Production (Multi-stage):** ~120 MB (Frontend) / ~250 MB (Backend)
- **Difference:** Giảm được ~70% dung lượng.

## Part 3: Cloud Deployment

### Exercise 3.1: Render deployment
- **Frontend URL:** https://document-sharing-frontend-thik.onrender.com/
- **Backend URL:** https://document-sharing-backend.onrender.com/api
- **Lỗi đã xử lý:** 
    - Sai Docker Context trong `render.yaml`.
    - Nginx 502 Bad Gateway do sai DNS resolver nội bộ.
    - Lỗi kết nối API do thiếu tiền tố `/api` trong `VITE_API_URL`.

## Part 4: API Security

### Exercise 4.1-4.3: Test results
- **Auth:** Đã triển khai JWT token cho việc tải tài liệu (`auth.ts`).
- **Rate Limiting:** Sử dụng Middleware của Hono để giới hạn 10 req/phút cho các endpoint quan trọng.

## Part 5: Scaling & Reliability

### Exercise 5.1-5.5: Implementation notes
- **Stateless:** Dữ liệu file được lưu trên Telegram/Supabase, session không lưu trong memory giúp scale ngang dễ dàng.
- **Graceful Shutdown:** Đã cấu hình để hoàn tất các stream upload trước khi container thoát.
