# Auth / User Access Domain Notes

## Scope in the rewrite

This `auth` domain is about **how a caller proves who they are** and how access tokens / sessions are managed. It _depends on_ the `users` domain ("who is this person?") but should not own user profile data.

We are **not** implementing full auth flows yet. This document extracts the existing behavior from the legacy backend to guide a cleaner design in the new Effect + Hono backend.

---

## Legacy behavior (apps/backend)

References:

- `src/controllers/users.controllers.ts`
- `src/services/users.services.ts`
- `src/middlewares/users.middlewares.ts`
- `src/models/schemas/user.schema.ts`, `refresh-token.schemas.ts`
- `src/utils/jwt.ts`, `src/utils/crypto.ts`, `src/utils/email-templates.ts`

### Core auth flows

1. **Login**
   - Route: `POST /users/login`
   - Flow:
     - Middleware validates email/password and loads `req.user` (Mongo user document).
     - Controller calls `usersService.login({ user_id, verify })`.
     - Service:
       - Signs an **access token** (15 minutes) with payload `{ user_id, token_type: AccessToken, verify }`.
       - Signs a **refresh token** (7 days) with payload `{ user_id, token_type: RefreshToken, verify }`.
       - Decodes refresh token to read `exp` and `iat`.
       - Persists a `RefreshToken` document containing `{ token, user_id, exp, iat }`.
       - Returns `{ access_token, refresh_token }` to client.

2. **Register**
   - Route: `POST /users/register`
   - Flow:
     - Validates payload (email, password, fullname, phone, etc.).
     - Allocates a new `user_id` (Mongo ObjectId).
     - Generates an **email verification OTP** and expiry (10 minutes, VN timezone).
     - Creates a `User` with:
       - Hashed password
       - `verify = Unverified`
       - `email_verify_otp`, `email_verify_otp_expires`
       - `role = User`
     - In the legacy code, registration is wrapped in a **MongoDB transaction**:
       - Insert `User`.
       - Create `Wallet` for the user.
       - Insert initial `RefreshToken`.
     - Sends a verification email with the OTP.
     - Returns an initial pair `{ access_token, refresh_token }` (for unverified user).

3. **Refresh token**
   - Route: `POST /users/refresh-token`
   - Flow:
     - Middleware decodes and validates provided `refresh_token`:
       - Checks signature, `token_type === RefreshToken`, expiry, etc.
       - Attaches `decoded_refresh_token` to request.
     - Controller calls `usersService.refreshToken({ user_id, verify, refresh_token, exp })`.
     - Service:
       - Verifies refresh token exists in DB (revocation support).
       - Issues new access + refresh tokens (rotation), updates refresh-token collection.

---

## Rewrite note: Active-user analytics (`AuthEvent`)

Legacy “active users” stats were computed from the refresh token store (`refreshTokens.iat`), which was queryable.

In the rewrite, sessions/refresh tokens live in Redis (ephemeral, not suitable for time-series analytics), so we add a Postgres audit/event table:

- Prisma schema: `apps/server/prisma/models/auth_events.prisma`
  - `AuthEvent` with `type = SESSION_ISSUED` and `occurredAt`
- When to write events:
  - After successful login session creation
  - After successful refresh rotation (new session/token issued)
- What it enables:
  - `GET /v1/users/manage-users/stats/active-users` (groupBy day/month, date range) via SQL over `AuthEvent.occurredAt`.

4. **Logout**
   - Route: `POST /users/logout`
   - Flow:
     - Controller receives body `{ refresh_token }`.
     - Service deletes corresponding `RefreshToken` document.
     - No changes to `User`.

5. **Forgot password**
   - Route: `POST /users/forgot-password`
   - Flow:
     - Requires authenticated user (so this is _not_ anonymous email-based forgot password).
     - Service generates a 6‑digit OTP and its expiry (5 minutes, VN timezone).
     - Updates user document with `forgot_password_otp`, `forgot_password_otp_expires`.
     - Sends OTP email with template `forgot-password-otp.html`.

6. **Reset password**
   - Route: `POST /users/reset-password`
   - Flow:
     - Accepts `{ email, otp, password }`.
     - Loads user by email.
     - Guards:
       - 404 if user not found.
       - 403 if `verify === Banned`.
       - 401 if OTP missing/incorrect/expired.
       - 400 if new password is same as existing password.
     - Updates user password with new bcrypt hash.
     - Clears `forgot_password_otp` and expiry.

7. **Email verification**
   - Verify OTP
     - Route: `POST /users/verify-email-otp`
     - Flow:
       - Accepts `{ email, otp }`.
       - Loads user by email.
       - Guards:
         - 404 if not found.
         - If already `Verified`, return success message (idempotent).
         - 403 if `Banned`.
         - 401 if OTP missing/incorrect/expired.
       - Marks user as `Verified`, clears email OTP fields.
       - Issues **new access & refresh tokens** for verified state and stores new refresh token.

   - Resend OTP
     - Route: `POST /users/resend-verify-email`
     - Flow:
       - Requires authenticated user (access token).
       - Reloads user by `user_id`.
       - Guards:
         - 404 if not found.
         - 400 if already verified.
         - 403 if banned.
       - Generates a new email OTP + expiry.
       - Updates user and sends another verification email.

8. **Change password (authenticated)**
   - Route: `POST /users/change-password`
   - Flow:
     - Requires access token.
     - Middleware validates old/new password (including that old matches).
     - Service updates password hash, clears reset tokens, updates `updated_at`.

9. **Get profile / update profile**
   - `GET /users/me` – reads user by id, excludes sensitive fields.
   - `PATCH /users/me` – updates profile fields (name, email, phone, etc.), with extra behavior:
     - If sensitive fields change (like email), may re-trigger verification email.

10. **Admin / staff user management (auth-adjacent)**
    - Admin can list/search users, reset passwords, change roles/status, see stats.
    - These are _authorization_ concerns layered on top of authentication.

---

## Roles and verification

Auth decisions depend on 2 main aspects of the user model:

- **Role** (`Role` enum in legacy): `User`, `Admin`, `Staff`, ...
- **Verify status** (`UserVerifyStatus`): `Unverified`, `Verified`, `Banned`.

Middleware uses decoded token payload to:

- Enforce "must be verified" for most user actions.
- Enforce role-based access for admin/staff routes.

In the rewrite, this likely becomes:

- A **User** domain exposing `UserRow` with `role` and `verifyStatus`.
- An **Auth** domain that issues tokens with `{ userId, role, verifyStatus }`.
- Hono middlewares that decode/verify tokens and attach a typed `AuthContext` for routes to use.

---

## Planned auth domain in the new backend

### Responsibilities of `auth` domain (future design)

1. **Token issuance & rotation**
   - `issueTokens(userId, verifyStatus)` → `{ accessToken, refreshToken }`.
   - `refreshTokens(refreshToken)` → new pair + rotation rules.

2. **Session / refresh-token persistence**
   - In legacy: stored in Mongo (`RefreshToken` collection).
   - In rewrite: candidates are Postgres + Redis.
   - Decisions to make:
     - Use Redis for short-lived refresh tokens / sessions.
     - Or keep Postgres for auditability and use Redis as cache.

3. **Email / OTP flows** (authentication-related):
   - `beginEmailVerification(userId)` → generate OTP, store with expiry, send email.
   - `verifyEmailOtp(email, otp)` → mark user verified, issue tokens.
   - `beginPasswordReset(email)` → OTP + email.
   - `resetPassword(email, otp, newPassword)` → update password.

4. **Crypto utilities (not domain logic)**
   - Password hashing / comparison.
   - JWT signing / verification for access/refresh tokens.

### Out of scope for `auth` (belongs to other domains)

- Wallet creation on register → `wallet` domain.
- User profile updates → `users` domain.
- Rental eligibility checks (credit, bans, etc.) → `users` + `wallet` + `rentals` coordination.

---

## Practical next steps

For now we only need enough auth to exercise other domains (stations, bikes, rentals):

1. **User repo + auth middleware**
   - Implement `UserRepository` and `UserService` to load users by id and check `verifyStatus` and role.
   - JWT bearer middleware is in `src/http/middlewares/auth.ts`; it parses access tokens and sets `currentUser` from the JWT payload for protected routes.

2. **Later: full auth domain**
   - Design `AuthService` with Effect + Redis:
     - Manage refresh tokens/sessions using Redis.
     - JWT signing and rotation.

---

## Current implementation status (rewrite)

- **Repositories / infra**
  - AuthRepository (Redis): owns refresh sessions + email/reset OTPs, TTL derived from `expiresAt`, keys under `auth:session:*`, `auth:user-sessions:*`, `auth:otp:*`.
  - Email infra: nodemailer transporter + `Email` service.
  - UserRepository (Postgres/Prisma): create/find/update/mark-verified, maps P2002 to duplicate email/phone errors.

- **Services / helpers**
  - AuthService: login, refresh, logout, logoutAll, send/verify email OTP, send/reset password (OTP), uses Redis + email + user repo; infra errors die, domain errors returned.
  - Helpers split out: JWT helpers (`jwt.ts`), OTP helpers (`otp.ts`), config constants (`config.ts`), domain errors (`domain-errors.ts`).

- **Use-cases**
  - Added thin wrappers in `domain/auth/use-cases/auth.use-cases.ts` for all implemented flows; resend verify reuses sendVerifyEmail (guards/rate limits can be added later).

- **Todo / future**
  - Resend verify: add guards (already verified/banned) and rate limits at use-case level.
  - Change password (authenticated) flow.
  - Register orchestration (user creation + optional wallet + initial verify email).
- Controllers/routes still pending; will map domain errors to HTTP contracts.

---

## Known drift vs legacy backend (to review later)

These are intentional/accidental differences from `apps/backend` that we should revisit:

- **Forgot password entry point**
  - Legacy: requires authenticated user to request forgot-password OTP.
  - Rewrite: `sendResetPassword` is anonymous and keyed by email.
  - Open question: keep it authenticated-only, allow anonymous, or branch based on login method (e.g. Google SSO users without a local password).

- **Verify-email completion**
  - Legacy: verifying email OTP also issues a new access + refresh token pair.
  - Rewrite: `verifyEmailOtp` currently only marks the user as verified (no tokens returned); routes can respond with 200/201 without new tokens.
  - Decision needed: do we really need token reissue here, or is a simple 200/201 plus “next login will reflect verified state” sufficient?

- **Refresh token TTL**
  - Legacy: refresh tokens lived ~7 days.
  - Rewrite: `REFRESH_TOKEN_EXPIRES_IN` is currently 30 days and Redis TTL follows that.
  - Decision: align to 7d for parity, or keep 30d as an explicit change.

- **JWT secrets**
  - Legacy: separate secrets for access vs refresh tokens.
  - Rewrite: uses a single `env.JWT_SECRET` for both.
  - Decision: keep single-secret simplicity or restore separate secrets for better key separation.

- **Registration orchestration**
  - Legacy: register flow created user + wallet + refresh token in one Mongo transaction and sent the initial verify OTP.
  - Rewrite: registration orchestration is not implemented yet (no wallet creation, no initial session); will live as a use-case coordinating `users`, `wallet`, and `auth`.

- **Resend verify-email**
  - Legacy: had a dedicated resend route with its own guards.
  - Rewrite: `resendVerifyEmailUseCase` just delegates to `sendVerifyEmail`; guards (already verified, banned, rate-limiting) are TODO at the use-case layer.

- **verify-forgot-password endpoint**
  - Legacy OpenAPI YAML lists `/users/verify-forgot-password`, but there is no corresponding Express route in `apps/backend/src/routes/users.routes.ts`.
  - If we add an explicit “verify forgot password OTP” step, it belongs here in the `auth` domain (OTP verification), not the `users` domain.

- **SOS role**
  - Rewrite: JWT helper currently normalises `UserRole.SOS` to `"USER"` as a temporary measure.
  - TODO: design proper SOS role handling (authz, token shape, and routes) and remove this clamp.
    - OTP storage using Redis or Postgres.
  - Add proper routes under `http/routes/auth.ts` or reuse `users` routes as in legacy.

This file should be updated as we solidify the new auth design.
