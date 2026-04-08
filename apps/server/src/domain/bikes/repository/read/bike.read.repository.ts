import { Effect, Option } from "effect";

import type { PageRequest } from "@/domain/shared/pagination";
import type { Prisma as PrismaTypes } from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { makePageResult, normalizedPage } from "@/domain/shared/pagination";
import { pickDefined } from "@/domain/shared/pick-defined";

import type { BikeFilter, BikeSortField } from "../../models";
import type { BikeDbClient } from "../bike.repository.shared";
import type { BikeQueryRepo } from "../bike.repository.types";

import { BikeRepositoryError } from "../../domain-errors";
import { bikeSelect, findBikeById, toBikeOrderBy } from "../bike.repository.shared";

export function makeBikeReadRepository(client: BikeDbClient): BikeQueryRepo {
  return {
    getById: bikeId =>
      Effect.tryPromise({
        try: () => findBikeById(client, bikeId),
        catch: cause =>
          new BikeRepositoryError({
            operation: "getById",
            cause,
            message: "Failed to fetch bike by id",
          }),
      }).pipe(
        Effect.map(Option.fromNullable),
        defectOn(BikeRepositoryError),
      ),

    findAvailableByStation: stationId =>
      Effect.tryPromise({
        try: () =>
          client.bike.findFirst({
            where: { stationId, status: "AVAILABLE" },
            select: bikeSelect,
          }),
        catch: cause =>
          new BikeRepositoryError({
            operation: "findAvailableByStation",
            cause,
            message: "Failed to find available bike by station",
          }),
      }).pipe(
        Effect.map(Option.fromNullable),
        defectOn(BikeRepositoryError),
      ),

    listByStationWithOffset: (stationId, filter, pageReq) =>
      listBikesWithOffset(client, stationId, filter, pageReq),
  };
}

function listBikesWithOffset(
  client: BikeDbClient,
  stationId: string | undefined,
  filter: BikeFilter,
  pageReq: PageRequest<BikeSortField>,
) {
  const { page, pageSize, skip, take } = normalizedPage(pageReq);
  const where: PrismaTypes.BikeWhereInput = pickDefined({
    stationId,
    status: filter.status,
    supplierId: filter.supplierId,
    id: filter.id,
  });
  const orderBy = toBikeOrderBy(pageReq);

  return Effect.gen(function* () {
    const [total, items] = yield* Effect.all([
      Effect.tryPromise({
        try: () => client.bike.count({ where }),
        catch: cause =>
          new BikeRepositoryError({
            operation: "listByStationWithOffset.count",
            cause,
            message: "Failed to count bikes",
          }),
      }),
      Effect.tryPromise({
        try: () => client.bike.findMany({ where, skip, take, orderBy, select: bikeSelect }),
        catch: cause =>
          new BikeRepositoryError({
            operation: "listByStationWithOffset.findMany",
            cause,
            message: "Failed to list bikes",
          }),
      }),
    ]);

    return makePageResult(items, total, page, pageSize);
  }).pipe(defectOn(BikeRepositoryError));
}
