# Wallet Domain – Notes (rewrite backend)

## Rewrite status (apps/server, verified)

Implemented user-facing HTTP endpoints live in `apps/server/src/http/routes/wallets.ts`:

- Get my wallet
- List my wallet transactions
- Credit/debit wallet endpoints (currently exposed under `/v1/wallets/me/*`; confirm whether these should be admin-only or dev-only)
- Stripe topup session (Checkout) + webhook-driven crediting
- Wallet withdrawals (Stripe Connect transfer/payout flow)

Known gaps vs legacy `apps/backend/src/routes/wallets.routes.ts` + `apps/backend/src/routes/withdraw.routes.ts`:

- Admin wallet overview and system-wide transaction management (`/wallets/overview`, `/wallets/manage-transactions`, `/wallets/manage-wallet*`)
- Admin increase/decrease wallet balance endpoints (explicit admin-only controls)
- Admin change wallet status (freeze/unfreeze) endpoint equivalent
- Legacy withdraw/refund management endpoints (overview, approve/reject/complete) — the rewrite uses a different Stripe-based withdrawal model, so contract + operational tooling needs explicit design.

## 1. Legacy backend shape (Mongo)

- Collections:
  - `wallets` – one per user
    - `user_id: ObjectId`
    - `balance: Decimal128`
    - `status: WalletStatus` (Active, Frozen, etc.)
    - `created_at`, `updated_at`
  - `transactions` – money in/out of a wallet
    - `wallet_id: ObjectId`
    - `amount: Decimal128`
    - `fee: Decimal128`
    - `description: string`
    - `transaction_hash: string` (optional, mostly empty)
    - `type: TransactionTypeEnum` (Deposit, Decrease, Refund, etc.)
    - `status: TransactionStatus` (Success, Failed, Pending…)
    - `created_at`
  - `refunds`
    - Links to a transaction and a user.
    - Has `status` (Pending → Approved → Completed, or Rejected).
  - `withdraws`
    - Withdrawal requests from a user’s wallet.
    - Has `status` (Pending → Approved → Completed, or Rejected).

- Access pattern:
  - All wallet APIs sit behind normal auth; they use `req.decoded_authorization.user_id`.
  - Admin‑only endpoints (overview, manual balance adjustments, managing wallets) are gate‑kept by role middleware.

## 2. Legacy wallet use‑cases (high level)

User‑facing:

- **Create wallet** (usually called early or lazily on first money operation):
  - If user already has wallet → 400 `USER_ALREADY_HAVE_WALLET`.
  - Else insert wallet with balance = 0, status = Active.
- **Get my wallet** (`/wallets`):
  - Look up wallet by `user_id`.
  - If none → 400 `USER_NOT_HAVE_WALLET`.
- **Get my transactions** (`/wallets/transaction`, `/wallets/transaction/:id`):
  - Paginated listing by wallet_id.
  - Filter by type.
  - Transaction detail by id (scoped to user’s wallet).
- **Wallet history** (for a user):
  - “History” = paginated wallet snapshot list (with user info join).
  - There is also a per‑user “wallet history” that is effectively the same as “transactions for this wallet”.
- **Refund a transaction**:
  - User requests refund against a transaction:
    - Validates transaction exists and belongs to user.
    - Amount cannot exceed original transaction amount.
    - Creates a `refund` document with `Pending` status.
  - Admin workflow:
    - `Pending` → `Approved`/`Rejected`.
    - `Approved` → `Completed` (on Completed a new `Refund` transaction is recorded and wallet credited).
- **Withdraw funds**:
  - User submits withdrawal request (amount, bank account info, note).
  - Validate:
    - User exists.
    - User has wallet.
    - Wallet balance ≥ requested amount.
  - Insert `withdraw` with `Pending` status; does **not** immediately debit the balance.
  - Admin approves/completes it later; balance adjustment happens then (and a transaction is recorded).

Admin‑facing:

- **Increase balance (admin only)**:
  - Given `{ user_id, amount, fee, description, transaction_hash? }`.
  - Validations:
    - Wallet must exist; else 404 `USER_NOT_HAVE_WALLET`.
    - `amount > 0`.
    - `netChange = amount - fee > 0`.
  - Behavior:
    - `wallet.balance += netChange`.
    - Insert `transaction` with type = `Deposit`, status = `Success`.
- **Decrease balance (admin only)**:
  - Given `{ user_id, amount, description }`.
  - Validations:
    - Wallet must exist.
    - `amount > 0`.
    - `wallet.balance >= amount`.
  - Behavior:
    - `wallet.balance -= amount`.
    - Insert `transaction` with type = `DECREASE` (or similar), status = `Success`.
- **Change wallet status (admin only)**:
  - Update `wallet.status` to a new enum value.
- **Wallet overview**:
  - Aggregates:
    - Total balance across all wallets.
    - Total transaction count.
    - Total deposits / total decreases.
  - Used for admin dashboards.
- **Refund overview / Withdraw overview**:
  - Aggregated statistics over `refunds` / `withdraws` collections:
    - Total amount completed.
    - Counts by status (Pending / Approved / Rejected / Completed).

## 3. Obvious business rules to preserve

- At most **one wallet per user**.
- Multiple independent **transactions per wallet** (no hard cap).
- **No negative balances**:
  - decrease / withdraw / completed refund must never drive balance below 0.
- **Status transitions are constrained**:
  - RefundStatus:
    - Pending → Approved / Rejected.
    - Approved → Completed.
    - Completed / Rejected → terminal.
  - WithdrawStatus:
    - Pending → Approved / Rejected.
    - Approved → Completed.
    - Completed / Rejected → terminal.
- Refund/Withdraw:
  - Cannot move to an arbitrary status; only allowed next states are permitted.
  - When a refund is **Completed**, a credit transaction is written and (implicitly) the wallet should reflect it.

## 4. How we’ll scope the rewrite (Phase 1)

Phase 1 goal: internal credit wallet only, no external PSP (Stripe) yet. Focus on:

- Models (Postgres via Prisma):
  - `Wallet`:
    - `id` (uuid7)
    - `userId` (FK → users)
    - `balance` (numeric/decimal)
    - `status` (enum)
    - `createdAt`, `updatedAt`
  - `WalletTransaction`:
    - `id`
    - `walletId`
    - `amount`
    - `fee`
    - `description`
    - `hash` (for future PSP correlation – optional)
    - `type` (Deposit / Debit / Refund / Adjustment)
    - `status` (Success / Pending / Failed)
    - `createdAt`
  - **Phase‑1 TODO**: `Refund` and `Withdraw` tables.

- Repository responsibilities:
  - `WalletRepository`:
    - `findByUserId`, `createForUser`, `getById`.
    - `listTransactionsForWallet` with pagination.
    - `increaseBalance` / `decreaseBalance` that:
      - Do the balance mutation and write a transaction in a single DB transaction.
      - Enforce non‑negative balance.
  - Later: `RefundRepository`, `WithdrawRepository`.

- Service responsibilities:
  - Implement business rules on top of the repository:
    - “User already has wallet” check.
    - “User must have wallet” for balance changes.
    - Non‑negative balance (delegated or double‑checked).
  - Map repo errors (DB issues) → domain errors (`WalletRepositoryError`, `WalletNotFound`, `InsufficientBalance`, etc.).

- Use‑cases (Phase 1 minimum):
  - `createWalletForUserUseCase(userId)`.
  - `getWalletForUserUseCase(userId)`.
  - `listUserTransactionsUseCase(userId, pagination/filter)`.
  - Admin:
    - `increaseWalletBalanceUseCase(args)` (manual credit).
    - `decreaseWalletBalanceUseCase(args)` (manual debit).
    - `getWalletOverviewUseCase()`.

## 5. Stripe / PSP (Phase 2 – future)

Planned extension (not implemented yet):

- Introduce a `payments` / `psp` infra layer:
  - Outbound: create top‑up payment intents (Stripe Checkout, etc.) with metadata `{ userId, walletId, correlationId }`.
  - Inbound: webhook handler that:
    - Validates signature.
    - Maps events (payment succeeded/failed) → wallet domain commands:
      - `WalletService.recordTopUp(correlationId, amount, fee, PSP metadata)`.
    - Ensures idempotency via a dedicated key (e.g. PSP event id).

- Wallet domain stays Stripe‑agnostic:
  - Only sees `recordDeposit`/`recordDebit` commands.
  - No direct Stripe SDK calls inside domain/service.

## 6. Rewrite constraints / TODOs

- Do **not** attempt to re‑implement refunds/withdraws fully in Phase 1; mark them as TODOs in the domain and contracts.
- Make sure balance adjustments are **transactional** at the database level.
- Keep enums and models **local to the wallet schema file** (per `AGENTS.md`).
- Avoid duplicating `increase/decrease` logic in controllers; use use‑cases.
