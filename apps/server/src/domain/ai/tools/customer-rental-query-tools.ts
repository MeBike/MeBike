import type { z } from "zod";

import { tool } from "ai";
import { Effect, Option } from "effect";

import type { CreateCustomerToolsArgs } from "./customer-tool-helpers";

import {
  loadStationSummaryMap,
  toRentalDetailItem,
  toRentalSummaryItem,
} from "./customer-rental-ai-presenter";
import {
  QueryRentalsInputSchema,
  RentalDetailInputSchema,
  RentalDetailsInputSchema,
  rentalToolPage,
  resolveRentalReference,
} from "./customer-tool-helpers";
import {
  QueryRentalsToolOutputSchema,
  RentalDetailsToolOutputSchema,
  RentalDetailToolOutputSchema,
} from "./customer-tool-schemas";

export function createCustomerRentalQueryTools(args: CreateCustomerToolsArgs) {
  return {
    queryRentals: tool({
      description: "Query the current user's rental overview or recent rental history. Use this for active rentals, recent rentals, recent completed rentals, and rental counts. Use getRentalDetail only after you already know which single rental to inspect.",
      inputSchema: QueryRentalsInputSchema,
      outputSchema: QueryRentalsToolOutputSchema,
      execute: async (input: z.infer<typeof QueryRentalsInputSchema>): Promise<z.infer<typeof QueryRentalsToolOutputSchema>> => {
        const listPage = {
          ...rentalToolPage,
          pageSize: input.limit,
        } as const;

        const countsPromise = input.includeCounts
          ? Effect.runPromise(args.rentalService.getMyRentalCounts(args.userId))
          : Promise.resolve(null);

        const rentalsPromise = input.scope === "current"
          ? Effect.runPromise(
              args.rentalService.listMyCurrentRentals(args.userId, listPage),
            )
          : Effect.runPromise(
              args.rentalService.listMyRentals(
                args.userId,
                input.status ? { status: input.status } : {},
                listPage,
              ),
            );

        const [counts, rentals] = await Promise.all([countsPromise, rentalsPromise]);
        const stationMap = await loadStationSummaryMap(args, rentals.items);

        return {
          counts,
          limit: input.limit,
          rentals: rentals.items.map(rental => toRentalSummaryItem(rental, stationMap)),
          scope: input.scope,
          status: input.scope === "current" ? "RENTED" : input.status ?? null,
          totalMatching: rentals.total,
        };
      },
    }),
    getRentalDetail: tool({
      description: "Get one user-owned rental detail after you already know which rental to inspect. Prefer current screen context, current rental, latest rental, or an id returned by the rental query tool instead of guessing raw ids.",
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

        const stationMap = await loadStationSummaryMap(args, [rental]);

        return {
          reference: input.reference,
          detail: toRentalDetailItem(rental, stationMap),
        };
      },
    }),
    getRentalDetails: tool({
      description: "Get details for multiple user-owned rentals at once when you already have their ids from the rental query tool. Use this instead of calling getRentalDetail many times. Never guess raw ids.",
      inputSchema: RentalDetailsInputSchema,
      outputSchema: RentalDetailsToolOutputSchema,
      execute: async (input: z.infer<typeof RentalDetailsInputSchema>): Promise<z.infer<typeof RentalDetailsToolOutputSchema>> => {
        const rentals = await Promise.all(
          input.rentalIds.map(async (rentalId) => {
            const rental = await Effect.runPromise(
              args.rentalService.getMyRentalById(args.userId, rentalId),
            );

            return Option.isSome(rental)
              ? {
                  rental: rental.value,
                  rentalId,
                }
              : {
                  rental: null,
                  rentalId,
                };
          }),
        );

        const resolvedRentals = rentals.flatMap(item => item.rental ? [item.rental] : []);
        const stationMap = await loadStationSummaryMap(args, resolvedRentals);

        return {
          details: rentals.flatMap(item => item.rental ? [toRentalDetailItem(item.rental, stationMap)] : []),
          missingRentalIds: rentals.flatMap(item => item.rental ? [] : [item.rentalId]),
          requestedCount: input.rentalIds.length,
          returnedCount: resolvedRentals.length,
        };
      },
    }),
  } as const;
}
