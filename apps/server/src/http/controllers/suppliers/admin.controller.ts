import type { RouteHandler } from "@hono/zod-openapi";

import { Effect, Match } from "effect";

import { SupplierServiceTag } from "@/domain/suppliers/services/supplier.service";
import { Prisma as PrismaTypes } from "generated/prisma/client";

import type { SupplierErrorResponse, SuppliersRoutes, SupplierSummary } from "./shared";

import {
  SupplierErrorCodeSchema,
  supplierErrorMessages,

  toSupplierSummary,
} from "./shared";

const listSuppliers: RouteHandler<SuppliersRoutes["listSuppliers"]> = async (c) => {
  const query = c.req.valid("query");

  const eff = Effect.flatMap(SupplierServiceTag, svc =>
    svc.listSuppliers({
      name: query.name,
      status: query.status,
    }, {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? 50,
      sortBy: query.sortBy ?? "name",
      sortDir: query.sortDir ?? "asc",
    }));

  const result = await c.var.runPromise(eff);

  return c.json(
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
};

const getSupplier: RouteHandler<SuppliersRoutes["getSupplier"]> = async (c) => {
  const { supplierId } = c.req.valid("param");

  const eff = Effect.flatMap(SupplierServiceTag, svc => svc.getSupplierById(supplierId));

  const result = await c.var.runPromise(eff.pipe(Effect.either));

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
};

const createSupplier: RouteHandler<SuppliersRoutes["createSupplier"]> = async (c) => {
  const body = c.req.valid("json");

  const eff = Effect.flatMap(SupplierServiceTag, svc => svc.createSupplier({
    name: body.name,
    address: body.address,
    phoneNumber: body.phoneNumber,
    contractFee: body.contractFee === undefined
      ? undefined
      : new PrismaTypes.Decimal(body.contractFee),
    status: body.status,
  }));

  const result = await c.var.runPromise(eff.pipe(Effect.either));

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
};

const updateSupplier: RouteHandler<SuppliersRoutes["updateSupplier"]> = async (c) => {
  const { supplierId } = c.req.valid("param");
  const body = c.req.valid("json");

  const eff = Effect.flatMap(SupplierServiceTag, svc => svc.updateSupplier(supplierId, {
    name: body.name,
    address: body.address,
    phoneNumber: body.phoneNumber,
    contractFee: body.contractFee === undefined
      ? undefined
      : new PrismaTypes.Decimal(body.contractFee),
    status: body.status,
  }));

  const result = await c.var.runPromise(eff.pipe(Effect.either));

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
};

const updateSupplierStatus: RouteHandler<SuppliersRoutes["updateSupplierStatus"]> = async (c) => {
  const { supplierId } = c.req.valid("param");
  const body = c.req.valid("json");

  const eff = Effect.flatMap(SupplierServiceTag, svc => svc.updateSupplierStatus(supplierId, body.status));

  const result = await c.var.runPromise(eff.pipe(Effect.either));

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
};

const deleteSupplier: RouteHandler<SuppliersRoutes["deleteSupplier"]> = async (c) => {
  const { supplierId } = c.req.valid("param");

  const eff = Effect.flatMap(SupplierServiceTag, svc => svc.updateSupplierStatus(supplierId, "TERMINATED"));

  const result = await c.var.runPromise(eff.pipe(Effect.either));

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
};

export const SupplierAdminController = {
  listSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  updateSupplierStatus,
  deleteSupplier,
} as const;
