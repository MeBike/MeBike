import { tool } from "ai";
import { Effect, Option } from "effect";
import { z } from "zod";

import {
  toContractReservation,
  toContractReservationExpanded,
} from "@/http/presenters/reservations.presenter";

import type { CreateCustomerToolsArgs } from "./customer-tool-helpers";

import {

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
                prepaidDisplay: formatMinorVnd(Number(latestPendingOrActive.value.prepaid.toString())),
                statusLabel: getReservationStatusLabel(latestPendingOrActive.value.status),
              }
            : null,
          reservations: reservations.items.map(reservation => ({
            ...toContractReservation(reservation),
            prepaidDisplay: formatMinorVnd(Number(reservation.prepaid.toString())),
            statusLabel: getReservationStatusLabel(reservation.status),
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
                statusLabel: getReservationStatusLabel(detail.value.status),
              }
            : null,
        };
      },
    }),
  } as const;
}
