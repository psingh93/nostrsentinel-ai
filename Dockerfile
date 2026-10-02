# Production Dockerfile for NostrSentinel AI
# Target: AWS App Runner / Amazon ECS (AWS Fargate) / Docker container runtime

FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json bun.lock* ./

# Install all dependencies for build
RUN npm install

# Copy source code and config
COPY . .

# Build Vite client production bundle
RUN npm run build

# Runner stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies
COPY package.json ./
RUN npm install --omit=dev && npm install -g tsx

# Copy built frontend assets and server entry point
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/src/types ./src/types
COPY --from=builder /app/server.ts ./server.ts

EXPOSE 3000

CMD ["tsx", "server.ts"]
