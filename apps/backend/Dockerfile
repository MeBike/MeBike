
FROM node:24.11.0-bookworm-slim AS base
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.21.0 --activate

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.5.8 prune --scope backend --docker

FROM base AS deps
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /repo/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile --filter @mebike/tsconfig --filter @mebike/shared... --filter backend...

FROM deps AS builder
COPY --from=pruner /repo/out/full/ .
RUN pnpm --filter @mebike/shared build \
 && pnpm --filter backend build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /repo/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /repo/out/json/ .
RUN pnpm install --frozen-lockfile --prod --filter @mebike/tsconfig --filter @mebike/shared... --filter backend...

COPY --from=builder /repo/packages/shared/dist ./packages/shared/dist
COPY --from=builder /repo/apps/backend/dist ./apps/backend/dist

EXPOSE 4000
CMD ["node", "apps/backend/dist/server.js"]
