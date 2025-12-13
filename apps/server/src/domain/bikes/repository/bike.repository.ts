import { Context, Effect, Layer, Option } from "effect";

import type { PageRequest, PageResult } from "@/domain/shared/pagination";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { Prisma } from "@/infrastructure/prisma";

import type {
  BikeStatus,
  PrismaClient,
  Prisma as PrismaTypes,
} from "../../../../generated/prisma/client";
import type { BikeFilter, BikeRow, BikeSortField } from "../models";

export type BikeRepo = {
  getById: (bikeId: string) => Effect.Effect<Option.Option<BikeRow>>;
  listByStationWithOffset: (
    stationId: string | undefined,
    filter: BikeFilter,
    pageReq: PageRequest<BikeSortField>,
  ) => Effect.Effect<PageResult<BikeRow>>;
  updateStatus: (
    bikeId: string,
    status: BikeStatus,
  ) => Effect.Effect<Option.Option<BikeRow>>;
};
export class BikeRepository extends Context.Tag("BikeRepository")<
  BikeRepository,
  BikeRepo
>() {}

export function toBikeOrderBy(
  req: PageRequest<BikeSortField>,
): PrismaTypes.BikeOrderByWithRelationInput {
  const sortBy: BikeSortField = req.sortBy ?? "status";
  const sortDir = req.sortDir ?? "asc";
  switch (sortBy) {
    case "name":
      return { chipId: sortDir };
    case "status":
    default:
      return { status: sortDir };
  }
}

export function makeBikeRepository(client: PrismaClient): BikeRepo {
  const select = {
    id: true,
    chipId: true,
    stationId: true,
    supplierId: true,
    status: true,
  } as const;

  return {
    getById: (bikeId: string) =>
      Effect.promise(() =>
        client.bike.findUnique({ where: { id: bikeId }, select }),
      ).pipe(Effect.map(Option.fromNullable)),

    listByStationWithOffset: (stationId, filter, pageReq) => {
      const { page, pageSize, skip, take } = normalizedPage(pageReq);

      const where: PrismaTypes.BikeWhereInput = {
        ...(stationId ? { stationId } : {}),
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.supplierId ? { supplierId: filter.supplierId } : {}),
        ...(filter.id ? { id: filter.id } : {}),
      };

      const orderBy = toBikeOrderBy(pageReq);

      return Effect.gen(function* () {
        const [total, items] = yield* Effect.all([
          Effect.promise(() => client.bike.count({ where })),
          Effect.promise(() =>
            client.bike.findMany({ where, skip, take, orderBy, select }),
          ),
        ]);

        return makePageResult(items, total, page, pageSize);
      });
    },

    updateStatus: (bikeId, status) =>
      Effect.gen(function* () {
        const updated = yield* Effect.promise(() =>
          client.bike.updateMany({
            where: { id: bikeId },
            data: { status },
          }),
        );

        if (updated.count === 0) {
          return Option.none<BikeRow>();
        }

        const row = yield* Effect.promise(() =>
          client.bike.findUnique({ where: { id: bikeId }, select }),
        );

        return Option.fromNullable(row);
      }),
  };
}

export const bikeRepositoryFactory = makeBikeRepository;

export const BikeRepositoryLive = Layer.effect(
  BikeRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeBikeRepository(client);
  }),
);
