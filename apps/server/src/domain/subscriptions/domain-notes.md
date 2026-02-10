# Subscriptions Domain – Findings & Checklist (from legacy backend)

Legacy implementation lives in:

- `apps/backend/src/services/subscription.services.ts`
- `apps/backend/src/routes/subscriptions.routes.ts`
- `apps/backend/src/middlewares/subscriptions.middlewares.ts`
- Coupling points:
  - `apps/backend/src/services/reservations.services.ts` (consumes 1 usage when reserving with subscription)
  - `apps/backend/src/services/rentals.services.ts` (consumes + reconciles usages at rental end)
  - `apps/backend/src/services/fixed-slot.services.ts` (bulk consumption for fixed-slot reservations)

## Core Concepts (Legacy)

- **Subscription status**:
  - `PENDING`: created, not activated yet.
  - `ACTIVE`: activated, has `activated_at` + `expires_at`.
  - `EXPIRED`: expired (set by delayed job or by `useOne` guard).
- **Package config** (`PACKAGE_CONFIG`):
  - `price` (string, VND minor unit-ish) and `max_usages` (`null` = unlimited).
- **Usage counting**:
  - Subscriptions track `usage_count`.
  - A “usage” is a unit that can cover time in rentals (`SUB_HOURS_PER_USED`, default `10` hours per usage).

## Legacy Use Cases

### 1) Subscribe (create subscription)

HTTP: `POST /subscriptions/subscribe`

Preconditions (middlewares):

- User authenticated and verified (`accessTokenValidator`, `verifiedUserValidator`).
- User does not already have a `PENDING` or `ACTIVE` subscription (`isPendingOrActiveSubscriptionExist`).
- User has a wallet and wallet balance ≥ package price (`checkUserWalletBeforeSubscribe`).

Effects (service):

- Insert subscription with:
  - `status = PENDING`
  - `usage_count = 0`
  - `package_name`, `max_usages`, `price`, `created_at`
- Charge wallet immediately (wallet “paymentReservation” with description including subscription id).
- Enqueue “success subscription” email job.
- Enqueue delayed “auto activate” job after `AUTO_ACTIVATE_IN_DAYS` (default `10`).

### 2) Activate subscription (admin/staff)

HTTP: `POST /subscriptions/:id/activate`

Preconditions:

- Authenticated.
- Subscription exists, and must be `PENDING` (validator `mustBePending`).
- Authorization: user cannot operate other user’s subscription; admin/staff can.

Effects:

- Transition `PENDING → ACTIVE`.
- Set `activated_at = now`.
- Set `expires_at = now + EXPIRE_AFTER_DAYS` (default `30`).
- Enqueue delayed “expire” job at `expires_at`.

Notes:

- `RESERVATIONS_MESSAGE.SUB_ACTIVATE_TOO_EARLY` exists in messages but is not enforced anywhere in code.

### 3) Consume usage (reservation / rental)

There isn’t a standalone HTTP endpoint. Consumption happens as part of other domains.

#### 3a) Reserve with subscription

Flow: reservations service calls `subscriptionService.useOne(subscription_id, user_id, session)` inside the reservation transaction.

Rules:

- `useOne` only works when subscription belongs to the user and is `PENDING` or `ACTIVE`.
- Increments `usage_count` by 1.
- If expired (`expires_at` set and now > expires_at): mark `EXPIRED` and fail.
- If `max_usages` is set and `usage_count > max_usages`: fail.
- If first usage and subscription was `PENDING`: activate immediately.

#### 3b) Start rental session with subscription

Flow: rentals service calls `subscriptionService.useOne(subscription_id, user_id, session)` inside the rental start transaction.

Result:

- Same “consume one usage” semantics as reservations.

#### 3c) End rental session (usage reconciliation)

Flow: at rental end, rentals service:

- Loads subscription by `rental.subscription_id` (must belong to same user and be `PENDING`/`ACTIVE`).
- Computes `requiredUsages = ceil(durationHours / SUB_HOURS_PER_USED)` (minimum 1).
- `addedUsage = 1` (already consumed on rental start).
- If subscription is unlimited:
  - `usageToAdd = requiredUsages`
  - total price = 0
- Else limited:
  - `availableUsages = max_usages - usage_count + addedUsage`
  - If enough usages → total price = 0, add remaining usages to reach `requiredUsages`
  - If not enough usages → consume remaining usages and bill the extra duration
- Updates subscription `usage_count` by `usageToAdd` (if > 0).

#### 3d) Fixed-slot template bulk reservations

Flow: fixed-slot service checks the user’s `PENDING`/`ACTIVE` subscription and:

- If it can cover **all selected dates** (unlimited OR remaining usages >= number of reservations):
  - Creates reservations with `prepaid = 0` and sets `subscription_id`.
  - Increments `usage_count += totalReservation` directly.
- Else:
  - No subscription usage; reservation is prepaid-per-slot.

Legacy inconsistency:

- This path does not call `subscriptionService.useOne`, so it does **not**:
  - activate a `PENDING` subscription on first usage
  - enforce expiry/max-usage the same way as `useOne`

### 4) Get subscription detail

HTTP: `GET /subscriptions/:id`

- Validator loads the subscription into `req.subscription`.
- Service joins user info `{ fullname, email }`.
- `price` is returned as a float (legacy converts Decimal128 → number).

### 5) List subscriptions (user or admin/staff)

HTTP: `GET /subscriptions`

Rules:

- If `Role.User`: only sees their subscriptions; optional `status` filter.
- If `Role.Admin` or `Role.Staff`: can filter by many fields (`buildAdminSubscriptionFilter`).
- Implementation uses Mongo aggregation pipeline with `$lookup` to user and `$sort created_at desc`.

## Legacy Data Model (Mongo `subscriptions`)

From `apps/backend/src/models/schemas/subscription.schema.ts`:

- `_id`: ObjectId
- `user_id`: ObjectId
- `package_name`: SubscriptionPackage (BASIC/PREMIUM/UNLIMITED)
- `price`: Decimal128
- `max_usages?`: number | undefined (undefined means unlimited in practice)
- `usage_count`: number
- `status`: SubscriptionStatus (PENDING/ACTIVE/EXPIRED)
- `activated_at?`, `expires_at?`
- `created_at`, `updated_at`

## Rewrite Design Notes (what to preserve)

- One user can have at most one `PENDING` or `ACTIVE` subscription at a time.
- Charging wallet should be **transactional** relative to subscription creation (or at least idempotent).
- Subscription usage consumption is part of reservations/rentals flows; avoid “god” subscription service.
- Decide whether fixed-slot should reuse the same usage consumption logic (`useOne` equivalent) or keep special-case bulk consume.
- Preserve `SUB_HOURS_PER_USED` semantics (or explicitly drop/replace it).

## Rewrite Progress Checklist (Subscriptions)

### 1) Shared Contracts (`packages/shared/src/contracts/server/subscriptions/*`)

- [x] Define subscription models (summary/detail) and enums (status, package).
- [x] Define error codes (not found, already has active/pending, expired, usage limit, wallet insufficient).
- [x] Define query routes (detail/list).
- [x] Define mutation routes (subscribe, activate).
- [ ] Define mutation routes (cancel).

### 2) Domain (`apps/server/src/domain/subscriptions`)

- [x] Define domain types (SubscriptionId, PackageName, Status, Usage).
- [ ] Repository interface:
  - [x] Create subscription (PENDING).
  - [x] Find current (PENDING/ACTIVE) for user.
  - [x] Find by id.
  - [x] Activate + set expiry.
  - [x] Consume usage (single) (optimistic lock / CAS guard on `usage_count`).
  - [ ] Consume usage (bulk) (fixed-slot).
  - [x] Expire (mark expired by `expiresAt`).
- [ ] Service:
  - [x] Orchestrate wallet charge + subscription create (implemented in use-case with tx-aware repos).
  - [x] Activation rules.
  - [x] Usage rules (expiry, limit).
  - [ ] Retry policy for CAS conflict (TODO).
  - [x] DB constraint: partial unique index for “one ACTIVE per user”.

### 3) Cross-domain integration

- [ ] Rentals: use subscription usage at start + reconcile at end (or redesign).
- [ ] Reservations: consume usage on reserve-with-subscription.
- [ ] Fixed-slot: decide if it uses bulk usage consume with shared logic.

### 4) Infrastructure

- [ ] Job scheduling replacement for Bull queues:
  - auto-activate after `AUTO_ACTIVATE_IN_DAYS`
  - expire after `EXPIRE_AFTER_DAYS`
- [ ] Email notification infra (subscription success email) – TODO for now.

TODO (jobs detail):

- TODO: Expiry job can be implemented as a periodic task calling `SubscriptionService.markExpiredNow(new Date())` (e.g. every 1–5 minutes).
- TODO: Auto-activate job needs a stable “created time” for `Subscription`. Current schema only has `updatedAt`; using it for age checks is unsafe. Consider adding `createdAt` or an explicit `pendingCreatedAt`.
- TODO: Consider replacing the in-process periodic timer with a real job queue + worker:
  - Candidate: `pg-boss` (Postgres-backed delayed jobs) for `subscription.autoActivate` and `subscription.expire`.
  - Worker should run as a separate process (not inside the HTTP server). Suggested location: `apps/server/src/worker/*` with a separate entrypoint/script.
  - Keep handlers idempotent (`UPDATE ... WHERE status = 'ACTIVE' AND expiresAt <= now`) so running twice is safe and scaling the API to N replicas won’t break correctness.
  - Prisma tx note: `pg-boss` can’t participate in the same Prisma `$transaction`; if we need strict atomic “activate+enqueue”, use an outbox table inside the tx and a dispatcher that enqueues after commit (TODO).

### 5) Tests

- [ ] Unit tests for usage limit + expiry (incl. reconciliation math).
- [ ] Concurrency tests around “only one pending/active subscription”.
