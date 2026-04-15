import { Context, Effect, Layer } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { Prisma } from "@/infrastructure/prisma";
import { Prisma as PrismaNamespace } from "generated/prisma/client";

import type {
  CompletedRentalMissingEnvironmentImpactRow,
  ListCompletedRentalsMissingEnvironmentImpactInput,
} from "../models";

export type EnvironmentImpactRepairRepo = {
  listCompletedRentalsMissingEnvironmentImpact: (
    input: ListCompletedRentalsMissingEnvironmentImpactInput,
  ) => Effect.Effect<readonly CompletedRentalMissingEnvironmentImpactRow[]>;
};

type EnvironmentImpactRepairClient = Pick<
  PrismaClient | PrismaTypes.TransactionClient,
  "$queryRaw"
>;

const DEFAULT_REPAIR_LIMIT = 100;

function normalizeRepairLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return DEFAULT_REPAIR_LIMIT;
  }

  return Math.max(1, Math.trunc(limit));
}

export function makeEnvironmentImpactRepairRepository(
  client: EnvironmentImpactRepairClient,
): EnvironmentImpactRepairRepo {
  return {
    listCompletedRentalsMissingEnvironmentImpact(input) {
      return Effect.promise(async () => {
        const limit = normalizeRepairLimit(input.limit);

        const rows = await client.$queryRaw<
          CompletedRentalMissingEnvironmentImpactRow[]
        >`
          SELECT r.id
          FROM "Rental" r
          LEFT JOIN environmental_impact_stats eis
            ON eis.rental_id = r.id
          WHERE r.status = 'COMPLETED'
            AND eis.id IS NULL
            ${input.completedFrom
              ? PrismaNamespace.sql`AND r.end_time >= ${input.completedFrom}`
              : PrismaNamespace.empty}
            ${input.completedTo
              ? PrismaNamespace.sql`AND r.end_time <= ${input.completedTo}`
              : PrismaNamespace.empty}
          ORDER BY r.end_time ASC NULLS LAST, r.created_at ASC, r.id ASC
          LIMIT ${limit}
        `;

        return rows;
      });
    },
  };
}

export class EnvironmentImpactRepairRepository extends Context.Tag(
  "EnvironmentImpactRepairRepository",
)<EnvironmentImpactRepairRepository, EnvironmentImpactRepairRepo>() {}

export const EnvironmentImpactRepairRepositoryLive = Layer.effect(
  EnvironmentImpactRepairRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeEnvironmentImpactRepairRepository(client);
  }),
);
