# Build and run MeBike backend
# Base image: Node 25 (Debian bookworm slim)
FROM node:24.11.0-bookworm-slim AS deps

# Enable pnpm via Corepack
RUN corepack enable && corepack prepare pnpm@10.6.3 --activate

WORKDIR /repo

# Copy monorepo manifests first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json

# Pre-fetch dependencies to leverage Docker layer caching
RUN pnpm fetch --frozen-lockfile

# Copy only sources needed to build backend and shared
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

# Install only the workspace deps required to build these packages
RUN pnpm install --frozen-lockfile --filter @mebike/shared... --filter backend...

# Build shared first, then backend
RUN pnpm --filter @mebike/shared build \
 && pnpm --filter backend build

# Runtime stage
FROM node:24.11.0-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

# Enable pnpm to run the app if needed
RUN corepack enable && corepack prepare pnpm@10.6.3 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install only production dependencies for the runtime
RUN corepack enable && corepack prepare pnpm@10.6.3 --activate \
 && pnpm install --frozen-lockfile --prod --filter @mebike/shared... --filter backend...

# Copy built artifacts from builder
COPY --from=deps /repo/packages/shared/dist /app/packages/shared/dist
COPY --from=deps /repo/apps/backend/dist /app/apps/backend/dist

EXPOSE 4000
CMD ["node", "apps/backend/dist/server.js"]
