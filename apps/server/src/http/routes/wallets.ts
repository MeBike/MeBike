import { serverRoutes, UnauthorizedErrorCodeSchema, unauthorizedErrorMessages, WalletsContracts } from "@mebike/shared";
import { Effect, Match } from "effect";

import { withLoggedCause } from "@/domain/shared";
import { toMinorUnit } from "@/domain/shared/money";
import {
  createStripeCheckoutSessionUseCase,
  creditWalletUseCase,
  debitWalletUseCase,
  getRequiredWalletByUserIdUseCase,
  listWalletTransactionsForUserUseCase,
  requestWithdrawalUseCase,
} from "@/domain/wallets";
import { withStripeTopupDeps, withWalletDeps, withWithdrawalDeps } from "@/http/shared/providers";

export function registerWalletRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const wallets = serverRoutes.wallets;
  const { walletErrorMessages, WalletErrorCodeSchema } = WalletsContracts;

  const mapWalletDetail = (row: import("@/domain/wallets").WalletRow): WalletsContracts.WalletDetail => ({
    id: row.id,
    userId: row.userId,
    balance: row.balance.toString(),
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });

  const mapWalletTransaction = (
    row: import("@/domain/wallets").WalletTransactionRow,
  ): WalletsContracts.WalletTransactionDetail => ({
    id: row.id,
    walletId: row.walletId,
    amount: row.amount.toString(),
    fee: row.fee.toString(),
    description: row.description,
    hash: row.hash,
    type: row.type,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
  });

  const mapWalletWithdrawal = (
    row: import("@/domain/wallets/withdrawals").WalletWithdrawalRow,
  ): WalletsContracts.WalletWithdrawalDetail => ({
    id: row.id,
    userId: row.userId,
    walletId: row.walletId,
    amount: row.amount.toString(),
    currency: row.currency,
    status: row.status,
    idempotencyKey: row.idempotencyKey,
    stripeTransferId: row.stripeTransferId,
    stripePayoutId: row.stripePayoutId,
    failureReason: row.failureReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });

  app.openapi(wallets.getMyWallet, async (c) => {
    const userId = c.var.currentUser?.userId ?? null;
    if (!userId) {
      return c.json({
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      }, 401);
    }

    const eff = withLoggedCause(
      withWalletDeps(getRequiredWalletByUserIdUseCase(userId)),
      "GET /v1/wallets/me",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));

    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        c.json<WalletsContracts.GetMyWalletResponse, 200>({ data: mapWalletDetail(right) }, 200)),
      Match.tag("Left", ({ left }) => Match.value(left).pipe(
        Match.tag("WalletNotFound", () =>
          c.json<WalletsContracts.WalletErrorResponse, 404>({
            error: walletErrorMessages.WALLET_NOT_FOUND,
            details: { code: WalletErrorCodeSchema.enum.WALLET_NOT_FOUND },
          }, 404)),
        Match.orElse(() =>
          c.json<WalletsContracts.WalletErrorResponse, 404>({
            error: walletErrorMessages.WALLET_NOT_FOUND,
            details: { code: WalletErrorCodeSchema.enum.WALLET_NOT_FOUND },
          }, 404)),
      )),
      Match.exhaustive,
    );
  });

  app.openapi(wallets.listMyWalletTransactions, async (c) => {
    const userId = c.var.currentUser?.userId ?? null;
    if (!userId) {
      return c.json({
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      }, 401);
    }

    const query = c.req.valid("query");
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 50;

    const eff = withLoggedCause(
      withWalletDeps(
        listWalletTransactionsForUserUseCase({
          userId,
          pageReq: { page, pageSize },
        }),
      ),
      "GET /v1/wallets/me/transactions",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));

    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        c.json<WalletsContracts.ListMyWalletTransactionsResponse, 200>({
          data: right.items.map(mapWalletTransaction),
          pagination: {
            page: right.page,
            pageSize: right.pageSize,
            total: right.total,
            totalPages: right.totalPages,
          },
        }, 200)),
      Match.tag("Left", ({ left }) => Match.value(left).pipe(
        Match.tag("WalletNotFound", () =>
          c.json<WalletsContracts.WalletErrorResponse, 404>({
            error: walletErrorMessages.WALLET_NOT_FOUND,
            details: { code: WalletErrorCodeSchema.enum.WALLET_NOT_FOUND },
          }, 404)),
        Match.orElse(() =>
          c.json<WalletsContracts.WalletErrorResponse, 404>({
            error: walletErrorMessages.WALLET_NOT_FOUND,
            details: { code: WalletErrorCodeSchema.enum.WALLET_NOT_FOUND },
          }, 404)),
      )),
      Match.exhaustive,
    );
  });

  app.openapi(wallets.creditMyWallet, async (c) => {
    const userId = c.var.currentUser?.userId ?? null;
    if (!userId) {
      return c.json({
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      }, 401);
    }

    const body = c.req.valid("json");
    const amount = toMinorUnit(body.amount);
    const fee = body.fee !== undefined ? toMinorUnit(body.fee) : undefined;

    const eff = withLoggedCause(
      withWalletDeps(creditWalletUseCase({
        userId,
        amount,
        fee,
        description: body.description ?? null,
        hash: body.hash ?? null,
        type: body.type,
      })),
      "POST /v1/wallets/me/credit",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));

    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        c.json<WalletsContracts.WalletMutationResponse, 200>({
          data: mapWalletDetail(right),
        }, 200)),
      Match.tag("Left", ({ left }) => Match.value(left).pipe(
        Match.tag("WalletNotFound", () =>
          c.json<WalletsContracts.WalletErrorResponse, 404>({
            error: walletErrorMessages.WALLET_NOT_FOUND,
            details: { code: WalletErrorCodeSchema.enum.WALLET_NOT_FOUND },
          }, 404)),
        Match.orElse(() =>
          c.json<WalletsContracts.WalletErrorResponse, 404>({
            error: walletErrorMessages.WALLET_NOT_FOUND,
            details: { code: WalletErrorCodeSchema.enum.WALLET_NOT_FOUND },
          }, 404)),
      )),
      Match.exhaustive,
    );
  });

  app.openapi(wallets.debitMyWallet, async (c) => {
    const userId = c.var.currentUser?.userId ?? null;
    if (!userId) {
      return c.json({
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      }, 401);
    }

    const body = c.req.valid("json");
    const amount = toMinorUnit(body.amount);

    const eff = withLoggedCause(
      withWalletDeps(debitWalletUseCase({
        userId,
        amount,
        description: body.description ?? null,
        hash: body.hash ?? null,
        type: body.type,
      })),
      "POST /v1/wallets/me/debit",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));

    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        c.json<WalletsContracts.WalletMutationResponse, 200>({
          data: mapWalletDetail(right),
        }, 200)),
      Match.tag("Left", ({ left }) => Match.value(left).pipe(
        Match.tag("InsufficientWalletBalance", () =>
          c.json<WalletsContracts.WalletErrorResponse, 400>({
            error: walletErrorMessages.INSUFFICIENT_BALANCE,
            details: { code: WalletErrorCodeSchema.enum.INSUFFICIENT_BALANCE },
          }, 400)),
        Match.tag("WalletNotFound", () =>
          c.json<WalletsContracts.WalletErrorResponse, 404>({
            error: walletErrorMessages.WALLET_NOT_FOUND,
            details: { code: WalletErrorCodeSchema.enum.WALLET_NOT_FOUND },
          }, 404)),
        Match.orElse(() =>
          c.json<WalletsContracts.WalletErrorResponse, 404>({
            error: walletErrorMessages.WALLET_NOT_FOUND,
            details: { code: WalletErrorCodeSchema.enum.WALLET_NOT_FOUND },
          }, 404)),
      )),
      Match.exhaustive,
    );
  });

  app.openapi(wallets.createStripeTopupSession, async (c) => {
    const userId = c.var.currentUser?.userId ?? null;
    if (!userId) {
      return c.json({
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      }, 401);
    }

    const body = c.req.valid("json");
    if (!/^\d+$/.test(body.amount)) {
      return c.json<WalletsContracts.WalletErrorResponse, 400>({
        error: walletErrorMessages.TOPUP_INVALID_REQUEST,
        details: { code: WalletErrorCodeSchema.enum.TOPUP_INVALID_REQUEST },
      }, 400);
    }

    const amountMinor = BigInt(body.amount);
    if (amountMinor < 5000n) {
      return c.json<WalletsContracts.WalletErrorResponse, 400>({
        error: walletErrorMessages.TOPUP_INVALID_REQUEST,
        details: { code: WalletErrorCodeSchema.enum.TOPUP_INVALID_REQUEST },
      }, 400);
    }

    if (amountMinor > BigInt(Number.MAX_SAFE_INTEGER)) {
      return c.json<WalletsContracts.WalletErrorResponse, 400>({
        error: walletErrorMessages.TOPUP_INVALID_REQUEST,
        details: { code: WalletErrorCodeSchema.enum.TOPUP_INVALID_REQUEST },
      }, 400);
    }

    const eff = withLoggedCause(
      withStripeTopupDeps(createStripeCheckoutSessionUseCase({
        userId,
        amountMinor: Number(amountMinor),
        currency: body.currency,
        successUrl: body.successUrl,
        cancelUrl: body.cancelUrl,
      })),
      "POST /v1/wallets/me/topups/stripe/checkout",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));

    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        c.json<WalletsContracts.StripeTopupSessionResponse, 200>({
          data: {
            paymentAttemptId: right.paymentAttemptId,
            checkoutUrl: right.checkoutUrl,
          },
        }, 200)),
      Match.tag("Left", ({ left }) => Match.value(left).pipe(
        Match.tag("InvalidTopupRequest", () =>
          c.json<WalletsContracts.WalletErrorResponse, 400>({
            error: walletErrorMessages.TOPUP_INVALID_REQUEST,
            details: { code: WalletErrorCodeSchema.enum.TOPUP_INVALID_REQUEST },
          }, 400)),
        Match.tag("WalletNotFound", () =>
          c.json<WalletsContracts.WalletErrorResponse, 404>({
            error: walletErrorMessages.WALLET_NOT_FOUND,
            details: { code: WalletErrorCodeSchema.enum.WALLET_NOT_FOUND },
          }, 404)),
        Match.tag("TopupProviderError", () =>
          c.json<WalletsContracts.WalletErrorResponse, 502>({
            error: walletErrorMessages.TOPUP_PROVIDER_ERROR,
            details: { code: WalletErrorCodeSchema.enum.TOPUP_PROVIDER_ERROR },
          }, 502)),
        Match.orElse(() =>
          c.json<WalletsContracts.WalletErrorResponse, 500>({
            error: walletErrorMessages.TOPUP_INTERNAL_ERROR,
            details: { code: WalletErrorCodeSchema.enum.TOPUP_INTERNAL_ERROR },
          }, 500)),
      )),
      Match.exhaustive,
    );
  });

  app.openapi(wallets.createWalletWithdrawal, async (c) => {
    const userId = c.var.currentUser?.userId ?? null;
    if (!userId) {
      return c.json({
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      }, 401);
    }

    const body = c.req.valid("json");
    if (!/^\d+$/.test(body.amount)) {
      return c.json<WalletsContracts.WalletErrorResponse, 400>({
        error: walletErrorMessages.WITHDRAWAL_INVALID_REQUEST,
        details: { code: WalletErrorCodeSchema.enum.WITHDRAWAL_INVALID_REQUEST },
      }, 400);
    }

    const amount = BigInt(body.amount);
    if (amount <= 0n || amount > BigInt(Number.MAX_SAFE_INTEGER)) {
      return c.json<WalletsContracts.WalletErrorResponse, 400>({
        error: walletErrorMessages.WITHDRAWAL_INVALID_REQUEST,
        details: { code: WalletErrorCodeSchema.enum.WITHDRAWAL_INVALID_REQUEST },
      }, 400);
    }

    const eff = withLoggedCause(
      withWithdrawalDeps(
        requestWithdrawalUseCase({
          userId,
          amount,
          currency: body.currency,
          idempotencyKey: body.idempotencyKey && body.idempotencyKey.trim()
            ? body.idempotencyKey.trim()
            : undefined,
        }),
      ),
      "POST /v1/wallets/me/withdrawals",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));

    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        c.json<WalletsContracts.WalletWithdrawalResponse, 200>({
          data: mapWalletWithdrawal(right),
        }, 200)),
      Match.tag("Left", ({ left }) => Match.value(left).pipe(
        Match.tag("InvalidWithdrawalRequest", () =>
          c.json<WalletsContracts.WalletErrorResponse, 400>({
            error: walletErrorMessages.WITHDRAWAL_INVALID_REQUEST,
            details: { code: WalletErrorCodeSchema.enum.WITHDRAWAL_INVALID_REQUEST },
          }, 400)),
        Match.tag("InsufficientWalletBalance", () =>
          c.json<WalletsContracts.WalletErrorResponse, 400>({
            error: walletErrorMessages.INSUFFICIENT_BALANCE,
            details: { code: WalletErrorCodeSchema.enum.INSUFFICIENT_BALANCE },
          }, 400)),
        Match.tag("StripeConnectNotLinked", () =>
          c.json<WalletsContracts.WalletErrorResponse, 403>({
            error: walletErrorMessages.WITHDRAWAL_NOT_ENABLED,
            details: { code: WalletErrorCodeSchema.enum.WITHDRAWAL_NOT_ENABLED },
          }, 403)),
        Match.tag("StripePayoutsNotEnabled", () =>
          c.json<WalletsContracts.WalletErrorResponse, 403>({
            error: walletErrorMessages.WITHDRAWAL_NOT_ENABLED,
            details: { code: WalletErrorCodeSchema.enum.WITHDRAWAL_NOT_ENABLED },
          }, 403)),
        Match.tag("DuplicateWithdrawalRequest", () =>
          c.json<WalletsContracts.WalletErrorResponse, 409>({
            error: walletErrorMessages.WITHDRAWAL_DUPLICATE,
            details: { code: WalletErrorCodeSchema.enum.WITHDRAWAL_DUPLICATE },
          }, 409)),
        Match.orElse(() =>
          c.json<WalletsContracts.WalletErrorResponse, 500>({
            error: walletErrorMessages.WITHDRAWAL_INTERNAL_ERROR,
            details: { code: WalletErrorCodeSchema.enum.WITHDRAWAL_INTERNAL_ERROR },
          }, 500)),
      )),
      Match.exhaustive,
    );
  });
}
