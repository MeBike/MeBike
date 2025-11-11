FROM node:24.11.0-bookworm-slim AS deps

RUN corepack enable && corepack prepare pnpm@10.21.0 --activate

WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/iot-service/package.json apps/iot-service/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json

RUN pnpm fetch --frozen-lockfile

COPY packages/shared ./packages/shared
COPY packages/tsconfig ./packages/tsconfig
COPY apps/iot-service ./apps/iot-service

RUN pnpm install --frozen-lockfile --filter @mebike/tsconfig --filter @mebike/shared... --filter iot-service...

RUN pnpm --filter @mebike/shared build \
 && pnpm --filter iot-service build

FROM node:24.11.0-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.6.3 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/iot-service/package.json apps/iot-service/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json

RUN pnpm install --frozen-lockfile --prod --filter @mebike/tsconfig --filter @mebike/shared... --filter iot-service...

COPY --from=deps /repo/packages/shared/dist /app/packages/shared/dist
COPY --from=deps /repo/apps/iot-service/dist /app/apps/iot-service/dist

EXPOSE 3000
CMD ["node", "apps/iot-service/dist/index.js"]
