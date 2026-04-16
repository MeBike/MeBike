import { Effect, Layer } from "effect";

import type { PrismaClient, Prisma as PrismaTypes } from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import {
  makePageResult,
  normalizedPage,
} from "@/domain/shared/pagination";
import { Prisma } from "@/infrastructure/prisma";

import type {
  ActiveCouponRuleRow,
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
