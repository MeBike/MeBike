import { tool } from "ai";
import { Effect, Option } from "effect";
import { z } from "zod";

import {
  toContractReservation,
  toContractReservationExpanded,
} from "@/http/presenters/reservations.presenter";

import type { CreateCustomerToolsArgs } from "./customer-tool-helpers";

import {
  formatLocalDateTime,
  formatMinorVnd,
  getReservationStatusLabel,
  rentalToolPage,
  ReservationDetailInputSchema,
} from "./customer-tool-helpers";
import {
  ReservationDetailToolOutputSchema,
  ReservationSummaryToolOutputSchema,
} from "./customer-tool-schemas";

export function createCustomerReservationTools(args: CreateCustomerToolsArgs) {
  return {
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
                createdAtDisplay: formatLocalDateTime(latestPendingOrActive.value.createdAt),
                endTimeDisplay: formatLocalDateTime(latestPendingOrActive.value.endTime),
                prepaidDisplay: formatMinorVnd(Number(latestPendingOrActive.value.prepaid.toString())),
                startTimeDisplay: formatLocalDateTime(latestPendingOrActive.value.startTime),
                statusLabel: getReservationStatusLabel(latestPendingOrActive.value.status),
                updatedAtDisplay: formatLocalDateTime(latestPendingOrActive.value.updatedAt),
              }
            : null,
          reservations: reservations.items.map(reservation => ({
            ...toContractReservation(reservation),
            createdAtDisplay: formatLocalDateTime(reservation.createdAt),
            endTimeDisplay: formatLocalDateTime(reservation.endTime),
            prepaidDisplay: formatMinorVnd(Number(reservation.prepaid.toString())),
            startTimeDisplay: formatLocalDateTime(reservation.startTime),
            statusLabel: getReservationStatusLabel(reservation.status),
            updatedAtDisplay: formatLocalDateTime(reservation.updatedAt),
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
                createdAtDisplay: formatLocalDateTime(detail.value.createdAt),
                endTimeDisplay: formatLocalDateTime(detail.value.endTime),
                prepaidDisplay: formatMinorVnd(Number(detail.value.prepaid.toString())),
                startTimeDisplay: formatLocalDateTime(detail.value.startTime),
                statusLabel: getReservationStatusLabel(detail.value.status),
                updatedAtDisplay: formatLocalDateTime(detail.value.updatedAt),
              }
            : null,
        };
      },
    }),
  } as const;
}
