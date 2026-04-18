import type { AiChatContext } from "@mebike/shared";

import { tool } from "ai";
import { Effect, Either, Option } from "effect";
import { z } from "zod";

import type { RentalService } from "@/domain/rentals/services/rental.service";
import type { ReservationQueryService } from "@/domain/reservations";
import type { WalletService } from "@/domain/wallets/services/wallet.service";

type CreateCustomerToolsArgs = {
  readonly reservationQueryService: ReservationQueryService;
  readonly rentalService: RentalService;
  readonly userId: string;
  readonly walletService: WalletService;
};

export type CustomerToolName
  = | "getCurrentRentalSummary"
    | "getReservationSummary"
    | "getWalletSummary";

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
      return ["getCurrentRentalSummary"];
    case "reservation":
      return ["getReservationSummary"];
    case "wallet":
      return ["getWalletSummary"];
    default:
      return [
        "getCurrentRentalSummary",
        "getReservationSummary",
        "getWalletSummary",
      ];
  }
}

export function createCustomerTools(args: CreateCustomerToolsArgs) {
  return {
    getCurrentRentalSummary: tool({
      description: "Get the current user's active rental summary and rental counts.",
      inputSchema: z.object({}),
      execute: async () => {
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
            id: rental.id,
            bikeId: rental.bikeId,
            bikeNumber: rental.bikeNumber,
            status: rental.status,
            startStationId: rental.startStationId,
            endStationId: rental.endStationId,
            startTime: rental.startTime.toISOString(),
            endTime: rental.endTime?.toISOString() ?? null,
            durationMinutes: rental.durationMinutes,
            totalPriceMinor: rental.totalPrice?.toString() ?? null,
            totalPriceDisplay: formatMinorVnd(rental.totalPrice),
          })),
        };
      },
    }),
    getReservationSummary: tool({
      description: "Get the current user's latest active or pending reservation plus recent reservation history.",
      inputSchema: z.object({}),
      execute: async () => {
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
                id: latestPendingOrActive.value.id,
                bikeId: latestPendingOrActive.value.bikeId,
                bikeNumber: latestPendingOrActive.value.bikeNumber,
                stationId: latestPendingOrActive.value.stationId,
                reservationOption: latestPendingOrActive.value.reservationOption,
                status: latestPendingOrActive.value.status,
                startTime: latestPendingOrActive.value.startTime.toISOString(),
                endTime: latestPendingOrActive.value.endTime?.toISOString() ?? null,
                prepaidMinor: latestPendingOrActive.value.prepaid.toString(),
              }
            : null,
          reservations: reservations.items.map(reservation => ({
            id: reservation.id,
            bikeId: reservation.bikeId,
            bikeNumber: reservation.bikeNumber,
            stationId: reservation.stationId,
            reservationOption: reservation.reservationOption,
            status: reservation.status,
            startTime: reservation.startTime.toISOString(),
            endTime: reservation.endTime?.toISOString() ?? null,
            prepaidMinor: reservation.prepaid.toString(),
          })),
        };
      },
    }),
    getWalletSummary: tool({
      description: "Get the current user's wallet summary and recent wallet transactions.",
      inputSchema: z.object({}),
      execute: async () => {
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
            id: wallet.id,
            status: wallet.status,
            balanceMinor: wallet.balance.toString(),
            balanceDisplay: formatMinorVnd(wallet.balance),
            reservedBalanceMinor: wallet.reservedBalance.toString(),
            reservedBalanceDisplay: formatMinorVnd(wallet.reservedBalance),
          },
          recentTransactions: transactions.items.map(transaction => ({
            id: transaction.id,
            type: transaction.type,
            status: transaction.status,
            amountMinor: transaction.amount.toString(),
            amountDisplay: formatMinorVnd(transaction.amount),
            feeMinor: transaction.fee.toString(),
            feeDisplay: formatMinorVnd(transaction.fee),
            description: transaction.description,
            createdAt: transaction.createdAt.toISOString(),
          })),
        };
      },
    }),
  } as const;
}
