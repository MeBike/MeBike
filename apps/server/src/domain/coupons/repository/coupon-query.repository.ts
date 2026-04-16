import { Effect, Layer } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { Prisma } from "@/infrastructure/prisma";

import type { BillingPreviewDiscountRuleRow } from "../models";
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

type BillingPreviewDiscountRuleRecord = PrismaTypes.CouponRuleGetPayload<{
  select: typeof selectBillingPreviewDiscountRuleRow;
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

export function makeCouponQueryRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): CouponQueryRepo {
  return {
    listGlobalBillingPreviewDiscountRules: input =>
      Effect.gen(function* () {
        const rows = yield* Effect.tryPromise({
          try: () =>
            client.couponRule.findMany({
              where: {
                status: "ACTIVE",
                triggerType: "RIDING_DURATION",
                discountType: "FIXED_AMOUNT",
                minRidingMinutes: {
                  lte: input.billableMinutes,
                },
              },
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
