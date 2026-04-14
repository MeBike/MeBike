import { Context, Effect, Layer } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { Prisma as PrismaNamespace } from "generated/prisma/client";
import { uuidv7 } from "uuidv7";

import { Prisma } from "@/infrastructure/prisma";

import type {
  CreateEnvironmentPolicyData,
  EnvironmentPolicyFormulaConfig,
  EnvironmentPolicyRow,
} from "../models";

export type EnvironmentPolicyRepo = {
  create: (
    data: CreateEnvironmentPolicyData,
  ) => Effect.Effect<EnvironmentPolicyRow>;
  findActive: (now: Date) => Effect.Effect<EnvironmentPolicyRow | null>;
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
