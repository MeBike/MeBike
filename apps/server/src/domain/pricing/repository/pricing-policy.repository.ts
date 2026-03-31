import { Effect, Match, Option } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { defectOn } from "@/domain/shared";

import type { PricingPolicyRow } from "../models";

import {
  ActivePricingPolicyAmbiguous,
  ActivePricingPolicyNotFound,
  PricingPolicyNotFound,
  PricingPolicyRepositoryError,
} from "../domain-errors";

export type PricingPolicyRepo = {
  findById: (
    pricingPolicyId: string,
  ) => Effect.Effect<Option.Option<PricingPolicyRow>>;
  getById: (
    pricingPolicyId: string,
  ) => Effect.Effect<PricingPolicyRow, PricingPolicyNotFound>;
  getActive: () => Effect.Effect<
    PricingPolicyRow,
    ActivePricingPolicyNotFound | ActivePricingPolicyAmbiguous
  >;
};

const pricingPolicySelect = {
  id: true,
  name: true,
  baseRate: true,
  billingUnitMinutes: true,
  overtimeRate: true,
  reservationFee: true,
  depositRequired: true,
  lateReturnCutoff: true,
  status: true,
  activeFrom: true,
  activeTo: true,
  createdAt: true,
  updatedAt: true,
} as const;

type PricingPolicySelectRow = PrismaTypes.PricingPolicyGetPayload<{
  select: typeof pricingPolicySelect;
}>;

function toPricingPolicyRow(row: PricingPolicySelectRow): PricingPolicyRow {
  return row;
}

export function makePricingPolicyRepository(
  db: PrismaClient | PrismaTypes.TransactionClient,
): PricingPolicyRepo {
  const client = db;

  return {
    findById: pricingPolicyId =>
      Effect.tryPromise({
        try: () =>
          client.pricingPolicy.findUnique({
            where: { id: pricingPolicyId },
            select: pricingPolicySelect,
          }),
        catch: cause =>
          new PricingPolicyRepositoryError({
            operation: "pricingPolicy.findById",
            cause,
          }),
      }).pipe(
        Effect.map(row => Option.fromNullable(row).pipe(Option.map(toPricingPolicyRow))),
        defectOn(PricingPolicyRepositoryError),
      ),

    getById: pricingPolicyId =>
      Effect.gen(function* () {
        const policyOpt = yield* makePricingPolicyRepository(client).findById(pricingPolicyId);
        if (Option.isNone(policyOpt)) {
          return yield* Effect.fail(new PricingPolicyNotFound({ pricingPolicyId }));
        }
        return policyOpt.value;
      }),

    getActive: () =>
      Effect.tryPromise({
        try: () =>
          client.pricingPolicy.findMany({
            where: { status: "ACTIVE" },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            take: 2,
            select: pricingPolicySelect,
          }),
        catch: cause =>
          new PricingPolicyRepositoryError({
            operation: "pricingPolicy.getActive",
            cause,
          }),
      }).pipe(
        Effect.flatMap(rows => Match.value(rows).pipe(
          Match.when(
            value => value.length === 0,
            () => Effect.fail(new ActivePricingPolicyNotFound({ reason: "MISSING_ACTIVE_POLICY" })),
          ),
          Match.when(
            value => value.length > 1,
            value => Effect.fail(new ActivePricingPolicyAmbiguous({
              pricingPolicyIds: value.map(row => row.id),
            })),
          ),
          Match.orElse(value => Effect.succeed(toPricingPolicyRow(value[0]!))),
        )),
        defectOn(PricingPolicyRepositoryError),
      ),
  };
}
