import { serverRoutes, UnauthorizedErrorCodeSchema, unauthorizedErrorMessages, WalletsContracts } from "@mebike/shared";
import { Effect, Match } from "effect";

import { withLoggedCause } from "@/domain/shared";
import { toPrismaDecimal } from "@/domain/shared/decimal";
import {
  creditWalletUseCase,
  debitWalletUseCase,
  getRequiredWalletByUserIdUseCase,
  listWalletTransactionsForUserUseCase,
} from "@/domain/wallets";
import { withWalletDeps } from "@/http/shared/providers";

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
    const amount = toPrismaDecimal(body.amount);
    const fee = body.fee !== undefined ? toPrismaDecimal(body.fee) : undefined;

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
    const amount = toPrismaDecimal(body.amount);

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
}
