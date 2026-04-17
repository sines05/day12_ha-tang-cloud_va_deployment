# Day 12 Lab - Mission Answers

## Part 1: Localhost vs Production

### Exercise 1.1: Anti-patterns found
Trong file `develop/app.py`, tôi đã tìm thấy các anti-patterns sau:
1. **Hardcoded Secrets:** API Key (`OPENAI_API_KEY`) và Database URL được viết trực tiếp vào mã nguồn.
2. **Thiếu Configuration Management:** Các cấu hình như `DEBUG`, `MAX_TOKENS` bị gán cứng thay vì đọc từ môi trường.
3. **Hardcoded Host & Port:** Ứng dụng chỉ bind vào `localhost` và port `8000`, gây khó khăn khi triển khai trên Cloud hoặc Docker.
4. **Sử dụng `print()` thay vì logging chuyên nghiệp:** Không có timestamp, không có level (INFO/DEBUG) và rò rỉ secret ra log.
5. **Thiếu Health Check Endpoint:** Không có cơ chế để Platform giám sát trạng thái của Agent.
6. **Không xử lý Signal:** Thiếu cơ chế Graceful Shutdown để hoàn thành các request dở dang.

### Exercise 1.2: Phân tích 12-Factor App
1. **Tại sao `0.0.0.0` quan trọng?** 
   - `localhost` (127.0.0.1) chỉ cho phép kết nối từ chính bên trong container. 
   - `0.0.0.0` cho phép ứng dụng lắng nghe kết nối từ tất cả các interface mạng, giúp bên ngoài container (Internet/Load Balancer) có thể truy cập được.
2. **Ý nghĩa của Stateless:**
   - Giúp Agent có thể scale ngang (chạy nhiều bản sao) mà không lo lắng về việc dữ liệu session bị phân tán, vì mọi dữ liệu bền vững đều được lưu ở Backing Services (như Redis/PostgreSQL).

### Exercise 1.3: Comparison table
| Feature | Develop (❌) | Production (✅) | Why Important? |
|---------|---------|------------|----------------|
| **Config** | Hardcoded trong code | Đọc từ Environment Variables | Dễ thay đổi cấu hình mà không cần sửa code/build lại. |
| **Secrets** | Lộ trong source code | Lưu trong biến môi trường bảo mật | Tránh rò rỉ key và mất tiền/dữ liệu. |
| **Port** | Cố định 8000 | Đọc từ biến `PORT` | Cloud Provider (Railway/Render) sẽ cấp port ngẫu nhiên. |
| **Logging** | Dùng `print()` | Structured JSON Logging | Dễ dàng quản lý và phân tích log tự động (Datadog/ELK). |
| **Health Check** | Không có | Endpoint `/health` & `/ready` | Hệ thống có thể tự động restart nếu Agent bị treo. |
| **Shutdown** | Tắt đột ngột | Graceful Shutdown (SIGTERM) | Đảm bảo không làm mất dữ liệu của người dùng khi đang xử lý. |

## Part 2: Docker

### Exercise 2.1: Dockerfile questions
1. **Base image:** 
   - Bản Develop dùng `python:3.11` (đầy đủ tools, nặng ~1GB).
   - Bản Production dùng `python:3.11-slim` (tối ưu, nhẹ ~150MB).
2. **Working directory:** `/app` (Đây là thư mục tiêu chuẩn để chứa mã nguồn ứng dụng).
3. **Tại sao cần lệnh `COPY requirements.txt .` trước khi `COPY . .`?**
   - Để tận dụng **Docker Layer Caching**. Nếu bạn chỉ sửa code mà không thêm thư viện mới, Docker sẽ bỏ qua bước `pip install` và build cực nhanh.

### Exercise 2.2: Multi-stage Build Analysis
- **Stage 1 (Builder):** Chịu trách nhiệm cài đặt và compile các thư viện nặng.
- **Stage 2 (Runtime):** Chỉ chứa Python Runtime và các thư viện đã compile từ Stage 1. 
- **Lợi ích:** Image nhỏ hơn, không chứa build tools (như gcc) giúp giảm bề mặt tấn công (security).

### Exercise 2.3: Image size comparison
- **Develop:** ~800 MB (Single-stage, full python base)
- **Production:** ~160 MB (Multi-stage, slim base)
- **Difference:** Giảm ~80% dung lượng.

### Exercise 2.4: Docker Compose
- **Vai trò:** Giúp khởi động toàn bộ "hệ sinh thái" của Agent (Agent + Redis + Nginx) chỉ bằng một câu lệnh duy nhất `docker compose up`.
- **Nginx trong stack:** Đóng vai trò Reverse Proxy, giúp ẩn port thật của Agent và có thể thêm SSL/Load Balancing sau này.

## Part 3: Cloud Deployment

### Exercise 3.1: Railway deployment
- **URL:** https://your-agent-production.up.railway.app (Thay bằng URL thực tế của bạn)
- **Ưu điểm của Railway:** Tự động phát hiện ngôn ngữ lập trình, hỗ trợ Nixpacks để build cực nhanh mà không cần Dockerfile nếu muốn đơn giản.

### Exercise 3.2: Render vs Railway
| Tiêu chí | Railway | Render |
|----------|---------|--------|
| **Cấu hình** | `railway.toml` | `render.yaml` (Blueprints) |
| **Dễ dùng** | Rất cao, CLI mạnh | Cao, giao diện web trực quan |
| **Thế mạnh** | Deploy nhanh, pay-as-you-go | Infrastructure as Code mạnh mẽ |

### Exercise 3.3: Discussion Questions
1. **Tại sao serverless (Lambda) không phải lúc nào cũng tốt cho AI agent?**
   - AI Agent thường cần thời gian chạy dài (long-running) để suy nghĩ hoặc stream kết quả. Lambda có giới hạn thời gian (timeout) và tốn tài nguyên khi phải load model/thư viện AI liên tục ở mỗi request.
2. **"Cold start" là gì?**
   - Là hiện tượng Server tạm nghỉ khi không có request. Khi có người gọi, nó cần thời gian để khởi tạo lại container. Với AI Agent, việc load model trong lúc Cold Start có thể làm người dùng đợi rất lâu.
3. **Khi nào nên upgrade lên Cloud Run (GCP)?**
   - Khi ứng dụng có lượng traffic lớn, cần tự động scale mạnh mẽ và cần tích hợp sâu vào hệ sinh thái của Google (như Vertex AI, BigQuery).

## Part 4: API Security

### Exercise 4.1: API Key Authentication
- **Cơ chế:** Kiểm tra Header `X-API-Key`. Nếu không khớp với giá trị cấu hình trong `AGENT_API_KEY`, trả về lỗi `401 Unauthorized`.
- **Kết quả test:** 
  - Có key: Trả về 200 OK.
  - Không key/Key sai: Trả về 401.

### Exercise 4.2: Rate Limiting
- **Thuật toán:** Sliding Window Counter.
- **Cấu hình:** 10 requests / 60 seconds.
- **Mã lỗi trả về:** `429 Too Many Requests`.

### Exercise 4.4: Cost Guard Implementation
- **Cách tính phí:** Dựa trên số lượng Token input và output của mỗi request. 
- **Công thức:** `(Input_Tokens / 1000 * Giá_Input) + (Output_Tokens / 1000 * Giá_Output)`.
- **Cơ chế bảo vệ:** 
  - Theo dõi `total_cost_usd` tích lũy trong ngày của từng User.
  - Nếu `total_cost_usd >= daily_budget_usd`, chặn request tiếp theo và trả về mã lỗi `402 Payment Required`.
  - Có lớp bảo vệ **Global Budget** để tránh trường hợp nhiều user cùng dùng hết tiền của toàn hệ thống.

## Part 5: Scaling & Reliability

### Exercise 5.1: Health & Readiness Checks
- **Liveness (/health):** Trả về status 200 để xác nhận process của Agent vẫn đang chạy.
- **Readiness (/ready):** Kiểm tra các kết nối bên ngoài (Redis, Database). Nếu một dịch vụ phụ trợ sập, Agent sẽ báo chưa sẵn sàng để Load Balancer không gửi traffic vào.

### Exercise 5.2: Graceful Shutdown
- **Cơ chế:** Lắng nghe tín hiệu `SIGTERM`.
- **Hành động:** 
  1. Ngừng nhận request mới.
  2. Đợi các request hiện tại xử lý xong (trong khoảng timeout cho phép).
  3. Đóng các kết nối Database/Redis an toàn.
  4. Thoát process.

### Exercise 5.3: Stateless Refactoring
- **Trước (Stateful):** `history = {}` (Lưu trong RAM).
- **Sau (Stateless):** `history = redis.get(user_id)`.
- **Tại sao quan trọng?** Cho phép scale ngang (Horizontal Scaling). Bất kỳ instance nào cũng có thể phục vụ bất kỳ user nào.

### Exercise 5.4: Load Balancing với Nginx
- **Lệnh scale:** `docker compose up --scale agent=3`.
- **Quan sát:** Nginx sẽ phân phối request theo thuật toán Round Robin (xoay vòng) đến 3 instances của Agent. Nếu 1 instance bị crash, hệ thống vẫn hoạt động bình thường nhờ 2 instance còn lại.




