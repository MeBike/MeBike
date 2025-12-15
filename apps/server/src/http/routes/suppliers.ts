import { serverRoutes, SuppliersContracts } from "@mebike/shared";
import { Effect, Match } from "effect";

import {
  createSupplierUseCase,
  getAllSupplierStatsUseCase,
  getSupplierDetailsUseCase,
  getSupplierStatsUseCase,
  listSuppliersUseCase,
  updateSupplierStatusUseCase,
  updateSupplierUseCase,
} from "@/domain/suppliers";
import { withSupplierDeps } from "@/http/shared/providers";

import { Prisma as PrismaTypes } from "../../../generated/prisma/client";

type SupplierSummary = SuppliersContracts.SupplierSummary;
type SupplierErrorResponse = SuppliersContracts.SupplierErrorResponse;
type SupplierStats = SuppliersContracts.SupplierBikeStats;

const { SupplierErrorCodeSchema, supplierErrorMessages } = SuppliersContracts;

export function registerSupplierRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const suppliers = serverRoutes.suppliers;

  const toSupplierSummary = (row: import("@/domain/suppliers").SupplierRow): SupplierSummary => ({
    id: row.id,
    name: row.name,
    address: row.address,
    phoneNumber: row.phoneNumber,
    contractFee: row.contractFee ? Number(row.contractFee) : null,
    status: row.status,
    updatedAt:
      row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  });

  app.openapi(suppliers.listSuppliers, async (c) => {
    const query = c.req.valid("query");

    const eff = listSuppliersUseCase({
      filter: {
        name: query.name,
        status: query.status,
      },
      pageReq: {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 50,
        sortBy: query.sortBy ?? "name",
        sortDir: query.sortDir ?? "asc",
      },
    });

    const result = await Effect.runPromise(withSupplierDeps(eff));

    return c.json<SuppliersContracts.SupplierListResponse, 200>(
      {
        data: result.items.map(toSupplierSummary),
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        },
      },
      200,
    );
  });

  app.openapi(suppliers.getSupplier, async (c) => {
    const { supplierId } = c.req.valid("param");

    const eff = getSupplierDetailsUseCase(supplierId);

    const result = await Effect.runPromise(
      withSupplierDeps(eff).pipe(Effect.either),
    );

    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        c.json<SupplierSummary, 200>(toSupplierSummary(right), 200)),
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
  });

  app.openapi(suppliers.createSupplier, async (c) => {
    const body = c.req.valid("json");

    const eff = createSupplierUseCase({
      name: body.name,
      address: body.address,
      phoneNumber: body.phoneNumber,
      contractFee:
        body.contractFee === undefined
          ? undefined
          : new PrismaTypes.Decimal(body.contractFee),
      status: body.status,
    });

    const result = await Effect.runPromise(
      withSupplierDeps(eff).pipe(Effect.either),
    );

    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        c.json<SupplierSummary, 201>(toSupplierSummary(right), 201)),
      Match.tag("Left", ({ left }) =>
        Match.value(left).pipe(
          Match.tag("DuplicateSupplierName", () =>
            c.json<SupplierErrorResponse, 400>(
              {
                error: supplierErrorMessages[SupplierErrorCodeSchema.enum.DUPLICATE_SUPPLIER_NAME],
                details: {
                  code: SupplierErrorCodeSchema.enum.DUPLICATE_SUPPLIER_NAME,
                  name: body.name,
                },
              },
              400,
            )),
          Match.orElse(() => {
            throw left;
          }),
        )),
      Match.exhaustive,
    );
  });

  app.openapi(suppliers.updateSupplier, async (c) => {
    const { supplierId } = c.req.valid("param");
    const body = c.req.valid("json");

    const eff = updateSupplierUseCase(supplierId, {
      name: body.name,
      address: body.address,
      phoneNumber: body.phoneNumber,
      contractFee:
        body.contractFee === undefined
          ? undefined
          : new PrismaTypes.Decimal(body.contractFee),
      status: body.status,
    });

    const result = await Effect.runPromise(
      withSupplierDeps(eff).pipe(Effect.either),
    );

    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        c.json<SupplierSummary, 200>(toSupplierSummary(right), 200)),
      Match.tag("Left", ({ left }) =>
        Match.value(left).pipe(
          Match.tag("DuplicateSupplierName", () =>
            c.json<SupplierErrorResponse, 400>(
              {
                error: supplierErrorMessages[SupplierErrorCodeSchema.enum.DUPLICATE_SUPPLIER_NAME],
                details: {
                  code: SupplierErrorCodeSchema.enum.DUPLICATE_SUPPLIER_NAME,
                  name: body.name ?? "",
                },
              },
              400,
            )),
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
  });

  app.openapi(suppliers.updateSupplierStatus, async (c) => {
    const { supplierId } = c.req.valid("param");
    const body = c.req.valid("json");

    const eff = updateSupplierStatusUseCase(supplierId, body.status);

    const result = await Effect.runPromise(
      withSupplierDeps(eff).pipe(Effect.either),
    );

    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        c.json<SupplierSummary, 200>(toSupplierSummary(right), 200)),
      Match.tag("Left", ({ left }) =>
        Match.value(left).pipe(
          Match.tag("InvalidSupplierStatus", () =>
            c.json<SupplierErrorResponse, 400>(
              {
                error: supplierErrorMessages[SupplierErrorCodeSchema.enum.INVALID_SUPPLIER_STATUS],
                details: {
                  code: SupplierErrorCodeSchema.enum.INVALID_SUPPLIER_STATUS,
                  status: body.status,
                },
              },
              400,
            )),
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
  });

  app.openapi(suppliers.getAllSupplierStats, async (c) => {
    const eff = getAllSupplierStatsUseCase();
    const rows = await Effect.runPromise(withSupplierDeps(eff));
    return c.json<{ data: SupplierStats[] }, 200>(
      { data: Array.from(rows) },
      200,
    );
  });

  app.openapi(suppliers.getSupplierStats, async (c) => {
    const { supplierId } = c.req.valid("param");

    const eff = getSupplierStatsUseCase(supplierId);

    const result = await Effect.runPromise(
      withSupplierDeps(eff).pipe(Effect.either),
    );

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
  });
}
