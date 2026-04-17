# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Truyền biến môi trường để dùng làm API Gateway thông qua Nginx
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Production
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Sử dụng file cấu hình Nginx bên ngoài để quản lý API Gateway
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
# Healthcheck cho Nginx
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Lệnh "ma thuật": Tự động lấy DNS từ /etc/resolv.conf của Render để Nginx gọi được Backend nội bộ
CMD ["/bin/sh", "-c", "echo \"resolver $(awk 'BEGIN{ORS=\" \"} $1==\"nameserver\" {print $2}' /etc/resolv.conf) valid=30s;\" > /etc/nginx/conf.d/resolver.conf && nginx -g 'daemon off;'"]
