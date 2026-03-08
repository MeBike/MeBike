import type { RouteHandler } from "@hono/zod-openapi";
import type { RentalsContracts } from "@mebike/shared";

import { Effect } from "effect";

import { RentalRepository } from "@/domain/rentals";
import { withLoggedCause } from "@/domain/shared";
import { toContractStaffBikeSwapRequest } from "@/http/presenters/rentals.presenter";
import { toContractPage } from "@/http/shared/pagination";

import type { RentalsRoutes } from "./shared";

const staffListBikeSwapRequests: RouteHandler<
  RentalsRoutes["staffListBikeSwapRequests"]
> = async (c) => {
  const query = c.req.valid("query");

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const repo = yield* RentalRepository;
      return yield* repo.staffListBikeSwapRequests(
        {
          userId: query.userId,
          status: query.status,
        },
        {
          page: Number(query.page ?? 1),
          pageSize: Number(query.pageSize ?? 50),
          sortBy: (query.sortBy as any) ?? "createdAt",
          sortDir: query.sortDir ?? "desc",
        },
      );
    }),
    "GET /v1/staff/bike-swap-requests",
  );

  const value = await c.var.runPromise(eff);
  const response: RentalsContracts.BikeSwapRequestListResponse = {
    data: value.items.map(toContractStaffBikeSwapRequest),
    pagination: toContractPage(value),
  };
  return c.json<RentalsContracts.BikeSwapRequestListResponse, 200>(
    response,
    200,
  );
};

export const RentalStaffController = {
  staffListBikeSwapRequests,
} as const;
