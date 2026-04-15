import { Context, Effect, Layer, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { Prisma as PrismaNamespace } from "generated/prisma/client";
import { uuidv7 } from "uuidv7";

import { Prisma } from "@/infrastructure/prisma";
import { isPrismaUniqueViolation } from "@/infrastructure/prisma-errors";

import { EnvironmentImpactAlreadyExists } from "../domain-errors";
import type {
  CreateEnvironmentImpactData,
  EnvironmentImpactPolicySnapshot,
  EnvironmentImpactRentalRow,
  EnvironmentImpactRow,
  EnvironmentImpactSummaryRow,
} from "../models";

export type EnvironmentImpactRepo = {
  findImpactByRentalId: (
    rentalId: string,
  ) => Effect.Effect<Option.Option<EnvironmentImpactRow>>;
  getRentalForEnvironmentCalculation: (
    rentalId: string,
  ) => Effect.Effect<Option.Option<EnvironmentImpactRentalRow>>;
  createImpact: (
    data: CreateEnvironmentImpactData,
  ) => Effect.Effect<EnvironmentImpactRow, EnvironmentImpactAlreadyExists>;
  getUserEnvironmentSummary: (
    userId: string,
  ) => Effect.Effect<EnvironmentImpactSummaryRow>;
};

const environmentImpactSelect = {
  id: true,
  userId: true,
  rentalId: true,
  policyId: true,
  estimatedDistanceKm: true,
  co2Saved: true,
  policySnapshot: true,
  calculatedAt: true,
} as const;

type PrismaEnvironmentImpactRow = PrismaTypes.EnvironmentalImpactStatGetPayload<{
  select: typeof environmentImpactSelect;
}>;

function toEnvironmentImpactRow(
  row: PrismaEnvironmentImpactRow,
): EnvironmentImpactRow {
  return {
    id: row.id,
    userId: row.userId,
    rentalId: row.rentalId,
    policyId: row.policyId,
    estimatedDistanceKm: row.estimatedDistanceKm,
    co2Saved: row.co2Saved,
    policySnapshot: row.policySnapshot as EnvironmentImpactPolicySnapshot,
    calculatedAt: row.calculatedAt,
  };
}

export function makeEnvironmentImpactRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): EnvironmentImpactRepo {
  return {
    findImpactByRentalId(rentalId) {
      return Effect.promise(async () => {
        const row = await client.environmentalImpactStat.findUnique({
          where: { rentalId },
          select: environmentImpactSelect,
        });

        return Option.fromNullable(row).pipe(Option.map(toEnvironmentImpactRow));
      });
    },
    getRentalForEnvironmentCalculation(rentalId) {
      return Effect.promise(async () => {
        const row = await client.rental.findUnique({
          where: { id: rentalId },
          select: {
            id: true,
            userId: true,
            startTime: true,
            endTime: true,
            duration: true,
            status: true,
          },
        });

        return Option.fromNullable(row).pipe(
          Option.map(rental => ({
            id: rental.id,
            userId: rental.userId,
            startTime: rental.startTime,
            endTime: rental.endTime,
            durationMinutes: rental.duration,
            status: rental.status,
          })),
        );
      });
    },
    createImpact(data) {
      return Effect.tryPromise({
        try: async () => {
          const row = await client.environmentalImpactStat.create({
            data: {
              id: uuidv7(),
              userId: data.userId,
              rentalId: data.rentalId,
              policyId: data.policyId,
              estimatedDistanceKm: new PrismaNamespace.Decimal(
                data.estimatedDistanceKm.toFixed(2),
              ),
              co2Saved: new PrismaNamespace.Decimal(
                data.co2Saved.toFixed(4),
              ),
              policySnapshot: data.policySnapshot as unknown as PrismaTypes.InputJsonValue,
            },
            select: environmentImpactSelect,
          });

          return toEnvironmentImpactRow(row);
        },
        catch: (cause) => {
          if (isPrismaUniqueViolation(cause)) {
            return new EnvironmentImpactAlreadyExists({
              rentalId: data.rentalId,
            });
          }

          throw cause;
        },
      });
    },
    getUserEnvironmentSummary(userId) {
      return Effect.promise(async () => {
        const aggregate = await client.environmentalImpactStat.aggregate({
          where: { userId },
          _count: { id: true },
          _sum: {
            estimatedDistanceKm: true,
            co2Saved: true,
          },
        });

        return {
          totalTripsCounted: aggregate._count.id,
          totalEstimatedDistanceKm: aggregate._sum.estimatedDistanceKm
            ?? new PrismaNamespace.Decimal(0),
          totalCo2Saved: aggregate._sum.co2Saved
            ?? new PrismaNamespace.Decimal(0),
        };
      });
    },
  };
}

export class EnvironmentImpactRepository extends Context.Tag(
  "EnvironmentImpactRepository",
)<EnvironmentImpactRepository, EnvironmentImpactRepo>() {}

export const EnvironmentImpactRepositoryLive = Layer.effect(
  EnvironmentImpactRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeEnvironmentImpactRepository(client);
  }),
);
