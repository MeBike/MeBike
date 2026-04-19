import { tool } from "ai";
import { Effect, Either, Option } from "effect";
import { z } from "zod";

import {
  toWalletDetail,
  toWalletTransactionDetail,
} from "@/http/presenters/wallets.presenter";

import type { CreateCustomerToolsArgs } from "./customer-tool-helpers";

import {
  formatLocalDateTime,
  formatMinorVnd,
  WalletTransactionDetailInputSchema,
} from "./customer-tool-helpers";
import {
  WalletSummaryToolOutputSchema,
  WalletTransactionDetailToolOutputSchema,
} from "./customer-tool-schemas";

export function createCustomerWalletTools(args: CreateCustomerToolsArgs) {
  return {
    getWalletSummary: tool({
      description: "Get the current user's wallet summary and recent wallet transactions.",
      inputSchema: z.object({}),
      outputSchema: WalletSummaryToolOutputSchema,
      execute: async (): Promise<z.infer<typeof WalletSummaryToolOutputSchema>> => {
        const walletResult = await Effect.runPromise(
          args.walletService.getByUserId(args.userId).pipe(Effect.either),
        );

        if (Either.isLeft(walletResult)) {
          return {
            hasWallet: false,
            wallet: null,
            recentTransactions: [],
          };
        }

        const wallet = walletResult.right;
        const transactions = await Effect.runPromise(
          args.walletService.listTransactionsForUser({
            userId: args.userId,
            pageReq: {
              page: 1,
              pageSize: 5,
              sortBy: "createdAt",
              sortDir: "desc",
            },
          }),
        );

        return {
          hasWallet: true,
          wallet: {
            ...toWalletDetail(wallet),
            balanceDisplay: formatMinorVnd(wallet.balance),
            availableBalanceDisplay: formatMinorVnd(wallet.balance - wallet.reservedBalance),
            createdAtDisplay: formatLocalDateTime(wallet.createdAt),
            reservedBalanceDisplay: formatMinorVnd(wallet.reservedBalance),
            updatedAtDisplay: formatLocalDateTime(wallet.updatedAt),
          },
          recentTransactions: transactions.items.map(transaction => ({
            ...toWalletTransactionDetail(transaction),
            amountDisplay: formatMinorVnd(transaction.amount),
            createdAtDisplay: formatLocalDateTime(transaction.createdAt),
            feeDisplay: formatMinorVnd(transaction.fee),
          })),
        };
      },
    }),
    getWalletTransactionDetail: tool({
      description: "Get one wallet transaction detail. Prefer the latest transaction unless a known transaction id is already available from prior results.",
      inputSchema: WalletTransactionDetailInputSchema,
      outputSchema: WalletTransactionDetailToolOutputSchema,
      execute: async (input): Promise<z.infer<typeof WalletTransactionDetailToolOutputSchema>> => {
        let transactionId = input.transactionId ?? null;

        if (!transactionId && input.reference === "latest") {
          const transactions = await Effect.runPromise(
            args.walletService.listTransactionsForUser({
              userId: args.userId,
              pageReq: {
                page: 1,
                pageSize: 1,
                sortBy: "createdAt",
                sortDir: "desc",
              },
            }).pipe(Effect.either),
          );

          if (Either.isRight(transactions)) {
            transactionId = transactions.right.items[0]?.id ?? null;
          }
        }

        if (!transactionId) {
          return { reference: input.reference, detail: null };
        }

        const transaction = await Effect.runPromise(
          args.walletService.getTransactionByIdForUser({
            userId: args.userId,
            transactionId,
          }).pipe(Effect.either),
        );

        return {
          reference: input.reference,
          detail: Either.isRight(transaction) && Option.isSome(transaction.right)
            ? {
                ...toWalletTransactionDetail(transaction.right.value),
                amountDisplay: formatMinorVnd(transaction.right.value.amount),
                createdAtDisplay: formatLocalDateTime(transaction.right.value.createdAt),
                feeDisplay: formatMinorVnd(transaction.right.value.fee),
              }
            : null,
        };
      },
    }),
  } as const;
}
