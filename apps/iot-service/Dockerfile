# Build and run MeBike IoT Service
# Base image: Node 25 (Debian bookworm slim)
FROM node:24.11.0-bookworm-slim AS deps

# Enable pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@10.6.3 --activate

WORKDIR /repo

# Copy monorepo manifests first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/iot-service/package.json apps/iot-service/package.json
COPY packages/shared/package.json packages/shared/package.json

# Pre-fetch dependencies to leverage Docker layer caching
RUN pnpm fetch --frozen-lockfile

# Copy only sources needed to build
COPY packages/shared ./packages/shared
COPY apps/iot-service ./apps/iot-service

# Install only the deps required to build these packages
RUN pnpm install --frozen-lockfile --filter @mebike/shared... --filter iot-service...

# Build shared first, then iot-service
RUN pnpm --filter @mebike/shared build \
 && pnpm --filter iot-service build

# Runtime stage
FROM node:24.11.0-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.6.3 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/iot-service/package.json apps/iot-service/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install prod-only runtime deps
RUN pnpm install --frozen-lockfile --prod --filter @mebike/shared... --filter iot-service...

# Copy built artifacts
COPY --from=deps /repo/packages/shared/dist /app/packages/shared/dist
COPY --from=deps /repo/apps/iot-service/dist /app/apps/iot-service/dist

EXPOSE 3000
CMD ["node", "apps/iot-service/dist/index.js"]
