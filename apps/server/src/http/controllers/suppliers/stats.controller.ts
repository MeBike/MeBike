import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match } from "effect";

import {
  getAllSupplierStatsUseCase,
  getSupplierStatsUseCase,
} from "@/domain/suppliers";

import type { SupplierErrorResponse, SuppliersRoutes, SupplierStats } from "./shared";

import {
  SupplierErrorCodeSchema,
  supplierErrorMessages,

} from "./shared";

const getAllSupplierStats: RouteHandler<SuppliersRoutes["getAllSupplierStats"]> = async (c) => {
  const eff = getAllSupplierStatsUseCase();
  const rows = await c.var.runPromise(eff);
  return c.json<{ data: SupplierStats[] }, 200>({ data: Array.from(rows) }, 200);
};

const getSupplierStats: RouteHandler<SuppliersRoutes["getSupplierStats"]> = async (c) => {
  const { supplierId } = c.req.valid("param");

  const eff = getSupplierStatsUseCase(supplierId);

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<SupplierStats, 200>(right, 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("SupplierNotFound", () =>
          c.json<SupplierErrorResponse, 404>(
            {
              error: supplierErrorMessages[SupplierErrorCodeSchema.enum.SUPPLIER_NOT_FOUND],
              details: {
                code: SupplierErrorCodeSchema.enum.SUPPLIER_NOT_FOUND,
                supplierId,
              },
            },
            404,
          )),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

export const SupplierStatsController = {
  getAllSupplierStats,
  getSupplierStats,
} as const;
