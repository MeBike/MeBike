import type { AiChatContext } from "@mebike/shared";

import { tool } from "ai";
import { Effect, Either, Option } from "effect";
import { z } from "zod";

import type { RentalService } from "@/domain/rentals";
import type { ReservationQueryService } from "@/domain/reservations";
import type { WalletService } from "@/domain/wallets/services/wallet.service";

import { toContractRental } from "@/http/presenters/rentals.presenter";
import {
  toContractReservation,
  toContractReservationExpanded,
} from "@/http/presenters/reservations.presenter";
import {
  toWalletDetail,
  toWalletTransactionDetail,
} from "@/http/presenters/wallets.presenter";

import {
  CurrentRentalSummaryToolOutputSchema,
  RentalDetailToolOutputSchema,
  ReservationDetailToolOutputSchema,
  ReservationSummaryToolOutputSchema,
  WalletSummaryToolOutputSchema,
  WalletTransactionDetailToolOutputSchema,
} from "./customer-tool-schemas";

type CreateCustomerToolsArgs = {
  readonly context: AiChatContext | null;
  readonly reservationQueryService: ReservationQueryService;
  readonly rentalService: RentalService;
  readonly userId: string;
  readonly walletService: WalletService;
};

export type CustomerToolName
  = | "getCurrentRentalSummary"
    | "getRentalDetail"
    | "getReservationSummary"
    | "getReservationDetail"
    | "getWalletSummary"
    | "getWalletTransactionDetail";

const RentalDetailInputSchema = z.object({
  rentalId: z.string().optional(),
  reference: z.enum(["context", "current", "latest", "id"]).default("context"),
});

const ReservationDetailInputSchema = z.object({
  reservationId: z.string().optional(),
  reference: z.enum(["context", "latestPendingOrActive", "id"]).default("context"),
});

const WalletTransactionDetailInputSchema = z.object({
  transactionId: z.string().optional(),
  reference: z.enum(["latest", "id"]).default("latest"),
});

const rentalToolPage = {
  page: 1,
  pageSize: 5,
  sortBy: "updatedAt",
  sortDir: "desc",
} as const;

function formatMinorVnd(value: bigint | number | null): string | null {
  if (value === null) {
    return null;
  }

  const numeric = typeof value === "bigint" ? Number(value) : value;
  return `${new Intl.NumberFormat("vi-VN").format(numeric)} VND`;
}

export function getActiveCustomerTools(
  screen: AiChatContext["screen"] | null | undefined,
): CustomerToolName[] {
  switch (screen) {
    case "rental":
      return ["getCurrentRentalSummary", "getRentalDetail"];
    case "reservation":
      return ["getReservationSummary", "getReservationDetail"];
    case "wallet":
      return ["getWalletSummary", "getWalletTransactionDetail"];
    default:
      return [
        "getCurrentRentalSummary",
        "getRentalDetail",
        "getReservationSummary",
        "getReservationDetail",
        "getWalletSummary",
        "getWalletTransactionDetail",
      ];
  }
}

export function createCustomerTools(args: CreateCustomerToolsArgs) {
  return {
    getCurrentRentalSummary: tool({
      description: "Get the current user's active rental summary and rental counts.",
      inputSchema: z.object({}),
      outputSchema: CurrentRentalSummaryToolOutputSchema,
      execute: async (): Promise<z.infer<typeof CurrentRentalSummaryToolOutputSchema>> => {
        const [rentals, counts] = await Promise.all([
          Effect.runPromise(
            args.rentalService.listMyCurrentRentals(args.userId, rentalToolPage),
          ),
          Effect.runPromise(
            args.rentalService.getMyRentalCounts(args.userId),
          ),
        ]);

        return {
          activeRentalCount: rentals.total,
          counts,
          rentals: rentals.items.map(rental => ({
            ...toContractRental(rental),
            totalPriceDisplay: formatMinorVnd(rental.totalPrice),
          })),
        };
      },
    }),
    getRentalDetail: tool({
      description: "Get one user-owned rental detail. Prefer current screen context or current or latest rental instead of raw ids unless an id is already available.",
      inputSchema: RentalDetailInputSchema,
      outputSchema: RentalDetailToolOutputSchema,
      execute: async (input): Promise<z.infer<typeof RentalDetailToolOutputSchema>> => {
        let rentalId = input.rentalId ?? null;

        if (!rentalId && input.reference === "context") {
          rentalId = args.context?.rentalId ?? null;
        }

        if (!rentalId && input.reference === "current") {
          const rentals = await Effect.runPromise(
            args.rentalService.listMyCurrentRentals(args.userId, {
              ...rentalToolPage,
              pageSize: 1,
            }),
          );
          rentalId = rentals.items[0]?.id ?? null;
        }

        if (!rentalId && input.reference === "latest") {
          const rentals = await Effect.runPromise(
            args.rentalService.listMyRentals(args.userId, {}, {
              ...rentalToolPage,
              pageSize: 1,
            }),
          );
          rentalId = rentals.items[0]?.id ?? null;
        }

        if (!rentalId) {
          return { reference: input.reference, detail: null };
        }

        const rental = await Effect.runPromise(
          args.rentalService.getMyRentalById(args.userId, rentalId),
        );

        return {
          reference: input.reference,
          detail: Option.isSome(rental)
            ? {
                ...toContractRental(rental.value),
                totalPriceDisplay: formatMinorVnd(rental.value.totalPrice),
                depositAmountDisplay: formatMinorVnd(rental.value.depositAmount),
              }
            : null,
        };
      },
    }),
    getReservationSummary: tool({
      description: "Get the current user's latest active or pending reservation plus recent reservation history.",
      inputSchema: z.object({}),
      outputSchema: ReservationSummaryToolOutputSchema,
      execute: async (): Promise<z.infer<typeof ReservationSummaryToolOutputSchema>> => {
        const [latestPendingOrActive, reservations] = await Promise.all([
          Effect.runPromise(
            args.reservationQueryService.getLatestPendingOrActiveForUser(args.userId),
          ),
          Effect.runPromise(
            args.reservationQueryService.listForUser(
              args.userId,
              {},
              rentalToolPage,
            ),
          ),
        ]);

        return {
          latestPendingOrActive: Option.isSome(latestPendingOrActive)
            ? {
                ...toContractReservation(latestPendingOrActive.value),
                prepaidDisplay: formatMinorVnd(Number(latestPendingOrActive.value.prepaid.toString())),
              }
            : null,
          reservations: reservations.items.map(reservation => ({
            ...toContractReservation(reservation),
            prepaidDisplay: formatMinorVnd(Number(reservation.prepaid.toString())),
          })),
        };
      },
    }),
    getReservationDetail: tool({
      description: "Get one user-owned reservation detail. Prefer current screen context or the latest pending or active reservation before raw ids.",
      inputSchema: ReservationDetailInputSchema,
      outputSchema: ReservationDetailToolOutputSchema,
      execute: async (input): Promise<z.infer<typeof ReservationDetailToolOutputSchema>> => {
        let reservationId = input.reservationId ?? null;

        if (!reservationId && input.reference === "context") {
          reservationId = args.context?.reservationId ?? null;
        }

        if (!reservationId && input.reference === "latestPendingOrActive") {
          const latest = await Effect.runPromise(
            args.reservationQueryService.getLatestPendingOrActiveForUser(args.userId),
          );
          reservationId = Option.isSome(latest) ? latest.value.id : null;
        }

        if (!reservationId) {
          return { reference: input.reference, detail: null };
        }

        const detail = await Effect.runPromise(
          args.reservationQueryService.getExpandedDetailById(reservationId),
        );

        return {
          reference: input.reference,
          detail: Option.isSome(detail) && detail.value.user.id === args.userId
            ? {
                ...toContractReservationExpanded(detail.value),
                prepaidDisplay: formatMinorVnd(Number(detail.value.prepaid.toString())),
              }
            : null,
        };
      },
    }),
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
            reservedBalanceDisplay: formatMinorVnd(wallet.reservedBalance),
          },
          recentTransactions: transactions.items.map(transaction => ({
            ...toWalletTransactionDetail(transaction),
            amountDisplay: formatMinorVnd(transaction.amount),
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
                feeDisplay: formatMinorVnd(transaction.right.value.fee),
              }
            : null,
        };
      },
    }),
  } as const;
}

export type CustomerToolSet = ReturnType<typeof createCustomerTools>;
