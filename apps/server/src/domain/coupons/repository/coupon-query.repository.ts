import { Effect, Layer, Option } from "effect";

import type { PageRequest } from "@/domain/shared/pagination";
import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import {
  makePageResult,
  normalizedPage,
} from "@/domain/shared/pagination";
import { Prisma } from "@/infrastructure/prisma";

import type { CouponSortField } from "../models";
import type { BillingPreviewDiscountRuleRow } from "../models";
import type { CouponQueryRepo } from "./coupon.repository.types";

import { CouponRepositoryError } from "../domain-errors";
import {
  selectUserCouponDetailRow,
  selectUserCouponListItemRow,
  toUserCouponDetailRow,
  toUserCouponListItemRow,
} from "./coupon.mappers";

function toCouponOrderBy(
  _req: PageRequest<CouponSortField>,
): PrismaTypes.UserCouponOrderByWithRelationInput {
  return { assignedAt: "desc" };
}

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
    getForUserById: (userId, userCouponId) =>
      Effect.gen(function* () {
        const item = yield* Effect.tryPromise({
          try: () =>
            client.userCoupon.findFirst({
              where: {
                id: userCouponId,
                userId,
              },
              select: selectUserCouponDetailRow,
            }),
          catch: err =>
            new CouponRepositoryError({
              operation: "getForUserById.findFirst",
              message: `Failed to get coupon ${userCouponId} for user ${userId}`,
              cause: err,
            }),
        });

        return Option.fromNullable(item).pipe(
          Option.map(toUserCouponDetailRow),
        );
      }).pipe(defectOn(CouponRepositoryError)),
    listForUser: (userId, filter, pageReq) =>
      Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage(pageReq);

        const where: PrismaTypes.UserCouponWhereInput = {
          userId,
          ...(filter.status ? { status: filter.status } : {}),
        };

        const orderBy = toCouponOrderBy(pageReq);

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.userCoupon.count({ where }),
            catch: err =>
              new CouponRepositoryError({
                operation: "listForUser.count",
                message: `Failed to count coupons for user ${userId}`,
                cause: err,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.userCoupon.findMany({
                where,
                skip,
                take,
                orderBy,
                select: selectUserCouponListItemRow,
              }),
            catch: err =>
              new CouponRepositoryError({
                operation: "listForUser.findMany",
                message: `Failed to list coupons for user ${userId}`,
                cause: err,
              }),
          }),
        ]);

        return makePageResult(items.map(toUserCouponListItemRow), total, page, pageSize);
      }).pipe(defectOn(CouponRepositoryError)),
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
