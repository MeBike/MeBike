
FROM node:24.11.0-bookworm-slim AS deps

RUN corepack enable && corepack prepare pnpm@10.21.0 --activate

WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json

RUN pnpm fetch --frozen-lockfile

COPY packages/shared ./packages/shared
COPY packages/tsconfig ./packages/tsconfig
COPY apps/backend ./apps/backend

RUN pnpm install --frozen-lockfile --filter @mebike/tsconfig --filter @mebike/shared... --filter backend...

RUN pnpm --filter @mebike/shared build \
 && pnpm --filter backend build

FROM node:24.11.0-bookworm-slim AS runner
ENV NODE_ENV=production
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.6.3 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json apps/backend/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json

RUN corepack enable && corepack prepare pnpm@10.6.3 --activate \
 && pnpm install --frozen-lockfile --prod --filter @mebike/tsconfig --filter @mebike/shared... --filter backend...

COPY --from=deps /repo/packages/shared/dist /app/packages/shared/dist
COPY --from=deps /repo/apps/backend/dist /app/apps/backend/dist

EXPOSE 4000
CMD ["node", "apps/backend/dist/server.js"]
