FROM node:24-bookworm-slim AS base
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/tsconfig/package.json ./packages/tsconfig/package.json
COPY packages/eslint-config/package.json ./packages/eslint-config/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts --filter @mebike/shared... --filter server...

FROM deps AS builder
ARG DATABASE_URL=postgresql://mebike:mebike@localhost:5432/mebike
ENV DATABASE_URL=${DATABASE_URL}
COPY apps/server ./apps/server
COPY packages/shared ./packages/shared
COPY packages/tsconfig ./packages/tsconfig
COPY packages/eslint-config ./packages/eslint-config
RUN pnpm --filter @mebike/shared build \
 && pnpm --filter server exec prisma generate \
 && pnpm --filter server build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/package.json
COPY packages/shared/package.json ./packages/shared/package.json
COPY packages/tsconfig/package.json ./packages/tsconfig/package.json
RUN pnpm install --frozen-lockfile --prod --ignore-scripts --filter @mebike/shared... --filter server...
COPY --from=builder /repo/packages/shared/dist ./packages/shared/dist
COPY --from=builder /repo/apps/server/dist ./apps/server/dist
COPY --from=builder /repo/apps/server/generated ./apps/server/generated
EXPOSE 4000
CMD ["node", "apps/server/dist/src/http/server.js"]
