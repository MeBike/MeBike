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
