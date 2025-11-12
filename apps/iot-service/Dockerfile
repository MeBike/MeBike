FROM node:24.11.0-bookworm-slim AS base
WORKDIR /repo
RUN corepack enable && corepack prepare pnpm@10.21.0 --activate

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@2.5.8 prune --scope iot-service --docker

FROM base AS deps
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /repo/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /repo/out/json/ .
RUN rm -rf apps/backend
RUN pnpm install --frozen-lockfile --filter @mebike/tsconfig --filter @mebike/shared... --filter iot-service...

FROM deps AS builder
COPY --from=pruner /repo/out/full/ .
RUN rm -rf apps/backend
RUN pnpm --filter @mebike/shared build \
 && pnpm --filter iot-service build

FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /repo/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=pruner /repo/out/json/ .
RUN rm -rf apps/backend
RUN pnpm install --frozen-lockfile --prod --filter @mebike/tsconfig --filter @mebike/shared... --filter iot-service...

COPY --from=builder /repo/packages/shared/dist ./packages/shared/dist
COPY --from=builder /repo/apps/iot-service/dist ./apps/iot-service/dist

EXPOSE 3000
CMD ["node", "apps/iot-service/dist/index.js"]
