import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { Prisma } from "@/infrastructure/prisma";

import type {
  BikeStatus,
  PrismaClient,
  SupplierStatus,
} from "../../../../generated/prisma/client";
import type {
  CreateSupplierInput,
  SupplierError,
  SupplierFilter,
  SupplierRow,
  SupplierSortField,
  UpdateSupplierInput,
} from "../models";

import {
  Prisma as PrismaTypes,
} from "../../../../generated/prisma/client";
import { DuplicateSupplierName } from "../domain-errors";

export type SupplierRepo = {
  listWithOffset: (
    filter: SupplierFilter,
    pageReq: PageRequest<SupplierSortField>,
  ) => Effect.Effect<PageResult<SupplierRow>>;

  getById: (id: string) => Effect.Effect<Option.Option<SupplierRow>>;

  create: (data: CreateSupplierInput) => Effect.Effect<SupplierRow, SupplierError>;

  update: (
    id: string,
    patch: UpdateSupplierInput,
  ) => Effect.Effect<Option.Option<SupplierRow>, SupplierError>;

  updateStatus: (
    id: string,
    status: SupplierStatus,
  ) => Effect.Effect<Option.Option<SupplierRow>>;

  // Low-level helpers for stats
  listIdName: () => Effect.Effect<
    readonly { id: string; name: string }[]
  >;

  groupBikeCountsBySupplier: () => Effect.Effect<
    readonly {
      supplierId: string | null;
      status: BikeStatus;
      count: number;
    }[]
  >;

  groupBikeCountsForSupplier: (
    supplierId: string,
  ) => Effect.Effect<
    readonly {
      status: BikeStatus;
      count: number;
    }[]
  >;
};

function toSupplierOrderBy(
  req: PageRequest<SupplierSortField>,
): PrismaTypes.SupplierOrderByWithRelationInput {
  const sortBy = req.sortBy ?? "name";
  const sortDir = req.sortDir ?? "asc";

  switch (sortBy) {
    case "status":
      return { status: sortDir };
    case "updatedAt":
      return { updatedAt: sortDir };
    case "name":
    default:
      return { name: sortDir };
  }
}

export function makeSupplierRepository(client: PrismaClient): SupplierRepo {
  const select = {
    id: true,
    name: true,
    address: true,
    phoneNumber: true,
    contractFee: true,
    status: true,
    updatedAt: true,
  } as const;

  return {
    listWithOffset(filter, pageReq) {
      return Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);

        const where: PrismaTypes.SupplierWhereInput = {
          ...(filter.name && {
            name: { contains: filter.name, mode: "insensitive" },
          }),
          ...(filter.status && { status: filter.status }),
        };

        const orderBy = toSupplierOrderBy(pageReq);

        const [total, items] = yield* Effect.all([
          Effect.promise(() => client.supplier.count({ where })),
          Effect.promise(() =>
            client.supplier.findMany({
              where,
              skip,
              take,
              orderBy,
              select,
            }),
          ),
        ]);

        return makePageResult(items, total, page, pageSize);
      });
    },

    getById(id) {
      return Effect.promise(() =>
        client.supplier.findUnique({ where: { id }, select }),
      ).pipe(Effect.map(Option.fromNullable));
    },

    create(data) {
      return Effect.tryPromise({
        try: () =>
          client.supplier.create({
            data: {
              name: data.name,
              address: data.address ?? null,
              phoneNumber: data.phoneNumber ?? null,
              contractFee: data.contractFee ?? null,
              status: data.status ?? "ACTIVE",
              updatedAt: new Date(),
            },
            select,
          }),
        catch: (err: any) => {
          if (
            err instanceof PrismaTypes.PrismaClientKnownRequestError
            && err.code === "P2002"
          ) {
            return new DuplicateSupplierName({ name: data.name });
          }
          return err;
        },
      });
    },

    update(id, patch) {
      return Effect.gen(function* () {
        const existing = yield* Effect.promise(() =>
          client.supplier.findUnique({ where: { id }, select }),
        );
        if (!existing) {
          return Option.none<SupplierRow>();
        }

        const updated = yield* Effect.tryPromise({
          try: () =>
            client.supplier.update({
              where: { id },
              data: {
                ...(patch.name !== undefined ? { name: patch.name } : {}),
                ...(patch.address !== undefined ? { address: patch.address } : {}),
                ...(patch.phoneNumber !== undefined
                  ? { phoneNumber: patch.phoneNumber }
                  : {}),
                ...(patch.contractFee !== undefined
                  ? { contractFee: patch.contractFee }
                  : {}),
                ...(patch.status !== undefined ? { status: patch.status } : {}),
              },
              select,
            }),
          catch: (err: any) => {
            if (
              err instanceof PrismaTypes.PrismaClientKnownRequestError
              && err.code === "P2002"
            ) {
              return new DuplicateSupplierName({
                name: patch.name ?? existing.name,
              });
            }
            return err;
          },
        });

        return Option.some(updated);
      });
    },

    updateStatus(id, status) {
      return Effect.gen(function* () {
        const existing = yield* Effect.promise(() =>
          client.supplier.findUnique({ where: { id }, select }),
        );
        if (!existing) {
          return Option.none<SupplierRow>();
        }

        const updated = yield* Effect.promise(() =>
          client.supplier.update({
            where: { id },
            data: { status },
            select,
          }),
        );

        return Option.some(updated);
      });
    },

    listIdName() {
      return Effect.promise(() =>
        client.supplier.findMany({ select: { id: true, name: true } }),
      );
    },

    groupBikeCountsBySupplier() {
      return Effect.promise(() =>
        client.bike.groupBy({
          by: ["supplierId", "status"],
          _count: { _all: true },
          where: { supplierId: { not: null } },
        }).then(rows =>
          rows.map(row => ({
            supplierId: row.supplierId,
            status: row.status,
            count: row._count._all,
          })),
        ),
      );
    },

    groupBikeCountsForSupplier(supplierId) {
      return Effect.promise(() =>
        client.bike.groupBy({
          by: ["status"],
          _count: { _all: true },
          where: { supplierId },
        }).then(rows =>
          rows.map(row => ({
            status: row.status,
            count: row._count._all,
          })),
        ),
      );
    },
  };
}

export class SupplierRepository extends Context.Tag("SupplierRepository")<
  SupplierRepository,
  SupplierRepo
>() {}

export const SupplierRepositoryLive = Layer.effect(
  SupplierRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeSupplierRepository(client);
  }),
);

export { toSupplierOrderBy };
