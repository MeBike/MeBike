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
  AdminCouponUsageLogRow,
  AdminCouponRuleRow,
  BillingPreviewDiscountRuleRow,
  CouponRuleSnapshot,
  CouponStatsByRuleRow,
} from "../models";
import type { CouponQueryRepo } from "./coupon.repository.types";

import { CouponRepositoryError } from "../domain-errors";
import { GLOBAL_AUTO_DISCOUNT_TIERS } from "../global-auto-discount.policy";

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

const selectAdminCouponUsageLogRow = {
  rentalId: true,
  pricingPolicyId: true,
  totalDurationMinutes: true,
  baseAmount: true,
  couponRuleId: true,
  couponRuleSnapshot: true,
  couponDiscountAmount: true,
  subscriptionDiscountAmount: true,
  totalAmount: true,
  createdAt: true,
  couponRule: {
    select: {
      id: true,
      name: true,
      triggerType: true,
      minRidingMinutes: true,
      discountType: true,
      discountValue: true,
    },
  },
  rental: {
    select: {
      id: true,
      userId: true,
      status: true,
      startTime: true,
      endTime: true,
      subscriptionId: true,
      reservation: {
        select: {
          prepaid: true,
        },
      },
    },
  },
} satisfies PrismaTypes.RentalBillingRecordSelect;

type BillingPreviewDiscountRuleRecord = PrismaTypes.CouponRuleGetPayload<{
  select: typeof selectBillingPreviewDiscountRuleRow;
}>;

type ActiveCouponRuleRecord = PrismaTypes.CouponRuleGetPayload<{
  select: typeof selectActiveCouponRuleRow;
}>;

type AdminCouponRuleRecord = PrismaTypes.CouponRuleGetPayload<{
  select: typeof selectAdminCouponRuleRow;
}>;

type AdminCouponUsageLogRecord = PrismaTypes.RentalBillingRecordGetPayload<{
  select: typeof selectAdminCouponUsageLogRow;
}>;

type CouponRuleUsageAggregate = {
  readonly ruleId: string;
  readonly appliedCount: number;
  readonly totalDiscountAmount: number;
};

type CouponRuleIdentity = {
  readonly ruleId: string;
  readonly name: string;
  readonly triggerType: "RIDING_DURATION";
  readonly minRidingMinutes: number | null;
  readonly discountType: "FIXED_AMOUNT";
  readonly discountValue: number;
  readonly source: "BILLING_RECORD_RULE" | "BILLING_RECORD_SNAPSHOT";
};

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

function toAdminCouponUsageLogRow(
  row: AdminCouponUsageLogRecord,
): AdminCouponUsageLogRow {
  const couponDiscountAmount = Number(toMinorUnit(row.couponDiscountAmount));
  const couponRuleIdentity = readCouponRuleIdentity(row);

  return {
    rentalId: row.rentalId,
    userId: row.rental.userId,
    pricingPolicyId: row.pricingPolicyId,
    rentalStatus: row.rental.status,
    startTime: row.rental.startTime,
    endTime: row.rental.endTime,
    totalDurationMinutes: row.totalDurationMinutes,
    baseAmount: Number(toMinorUnit(row.baseAmount)),
    prepaidAmount: Number(toMinorUnit(row.rental.reservation?.prepaid)),
    subscriptionApplied: Boolean(row.rental.subscriptionId),
    subscriptionDiscountAmount: Number(toMinorUnit(row.subscriptionDiscountAmount)),
    couponRuleId: couponRuleIdentity?.ruleId ?? row.couponRuleId,
    couponRuleName: couponRuleIdentity?.name ?? null,
    couponRuleMinRidingMinutes: couponRuleIdentity?.minRidingMinutes ?? null,
    couponRuleDiscountType: couponRuleIdentity?.discountType ?? null,
    couponRuleDiscountValue: couponRuleIdentity?.discountValue ?? null,
    couponDiscountAmount,
    totalAmount: Number(toMinorUnit(row.totalAmount)),
    appliedAt: row.createdAt,
    derivedTier: deriveCouponUsageTier(couponDiscountAmount),
  };
}

function readCouponRuleIdentity(
  row: Pick<
    AdminCouponUsageLogRecord,
    "couponRuleId" | "couponRuleSnapshot" | "couponRule"
  >,
): CouponRuleIdentity | null {
  const snapshot = readCouponRuleSnapshot(row.couponRuleSnapshot);
  if (snapshot) {
    return {
      ruleId: snapshot.ruleId,
      name: snapshot.name,
      triggerType: snapshot.triggerType,
      minRidingMinutes: snapshot.minRidingMinutes,
      discountType: snapshot.discountType,
      discountValue: snapshot.discountValue,
      source: "BILLING_RECORD_SNAPSHOT",
    };
  }

  if (
    row.couponRule
    && row.couponRule.triggerType === "RIDING_DURATION"
    && row.couponRule.discountType === "FIXED_AMOUNT"
  ) {
    return {
      ruleId: row.couponRule.id,
      name: row.couponRule.name,
      triggerType: row.couponRule.triggerType,
      minRidingMinutes: row.couponRule.minRidingMinutes,
      discountType: row.couponRule.discountType,
      discountValue: Number(toMinorUnit(row.couponRule.discountValue)),
      source: "BILLING_RECORD_RULE",
    };
  }

  return null;
}

function readCouponRuleSnapshot(
  value: PrismaTypes.JsonValue | null,
): CouponRuleSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const snapshot = value as Record<string, unknown>;
  if (
    typeof snapshot.ruleId !== "string"
    || typeof snapshot.name !== "string"
    || snapshot.triggerType !== "RIDING_DURATION"
    || typeof snapshot.minRidingMinutes !== "number"
    || snapshot.discountType !== "FIXED_AMOUNT"
    || typeof snapshot.discountValue !== "number"
    || typeof snapshot.priority !== "number"
    || typeof snapshot.billableMinutes !== "number"
    || typeof snapshot.billableHours !== "number"
    || typeof snapshot.appliedAt !== "string"
  ) {
    return null;
  }

  return {
    ruleId: snapshot.ruleId,
    name: snapshot.name,
    triggerType: snapshot.triggerType,
    minRidingMinutes: snapshot.minRidingMinutes,
    discountType: snapshot.discountType,
    discountValue: snapshot.discountValue,
    priority: snapshot.priority,
    billableMinutes: snapshot.billableMinutes,
    billableHours: snapshot.billableHours,
    appliedAt: snapshot.appliedAt,
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
      {
        OR: GLOBAL_AUTO_DISCOUNT_TIERS.map(tier => ({
          minRidingMinutes: tier.minRidingMinutes,
          discountValue: tier.discountValue.toString(),
        })),
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

function adminCouponUsageLogsOrderBy(): PrismaTypes.RentalBillingRecordOrderByWithRelationInput[] {
  return [
    { createdAt: "desc" },
    { id: "desc" },
  ];
}

function deriveCouponUsageTier(
  discountAmount: number,
): AdminCouponUsageLogRow["derivedTier"] {
  switch (discountAmount) {
    case 1000:
      return "TIER_1H_2H";
    case 2000:
      return "TIER_2H_4H";
    case 4000:
      return "TIER_4H_6H";
    case 6000:
      return "TIER_6H_PLUS";
    default:
      return null;
  }
}

function buildCouponStatsByRule(input: {
  readonly aggregates: readonly CouponRuleUsageAggregate[];
  readonly representativeRecords: readonly AdminCouponUsageLogRecord[];
}): CouponStatsByRuleRow[] {
  const identityByRuleId = new Map<string, CouponRuleIdentity>();

  for (const record of input.representativeRecords) {
    const identity = readCouponRuleIdentity(record);
    if (!identity) {
      continue;
    }

    identityByRuleId.set(record.couponRuleId ?? identity.ruleId, identity);
    identityByRuleId.set(identity.ruleId, identity);
  }

  const rows: CouponStatsByRuleRow[] = [];

  for (const aggregate of input.aggregates) {
    const identity = identityByRuleId.get(aggregate.ruleId);
    if (!identity) {
      continue;
    }

    rows.push({
      ruleId: identity.ruleId,
      name: identity.name,
      triggerType: identity.triggerType,
      minRidingMinutes: identity.minRidingMinutes,
      discountType: identity.discountType,
      discountValue: identity.discountValue,
      appliedCount: aggregate.appliedCount,
      totalDiscountAmount: aggregate.totalDiscountAmount,
      source: identity.source,
    });
  }

  return rows.sort((left, right) =>
    right.appliedCount - left.appliedCount
    || right.totalDiscountAmount - left.totalDiscountAmount
    || (left.minRidingMinutes ?? 0) - (right.minRidingMinutes ?? 0)
    || left.ruleId.localeCompare(right.ruleId),
  );
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
    readonly statsByRule: readonly CouponStatsByRuleRow[];
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
      statsByRule: input.statsByRule,
      topAppliedRule: input.statsByRule[0]
        ? {
            ruleId: input.statsByRule[0].ruleId,
            name: input.statsByRule[0].name,
            triggerType: input.statsByRule[0].triggerType,
            minRidingMinutes: input.statsByRule[0].minRidingMinutes,
            discountType: input.statsByRule[0].discountType,
            discountValue: input.statsByRule[0].discountValue,
            appliedCount: input.statsByRule[0].appliedCount,
            inferredFrom: input.statsByRule[0].source,
          }
        : null,
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

        const [
          totalCompletedRentals,
          discountedAggregate,
          groupedDiscountAmounts,
          groupedRuleUsage,
        ] = yield* Effect.all([
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
          Effect.tryPromise({
            try: () =>
              client.rentalBillingRecord.groupBy({
                by: ["couponRuleId"],
                where: {
                  rental: {
                    is: rentalWhere,
                  },
                  couponDiscountAmount: {
                    gt: "0",
                  },
                  couponRuleId: {
                    not: null,
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
                operation: "getAdminCouponStats.groupByRule",
                message: "Failed to group coupon stats by coupon rule",
                cause: err,
              }),
          }),
        ]);

        const ruleUsageAggregates: CouponRuleUsageAggregate[] = [];
        for (const row of groupedRuleUsage) {
          if (row.couponRuleId === null) {
            continue;
          }

          ruleUsageAggregates.push({
            ruleId: row.couponRuleId,
            appliedCount: row._count._all,
            totalDiscountAmount: Number(toMinorUnit(row._sum.couponDiscountAmount)),
          });
        }

        const ruleUsageRepresentativeRecords = yield* Effect.all(
          ruleUsageAggregates.map(aggregate =>
            Effect.tryPromise({
              try: () =>
                client.rentalBillingRecord.findFirst({
                  where: {
                    rental: {
                      is: rentalWhere,
                    },
                    couponDiscountAmount: {
                      gt: "0",
                    },
                    couponRuleId: aggregate.ruleId,
                  },
                  orderBy: adminCouponUsageLogsOrderBy(),
                  select: selectAdminCouponUsageLogRow,
                }),
              catch: err =>
                new CouponRepositoryError({
                  operation: "getAdminCouponStats.findRuleRepresentative",
                  message: "Failed to load coupon rule representative record for stats",
                  cause: err,
                }),
            }),
          ),
        );

        const totalDiscountAmount = Number(
          toMinorUnit(discountedAggregate._sum.couponDiscountAmount),
        );

        return toCouponStats({
          from: input.from,
          to: input.to,
          totalCompletedRentals,
          discountedRentalsCount: discountedAggregate._count._all,
          totalDiscountAmount,
          statsByRule: buildCouponStatsByRule({
            aggregates: ruleUsageAggregates,
            representativeRecords: ruleUsageRepresentativeRecords.filter(
              (record): record is AdminCouponUsageLogRecord => record !== null,
            ),
          }),
          statsByDiscountAmount: groupedDiscountAmounts.map(row => ({
            discountAmount: Number(toMinorUnit(row.couponDiscountAmount)),
            rentalsCount: row._count._all,
            totalDiscountAmount: Number(toMinorUnit(row._sum.couponDiscountAmount)),
          })),
        });
      }).pipe(defectOn(CouponRepositoryError)),
    listAdminCouponUsageLogs: (filter, pageReq) =>
      Effect.gen(function* () {
        const { page, pageSize, skip, take } = normalizedPage({
          ...pageReq,
          pageSize: Math.min(pageReq.pageSize, 100),
        });

        const where: PrismaTypes.RentalBillingRecordWhereInput = {
          couponDiscountAmount: {
            gt: "0",
            ...(filter.discountAmount !== undefined
              ? { equals: filter.discountAmount.toString() }
              : {}),
          },
          ...(filter.from || filter.to
            ? {
                createdAt: {
                  ...(filter.from ? { gte: filter.from } : {}),
                  ...(filter.to ? { lte: filter.to } : {}),
                },
              }
            : {}),
          rental: {
            is: {
              status: "COMPLETED",
              ...(filter.userId ? { userId: filter.userId } : {}),
              ...(filter.rentalId ? { id: filter.rentalId } : {}),
              ...(filter.subscriptionApplied === undefined
                ? {}
                : filter.subscriptionApplied
                  ? { subscriptionId: { not: null } }
                  : { subscriptionId: null }),
            },
          },
        };

        const [total, items] = yield* Effect.all([
          Effect.tryPromise({
            try: () => client.rentalBillingRecord.count({ where }),
            catch: err =>
              new CouponRepositoryError({
                operation: "listAdminCouponUsageLogs.count",
                message: "Failed to count admin coupon usage logs",
                cause: err,
              }),
          }),
          Effect.tryPromise({
            try: () =>
              client.rentalBillingRecord.findMany({
                where,
                skip,
                take,
                orderBy: adminCouponUsageLogsOrderBy(),
                select: selectAdminCouponUsageLogRow,
              }),
            catch: err =>
              new CouponRepositoryError({
                operation: "listAdminCouponUsageLogs.findMany",
                message: "Failed to list admin coupon usage logs",
                cause: err,
              }),
          }),
        ]);

        return makePageResult(
          items.map(toAdminCouponUsageLogRow),
          total,
          page,
          pageSize,
        );
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
