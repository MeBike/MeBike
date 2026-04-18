import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { makePageResult, normalizedPage } from "@/domain/shared/pagination";

import type { RatingRepo } from "../rating.repository.types";

import { RatingRepositoryError } from "../../domain-errors";
import {
  selectRatingRow,
  toAdminRatingDetailRow,
  toAdminRatingListItemRow,
  toRatingRow,
} from "../rating.mappers";

export type RatingReadRepo = Pick<
  RatingRepo,
  | "findByRentalId"
  | "findAdminList"
  | "findAdminDetailById"
  | "findBikeSummary"
  | "findBikeAggregates"
  | "findStationSummary"
>;

const selectAdminRatingBaseRow = {
  id: true,
  rentalId: true,
  bikeId: true,
  stationId: true,
  bikeScore: true,
  stationScore: true,
  comment: true,
  createdAt: true,
  updatedAt: true,
  editedAt: true,
  user: {
    select: {
      id: true,
      fullName: true,
      phoneNumber: true,
    },
  },
  reasons: {
    select: {
      reason: {
        select: {
          id: true,
          type: true,
          appliesTo: true,
          message: true,
        },
      },
    },
  },
} as const;

const selectAdminRatingDetailRow = {
  ...selectAdminRatingBaseRow,
  rental: {
    select: {
      id: true,
      status: true,
      startTime: true,
      endTime: true,
    },
  },
} as const;

function toAdminRatingWhere(
  filters: {
    readonly userId?: string;
    readonly rentalId?: string;
    readonly bikeId?: string;
    readonly stationId?: string;
  },
): PrismaTypes.RatingWhereInput {
  return {
    userId: filters.userId,
    rentalId: filters.rentalId,
    bikeId: filters.bikeId,
    stationId: filters.stationId,
  };
}

function toAdminRatingOrderBy(
  sortBy?: "createdAt" | "updatedAt" | "bikeScore" | "stationScore",
  sortDir: "asc" | "desc" = "desc",
): PrismaTypes.RatingOrderByWithRelationInput[] {
  switch (sortBy) {
    case "updatedAt":
      return [{ updatedAt: sortDir }, { id: sortDir }];
    case "bikeScore":
      return [{ bikeScore: sortDir }, { id: sortDir }];
    case "stationScore":
      return [{ stationScore: sortDir }, { id: sortDir }];
    case "createdAt":
    default:
      return [{ createdAt: sortDir }, { id: sortDir }];
  }
}

export function makeRatingReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): RatingReadRepo {
  const enrichRatings = async <TRow extends {
    bikeId: string | null;
    stationId: string | null;
  }>(rows: TRow[]) => {
    const bikeIds = [...new Set(rows.flatMap(row => row.bikeId ? [row.bikeId] : []))];
    const stationIds = [...new Set(rows.flatMap(row => row.stationId ? [row.stationId] : []))];

    const [bikes, stations] = await Promise.all([
      bikeIds.length === 0
        ? Promise.resolve([])
        : client.bike.findMany({
            where: { id: { in: bikeIds } },
            select: { id: true, bikeNumber: true },
          }),
      stationIds.length === 0
        ? Promise.resolve([])
        : client.station.findMany({
            where: { id: { in: stationIds } },
            select: { id: true, name: true, address: true },
          }),
    ]);

    return {
      bikeMap: new Map(bikes.map(bike => [bike.id, { id: bike.id, bikeNumber: bike.bikeNumber }])),
      stationMap: new Map(stations.map(station => [
        station.id,
        { id: station.id, name: station.name, address: station.address },
      ])),
    };
  };

  const findSummaryByWhere = (
    where: PrismaTypes.RatingWhereInput,
    scoreField: "bikeScore" | "stationScore",
    operation: string,
  ) =>
    Effect.tryPromise({
      try: async () => {
        const scores = scoreField === "bikeScore"
          ? (await client.rating.findMany({
              where,
              select: { bikeScore: true },
            })).map(row => row.bikeScore)
          : (await client.rating.findMany({
              where,
              select: { stationScore: true },
            })).map(row => row.stationScore);

        const totalRatings = scores.length;
        const totalScore = scores.reduce((sum, score) => sum + score, 0);
        const groupedCounts = new Map<number, number>();
        for (const score of scores) {
          groupedCounts.set(score, (groupedCounts.get(score) ?? 0) + 1);
        }

        return {
          averageRating: totalRatings === 0 ? 0 : Number((totalScore / totalRatings).toFixed(2)),
          totalRatings,
          breakdown: {
            oneStar: groupedCounts.get(1) ?? 0,
            twoStar: groupedCounts.get(2) ?? 0,
            threeStar: groupedCounts.get(3) ?? 0,
            fourStar: groupedCounts.get(4) ?? 0,
            fiveStar: groupedCounts.get(5) ?? 0,
          },
        };
      },
      catch: err =>
        new RatingRepositoryError({
          operation,
          cause: err,
        }),
    });

  return {
    findByRentalId: rentalId =>
      Effect.tryPromise({
        try: () =>
          client.rating.findUnique({
            where: { rentalId },
            select: selectRatingRow,
          }),
        catch: err =>
          new RatingRepositoryError({
            operation: "findByRentalId",
            cause: err,
          }),
      }).pipe(
        Effect.map(row =>
          Option.fromNullable(row).pipe(Option.map(toRatingRow)),
        ),
      ),

    findAdminList: (filters, pageReq) =>
      Effect.tryPromise({
        try: async () => {
          const page = normalizedPage(pageReq);
          const where = toAdminRatingWhere(filters);
          const orderBy = toAdminRatingOrderBy(page.sortBy, page.sortDir);

          const [rows, total] = await Promise.all([
            client.rating.findMany({
              where,
              orderBy,
              skip: page.skip,
              take: page.take,
              select: selectAdminRatingBaseRow,
            }),
            client.rating.count({ where }),
          ]);

          const { bikeMap, stationMap } = await enrichRatings(rows);

          return makePageResult(
            rows.map(row =>
              toAdminRatingListItemRow(
                row,
                row.bikeId ? (bikeMap.get(row.bikeId) ?? null) : null,
                row.stationId ? (stationMap.get(row.stationId) ?? null) : null,
              ),
            ),
            total,
            page.page,
            page.pageSize,
          );
        },
        catch: err =>
          new RatingRepositoryError({
            operation: "findAdminList",
            cause: err,
          }),
      }),

    findAdminDetailById: ratingId =>
      Effect.tryPromise({
        try: async () => {
          const row = await client.rating.findUnique({
            where: { id: ratingId },
            select: selectAdminRatingDetailRow,
          });

          if (!row) {
            return Option.none();
          }

          const { bikeMap, stationMap } = await enrichRatings([row]);

          return Option.some(
            toAdminRatingDetailRow(
              row,
              row.bikeId ? (bikeMap.get(row.bikeId) ?? null) : null,
              row.stationId ? (stationMap.get(row.stationId) ?? null) : null,
            ),
          );
        },
        catch: err =>
          new RatingRepositoryError({
            operation: "findAdminDetailById",
            cause: err,
          }),
      }),

    findBikeSummary: bikeId =>
      findSummaryByWhere(
        { bikeId },
        "bikeScore",
        "findBikeSummary",
      ),

    findBikeAggregates: (bikeIds) => {
      if (bikeIds.length === 0) {
        return Effect.succeed({});
      }

      return Effect.tryPromise({
        try: async () => {
          const rows = await client.rating.groupBy({
            by: ["bikeId"],
            where: {
              bikeId: { in: [...bikeIds] },
            },
            _avg: {
              bikeScore: true,
            },
            _count: {
              bikeScore: true,
            },
          });

          return Object.fromEntries(
            rows.flatMap((row) => {
              if (!row.bikeId) {
                return [];
              }

              return [[
                row.bikeId,
                {
                  averageRating: Number((row._avg.bikeScore ?? 0).toFixed(2)),
                  totalRatings: row._count.bikeScore,
                },
              ]];
            }),
          );
        },
        catch: err =>
          new RatingRepositoryError({
            operation: "findBikeAggregates",
            cause: err,
          }),
      });
    },

    findStationSummary: stationId =>
      findSummaryByWhere(
        { stationId },
        "stationScore",
        "findStationSummary",
      ),
  };
}
