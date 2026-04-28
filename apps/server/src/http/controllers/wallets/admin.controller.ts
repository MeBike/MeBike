import type { RouteHandler } from "@hono/zod-openapi";
import type { WalletsContracts } from "@mebike/shared";

import { Effect, Match } from "effect";

import { withLoggedCause } from "@/domain/shared";
import { WalletQueryServiceTag } from "@/domain/wallets/services/queries/wallet-query.service";
import {
  toWalletDetail,
  toWalletTransactionDetail,
  toWalletTransactionUser,
} from "@/http/presenters/wallets.presenter";
import { toContractPage } from "@/http/shared/pagination";

import type { WalletsRoutes } from "./shared";

import { WalletErrorCodeSchema, walletErrorMessages } from "./shared";

const adminGetUserWallet: RouteHandler<
  WalletsRoutes["adminGetUserWallet"]
> = async (c) => {
  const { userId } = c.req.valid("param");

  const eff = withLoggedCause(
    Effect.flatMap(WalletQueryServiceTag, service => service.getByUserId(userId)),
    "GET /v1/admin/users/{userId}/wallet",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<WalletsContracts.GetMyWalletResponse, 200>(toWalletDetail(right), 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("WalletNotFound", () =>
          c.json<WalletsContracts.WalletErrorResponse, 404>({
            error: walletErrorMessages.WALLET_NOT_FOUND,
            details: { code: WalletErrorCodeSchema.enum.WALLET_NOT_FOUND },
          }, 404)),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

const adminListUserWalletTransactions: RouteHandler<
  WalletsRoutes["adminListUserWalletTransactions"]
> = async (c) => {
  const { userId } = c.req.valid("param");
  const query = c.req.valid("query");
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 50;
  const status = query.status;

  const eff = withLoggedCause(
    Effect.flatMap(WalletQueryServiceTag, service =>
      service.adminListTransactionsForUser({ userId, pageReq: { page, pageSize }, status })),
    "GET /v1/admin/users/{userId}/wallet/transactions",
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<WalletsContracts.AdminListUserWalletTransactionsResponse, 200>({
        data: {
          user: toWalletTransactionUser(right.user),
          items: right.transactions.items.map(toWalletTransactionDetail),
        },
        pagination: toContractPage(right.transactions),
      }, 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("WalletNotFound", () =>
          c.json<WalletsContracts.WalletErrorResponse, 404>({
            error: walletErrorMessages.WALLET_NOT_FOUND,
            details: { code: WalletErrorCodeSchema.enum.WALLET_NOT_FOUND },
          }, 404)),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

export const WalletAdminController = {
  adminGetUserWallet,
  adminListUserWalletTransactions,
} as const;
