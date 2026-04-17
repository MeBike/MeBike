import { Effect, Layer, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";
import { Prisma } from "@/infrastructure/prisma";

import type { AdminCouponRuleRow } from "../models";
import type { CouponCommandRepo } from "./coupon.repository.types";

import { CouponRepositoryError } from "../domain-errors";

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

type AdminCouponRuleRecord = PrismaTypes.CouponRuleGetPayload<{
  select: typeof selectAdminCouponRuleRow;
}>;

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

export function makeCouponCommandRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): CouponCommandRepo {
  return {
    findAdminCouponRule: ruleId =>
      Effect.gen(function* () {
        const existing = yield* Effect.tryPromise({
          try: () =>
            client.couponRule.findUnique({
              where: { id: ruleId },
              select: selectAdminCouponRuleRow,
            }),
          catch: err =>
            new CouponRepositoryError({
              operation: "findAdminCouponRule",
              message: "Failed to find admin coupon rule",
              cause: err,
            }),
        });

        return existing
          ? Option.some(toAdminCouponRuleRow(existing))
          : Option.none();
      }).pipe(defectOn(CouponRepositoryError)),
    findActiveRuleWithMinRidingMinutes: (minRidingMinutes, excludeRuleId) =>
      Effect.gen(function* () {
        const existing = yield* Effect.tryPromise({
          try: () =>
            client.couponRule.findFirst({
              where: {
                status: "ACTIVE",
                triggerType: "RIDING_DURATION",
                discountType: "FIXED_AMOUNT",
                minRidingMinutes,
                ...(excludeRuleId ? { id: { not: excludeRuleId } } : {}),
              },
              select: { id: true },
              orderBy: [
                { createdAt: "asc" },
                { id: "asc" },
              ],
            }),
          catch: err =>
            new CouponRepositoryError({
              operation: "findActiveRuleWithMinRidingMinutes",
              message: "Failed to find active coupon rule by tier",
              cause: err,
            }),
        });

        return existing ? Option.some(existing) : Option.none();
      }).pipe(defectOn(CouponRepositoryError)),
    hasRentalBillingRecordForRule: ruleId =>
      Effect.gen(function* () {
        const existing = yield* Effect.tryPromise({
          try: () =>
            client.rentalBillingRecord.findFirst({
              where: {
                OR: [
                  { couponRuleId: ruleId },
                  {
                    couponRuleSnapshot: {
                      path: ["ruleId"],
                      equals: ruleId,
                    },
                  },
                ],
              },
              select: { id: true },
            }),
          catch: err =>
            new CouponRepositoryError({
              operation: "hasRentalBillingRecordForRule",
              message: "Failed to check coupon rule billing usage",
              cause: err,
            }),
        });

        return Boolean(existing);
      }).pipe(defectOn(CouponRepositoryError)),
    createAdminCouponRule: data =>
      Effect.tryPromise({
        try: () =>
          client.couponRule.create({
            data: {
              name: data.name,
              triggerType: data.triggerType,
              minRidingMinutes: data.minRidingMinutes,
              minCompletedRentals: data.minCompletedRentals,
              discountType: data.discountType,
              discountValue: data.discountValue,
              status: data.status,
              priority: data.priority,
              activeFrom: data.activeFrom,
              activeTo: data.activeTo,
            },
            select: selectAdminCouponRuleRow,
          }),
        catch: err =>
          new CouponRepositoryError({
            operation: "createAdminCouponRule",
            message: "Failed to create admin coupon rule",
            cause: err,
          }),
      }).pipe(
        Effect.map(toAdminCouponRuleRow),
        defectOn(CouponRepositoryError),
      ),
    activateAdminCouponRule: ruleId =>
      Effect.gen(function* () {
        const existing = yield* Effect.tryPromise({
          try: () =>
            client.couponRule.findUnique({
              where: { id: ruleId },
              select: selectAdminCouponRuleRow,
            }),
          catch: err =>
            new CouponRepositoryError({
              operation: "activateAdminCouponRule.findExisting",
              message: "Failed to find admin coupon rule before activate",
              cause: err,
            }),
        });

        if (!existing) {
          return Option.none();
        }

        if (existing.status === "ACTIVE") {
          return Option.some(toAdminCouponRuleRow(existing));
        }

        const activated = yield* Effect.tryPromise({
          try: () =>
            client.couponRule.update({
              where: { id: ruleId },
              data: {
                status: "ACTIVE",
              },
              select: selectAdminCouponRuleRow,
            }),
          catch: err =>
            new CouponRepositoryError({
              operation: "activateAdminCouponRule",
              message: "Failed to activate admin coupon rule",
              cause: err,
            }),
        });

        return Option.some(toAdminCouponRuleRow(activated));
      }).pipe(
        defectOn(CouponRepositoryError),
      ),
    deactivateAdminCouponRule: ruleId =>
      Effect.gen(function* () {
        const existing = yield* Effect.tryPromise({
          try: () =>
            client.couponRule.findUnique({
              where: { id: ruleId },
              select: selectAdminCouponRuleRow,
            }),
          catch: err =>
            new CouponRepositoryError({
              operation: "deactivateAdminCouponRule.findExisting",
              message: "Failed to find admin coupon rule before deactivate",
              cause: err,
            }),
        });

        if (!existing) {
          return Option.none();
        }

        if (existing.status === "INACTIVE") {
          return Option.some(toAdminCouponRuleRow(existing));
        }

        const deactivated = yield* Effect.tryPromise({
          try: () =>
            client.couponRule.update({
              where: { id: ruleId },
              data: {
                status: "INACTIVE",
              },
              select: selectAdminCouponRuleRow,
            }),
          catch: err =>
            new CouponRepositoryError({
              operation: "deactivateAdminCouponRule",
              message: "Failed to deactivate admin coupon rule",
              cause: err,
            }),
        });

        return Option.some(toAdminCouponRuleRow(deactivated));
      }).pipe(
        defectOn(CouponRepositoryError),
      ),
    updateAdminCouponRule: (ruleId, data) =>
      Effect.gen(function* () {
        const existing = yield* Effect.tryPromise({
          try: () =>
            client.couponRule.findUnique({
              where: { id: ruleId },
              select: { id: true },
            }),
          catch: err =>
            new CouponRepositoryError({
              operation: "updateAdminCouponRule.findExisting",
              message: "Failed to find admin coupon rule before update",
              cause: err,
            }),
        });

        if (!existing) {
          return Option.none();
        }

        const updated = yield* Effect.tryPromise({
          try: () =>
            client.couponRule.update({
              where: { id: ruleId },
              data: {
                name: data.name,
                triggerType: data.triggerType,
                minRidingMinutes: data.minRidingMinutes,
                minCompletedRentals: data.minCompletedRentals,
                discountType: data.discountType,
                discountValue: data.discountValue,
                status: data.status,
                priority: data.priority,
                activeFrom: data.activeFrom,
                activeTo: data.activeTo,
              },
              select: selectAdminCouponRuleRow,
            }),
          catch: err =>
            new CouponRepositoryError({
              operation: "updateAdminCouponRule",
              message: "Failed to update admin coupon rule",
              cause: err,
            }),
        });

        return Option.some(toAdminCouponRuleRow(updated));
      }).pipe(
        defectOn(CouponRepositoryError),
      ),
  };
}

const makeCouponCommandRepositoryEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  return makeCouponCommandRepository(client);
});

export class CouponCommandRepository extends Effect.Service<CouponCommandRepository>()(
  "CouponCommandRepository",
  {
    effect: makeCouponCommandRepositoryEffect,
  },
) {}

export const CouponCommandRepositoryLive = Layer.effect(
  CouponCommandRepository,
  makeCouponCommandRepositoryEffect.pipe(
    Effect.map(CouponCommandRepository.make),
  ),
);
