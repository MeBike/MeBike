import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";
import type { BikeStatus, SupplierStatus } from "generated/prisma/client";

import type {
  DuplicateSupplierName,
} from "../domain-errors";
import type {
  CreateSupplierInput,
  SupplierBikeStats,
  SupplierFilter,
  SupplierRow,
  SupplierSortField,
  UpdateSupplierInput,
} from "../models";

import {
  InvalidSupplierStatus,
  SupplierNotFound,
} from "../domain-errors";
import { SupplierRepository } from "../repository/supplier.repository";

export type SupplierService = {
  listSuppliers: (
    filter: SupplierFilter,
    pageReq: PageRequest<SupplierSortField>,
  ) => Effect.Effect<PageResult<SupplierRow>>;

  getSupplierById: (
    supplierId: string,
  ) => Effect.Effect<SupplierRow, SupplierNotFound>;

  createSupplier: (
    data: CreateSupplierInput,
  ) => Effect.Effect<SupplierRow, DuplicateSupplierName | InvalidSupplierStatus>;

  updateSupplier: (
    supplierId: string,
    patch: UpdateSupplierInput,
  ) => Effect.Effect<
    SupplierRow,
    DuplicateSupplierName | SupplierNotFound | InvalidSupplierStatus
  >;

  updateSupplierStatus: (
    supplierId: string,
    status: SupplierStatus,
  ) => Effect.Effect<SupplierRow, SupplierNotFound | InvalidSupplierStatus>;

  getAllStats: () => Effect.Effect<readonly SupplierBikeStats[]>;
  getSupplierStats: (
    supplierId: string,
  ) => Effect.Effect<SupplierBikeStats, SupplierNotFound>;
};

export class SupplierServiceTag extends Context.Tag("SupplierService")<
  SupplierServiceTag,
  SupplierService
>() {}

export function emptyStats(
  supplierId: string,
  supplierName: string,
): SupplierBikeStats {
  return {
    supplierId,
    supplierName,
    totalBikes: 0,
    available: 0,
    booked: 0,
    broken: 0,
    reserved: 0,
    maintained: 0,
    unavailable: 0,
  };
}

export type SupplierCountRow = {
  supplierId: string | null;
  status: BikeStatus;
  count: number;
};

export type SupplierStatusCountRow = {
  status: BikeStatus;
  count: number;
};

export function updateStatsWithCount(
  stats: SupplierBikeStats,
  status: BikeStatus,
  count: number,
): SupplierBikeStats {
  const total = stats.totalBikes + count;
  const update: Partial<SupplierBikeStats> = { totalBikes: total };

  switch (status) {
    case "AVAILABLE":
      update.available = count;
      break;
    case "BOOKED":
      update.booked = count;
      break;
    case "BROKEN":
      update.broken = count;
      break;
    case "RESERVED":
      update.reserved = count;
      break;
    case "MAINTAINED":
      update.maintained = count;
      break;
    case "UNAVAILABLE":
      update.unavailable = count;
      break;
  }

  return { ...stats, ...update };
}

export function buildAllSupplierStats(
  suppliers: readonly { id: string; name: string }[],
  counts: readonly SupplierCountRow[],
): readonly SupplierBikeStats[] {
  const statsMap = new Map<string, SupplierBikeStats>();

  for (const s of suppliers) {
    statsMap.set(s.id, emptyStats(s.id, s.name));
  }

  for (const row of counts) {
    if (!row.supplierId)
      continue;
    const current = statsMap.get(row.supplierId);
    if (!current)
      continue;
    statsMap.set(
      row.supplierId,
      updateStatsWithCount(current, row.status, row.count),
    );
  }

  return Array.from(statsMap.values());
}

export function buildSupplierStats(
  supplierId: string,
  supplierName: string,
  counts: readonly SupplierStatusCountRow[],
): SupplierBikeStats {
  let stats = emptyStats(supplierId, supplierName);

  for (const row of counts) {
    stats = updateStatsWithCount(stats, row.status, row.count);
  }

  return stats;
}

const allowedStatuses: readonly SupplierStatus[] = [
  "ACTIVE",
  "INACTIVE",
  "TERMINATED",
];

export function ensureValidStatus(
  status: SupplierStatus | undefined,
): Effect.Effect<void, InvalidSupplierStatus, never> {
  if (status === undefined) {
    return Effect.void;
  }
  return allowedStatuses.includes(status)
    ? Effect.void
    : Effect.fail(
        new InvalidSupplierStatus({ status, allowed: allowedStatuses }),
      );
}

export const SupplierServiceLive = Layer.effect(
  SupplierServiceTag,
  Effect.gen(function* () {
    const repo = yield* SupplierRepository;

    const service: SupplierService = {
      listSuppliers: (filter, pageReq) => repo.listWithOffset(filter, pageReq),

      getSupplierById: (supplierId: string) =>
        repo.getById(supplierId).pipe(
          Effect.flatMap(opt =>
            Option.isSome(opt)
              ? Effect.succeed(opt.value)
              : Effect.fail(new SupplierNotFound({ id: supplierId })),
          ),
        ),

      createSupplier: data =>
        ensureValidStatus(data.status).pipe(
          Effect.flatMap(() => repo.create(data)),
        ),

      updateSupplier: (supplierId, patch) =>
        ensureValidStatus(patch.status).pipe(
          Effect.flatMap(() => repo.update(supplierId, patch)),
          Effect.flatMap(opt =>
            Option.isSome(opt)
              ? Effect.succeed(opt.value)
              : Effect.fail(new SupplierNotFound({ id: supplierId })),
          ),
        ),

      updateSupplierStatus: (supplierId, status) =>
        ensureValidStatus(status).pipe(
          Effect.flatMap(() => repo.updateStatus(supplierId, status)),
          Effect.flatMap(opt =>
            Option.isSome(opt)
              ? Effect.succeed(opt.value)
              : Effect.fail(new SupplierNotFound({ id: supplierId })),
          ),
        ),

      getAllStats: () =>
        Effect.gen(function* () {
          const suppliers = yield* repo.listIdName();
          const counts = yield* repo.groupBikeCountsBySupplier();
          return buildAllSupplierStats(suppliers, counts);
        }),

      getSupplierStats: (supplierId: string) =>
        Effect.gen(function* () {
          const supplier = yield* repo.getById(supplierId).pipe(
            Effect.flatMap(opt =>
              Option.isSome(opt)
                ? Effect.succeed(opt.value)
                : Effect.fail(new SupplierNotFound({ id: supplierId })),
            ),
          );

          const counts = yield* repo.groupBikeCountsForSupplier(supplierId);
          const stats = buildSupplierStats(
            supplier.id,
            supplier.name,
            counts,
          );
          return stats;
        }),
    };

    return service;
  }),
);
