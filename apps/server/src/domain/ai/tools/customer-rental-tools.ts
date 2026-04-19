import { tool } from "ai";
import { Effect, Either, Option } from "effect";
import { z } from "zod";

import { toContractRental } from "@/http/presenters/rentals.presenter";

import type { CreateCustomerToolsArgs } from "./customer-tool-helpers";

import {

  formatMinorVnd,
  getRentalStatusLabel,
  getReturnSlotStatusLabel,
  getStationByIdOrNull,
  RentalDetailInputSchema,
  rentalToolPage,
  resolveRentalReference,
} from "./customer-tool-helpers";
import {
  CurrentRentalSummaryToolOutputSchema,
  CurrentReturnSlotToolOutputSchema,
  RentalDetailToolOutputSchema,
} from "./customer-tool-schemas";

export function createCustomerRentalTools(args: CreateCustomerToolsArgs) {
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
            statusLabel: getRentalStatusLabel(rental.status),
            totalPriceDisplay: formatMinorVnd(rental.totalPrice),
          })),
        };
      },
    }),
    getCurrentReturnSlot: tool({
      description: "Get the user's active return-slot reservation for a rental. Prefer current screen context or the current active rental before raw ids.",
      inputSchema: RentalDetailInputSchema,
      outputSchema: CurrentReturnSlotToolOutputSchema,
      execute: async (input): Promise<z.infer<typeof CurrentReturnSlotToolOutputSchema>> => {
        const rental = await resolveRentalReference({
          context: args.context,
          rentalId: input.rentalId,
          reference: input.reference,
          rentalService: args.rentalService,
          userId: args.userId,
        });

        if (!rental) {
          return {
            reference: input.reference,
            hasActiveRental: false,
            rentalId: null,
            returnSlot: null,
          };
        }

        if (rental.status !== "RENTED") {
          return {
            reference: input.reference,
            hasActiveRental: false,
            rentalId: rental.id,
            returnSlot: null,
          };
        }

        const currentReturnSlot = await Effect.runPromise(
          args.rentalCommandService.getCurrentReturnSlot({
            rentalId: rental.id,
            userId: args.userId,
          }).pipe(Effect.either),
        );

        if (Either.isLeft(currentReturnSlot) || Option.isNone(currentReturnSlot.right)) {
          return {
            reference: input.reference,
            hasActiveRental: true,
            rentalId: rental.id,
            returnSlot: null,
          };
        }

        const returnSlot = currentReturnSlot.right.value;
        const station = await getStationByIdOrNull(args.stationQueryService, returnSlot.stationId);

        return {
          reference: input.reference,
          hasActiveRental: true,
          rentalId: rental.id,
          returnSlot: {
            id: returnSlot.id,
            rentalId: returnSlot.rentalId,
            userId: returnSlot.userId,
            stationId: returnSlot.stationId,
            reservedFrom: returnSlot.reservedFrom.toISOString(),
            status: returnSlot.status,
            statusLabel: getReturnSlotStatusLabel(returnSlot.status),
            createdAt: returnSlot.createdAt.toISOString(),
            updatedAt: returnSlot.updatedAt.toISOString(),
            station: station
              ? {
                  id: station.id,
                  name: station.name,
                  address: station.address,
                }
              : null,
          },
        };
      },
    }),
    getRentalDetail: tool({
      description: "Get one user-owned rental detail. Prefer current screen context or current or latest rental instead of raw ids unless an id is already available.",
      inputSchema: RentalDetailInputSchema,
      outputSchema: RentalDetailToolOutputSchema,
      execute: async (input): Promise<z.infer<typeof RentalDetailToolOutputSchema>> => {
        const rental = await resolveRentalReference({
          context: args.context,
          rentalId: input.rentalId,
          reference: input.reference,
          rentalService: args.rentalService,
          userId: args.userId,
        });

        if (!rental) {
          return { reference: input.reference, detail: null };
        }

        return {
          reference: input.reference,
          detail: {
            ...toContractRental(rental),
            statusLabel: getRentalStatusLabel(rental.status),
            totalPriceDisplay: formatMinorVnd(rental.totalPrice),
            depositAmountDisplay: formatMinorVnd(rental.depositAmount),
          },
        };
      },
    }),
  } as const;
}
