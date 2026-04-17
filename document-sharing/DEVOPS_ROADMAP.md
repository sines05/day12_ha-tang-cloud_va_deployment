# Lộ trình DevOps: Học tập và Xây dựng Hệ thống

## Giới thiệu
### Mục tiêu chính (Học tập)
Lộ trình này tập trung vào việc học các công nghệ và quy trình DevOps hiện đại thông qua một dự án thực tế. Lộ trình được thiết kế từ gốc, bắt đầu bằng việc học ngôn ngữ lập trình cơ bản cho đến khi triển khai và vận hành một hệ thống hoàn chỉnh.

### Mục tiêu phụ (Sản phẩm)
1. Xây dựng một hệ thống **xác thực người dùng tập trung** vào `vnudocshub.com` bằng Supabase Auth.
2. Xây dựng một **dịch vụ streaming ("Study with Me")** như một module microservice độc lập, được bảo vệ bởi hệ thống xác thực trên.

### Công nghệ mục tiêu
- **Ngôn ngữ:** `JavaScript (ES6+)`, `TypeScript`
- **IaC:** `Terraform`
- **Containerization:** `Docker`, `Docker Compose`
- **Orchestration & Proxy:** `Nginx`
- **CI/CD:** `GitHub Actions`
- **Cloud & Server:** `Linux (Ubuntu)`, `Máy chủ ảo (VM)`
- **Backend & Auth:** `Node.js (Express/Fastify)`, `JWT`, `Supabase (Auth)`

---

## Giai đoạn 0: Nền tảng - JavaScript và TypeScript từ đầu
**Mục tiêu:** Nắm vững kiến thức nền tảng về ngôn ngữ lập trình chính của dự án.

### 0.1 Học JavaScript Cơ bản (ES5)
- [ ] Biến & Kiểu dữ liệu (`var`, `String`, `Number`, `Boolean`)
- [ ] Toán tử (`+`, `-`, `*`, `/`, `%`, `==`, `===`)
- [ ] Cấu trúc điều kiện (`if`, `else`, `switch`)
- [ ] Vòng lặp (`for`, `while`)
- [ ] Hàm cơ bản (`function`)
- [ ] Mảng (`Array`) và các method cơ bản (`push`, `pop`, `length`)
- [ ] Đối tượng (`Object`) và thuộc tính

### 0.2 Học JavaScript Hiện đại (ES6+)
- [ ] `let` và `const` (Scope)
- [ ] Arrow Functions (`() => {}`)
- [ ] Template Literals (`` `Hello ${name}` ``)
- [ ] Destructuring (`const { id } = user`)
- [ ] Spread/Rest Operator (`...arr`)
- [ ] Modules (`import` / `export`)
- [ ] **Quan trọng:** Asynchronous JS (`Promise`, `async` / `await`)

### 0.3 Chuyển đổi tư duy sang TypeScript
- [ ] Cài đặt TypeScript môi trường local
- [ ] Type Annotation cơ bản (`: string`, `: number`, `: boolean`)
- [ ] Interface & Type Alias (`interface User { ... }`)
- [ ] Optional Properties (`name?: string`)
- [ ] Union Types (`string | number`)
- [ ] Generics cơ bản (`Array<T>`)
- [ ] Thực hành: Clone một file `.js` trong project và viết lại thành `.ts`

---

## Giai đoạn 1: Nền tảng - Xác thực Người dùng Tập trung
**Mục tiêu:** Tích hợp Supabase Auth vào `vnudocshub.com`.

### 1.1 Cấu hình Supabase (Backend)
- [ ] Tạo Project mới trên Supabase Dashboard
- [ ] Vào Authentication -> Providers -> Bật **Email/Password**
- [ ] (Optional) Bật **Google Auth** (Tạo Credentials trên Google Cloud Console)
- [ ] Lấy API Keys (`Project URL`, `Anon Key`)
- [ ] Lưu Keys vào `.env` của project Frontend (`vnu`)

### 1.2 Tích hợp Frontend (React/Vite)
- [ ] Cài đặt library: `npm install @supabase/supabase-js`
- [ ] Tạo file cấu hình: `src/supabaseClient.ts`
- [ ] Tạo **Auth Context** (`src/contexts/AuthContext.tsx`) để quản lý global state (user session)
- [ ] Tạo trang **Login** (`src/pages/LoginPage.tsx`)
- [ ] Tạo trang **Register** (`src/pages/RegisterPage.tsx`)
- [ ] Xử lý Logic đăng nhập/đăng ký gọi hàm Supabase
- [ ] Tạo **Protected Route** (Chặn người chưa đăng nhập truy cập trang Streaming)
- [ ] Hiển thị thông tin User lên Header (Avatar/Tên) sau khi đăng nhập

---

## Giai đoạn 2: Container hóa - Xây dựng "Cụm Dịch vụ Streaming"
**Mục tiêu:** Viết Microservice Node.js và LiveKit, đóng gói bằng Docker.

### 2.1 Xây dựng `Token Service` (Node.js)
- [ ] Khởi tạo project: `npm init -y`
- [ ] Cài đặt packages: `express`, `livekit-server-sdk`, `cors`, `dotenv`
- [ ] Viết API `POST /api/token`:
    - [ ] Nhận `identity` và `roomName` từ body
    - [ ] Tạo LiveKit Access Token
    - [ ] Trả về Token cho client
- [ ] (Nâng cao) Middleware xác thực Supabase JWT trước khi cấp Token
- [ ] Chạy thử local bằng `node index.js`

### 2.2 Container hóa (Docker)
- [ ] Cài đặt Docker Desktop
- [ ] Viết `Dockerfile` cho `Token Service`:
    - [ ] Base Image: `node:18-alpine`
    - [ ] WORKDIR, COPY package.json
    - [ ] RUN npm install
    - [ ] COPY source code
    - [ ] CMD ["npm", "start"]
- [ ] Build & Run thử container: `docker build -t token-service .`

### 2.3 Docker Compose (Orchestration Local)
- [ ] Tạo file `docker-compose.yml`
- [ ] Định nghĩa Service 1: `livekit` (Image: `livekit/livekit-server`)
- [ ] Định nghĩa Service 2: `redis` (Image: `redis:alpine` - Dependencies của LiveKit)
- [ ] Định nghĩa Service 3: `token-service` (Build từ Dockerfile trên)
- [ ] Cấu hình Network: Để các service "nhìn thấy" nhau
- [ ] Chạy toàn bộ cụm: `docker-compose up -d`

---

## Giai đoạn 3: Hạ tầng dưới dạng mã (IaC) - Terraform
**Mục tiêu:** Tự động tạo Cloud Server (VM).

### 3.1 Chuẩn bị
- [ ] Đăng ký tài khoản Cloud (DigitalOcean, AWS, hoặc Google Cloud)
- [ ] Tạo Personal Access Token trên Cloud Provider
- [ ] Cài đặt CLI Terraform trên máy local

### 3.2 Viết mã Terraform
- [ ] Tạo thư mục `terraform/`
- [ ] File `provider.tf`: Khai báo provider (VD: `digitalocean`)
- [ ] File `variables.tf`: Định nghĩa biến (Token, Region, Size)
- [ ] File `main.tf`:
    - [ ] Resource `droplet`/`instance` (Máy chủ Ubuntu 22.04, RAM 2GB)
    - [ ] Resource `ssh_key` (Add key public của máy bạn vào server)
- [ ] File `firewall.tf`: Mở port 80, 443, 22
- [ ] Chạy lệnh: `terraform init`, `terraform plan`, `terraform apply` -> Có ngay Server!

---

## Giai đoạn 4: Vận hành - Triển khai & Cấu hình Server
**Mục tiêu:** Deploy ứng dụng lên Server vừa tạo.

### 4.1 Thiết lập môi trường Server
- [ ] SSH vào server: `ssh root@<ip-address>`
- [ ] Cài đặt Docker & Docker Compose trên Server
- [ ] Cài đặt Git

### 4.2 Deploy ứng dụng
- [ ] Clone code từ GitHub về Server
- [ ] Tạo file `.env` trên Server (chứa Secret Key thật)
- [ ] Chạy `docker-compose up -d` trên Server

### 4.3 Cấu hình Reverse Proxy & Domain
- [ ] Trỏ tên miền `stream.vnudocshub.com` về IP Server
- [ ] Cài đặt **Nginx** trên Server (hoặc chạy Nginx bằng Docker)
- [ ] Cấu hình Nginx Proxy Pass:
    - [ ] Port 80/443 -> Chuyển tiếp vào `Token Service` (Port 3000)
    - [ ] Websocket -> Chuyển tiếp vào `LiveKit`
- [ ] Cài đặt **Certbot** (Let's Encrypt) để lấy chứng chỉ SSL (HTTPS) miễn phí

---

## Giai đoạn 5: Tự động hóa - CI/CD với GitHub Actions
**Mục tiêu:** Push code là tự động deploy.

### 5.1 Chuẩn bị Secrets
- [ ] Vào GitHub Repo -> Settings -> Secrets
- [ ] Thêm: `HOST_IP`, `SSH_USER`, `SSH_PRIVATE_KEY`

### 5.2 Viết Workflow
- [ ] Tạo `.github/workflows/deploy.yml`
- [ ] Job `deploy`:
    - [ ] Checkout code
    - [ ] SSH vào Server bằng `appleboy/ssh-action`
    - [ ] Lệnh thực thi trên Server:
        ```bash
        cd /app
        git pull origin main
        docker-compose down
        docker-compose up -d --build
        ```
- [ ] Commit & Push -> Xem Action chạy màu xanh -> Done!
