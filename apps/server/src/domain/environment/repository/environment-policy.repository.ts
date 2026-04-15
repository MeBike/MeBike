import { Context, Effect, Layer } from "effect";
import { uuidv7 } from "uuidv7";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { makePageResult } from "@/domain/shared/pagination";
import { Prisma } from "@/infrastructure/prisma";
import { Prisma as PrismaNamespace } from "generated/prisma/client";

import type {
  CreateEnvironmentPolicyData,
  EnvironmentPolicyFormulaConfig,
  EnvironmentPolicyListFilter,
  EnvironmentPolicyListPageRequest,
  EnvironmentPolicyPageResult,
  EnvironmentPolicyRow,
} from "../models";

import {
  EnvironmentPolicyActivationBlocked,
  EnvironmentPolicyNotFound,
} from "../domain-errors";

export type EnvironmentPolicyRepo = {
  create: (
    data: CreateEnvironmentPolicyData,
  ) => Effect.Effect<EnvironmentPolicyRow>;
  activatePolicy: (
    policyId: string,
  ) => Effect.Effect<
    EnvironmentPolicyRow,
    EnvironmentPolicyNotFound | EnvironmentPolicyActivationBlocked
  >;
  findActive: (now: Date) => Effect.Effect<EnvironmentPolicyRow | null>;
  listPolicies: (
    filter: EnvironmentPolicyListFilter,
    pageReq: EnvironmentPolicyListPageRequest,
  ) => Effect.Effect<EnvironmentPolicyPageResult>;
};

type RawEnvironmentPolicyRow = {
  id: string;
  name: string;
  average_speed_kmh: PrismaTypes.Decimal | string | number;
  co2_saved_per_km: PrismaTypes.Decimal | string | number;
  status: EnvironmentPolicyRow["status"];
  active_from: Date | null;
  active_to: Date | null;
  formula_config: unknown;
  created_at: Date;
  updated_at: Date;
};

type PrismaEnvironmentPolicyRow = {
  id: string;
  name: string;
  averageSpeedKmh: PrismaTypes.Decimal;
  co2SavedPerKm: PrismaTypes.Decimal;
  status: EnvironmentPolicyRow["status"];
  activeFrom: Date | null;
  activeTo: Date | null;
  formulaConfig: PrismaTypes.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

const environmentPolicySelect = {
  id: true,
  name: true,
  averageSpeedKmh: true,
  co2SavedPerKm: true,
  status: true,
  activeFrom: true,
  activeTo: true,
  formulaConfig: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toEnvironmentPolicyRow(
  row: RawEnvironmentPolicyRow,
): EnvironmentPolicyRow {
  return {
    id: row.id,
    name: row.name,
    averageSpeedKmh: new PrismaNamespace.Decimal(row.average_speed_kmh),
    co2SavedPerKm: new PrismaNamespace.Decimal(row.co2_saved_per_km),
    status: row.status,
    activeFrom: row.active_from,
    activeTo: row.active_to,
    formulaConfig: row.formula_config as EnvironmentPolicyFormulaConfig | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toEnvironmentPolicyRowFromPrisma(
  row: PrismaEnvironmentPolicyRow,
): EnvironmentPolicyRow {
  return {
    id: row.id,
    name: row.name,
    averageSpeedKmh: row.averageSpeedKmh,
    co2SavedPerKm: row.co2SavedPerKm,
    status: row.status,
    activeFrom: row.activeFrom,
    activeTo: row.activeTo,
    formulaConfig: row.formulaConfig as EnvironmentPolicyFormulaConfig | null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toEnvironmentPolicyWhere(
  filter: EnvironmentPolicyListFilter,
): PrismaTypes.EnvironmentalImpactPolicyWhereInput {
  return {
    ...(filter.status ? { status: filter.status } : {}),
    ...(filter.search
      ? { name: { contains: filter.search, mode: "insensitive" as const } }
      : {}),
  };
}

function toEnvironmentPolicyOrderBy(
  pageReq: EnvironmentPolicyListPageRequest,
): PrismaTypes.EnvironmentalImpactPolicyOrderByWithRelationInput[] {
  const direction = pageReq.sortOrder;

  switch (pageReq.sortBy) {
    case "updated_at":
      return [{ updatedAt: direction }, { createdAt: "desc" }];
    case "active_from":
      return [{ activeFrom: direction }, { createdAt: "desc" }];
    case "name":
      return [{ name: direction }, { createdAt: "desc" }];
    case "created_at":
    default:
      return [{ createdAt: direction }];
  }
}

function runInTransaction<T>(
  client: PrismaClient | PrismaTypes.TransactionClient,
  operation: (tx: PrismaTypes.TransactionClient) => Promise<T>,
) {
  if ("$transaction" in client) {
    return client.$transaction(operation);
  }

  return operation(client as PrismaTypes.TransactionClient);
}

export function makeEnvironmentPolicyRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): EnvironmentPolicyRepo {
  return {
    create(data) {
      return Effect.promise(async () => {
        const id = uuidv7();
        const now = new Date();
        const rows = await client.$queryRaw<RawEnvironmentPolicyRow[]>`
          INSERT INTO "public"."environmental_impact_policies"
            (
              "id",
              "name",
              "average_speed_kmh",
              "co2_saved_per_km",
              "status",
              "active_from",
              "active_to",
              "formula_config",
              "updated_at"
            )
          VALUES
            (
              ${id}::uuid,
              ${data.name},
              ${data.averageSpeedKmh},
              ${data.co2SavedPerKm},
              ${data.status}::"AccountStatus",
              ${data.activeFrom},
              ${data.activeTo},
              ${JSON.stringify(data.formulaConfig)}::jsonb,
              ${now}
            )
          RETURNING
            "id",
            "name",
            "average_speed_kmh",
            "co2_saved_per_km",
            "status",
            "active_from",
            "active_to",
            "formula_config",
            "created_at",
            "updated_at"
        `;

        const row = rows[0];
        if (!row) {
          throw new Error("Failed to create environment policy");
        }

        return toEnvironmentPolicyRow(row);
      });
    },
    activatePolicy(policyId) {
      return Effect.tryPromise({
        try: () =>
          runInTransaction(client, async (tx) => {
            const now = new Date();

            await tx.$executeRaw`
              LOCK TABLE "public"."environmental_impact_policies"
              IN EXCLUSIVE MODE
            `;

            const target = await tx.environmentalImpactPolicy.findUnique({
              where: { id: policyId },
              select: environmentPolicySelect,
            });

            if (!target) {
              throw new EnvironmentPolicyNotFound({ policyId });
            }

            if (target.status === "SUSPENDED" || target.status === "BANNED") {
              throw new EnvironmentPolicyActivationBlocked({
                policyId,
                status: target.status,
              });
            }

            await tx.environmentalImpactPolicy.updateMany({
              where: {
                status: "ACTIVE",
                id: { not: policyId },
              },
              data: {
                status: "INACTIVE",
                updatedAt: now,
              },
            });

            if (target.status === "ACTIVE" && target.activeTo === null) {
              return toEnvironmentPolicyRowFromPrisma(target);
            }

            const activated = await tx.environmentalImpactPolicy.update({
              where: { id: policyId },
              data: {
                status: "ACTIVE",
                activeFrom: target.status === "ACTIVE"
                  ? target.activeFrom ?? now
                  : now,
                activeTo: null,
                updatedAt: now,
              },
              select: environmentPolicySelect,
            });

            return toEnvironmentPolicyRowFromPrisma(activated);
          }),
        catch: (cause) => {
          if (
            cause instanceof EnvironmentPolicyNotFound
            || cause instanceof EnvironmentPolicyActivationBlocked
          ) {
            return cause;
          }

          throw cause;
        },
      });
    },
    findActive(now) {
      return Effect.promise(async () => {
        const rows = await client.$queryRaw<RawEnvironmentPolicyRow[]>`
          SELECT
            "id",
            "name",
            "average_speed_kmh",
            "co2_saved_per_km",
            "status",
            "active_from",
            "active_to",
            "formula_config",
            "created_at",
            "updated_at"
          FROM "public"."environmental_impact_policies"
          WHERE
            "status" = 'ACTIVE'::"AccountStatus"
            AND ("active_from" IS NULL OR "active_from" <= ${now})
            AND ("active_to" IS NULL OR "active_to" > ${now})
          ORDER BY
            "active_from" DESC NULLS LAST,
            "updated_at" DESC,
            "created_at" DESC
          LIMIT 1
        `;

        const row = rows[0];
        return row ? toEnvironmentPolicyRow(row) : null;
      });
    },
    listPolicies(filter, pageReq) {
      return Effect.promise(async () => {
        const page = Math.max(1, pageReq.page);
        const pageSize = Math.max(1, Math.min(100, pageReq.pageSize));
        const skip = (page - 1) * pageSize;
        const where = toEnvironmentPolicyWhere(filter);
        const orderBy = toEnvironmentPolicyOrderBy(pageReq);

        const [total, items] = await Promise.all([
          client.environmentalImpactPolicy.count({ where }),
          client.environmentalImpactPolicy.findMany({
            where,
            skip,
            take: pageSize,
            orderBy,
            select: environmentPolicySelect,
          }),
        ]);

        return makePageResult(
          items.map(toEnvironmentPolicyRowFromPrisma),
          total,
          page,
          pageSize,
        );
      });
    },
  };
}

export class EnvironmentPolicyRepository extends Context.Tag(
  "EnvironmentPolicyRepository",
)<EnvironmentPolicyRepository, EnvironmentPolicyRepo>() {}

export const EnvironmentPolicyRepositoryLive = Layer.effect(
  EnvironmentPolicyRepository,
  Effect.gen(function* () {
    const { client } = yield* Prisma;
    return makeEnvironmentPolicyRepository(client);
  }),
);
