# Users Domain – Notes & Checklist

Source of truth for legacy behaviour: `apps/backend/src/controllers/users.controllers.ts`, `apps/backend/src/services/users.services.ts`, `apps/backend/src/routes/users.routes.ts`.

## Rewrite status (apps/server, verified)

Legacy `apps/backend` served both auth + user management under `/users/*`. The rewrite splits it:

- **Auth**: `apps/server/src/http/routes/auth.ts` (`/v1/auth/*`)
  - Register/login/refresh/logout/logout-all
  - Send/resend verify email, verify email OTP
  - Send reset password, reset password
- **User profile + admin tooling**: `apps/server/src/http/routes/users.ts` (`/v1/users/*`, `/v1/users/manage-users/*`)
  - User: get/update current user
  - Admin/Staff: list/search/detail/update users, stats dashboards
  - Admin: create user, admin reset password

Known gaps vs legacy (confirm before re-adding):

- Any legacy-only endpoints should be validated against `apps/backend/src/routes/users.routes.ts` before adding back; most of the surface area is already covered in the rewrite.

## 1. Core Concepts & Models

- **User**
  - `id` (Mongo `_id` originally, UUID v7 in the new backend)
  - `fullname`, `username`
  - `email`, `phone_number`, `avatar`, `location`
  - `password` (hashed), `role` (`USER | STAFF | ADMIN | SOS`)
  - `verify` (`UNVERIFIED | VERIFIED | BANNED`)
  - Timestamps: `createdAt`, `updatedAt` (the rewrite uses an explicit `createdAt` column; do not rely on UUID v7 timestamps for analytics)
  - Email verification fields:
    - `email_verify_otp`, `email_verify_otp_expires`
  - Forgot‑password fields:
    - `forgot_password_otp`, `forgot_password_otp_expires`
  - Optional `nfc_card_uid` (used for card tap login / identification)

- **Auth Tokens**
  - Access token (JWT) – 15m lifetime, payload: `{ user_id, verify, token_type: ACCESS_TOKEN }`
  - Refresh token (JWT) – 7d lifetime, payload: `{ user_id, verify, token_type: REFRESH_TOKEN, exp }`
  - Stored in `refreshTokens` collection with `user_id`, `token`, `iat`, `exp`
  - Rewrite note: sessions/refresh tokens are stored in Redis; analytics requiring time-series must use a Postgres event table (see `AuthEvent` below).

- **User Verify Status**
  - `UNVERIFIED` – registered but email not verified
  - `VERIFIED` – fully active account
  - `BANNED` – blocked; many flows hard‑fail for this status

- **Roles**
  - `USER` – normal rider
  - `STAFF` – support staff
  - `ADMIN` – full admin
  - `SOS` – rescue operator

## 2. Public Auth & Profile Use Cases

### 2.1 Authentication Flows

- **Login**
  - Path: `POST /users/login`
  - Input: `{ email, password }`
  - Middleware validates credentials and attaches `req.user`
  - Service:
    - Generates access + refresh tokens
    - Decodes refresh token to get `iat/exp`
    - Persists `RefreshToken` record
  - Output:
    - `{ access_token, refresh_token }`

- **Register**
  - Path: `POST /users/register`
  - Input: `{ fullname, email, password, confirm_password, phone_number, avatar? }`
  - Service behaviour:
    - Creates new `User`:
      - `username = "user" + user_id`
      - `role = USER`
      - `verify = UNVERIFIED`
      - `email_verify_otp` + 10‑minute expiry
      - `password` hashed
    - Starts Mongo transaction:
      - Insert `User`
      - Create wallet via `walletService.createWallet`
      - Insert initial `RefreshToken`
    - Sends email with verification OTP (10‑minute lifetime)
    - Returns `{ access_token, refresh_token }` for immediate login

- **Logout**
  - Path: `POST /users/logout`
  - Auth: access token + refresh token
  - Input: `{ refresh_token }`
  - Behaviour: deletes stored refresh token; returns logout message

- **Refresh Token**
  - Path: `POST /users/refresh-token`
  - Input: `{ refresh_token }`
  - Middleware:
    - Verifies refresh JWT
    - Attaches `{ user_id, verify, exp }` to `req.decoded_refresh_token`
  - Service:
    - Issues new access + refresh tokens
    - Deletes old refresh token document
    - Inserts new one

### 2.2 Email Verification

- **Verify Email via OTP**
  - Path: `POST /users/verify-email`
  - Input: `{ email, otp }`
  - Behaviour:
    - Looks up user by email
    - Guards:
      - `USER_NOT_FOUND` if no user
      - If `verify === VERIFIED`: returns "already verified"
      - If `verify === BANNED`: 403
      - If OTP missing/incorrect/expired: 401
    - Marks user as `VERIFIED`, clears OTP fields
    - Issues new access + refresh tokens (with `verify: VERIFIED`)
    - Inserts new refresh token

- **Resend Email Verification OTP**
  - Path: `POST /users/resend-verify-email`
  - Auth: access token
  - Behaviour:
    - Fetches user by `user_id` from access token
    - Guard: user not found → 404
    - Guard: `BANNED` → 403
    - Guard: `VERIFIED` → respond with "already verified"
    - Generates new OTP + expiry, updates user
    - Sends verification email

### 2.3 Password Flows

- **Forgot Password**
  - Path: `POST /users/forgot-password`
  - Auth: access token (user must be logged in)
  - Behaviour:
    - Generates `forgot_password_otp` (5‑minute expiry in VN timezone)
    - Saves OTP + expiry on user
    - Sends email with OTP and expiry info

- **Reset Password via OTP**
  - Path: `POST /users/reset-password`
  - Input: `{ email, otp, password, confirm_password }`
  - Behaviour:
    - Looks up user by email
    - Guards:
      - `USER_NOT_FOUND`
      - `BANNED` → 403
      - OTP missing/invalid/expired → 401
      - New password equal to old password → 400
    - Updates password (hashed)
    - Clears forgot‑password OTP fields

- **Change Password (logged‑in user)**
  - Path: `PUT /users/change-password`
  - Auth: access token, verified user
  - Input: `{ old_password, password, confirm_password }`
  - Behaviour:
    - Verifies old password
    - Updates to new hashed password

## 3. User Profile (Self‑Service)

- **Get Current User**
  - Path: `GET /users/me`
  - Auth: access token
  - Behaviour:
    - Fetches user by `user_id`
    - Returns user without sensitive fields:
      - `password`, `email_verify_token`, `forgot_password_token`, OTP fields

- **Update Current User**
  - Path: `PATCH /users/me`
  - Auth: access token
  - Allowed fields (filtered in middleware):
    - `fullname`, `location`, `username`, `avatar`, `phone_number`
  - Behaviour:
    - Updates allowed fields
    - Refreshes `updated_at`
    - Returns updated user with sensitive fields removed

## 4. Admin / Staff Use Cases

All these routes are under `/users/manage-users/*` and require access token plus role guards.

- **Get Aggregate User Stats**
  - Path: `GET /users/manage-users/stats`
  - Roles: `ADMIN`, `STAFF`
  - Aggregates:
    - `total_users`
    - `total_verified`
    - `total_unverified`
    - `total_banned`

- **Create User (Admin)**
  - Path: `POST /users/manage-users/create`
  - Roles: `ADMIN`
  - Input: `AdminCreateUserReqBody` (fullname, email, password, phone_number, role, verify?)
  - Behaviour:
    - Creates user with specified role and verification status
    - Similar field handling to normal registration (but likely without wallet creation / OTP)

- **Active User Time‑Series Stats**
  - Path: `GET /users/manage-users/stats/active-users`
  - Roles: `ADMIN`, `STAFF`
  - Query:
    - `groupBy`: `"day" | "month"`
    - `startDate`, `endDate` – date strings
  - Behaviour:
    - Aggregates unique active users per day/month based on `refreshTokens.iat`

- **Top Renters Stats**
  - Path: `GET /users/manage-users/stats/top-renters`
  - Roles: `ADMIN`, `STAFF`
  - Query: `page?`, `limit?`
  - Behaviour:
    - Aggregates completed rentals by user
    - Joins to users collection for profile info
    - Returns paginated list of top renters

- **New User Registration Stats**
  - Path: `GET /users/manage-users/stats/new-users`
  - Roles: `ADMIN`
  - Behaviour:
    - Compares counts of new `role: USER` users this month vs last month
    - Returns counts + percentage change

- **User Dashboard Stats (Admin)**
  - Path: `GET /users/manage-users/dashboard-stats`
  - Roles: `ADMIN`
  - Behaviour:
    - For `role: USER`:
      - `totalCustomers`
      - `activeCustomers` (`verify: VERIFIED`)
      - `newCustomersThisMonth`
    - VIP customer:
      - User with highest total rental duration (from rentals)
    - Financial:
      - `totalRevenue` from completed rentals
      - `averageSpending` per customer

- **List Users with Filters + Pagination**
  - Path: `GET /users/manage-users/get-all`
  - Roles: `ADMIN`, `STAFF`
  - Query:
    - `limit`, `page`
    - `fullname` (substring)
    - `verify` (`UNVERIFIED | VERIFIED | BANNED`)
    - `role` (`USER | STAFF | ADMIN`)
  - Behaviour:
    - Uses generic `sendPaginatedResponse` helper
    - Filters on fullname (case‑insensitive), verify, role
    - Excludes sensitive fields from projection

- **Search Users**
  - Path: `GET /users/manage-users/search`
  - Roles: `ADMIN`, `STAFF`
  - Query: `q` (string)
  - Behaviour:
    - Regex match on `email` OR `phone_number`
    - Excludes sensitive fields

- **Get User Detail (Admin/Staff)**
  - Path: `GET /users/manage-users/:_id`
  - Roles: `ADMIN`, `STAFF`
  - Behaviour:
    - Looks up user by id
    - Excludes sensitive fields
    - 404 if not found

- **Update User By ID (Admin/Staff)**
  - Path: `PATCH /users/manage-users/:_id`
  - Roles: `ADMIN`, `STAFF`
  - Allowed fields:
    - `fullname`, `email`, `verify`, `location`, `username`, `phone_number`, `role`, `nfc_card_uid`
  - Special behaviour:
    - If `email` changed:
      - Generates new email verification OTP
      - Sets `verify = UNVERIFIED`
      - Sends verification email to new address
  - Returns updated user or 404 if not found

- **Admin Reset Password for User**
  - Path: `POST /users/manage-users/admin-reset-password/:_id`
  - Roles: `ADMIN`
  - Input: `{ new_password, confirm_new_password }`
  - Behaviour:
    - Updates password (hashed)
    - Clears forgot‑password OTP fields
    - 404 if user not found

## 5. Domain Rules & Invariants (User)

- Email uniqueness must be enforced (legacy uses Mongo unique index + error handling).
- Passwords are always stored hashed.
- Many flows forbid actions when:
  - User is `BANNED` (login still allowed? legacy checks mostly around verify/OTP flows).
  - Email is not verified (some actions require `verify === VERIFIED`).
- OTPs:
  - Email verification OTP: 10‑minute TTL, regenerable via resend endpoint.
  - Forgot‑password OTP: 5‑minute TTL.
  - Both stored on user with expiry timestamps in VN timezone.
- Tokens:
  - Refresh tokens persisted; logout and refresh flows clean up old tokens.
  - Multiple refresh tokens per user are allowed (no revocation of all on login).

## 6. New Backend – TODO Checklist

High‑level plan for the `apps/server` rewrite.

### 6.1 Contracts (packages/shared)

- [x] Define user models for public consumption (no password / OTP fields). - `packages/shared/src/contracts/server/users/models.ts` (`UserDetailSchema`, `UserSummarySchema`).
- [x] Define auth request/response schemas (login, register, refresh, change password, forgot/reset, verify/resend). - Implemented under `contracts/server/auth/*` and wired to `auth` routes.
- [x] Define admin management schemas (list/search filters, user detail/update, reset password). - Implemented under `packages/shared/src/contracts/server/users/*` (manage-users routes).
- [x] Define error codes for user/auth flows (invalid credentials, user banned, email not verified, OTP invalid/expired, etc.). - Auth error codes live in `contracts/server/auth/schemas.ts`; user-specific errors (not found, duplicate email/phone) live in `contracts/server/users/schemas.ts`.

### 6.2 Persistence & Repository (apps/server)

- [x] Design Prisma models for `User` and `RefreshToken` (Postgres, UUID v7 ids). - `User` is defined in `apps/server/prisma/models/users.prisma` with `uuid(7)` ids; refresh/session data is stored in Redis via the auth repository instead of a Postgres `RefreshToken` table.
- [x] Implement `UserRepository` (find by id/email, create, update, admin list/search). - Core methods implemented in `repository/user.repository.ts` (create/find/update/markVerified); admin listing/search endpoints are still TODO.
- [x] Implement `AuthTokenRepository` (store/delete/rotate refresh tokens). - Implemented as `AuthRepository` in the `auth` domain backed by Redis (sessions + email/reset OTPs).

### 6.3 Services

- [x] Auth service:
  - [x] Issue access/refresh tokens (JWT) with Effect resources. - Implemented in `domain/auth/services/auth.service.ts` with helpers in `jwt.ts` and config from `config.ts`.
  - [x] Verify/parse tokens into a `CurrentUser` requirement. - `src/http/middlewares/auth.ts` parses bearer JWT access tokens and sets `currentUser` for protected routes (payload-only; no user lookup yet).
- [x] User service:
  - [x] self profile: getMe/updateMe - `UserService` wraps `UserRepository`; `/v1/users/me` routes call `UserService` directly.
  - [x] creation used by auth.register (user creation + verification status). - `AuthService.register` calls `UserService.create` and then auth repository/email.
  - [ ] login/register/logout/refresh flows - These live in the `auth` domain rather than `users` in the rewrite.
  - [x] forgot/reset password flows (implemented in `auth` domain).
  - [x] email verify / resend OTP flows (implemented in `auth` domain).
  - [x] admin: list/search/detail/update/reset password
  - [x] stats: aggregate + dashboard endpoints.

### 6.4 Effect / HTTP Integration

- [ ] Define `CurrentUser` Effect `Tag` (id + role + verify status).
- [x] Implement Hono middleware that:
  - [x] Reads access token from header/cookie.
- [ ] Verifies JWT and loads user from repository.
  - [x] Fails with contract‑typed errors on invalid/expired tokens.
  - [x] Provides `CurrentUser` to downstream Effects.
- [x] Update user-bound routes to use real `userId` from `CurrentUser` instead of placeholder. - Routes under `/v1/users`, `/v1/ratings`, `/v1/wallets`, `/v1/rentals`, and `/v1/subscriptions` now read `currentUser` from the JWT middleware (no `x-user-id` header).

### 6.5 Migration / Gaps vs Legacy

- [ ] Decide which legacy behaviours are essential for v1:
  - Wallet creation on register (likely yes).
  - All advanced stats endpoints (maybe later).
  - Support for SOS / STAFF roles in the first cut or later.

This file should be updated as we firm up which user flows we want to support in the first iteration of the new backend, and as we add contracts, repositories, services, and routes under `apps/server/src/domain/users`.

---

## 7. Legacy Admin/Staff User Management (Missing in Rewrite)

Legacy source: `apps/backend/src/routes/users.routes.ts` (all under `/users/manage-users/*`).

## 7.0 Legacy Stats Definitions (Source of Truth)

The legacy backend defines several “stats” endpoints under `/users/manage-users/*`. The definitions below are what the rewrite should match unless we explicitly decide to diverge.

### 7.0.1 `GET /users/manage-users/stats`

- Definition (Mongo aggregation over `users`):
  - `total_users`: count of all users
  - `total_verified`: count where `verify = VERIFIED`
  - `total_unverified`: count where `verify = UNVERIFIED`
  - `total_banned`: count where `verify = BANNED`
- Response shape:
  - `{ message, result: { total_users, total_verified, total_unverified, total_banned } }`

### 7.0.2 `GET /users/manage-users/stats/active-users`

- Legacy definition of “active” is **session/login activity**, not rentals:
  - A user is “active” if they have a `refreshTokens` record with `iat` within the requested period.
- Params:
  - `groupBy`: `day | month`
  - `startDate`, `endDate`
- Aggregation:
  - Filter refreshTokens by `iat`
  - Group by (date bucket, userId) to get unique users
  - Group by date bucket to count unique users
- Response shape:
  - `{ message, result: Array<{ date: string, active_users_count: number }> }`

- Rewrite implementation note:
  - The rewrite stores sessions in Redis, which is not suitable for historical time-series queries.
  - We will implement this endpoint against a Postgres audit/event table `AuthEvent`:
    - Insert `AuthEvent(type = SESSION_ISSUED)` when a session is created/rotated (login + refresh).
    - Aggregate unique active users per day/month from `AuthEvent.occurredAt`.

### 7.0.3 `GET /users/manage-users/stats/top-renters`

- Definition:
  - rank users by count of rentals with `status = COMPLETED`.
- Aggregation:
  - Filter rentals by `status = COMPLETED`
  - Group by `userId`, compute `total_rentals`
  - Sort desc by `total_rentals`
  - Join user fields: `fullname`, `email`, `avatar`, `phone_number`, `location`
  - Paginated response
- Response shape:
  - `{ message, result: { data: Array<{ total_rentals, user: {...} }>, pagination: { page, limit, total_pages, total_records } } }`

### 7.0.4 `GET /users/manage-users/stats/new-users`

- Definition:
  - Month-to-date comparison:
    - `newUsersThisMonth`: from start of current month → now
    - `newUsersLastMonth`: from start of last month → “equivalent day” in last month (if today is Oct 24, compare against Sep 1–Sep 24)
    - `percentageChange`: `(thisMonth - lastMonth) / lastMonth * 100`
- Response shape:
  - `{ message, result: { newUsersThisMonth, newUsersLastMonth, percentageChange } }`

### 7.0.5 `GET /users/manage-users/dashboard-stats`

- Fields:
  - `totalCustomers`: count users with `role = USER`
  - `activeCustomers`: count users with `role = USER` and `verify = VERIFIED`
  - `newCustomersThisMonth`: count users created in current month
  - `vipCustomer`: the user with highest sum of rental duration (completed rentals)
  - `totalRevenue`: sum `total_price` of completed rentals
  - `averageSpending`: `totalRevenue / totalCustomers`
- Response shape:
  - `{ message, result: { totalCustomers, activeCustomers, newCustomersThisMonth, vipCustomer, totalRevenue, averageSpending } }`

### 7.0.6 Open questions for the rewrite (must decide before implementation)

1. Do we keep `User.createdAt` (`timestamptz`) in Postgres/Prisma?
2. For “active-users”, do we want legacy-accurate behavior (requires queryable auth events / refresh token issuance timestamps), or redefine “active”?
3. Confirm rental fields needed for stats: do we have `totalPrice` + `startTime/endTime` and `COMPLETED` status in the rewrite schema?

### 7.1 Endpoints to add (contracts + http routes + domain support)

**Admin/Staff (requires auth + role guard)**

- [x] `GET /v1/users/manage-users/stats` (ADMIN, STAFF)
- [x] `GET /v1/users/manage-users/stats/active-users` (ADMIN, STAFF)
- [x] `GET /v1/users/manage-users/stats/top-renters` (ADMIN, STAFF)
- [x] `GET /v1/users/manage-users/get-all` (ADMIN, STAFF) – pagination + filters (`fullname`, `verify`, `role`)
- [x] `GET /v1/users/manage-users/search` (ADMIN, STAFF) – query param `q`
- [x] `GET /v1/users/manage-users/{userId}` (ADMIN, STAFF)
- [x] `PATCH /v1/users/manage-users/{userId}` (ADMIN, STAFF)

**Admin only**

- [x] `POST /v1/users/manage-users/create` (ADMIN)
- [x] `POST /v1/users/manage-users/admin-reset-password/{userId}` (ADMIN)
- [x] `GET /v1/users/manage-users/stats/new-users` (ADMIN)
- [x] `GET /v1/users/manage-users/dashboard-stats` (ADMIN)

> Note: the above endpoints are now implemented in `apps/server/src/http/routes/users.ts`.

### 7.2 Domain work required

- [x] Add `UserRepository` methods for admin list/search/detail/update/reset-password and any required aggregates.
- [x] Add `UserService` / `use-cases` for admin flows (keep orchestration out of HTTP routes).
- [x] Add HTTP middleware guards for `ADMIN` and `ADMIN|STAFF` on `/v1/users/manage-users/*`.

### 7.3 Legacy docs mismatch: verify-forgot-password

Legacy OpenAPI YAML (`apps/backend/src/docs/paths/all-paths.yaml`) lists:

- `/users/verify-forgot-password`

But there is no corresponding Express route in `apps/backend/src/routes/users.routes.ts`.

Rewrite decision:

- If we support a “verify forgot password OTP” step, it belongs in the `auth` domain (OTP verification) and should be defined explicitly in the `auth` contract.
