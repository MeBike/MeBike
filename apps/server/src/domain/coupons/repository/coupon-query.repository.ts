import { Effect, Layer } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { Prisma } from "@/infrastructure/prisma";

import type {
  ActiveCouponRuleRow,
  BillingPreviewDiscountRuleRow,
} from "../models";
import type { CouponQueryRepo } from "./coupon.repository.types";

import { CouponRepositoryError } from "../domain-errors";

const selectBillingPreviewDiscountRuleRow = {
  id: true,
  name: true,
  triggerType: true,
  minRidingMinutes: true,
  discountType: true,
  discountValue: true,
  priority: true,
  createdAt: true,
} satisfies PrismaTypes.CouponRuleSelect;

const selectActiveCouponRuleRow = {
  id: true,
  name: true,
  triggerType: true,
  minRidingMinutes: true,
  discountType: true,
  discountValue: true,
  status: true,
  priority: true,
  activeFrom: true,
  activeTo: true,
  createdAt: true,
} satisfies PrismaTypes.CouponRuleSelect;

type BillingPreviewDiscountRuleRecord = PrismaTypes.CouponRuleGetPayload<{
  select: typeof selectBillingPreviewDiscountRuleRow;
}>;

type ActiveCouponRuleRecord = PrismaTypes.CouponRuleGetPayload<{
  select: typeof selectActiveCouponRuleRow;
}>;

function toBillingPreviewDiscountRuleRow(
  row: BillingPreviewDiscountRuleRecord,
): BillingPreviewDiscountRuleRow {
  return {
    ruleId: row.id,
    name: row.name,
    triggerType: row.triggerType,
    minRidingMinutes: row.minRidingMinutes,
    discountType: row.discountType,
    discountValue: row.discountValue,
    priority: row.priority,
    createdAt: row.createdAt,
  };
}

function toActiveCouponRuleRow(
  row: ActiveCouponRuleRecord,
): ActiveCouponRuleRow {
  if (row.minRidingMinutes === null) {
    throw new Error(
      `Expected active coupon rule ${row.id} to have minRidingMinutes`,
    );
  }

  return {
    id: row.id,
    name: row.name,
    triggerType: row.triggerType,
    minRidingMinutes: row.minRidingMinutes,
    discountType: row.discountType,
    discountValue: row.discountValue,
    status: row.status,
    priority: row.priority,
    activeFrom: row.activeFrom,
    activeTo: row.activeTo,
    createdAt: row.createdAt,
  };
}

function activeGlobalRidingDurationFixedAmountWhere(
  now: Date,
  extraAnd: readonly PrismaTypes.CouponRuleWhereInput[] = [],
): PrismaTypes.CouponRuleWhereInput {
  return {
    status: "ACTIVE",
    triggerType: "RIDING_DURATION",
    discountType: "FIXED_AMOUNT",
    AND: [
      { minRidingMinutes: { not: null } },
      {
        OR: [
          { activeFrom: null },
          { activeFrom: { lte: now } },
        ],
      },
      {
        OR: [
          { activeTo: null },
          { activeTo: { gte: now } },
        ],
      },
      ...extraAnd,
    ],
  };
}

export function makeCouponQueryRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): CouponQueryRepo {
  return {
    listActiveGlobalCouponRules: input =>
      Effect.gen(function* () {
        const rows = yield* Effect.tryPromise({
          try: () =>
            client.couponRule.findMany({
              where: activeGlobalRidingDurationFixedAmountWhere(input.now),
              orderBy: [
                { minRidingMinutes: "asc" },
                { priority: "asc" },
                { createdAt: "asc" },
                { id: "asc" },
              ],
              select: selectActiveCouponRuleRow,
            }),
          catch: err =>
            new CouponRepositoryError({
              operation: "listActiveGlobalCouponRules.findMany",
              message: "Failed to list active global coupon rules",
              cause: err,
            }),
        });

        return rows.map(toActiveCouponRuleRow);
      }).pipe(defectOn(CouponRepositoryError)),
    listGlobalBillingPreviewDiscountRules: input =>
      Effect.gen(function* () {
        const rows = yield* Effect.tryPromise({
          try: () =>
            client.couponRule.findMany({
              where: activeGlobalRidingDurationFixedAmountWhere(
                input.previewedAt,
                [{ minRidingMinutes: { lte: input.billableMinutes } }],
              ),
              orderBy: [
                { priority: "asc" },
                { discountValue: "desc" },
                { minRidingMinutes: "desc" },
                { createdAt: "desc" },
                { id: "desc" },
              ],
              select: selectBillingPreviewDiscountRuleRow,
            }),
          catch: err =>
            new CouponRepositoryError({
              operation: "listGlobalBillingPreviewDiscountRules.findMany",
              message: "Failed to list global billing preview discount rules",
              cause: err,
            }),
        });

        return rows.map(toBillingPreviewDiscountRuleRow);
      }).pipe(defectOn(CouponRepositoryError)),
  };
}

const makeCouponQueryRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeCouponQueryRepository(client);
});

export class CouponQueryRepository extends Effect.Service<CouponQueryRepository>()(
  "CouponQueryRepository",
  {
    effect: makeCouponQueryRepositoryEffect,
  },
) {}

export const CouponQueryRepositoryLive = Layer.effect(
  CouponQueryRepository,
  makeCouponQueryRepositoryEffect.pipe(Effect.map(CouponQueryRepository.make)),
);
