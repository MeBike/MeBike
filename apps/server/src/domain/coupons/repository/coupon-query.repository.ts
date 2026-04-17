import { Effect, Layer } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { toMinorUnit } from "@/domain/shared/money";
import {
  makePageResult,
  normalizedPage,
} from "@/domain/shared/pagination";
import { Prisma } from "@/infrastructure/prisma";

import type {
  ActiveCouponRuleRow,
  AdminCouponStatsRow,
  AdminCouponRuleRow,
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

const selectAdminCouponRuleRow = {
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
  updatedAt: true,
} satisfies PrismaTypes.CouponRuleSelect;

type BillingPreviewDiscountRuleRecord = PrismaTypes.CouponRuleGetPayload<{
  select: typeof selectBillingPreviewDiscountRuleRow;
}>;

type ActiveCouponRuleRecord = PrismaTypes.CouponRuleGetPayload<{
  select: typeof selectActiveCouponRuleRow;
}>;

type AdminCouponRuleRecord = PrismaTypes.CouponRuleGetPayload<{
  select: typeof selectAdminCouponRuleRow;
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

function toAdminCouponRuleRow(
  row: AdminCouponRuleRecord,
): AdminCouponRuleRow {
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
    updatedAt: row.updatedAt,
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

function adminCouponRulesOrderBy(): PrismaTypes.CouponRuleOrderByWithRelationInput[] {
  return [
    { createdAt: "desc" },
    { id: "desc" },
  ];
}

export function makeCouponQueryRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): CouponQueryRepo {
  function couponStatsRentalWhere(input: {
    readonly from?: Date;
    readonly to?: Date;
  }): PrismaTypes.RentalWhereInput {
    return {
      status: "COMPLETED",
      ...(input.from && input.to
        ? {
            endTime: {
              gte: input.from,
              lte: input.to,
            },
          }
        : {}),
    };
  }

  function toCouponStats(input: {
    readonly from?: Date;
    readonly to?: Date;
    readonly totalCompletedRentals: number;
    readonly discountedRentalsCount: number;
    readonly totalDiscountAmount: number;
    readonly statsByDiscountAmount: readonly {
      readonly discountAmount: number;
      readonly rentalsCount: number;
      readonly totalDiscountAmount: number;
    }[];
  }): AdminCouponStatsRow {
    const nonDiscountedRentalsCount = Math.max(
      input.totalCompletedRentals - input.discountedRentalsCount,
      0,
    );

    return {
      range: {
        from: input.from ?? null,
        to: input.to ?? null,
      },
      summary: {
        totalCompletedRentals: input.totalCompletedRentals,
        discountedRentalsCount: input.discountedRentalsCount,
        nonDiscountedRentalsCount,
        discountRate: input.totalCompletedRentals === 0
          ? 0
          : Number((input.discountedRentalsCount / input.totalCompletedRentals).toFixed(4)),
        totalDiscountAmount: input.totalDiscountAmount,
        avgDiscountAmount: input.discountedRentalsCount === 0
          ? 0
          : Number((input.totalDiscountAmount / input.discountedRentalsCount).toFixed(2)),
      },
      statsByDiscountAmount: input.statsByDiscountAmount,
      topAppliedRule: null,
    };
  }

  return {
    listAdminCouponRules: (filter, pageReq) =>
      Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage({
          ...pageReq,
          pageSize: Math.min(pageReq.pageSize, 100),
        });

        const where: PrismaTypes.CouponRuleWhereInput = {
          ...(filter.status ? { status: filter.status } : {}),
          ...(filter.triggerType ? { triggerType: filter.triggerType } : {}),
          ...(filter.discountType ? { discountType: filter.discountType } : {}),
        };

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.couponRule.count({ where }),
            catch: err =>
              new CouponRepositoryError({
                operation: "listAdminCouponRules.count",
                message: "Failed to count admin coupon rules",
                cause: err,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.couponRule.findMany({
                where,
                skip,
                take,
                orderBy: adminCouponRulesOrderBy(),
                select: selectAdminCouponRuleRow,
              }),
            catch: err =>
              new CouponRepositoryError({
                operation: "listAdminCouponRules.findMany",
                message: "Failed to list admin coupon rules",
                cause: err,
              }),
          }),
        ]);

        return makePageResult(
          items.map(toAdminCouponRuleRow),
          total,
          page,
          pageSize,
        );
      }).pipe(defectOn(CouponRepositoryError)),
    getAdminCouponStats: input =>
      Effect.gen(function* () {
        const rentalWhere = couponStatsRentalWhere(input);

        const [totalCompletedRentals, discountedAggregate, groupedDiscountAmounts] = yield* Effect.all([
          Effect.tryPromise({
            try: () =>
              client.rental.count({
                where: rentalWhere,
              }),
            catch: err =>
              new CouponRepositoryError({
                operation: "getAdminCouponStats.countCompletedRentals",
                message: "Failed to count completed rentals for coupon stats",
                cause: err,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.rentalBillingRecord.aggregate({
                where: {
                  rental: {
                    is: rentalWhere,
                  },
                  couponDiscountAmount: {
                    gt: "0",
                  },
                },
                _count: {
                  _all: true,
                },
                _sum: {
                  couponDiscountAmount: true,
                },
              }),
            catch: err =>
              new CouponRepositoryError({
                operation: "getAdminCouponStats.aggregateDiscountedRentals",
                message: "Failed to aggregate discounted rentals for coupon stats",
                cause: err,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.rentalBillingRecord.groupBy({
                by: ["couponDiscountAmount"],
                where: {
                  rental: {
                    is: rentalWhere,
                  },
                  couponDiscountAmount: {
                    gt: "0",
                  },
                },
                _count: {
                  _all: true,
                },
                _sum: {
                  couponDiscountAmount: true,
                },
                orderBy: {
                  couponDiscountAmount: "asc",
                },
              }),
            catch: err =>
              new CouponRepositoryError({
                operation: "getAdminCouponStats.groupByDiscountAmount",
                message: "Failed to group coupon stats by discount amount",
                cause: err,
              }),
          }),
        ]);

        const totalDiscountAmount = Number(
          toMinorUnit(discountedAggregate._sum.couponDiscountAmount),
        );

        return toCouponStats({
          from: input.from,
          to: input.to,
          totalCompletedRentals,
          discountedRentalsCount: discountedAggregate._count._all,
          totalDiscountAmount,
          statsByDiscountAmount: groupedDiscountAmounts.map(row => ({
            discountAmount: Number(toMinorUnit(row.couponDiscountAmount)),
            rentalsCount: row._count._all,
            totalDiscountAmount: Number(toMinorUnit(row._sum.couponDiscountAmount)),
          })),
        });
      }).pipe(defectOn(CouponRepositoryError)),
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
