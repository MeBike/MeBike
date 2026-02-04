# Server (apps/server)

Backend chinh cua MeBike.

- Runtime: Node.js + TypeScript (`tsx` cho dev)
- HTTP: Hono + `@hono/zod-openapi` (contract tu `@mebike/shared`)
- Effect/DI: `effect` (errors-as-data, Layer cho dependency injection)
- Data: Postgres (PostGIS + pgvector) qua Prisma, Redis cho auth sessions/OTPs
- Jobs: outbox table + PgBoss workers
- Tests: Vitest (unit + integration voi Testcontainers)


## Quick Start

From repo root:

```bash
pnpm install
```

Chay Postgres + Redis, set env, migrate + seed, sau do chay server.

### 1) Chay Postgres + Redis (dev)

#### Cach 1: Docker (khuyen dung)

Tao 1 docker network rieng (de pgAdmin connect de dang):

```bash
docker network create mebike-dev || true
```

Chay Redis:

```bash
docker run --rm --name mebike-redis --network mebike-dev -p 6379:6379 redis:8.2.2-alpine
```

Chay Postgres (image nay co PostGIS + pgvector; dung chung voi integration tests):

```bash
# from apps/server
docker build -t mebike-postgres -f infra/postgres/Dockerfile.pg .
docker run --rm --name mebike-postgres --network mebike-dev -p 5432:5432 \
  -e POSTGRES_USER=mebike \
  -e POSTGRES_PASSWORD=mebike \
  -e POSTGRES_DB=mebike \
  mebike-postgres
```

Neu muon xem DB bang pgAdmin (optional):

```bash
docker run --rm --name mebike-pgadmin --network mebike-dev -p 5050:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@mebike.dev \
  -e PGADMIN_DEFAULT_PASSWORD=admin \
  dpage/pgadmin4:8
```

Truy cap:

- pgAdmin: `http://localhost:5050`
- Login:
  - Email: `admin@mebike.dev`
  - Password: `admin`
- Add server (trong pgAdmin):
  - Host: `mebike-postgres`
  - Port: `5432`
  - Maintenance DB: `mebike`
  - Username: `mebike`
  - Password: `mebike`

Ghi chu:

- Repo khong commit san `docker-compose.yml` cho Postgres/pgAdmin. Neu ban muon dung `docker compose up`, hay tao 1 file compose local (gitignored) theo cac thong so tren.

#### Cach 2: Docker run (toi gian)

Redis (default trong code la `redis://localhost:6379`):

```bash
docker run --rm -p 6379:6379 --name mebike-redis redis:8.2.2-alpine
```

Postgres can co PostGIS va pgvector.
Repo co Dockerfile (dang duoc dung cho integration tests):

```bash
# from apps/server
docker build -t mebike-postgres -f infra/postgres/Dockerfile.pg .
docker run --rm -p 5432:5432 --name mebike-postgres \
  -e POSTGRES_USER=mebike \
  -e POSTGRES_PASSWORD=mebike \
  -e POSTGRES_DB=mebike \
  mebike-postgres
```

Sau do set:

`DATABASE_URL=postgresql://mebike:mebike@localhost:5432/mebike`

### 2) Cau hinh environment

Env schema nam o `apps/server/src/config/env.ts`.

Bat dau bang cach copy `apps/server/.env.example` thanh `apps/server/.env`.

Toi thieu can co (dev local):

- `DATABASE_URL`
- `REDIS_URL` (defaults to `redis://localhost:6379`)
- `JWT_SECRET`
- `EMAIL_APP` / `EMAIL_PASSWORD_APP` (bat buoc theo env schema; neu khong dung email flow thi co the set gia tri gia)

Optional (chi can neu dung Stripe):

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

### 3) Chay migrations

From `apps/server`:

```bash
pnpm prisma migrate dev
```

Quy uoc (Prisma) — doc ky:

- Tuyet doi KHONG sua tay cac file trong `apps/server/prisma/migrations/**` (ke ca chi "fix" nho).
  Neu can thay doi schema: hay sua cac file `apps/server/prisma/*.prisma` roi tao migration moi.
- Khong doi `apps/server/prisma.config.ts` neu khong co yeu cau ro rang.
- Prisma schema trong repo nay la folder `apps/server/prisma/` (nhieu file theo domain). Dung tu y gom/chia lai.

Tao migration moi (dev):

```bash
pnpm prisma migrate dev --name <ten_ngan_gon>
```

Ap migration (prod/CI/test):

```bash
pnpm prisma migrate deploy
```

Generate Prisma client (types) sau khi doi schema/migration:

```bash
pnpm prisma generate
```

Ghi chu:

- Prisma config: `apps/server/prisma.config.ts`
- Prisma schema la 1 folder (`apps/server/prisma/`) gom nhieu `*.prisma` (khong gom vao 1 file lon)
- Generated client: `apps/server/generated/prisma`

### 4) Seed data

From `apps/server`:

```bash
pnpm seed
```

Quan trong:

- `pnpm seed` chay `prisma/seed.ts` va **TRUNCATE** bang `Station` (`TRUNCATE TABLE "Station" ... CASCADE`).

Seed them (tuy chon):

```bash
pnpm seed:bikes
pnpm tsx prisma/seed-suppliers.ts
```

### 5) Chay HTTP server

From `apps/server`:

```bash
pnpm dev
```

Server chay tren `0.0.0.0:${PORT:-4000}`.

- API docs: `http://localhost:4000/docs`
- OpenAPI JSON: `http://localhost:4000/docs/openapi.json`

## Workers (background jobs)

Workers xu ly outbox + scheduled jobs:

```bash
pnpm worker
```

## Stripe (dev)

Backend nhan webhook Stripe qua endpoint: `POST /webhooks/stripe`.
Trong moi truong dev (server chay local), Stripe se khong goi duoc webhook vao may cua ban neu khong forward.

Env can co (xem `apps/server/.env.example`):

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` (signing secret tu Stripe CLI)

### Forward webhook bang Stripe CLI

1) Cai Stripe CLI va dang nhap (1 lan):

```bash
stripe login
```

2) Forward webhook ve local server:

```bash
stripe listen --forward-to http://localhost:4000/webhooks/stripe
```

Stripe CLI se in ra `whsec_...` (webhook signing secret).
Copy gia tri do vao `.env`:

`STRIPE_WEBHOOK_SECRET=whsec_...`

Ghi chu:

- Neu ban chay app mobile tren dien thoai, `localhost` trong app se khong tro ve may tinh.
  Khi do app can goi server qua IP LAN (vi du `http://192.168.x.x:4000`).
  Con Stripe CLI `--forward-to` van tro ve `http://localhost:4000/webhooks/stripe` tren may tinh la duoc.
- Wallet topup/withdrawal chi duoc cap nhat sau khi webhook tu Stripe ve thanh cong.

Lenh one-off (de debug/dev/test):

```bash
pnpm worker:dispatch-once
pnpm worker:email-once
pnpm worker:fixed-slot-assign-once
pnpm worker:subscriptions-expire-sweep-once
pnpm worker:wallet-withdrawal-sweep-once
```

## Effect trong codebase nay

Tai lieu chinh thuc (Effect): https://effect.website/

### Mental model

`Effect<Success, Error, Env>` is a program description that:

- needs some environment `Env` (services/tags),
- either succeeds with `Success`,
- or fails with `Error` (as data).

Repo nay tranh `throw` trong domain; error la data (typed) va chi map ra HTTP o layer cuoi.

Xem pattern dang dung:

- ManagedRuntime (1 runtime cho HTTP, khong tao scope moi per request): `apps/server/src/http/bootstrap.ts`
- Controllers map error bang `Match` (khong if/else tren Left): `apps/server/src/http/controllers/**`
- Contracts + routes: `packages/shared/src/contracts/server/routes/**`

### Errors-as-data (domain layer)

Dung `Data.TaggedError` cho domain errors:

```ts
import { Data, Effect } from "effect";

export class ValidationError extends Data.TaggedError("ValidationError")<{
  issues: Array<{ path: string; message: string }>;
}> {}

export const validateName = (name: string) =>
  name.trim().length > 0
    ? Effect.void
    : Effect.fail(new ValidationError({ issues: [{ path: "name", message: "required" }] }));
```

### Chi wrap Promise o infra boundary

Use `Effect.tryPromise` at the boundary (DB, Redis, HTTP clients), and return typed errors:

```ts
import { Effect, Data } from "effect";

export class DbError extends Data.TaggedError("DbError")<{ message: string }> {}

export const findUser = (id: string) =>
  Effect.tryPromise({
    try: () => prisma.user.findUnique({ where: { id } }),
    catch: (err) => new DbError({ message: String(err) }),
  });
```

### Controller mong: run Effect 1 lan, map errors bang Match

Theo `apps/server/AGENTS.md`:

- Run the effect as an Either (`effect.pipe(Effect.either)`).
- Match on `Right` and on error tags in `Left`.
- End with exactly one finalizer: `Match.exhaustive` or `Match.orElse(...)`.

```ts
import { Effect, Match } from "effect";

const result = await c.var.runPromise(myUseCase.pipe(Effect.either));

return Match.value(result).pipe(
  Match.tag("Right", ({ right }) => c.json({ data: right }, 200)),
  Match.tag("Left", ({ left }) =>
    Match.value(left).pipe(
      Match.tag("ValidationError", (e) => c.json({ error: "Invalid", details: e }, 400)),
      Match.orElse(() => c.json({ error: "Internal" }, 500)),
    )),
  Match.exhaustive,
);
```

### Dependency injection voi Layer

Uu tien `*Live` layers o boundary (`src/http/bootstrap.ts`, workers).
Trong test, uu tien `Layer.succeed(...)` de provide fake.

Xem example chay duoc:

- `apps/server/examples/effect-intro.ts` (TaggedError + Layer + runPromiseExit)
- `apps/server/examples/effect-option.ts` (Option + Match Some/None)

### Option (Some/None) trong Effect

Repo hay tra ve `Option` khi query co the khong co record (vi du `findById`). Pattern chuan:

```ts
import { Effect, Match, Option } from "effect";

const userOpt: Option.Option<User> = yield* repo.findById(id);

const user = yield* Match.value(userOpt).pipe(
  Match.tag("Some", ({ value }) => Effect.succeed(value)),
  Match.tag("None", () => Effect.fail(new UserNotFound({ userId: id }))),
  Match.exhaustive,
);
```

## Tests

From `apps/server`:

```bash
pnpm test:unit
pnpm test:int
```

Integration tests:

- live in `src/**/test/**/*.int.test.ts`
- mac dinh se dung Testcontainers Postgres
- co the bypass Docker bang `TEST_DATABASE_URL`

Luu y: `apps/server/vitest.config.ts` co `globalSetup` (`apps/server/src/test/db/global-setup.ts`) nen khi chay test, no co the build image + start container + chay migrations.

Run a single integration test:

```bash
pnpm vitest run --config vitest.int.config.ts --mode test src/domain/rentals/repository/test/rental.repository.int.test.ts
```

## Examples (runnable)

Co example nho, chay duoc + co test:

```bash
pnpm tsx examples/effect-intro.ts
pnpm vitest run --mode test examples/effect-intro.test.ts
pnpm tsx examples/effect-option.ts
pnpm vitest run --mode test examples/effect-option.test.ts
```
