import { Effect, Match, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";

import type { PricingPolicyReadRepo } from "../pricing-policy.repository.types";

import {
  ActivePricingPolicyAmbiguous,
  ActivePricingPolicyNotFound,
  PricingPolicyNotFound,
  PricingPolicyRepositoryError,
} from "../../domain-errors";
import {
  pricingPolicySelect,
  toPricingPolicyRow,
} from "../pricing-policy.mappers";

/**
 * Repository chỉ-đọc cho pricing policy.
 *
 * Module này gom toàn bộ query không có side effect, gồm lookup policy đang
 * active và usage summary dùng cho rule bất biến ở service layer.
 */
export function makePricingPolicyReadRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): PricingPolicyReadRepo {
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
        // Tái dùng nullable lookup để logic đổi "không tìm thấy row" sang lỗi
        // domain chỉ nằm ở một chỗ.
        const policyOpt = yield* makePricingPolicyReadRepository(client).findById(pricingPolicyId);
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
          // Rule hiện tại yêu cầu đúng một pricing policy đang active.
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

    listByStatus: status =>
      Effect.tryPromise({
        try: () =>
          client.pricingPolicy.findMany({
            where: status ? { status } : undefined,
            orderBy: [{ createdAt: "desc" }, { id: "desc" }],
            select: pricingPolicySelect,
          }),
        catch: cause =>
          new PricingPolicyRepositoryError({
            operation: "pricingPolicy.listByStatus",
            cause,
          }),
      }).pipe(
        Effect.map(rows => rows.map(toPricingPolicyRow)),
        defectOn(PricingPolicyRepositoryError),
      ),

    getUsageSummary: pricingPolicyId =>
      Effect.tryPromise({
        try: async () => {
          // Cả ba loại tham chiếu này đều có thể "đóng băng" ý nghĩa lịch sử của
          // policy, nên service layer phải kiểm tra đủ cả ba trước khi cho sửa.
          const [reservationCount, rentalCount, billingRecordCount] = await Promise.all([
            client.reservation.count({ where: { pricingPolicyId } }),
            client.rental.count({ where: { pricingPolicyId } }),
            client.rentalBillingRecord.count({ where: { pricingPolicyId } }),
          ]);

          return {
            reservationCount,
            rentalCount,
            billingRecordCount,
            isUsed: reservationCount > 0 || rentalCount > 0 || billingRecordCount > 0,
          };
        },
        catch: cause =>
          new PricingPolicyRepositoryError({
            operation: "pricingPolicy.getUsageSummary",
            cause,
          }),
      }).pipe(defectOn(PricingPolicyRepositoryError)),
  };
}
