# Deployment Information

## Public URLs
- **Frontend:** [https://document-sharing-frontend-thik.onrender.com/](https://document-sharing-frontend-thik.onrender.com/)
- **Backend API:** [https://document-sharing-backend.onrender.com/api](https://document-sharing-backend.onrender.com/api)

## Platform
- **Cloud Provider:** Render.com
- **Deployment Method:** Render Blueprint (IaC) via `render.yaml`

## Test Commands

### 1. Health Check
Kiểm tra xem Backend có phản hồi không:
```bash
curl https://document-sharing-backend.onrender.com/api/universities
```
**Kết quả mong đợi:** Danh sách các trường đại học dưới dạng JSON.

### 2. API Security (JWT Auth)
Thử tải một tài liệu mà không có Token:
```bash
curl https://document-sharing-backend.onrender.com/api/download/part/some-id
```
**Kết quả mong đợi:** Lỗi `401 Unauthorized` (do chúng ta đã bảo mật bằng JWT).

### 3. API Gateway (Frontend Nginx)
Kiểm tra xem Nginx có điều hướng đúng yêu cầu API không:
```bash
curl https://document-sharing-frontend-thik.onrender.com/api/universities
```
**Kết quả mong đợi:** Phản hồi giống hệt lệnh gọi trực tiếp vào Backend (chứng minh Gateway hoạt động).

### 4. AI Agent (Ex 6.1)
Kiểm tra tính năng hội thoại của AI Agent (với Auth):
```bash
curl -X POST https://document-sharing-backend.onrender.com/api/ask \
  -H "X-API-Key: [YOUR_JWT_SECRET]" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "student_test", "question": "My name is Antigravity"}'
```
**Kết quả mong đợi:** AI nhận diện được tên và phản hồi 200 OK.

## Environment Variables Configuration
Hệ thống yêu cầu các biến sau trên Render Dashboard:
- `SUPABASE_URL` & `SUPABASE_ANON_KEY`: Kết nối cơ sở dữ liệu.
- `GOOGLE_AI_API_KEY`: Cho tính năng RAG Chatbot.
- `JWT_SECRET`: Bảo mật link tải tài liệu.
- `VITE_API_URL`: (Dùng cho Frontend) trỏ về URL Backend.
