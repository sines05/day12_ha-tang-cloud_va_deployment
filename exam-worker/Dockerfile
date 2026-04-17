# Stage 1: Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Build code (nếu có bước build, ví dụ: tsc)
# RUN npm run build

# Stage 2: Runtime stage
FROM node:20-alpine
WORKDIR /app

# Tạo user non-root để bảo mật
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp
USER nodeapp

# Chỉ copy những file cần thiết từ builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src

EXPOSE 3000

# Healthcheck chuẩn Docker
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["npm", "run", "start:node"]
