import { Effect, Option } from "effect";

import type {
  PrismaClient,
  Prisma as PrismaTypes,
} from "generated/prisma/client";

import { defectOn } from "@/domain/shared";

import type {
  CreatePricingPolicyInput,
  PricingPolicyWriteRepo,
  UpdatePricingPolicyInput,
  UpdatePricingPolicyStatusInput,
} from "../pricing-policy.repository.types";

import { PricingPolicyRepositoryError } from "../../domain-errors";
import {
  pricingPolicySelect,
  toPricingPolicyRow,
} from "../pricing-policy.mappers";

/**
 * Repository ghi cho pricing policy.
 *
 * Layer này chỉ lo ghi dữ liệu và trả về state mới nhất. Rule nghiệp vụ như
 * khung giờ được phép sửa, bất biến sau lần dùng đầu tiên, hay chuyển policy
 * đang active thuộc về command service ở tầng trên.
 */
export function makePricingPolicyWriteRepository(
  client: PrismaClient | PrismaTypes.TransactionClient,
): PricingPolicyWriteRepo {
  /**
   * Đường reload dùng chung để mọi mutation đều trả về cùng một select shape.
   */
  const findByIdWithSelect = (pricingPolicyId: string) =>
    client.pricingPolicy.findUnique({
      where: { id: pricingPolicyId },
      select: pricingPolicySelect,
    });

  /**
   * Helper update trả về `Option.none()` khi row không tồn tại, thay vì phụ
   * thuộc vào lỗi record-not-found mà Prisma ném ra.
   */
  const updateById = (
    pricingPolicyId: string,
    data: Omit<PrismaTypes.PricingPolicyUpdateManyMutationInput, "id">,
  ) =>
    Effect.tryPromise({
      try: async () => {
        const updated = await client.pricingPolicy.updateMany({
          where: { id: pricingPolicyId },
          data,
        });

        if (updated.count === 0) {
          return null;
        }

        return await findByIdWithSelect(pricingPolicyId);
      },
      catch: cause =>
        new PricingPolicyRepositoryError({
          operation: "pricingPolicy.updateById",
          cause,
        }),
    }).pipe(
      Effect.map(row => Option.fromNullable(row).pipe(Option.map(toPricingPolicyRow))),
      defectOn(PricingPolicyRepositoryError),
    );

  return {
    createPricingPolicy: (input: CreatePricingPolicyInput) =>
      Effect.tryPromise({
        try: () =>
          client.pricingPolicy.create({
            data: {
              ...(input.id ? { id: input.id } : {}),
              name: input.name,
              baseRate: input.baseRate,
              billingUnitMinutes: input.billingUnitMinutes,
              reservationFee: input.reservationFee,
              depositRequired: input.depositRequired,
              lateReturnCutoff: input.lateReturnCutoff,
              status: input.status ?? "INACTIVE",
              createdAt: input.createdAt,
              updatedAt: input.updatedAt,
            },
            select: pricingPolicySelect,
          }),
        catch: cause =>
          new PricingPolicyRepositoryError({
            operation: "pricingPolicy.createPricingPolicy",
            cause,
          }),
      }).pipe(
        Effect.map(toPricingPolicyRow),
        defectOn(PricingPolicyRepositoryError),
      ),

    updatePricingPolicy: (input: UpdatePricingPolicyInput) =>
      updateById(input.pricingPolicyId, {
        name: input.name,
        baseRate: input.baseRate,
        billingUnitMinutes: input.billingUnitMinutes,
        reservationFee: input.reservationFee,
        depositRequired: input.depositRequired,
        lateReturnCutoff: input.lateReturnCutoff,
        status: input.status,
        updatedAt: input.updatedAt ?? new Date(),
      }),

    updatePricingPolicyStatus: (input: UpdatePricingPolicyStatusInput) =>
      updateById(input.pricingPolicyId, {
        status: input.status,
        updatedAt: input.updatedAt ?? new Date(),
      }),

    deactivateActivePolicies: args =>
      Effect.tryPromise({
        try: () =>
          client.pricingPolicy.updateMany({
            where: {
              // Activation flow sẽ hạ mọi row đang active trước đó, trừ target
              // sắp được nâng lên active trong cùng transaction.
              status: "ACTIVE",
              ...(args?.excludePricingPolicyId
                ? { id: { not: args.excludePricingPolicyId } }
                : {}),
            },
            data: {
              status: "INACTIVE",
              updatedAt: args?.updatedAt ?? new Date(),
            },
          }),
        catch: cause =>
          new PricingPolicyRepositoryError({
            operation: "pricingPolicy.deactivateActivePolicies",
            cause,
          }),
      }).pipe(
        Effect.map(result => result.count),
        defectOn(PricingPolicyRepositoryError),
      ),
  };
}
