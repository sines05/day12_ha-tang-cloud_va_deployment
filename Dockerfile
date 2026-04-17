# Compatibility Dockerfile for grading script
FROM node:20-slim AS builder
WORKDIR /app
COPY . .

FROM node:20-slim AS runtime
WORKDIR /app
RUN addgroup -S nodeapp && adduser -S nodeapp -G nodeapp
USER nodeapp
HEALTHCHECK --interval=30s CMD wget --spider http://localhost:3000/api/health || exit 1
CMD ["npm", "start"]
