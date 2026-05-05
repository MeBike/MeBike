import type { z } from "zod";

import { tool } from "ai";
import { Effect, Either, Option } from "effect";

import type { RentalQueryToolsArgs } from "../shared/customer-tool-args";

import {
  QueryRentalsInputSchema,
  RentalBillingDetailInputSchema,
  RentalDetailInputSchema,
  RentalDetailsInputSchema,
  rentalToolPage,
} from "../shared/customer-tool-inputs";
import { resolveRentalReference } from "../shared/customer-tool-lookups";
import {
  loadStationSummaryMap,
  toRentalBillingDetailItem,
  toRentalDetailItem,
  toRentalSummaryItem,
} from "./presenter";
import {
  QueryRentalsToolOutputSchema,
  RentalBillingDetailToolOutputSchema,
  RentalDetailsToolOutputSchema,
  RentalDetailToolOutputSchema,
} from "./schemas";

type RentalBillingDetailToolError = NonNullable<z.infer<typeof RentalBillingDetailToolOutputSchema>["error"]>;

function failRentalBillingDetail(
  code: RentalBillingDetailToolError["code"],
  userMessage: string,
  status: RentalBillingDetailToolError["status"] = null,
): RentalBillingDetailToolError {
  return {
    code,
    status,
    userMessage,
  };
}

export function createCustomerRentalQueryTools(args: RentalQueryToolsArgs) {
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
      description: "Get one user-owned rental detail after you already know which rental to inspect. Prefer the current rental, the latest rental, or a rental already identified by the rental query tool instead of guessing.",
      inputSchema: RentalDetailInputSchema,
      outputSchema: RentalDetailToolOutputSchema,
      execute: async (input): Promise<z.infer<typeof RentalDetailToolOutputSchema>> => {
        const rental = await resolveRentalReference({
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
    getRentalBillingDetail: tool({
      description: "Get finalized billing detail for one completed rental when the user asks about final price, coupon application, discount breakdown, or why a finished rental cost that amount. Prefer latestCompleted unless that exact completed rental is already known from prior tool results.",
      inputSchema: RentalBillingDetailInputSchema,
      outputSchema: RentalBillingDetailToolOutputSchema,
      execute: async (input): Promise<z.infer<typeof RentalBillingDetailToolOutputSchema>> => {
        if (input.reference === "id" && !input.rentalId) {
          return {
            reference: input.reference,
            rentalId: null,
            detail: null,
            error: failRentalBillingDetail(
              "MISSING_RENTAL_ID",
              "Mình chưa xác định được chuyến thuê cần kiểm tra chi tiết hóa đơn này.",
            ),
          };
        }

        let rentalId = input.rentalId ?? null;

        if (!rentalId && input.reference === "latestCompleted") {
          const rentals = await Effect.runPromise(
            args.rentalService.listMyRentals(args.userId, { status: "COMPLETED" }, {
              ...rentalToolPage,
              pageSize: 1,
            }),
          );

          rentalId = rentals.items[0]?.id ?? null;
        }

        if (!rentalId) {
          return {
            reference: input.reference,
            rentalId: null,
            detail: null,
            error: failRentalBillingDetail(
              "NO_COMPLETED_RENTAL",
              "Mình chưa thấy chuyến thuê đã hoàn thành nào để kiểm tra hóa đơn cuối cùng.",
            ),
          };
        }

        const detail = await Effect.runPromise(
          args.rentalBillingDetailService.getForUser({
            rentalId,
            userId: args.userId,
          }).pipe(Effect.either),
        );

        if (Either.isRight(detail)) {
          return {
            reference: input.reference,
            rentalId,
            detail: toRentalBillingDetailItem(detail.right),
            error: null,
          };
        }

        if (detail.left._tag === "RentalNotFound") {
          return {
            reference: input.reference,
            rentalId,
            detail: null,
            error: failRentalBillingDetail(
              "RENTAL_NOT_FOUND",
              "Mình không tìm thấy chuyến thuê này trong lịch sử của bạn để kiểm tra hóa đơn.",
            ),
          };
        }

        if (detail.left._tag === "BillingDetailRequiresCompletedRental") {
          return {
            reference: input.reference,
            rentalId,
            detail: null,
            error: failRentalBillingDetail(
              "BILLING_DETAIL_REQUIRES_COMPLETED_RENTAL",
              "Chi tiết hóa đơn cuối chỉ có sau khi chuyến thuê đã hoàn thành.",
              detail.left.status,
            ),
          };
        }

        return {
          reference: input.reference,
          rentalId,
          detail: null,
          error: failRentalBillingDetail(
            "BILLING_DETAIL_NOT_READY",
            "Chuyến thuê này đã hoàn thành nhưng chi tiết hóa đơn cuối đang chưa sẵn sàng.",
            detail.left.status,
          ),
        };
      },
    }),
    getRentalDetails: tool({
      description: "Get details for multiple user-owned rentals at once when those rentals are already identified by the rental query tool. Use this instead of calling getRentalDetail many times. Never guess the target rentals.",
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
