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
import type { BillingPreviewCouponCandidateRow } from "../models";
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

const selectBillingPreviewCandidateRow = {
  id: true,
  couponId: true,
  assignedAt: true,
  status: true,
  coupon: {
    select: {
      code: true,
      discountType: true,
      discountValue: true,
      expiresAt: true,
      couponRuleId: true,
      status: true,
      couponRule: {
        select: {
          name: true,
          priority: true,
          triggerType: true,
          minRidingMinutes: true,
        },
      },
    },
  },
} satisfies PrismaTypes.UserCouponSelect;

type BillingPreviewCandidateRecord = PrismaTypes.UserCouponGetPayload<{
  select: typeof selectBillingPreviewCandidateRow;
}>;

function toBillingPreviewCouponCandidateRow(
  row: BillingPreviewCandidateRecord,
): BillingPreviewCouponCandidateRow {
  return {
    userCouponId: row.id,
    couponId: row.couponId,
    code: row.coupon.code,
    status: row.status,
    discountType: row.coupon.discountType,
    discountValue: row.coupon.discountValue,
    expiresAt: row.coupon.expiresAt,
    assignedAt: row.assignedAt,
    couponRuleId: row.coupon.couponRuleId,
    couponRuleName: row.coupon.couponRule?.name ?? null,
    couponRulePriority: row.coupon.couponRule?.priority ?? null,
    couponRuleTriggerType: row.coupon.couponRule?.triggerType ?? null,
    couponRuleMinRidingMinutes: row.coupon.couponRule?.minRidingMinutes ?? null,
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
    listBillingPreviewCandidatesForUser: (userId, input) =>
      Effect.gen(function* () {
        const rows = yield* Effect.tryPromise({
          try: () =>
            client.userCoupon.findMany({
              where: {
                userId,
                status: "ASSIGNED",
                coupon: {
                  status: "ACTIVE",
                  discountType: "FIXED_AMOUNT",
                  OR: [
                    { expiresAt: null },
                    { expiresAt: { gte: input.previewedAt } },
                  ],
                  couponRule: {
                    is: {
                      status: "ACTIVE",
                      triggerType: "RIDING_DURATION",
                      OR: [
                        { minRidingMinutes: null },
                        { minRidingMinutes: { lte: input.billableMinutes } },
                      ],
                      AND: [
                        {
                          OR: [
                            { activeFrom: null },
                            { activeFrom: { lte: input.previewedAt } },
                          ],
                        },
                        {
                          OR: [
                            { activeTo: null },
                            { activeTo: { gte: input.previewedAt } },
                          ],
                        },
                      ],
                    },
                  },
                },
              },
              orderBy: [
                { assignedAt: "desc" },
                { id: "desc" },
              ],
              select: selectBillingPreviewCandidateRow,
            }),
          catch: err =>
            new CouponRepositoryError({
              operation: "listBillingPreviewCandidatesForUser.findMany",
              message: `Failed to list billing preview coupons for user ${userId}`,
              cause: err,
            }),
        });

        return rows.map(toBillingPreviewCouponCandidateRow);
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
