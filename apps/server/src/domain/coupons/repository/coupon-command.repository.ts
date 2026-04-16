import { Effect, Layer } from "effect";

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
