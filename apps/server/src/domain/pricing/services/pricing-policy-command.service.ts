import { Effect, Layer, Option } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import {
  formatVietnamDateTime,
  isWithinOvernightOperationsWindow,
  OVERNIGHT_OPERATIONS_WINDOW_END_LABEL,
  OVERNIGHT_OPERATIONS_WINDOW_START_LABEL,
  VIETNAM_TIME_ZONE,
} from "@/domain/shared/business-hours";
import { Prisma } from "@/infrastructure/prisma";
import { PrismaTransactionError, runPrismaTransaction } from "@/lib/effect/prisma-tx";

import type {
  PricingPolicyReadRepo,
  PricingPolicyWriteRepo,
} from "../repository/pricing-policy.repository.types";
import type {
  PricingPolicyCommandService,
} from "./pricing-policy.service.types";

import { defectOn } from "../../shared";
import {
  PricingPolicyAlreadyUsed,
  PricingPolicyInvalidInput,
  PricingPolicyMutationWindowClosed,
  PricingPolicyNotFound,
} from "../domain-errors";
import { PricingPolicyCommandRepository } from "../repository/pricing-policy-command.repository";
import { PricingPolicyQueryRepository } from "../repository/pricing-policy-query.repository";
import { makePricingPolicyRepository } from "../repository/pricing-policy.repository";

const MIN_BASE_RATE_VND = 1_000n;
const MAX_BASE_RATE_VND = 1_000_000n;
const MIN_RESERVATION_FEE_VND = 1_000n;
const MAX_RESERVATION_FEE_VND = 1_000_000n;
const MIN_DEPOSIT_REQUIRED_VND = 1_000n;
const MAX_DEPOSIT_REQUIRED_VND = 100_000_000n;
const MIN_BILLING_UNIT_MINUTES = 1;
const MAX_BILLING_UNIT_MINUTES = 24 * 60;

type ValidationIssue = {
  readonly path: string;
  readonly message: string;
};

/**
 * Chỉ flow activate của pricing policy mới bị giới hạn trong khung giờ quản trị
 * ban đêm.
 *
 * @param now Thời điểm hiện tại để kiểm tra cửa sổ mutation.
 * @returns Effect thành công nếu đang trong cửa sổ cho phép; ngược lại fail với
 * `PricingPolicyMutationWindowClosed`.
 */
function ensureActivationWindowOpen(now: Date) {
  if (isWithinOvernightOperationsWindow(now)) {
    return Effect.void;
  }

  return Effect.fail(new PricingPolicyMutationWindowClosed({
    currentTime: formatVietnamDateTime(now),
    timeZone: VIETNAM_TIME_ZONE,
    windowStart: OVERNIGHT_OPERATIONS_WINDOW_START_LABEL,
    windowEnd: OVERNIGHT_OPERATIONS_WINDOW_END_LABEL,
  }));
}

function validateMoneyRange(args: {
  path: string;
  label: string;
  value: bigint;
  min: bigint;
  max: bigint;
  issues: ValidationIssue[];
}) {
  if (args.value < args.min || args.value > args.max) {
    args.issues.push({
      path: args.path,
      message: `${args.label} must be between ${args.min.toString()} and ${args.max.toString()} VND`,
    });
  }
}

function validateBillingUnitMinutes(
  value: number,
  issues: ValidationIssue[],
) {
  if (value < MIN_BILLING_UNIT_MINUTES || value > MAX_BILLING_UNIT_MINUTES) {
    issues.push({
      path: "billingUnitMinutes",
      message: `billingUnitMinutes must be between ${MIN_BILLING_UNIT_MINUTES} and ${MAX_BILLING_UNIT_MINUTES} minutes`,
    });
  }
}

function ensureCreateInputValid(input: {
  name: string;
  baseRate: bigint;
  billingUnitMinutes: number;
  reservationFee: bigint;
  depositRequired: bigint;
}) {
  const issues: ValidationIssue[] = [];

  if (input.name.trim().length === 0) {
    issues.push({
      path: "name",
      message: "name must not be empty",
    });
  }

  validateMoneyRange({
    path: "baseRate",
    label: "baseRate",
    value: input.baseRate,
    min: MIN_BASE_RATE_VND,
    max: MAX_BASE_RATE_VND,
    issues,
  });
  validateMoneyRange({
    path: "reservationFee",
    label: "reservationFee",
    value: input.reservationFee,
    min: MIN_RESERVATION_FEE_VND,
    max: MAX_RESERVATION_FEE_VND,
    issues,
  });
  validateMoneyRange({
    path: "depositRequired",
    label: "depositRequired",
    value: input.depositRequired,
    min: MIN_DEPOSIT_REQUIRED_VND,
    max: MAX_DEPOSIT_REQUIRED_VND,
    issues,
  });
  validateBillingUnitMinutes(input.billingUnitMinutes, issues);

  return issues.length === 0
    ? Effect.void
    : Effect.fail(new PricingPolicyInvalidInput({ issues }));
}

function ensureUpdateInputValid(input: {
  name?: string;
  baseRate?: bigint;
  billingUnitMinutes?: number;
  reservationFee?: bigint;
  depositRequired?: bigint;
}) {
  const issues: ValidationIssue[] = [];

  if (input.name !== undefined && input.name.trim().length === 0) {
    issues.push({
      path: "name",
      message: "name must not be empty",
    });
  }

  if (input.baseRate !== undefined) {
    validateMoneyRange({
      path: "baseRate",
      label: "baseRate",
      value: input.baseRate,
      min: MIN_BASE_RATE_VND,
      max: MAX_BASE_RATE_VND,
      issues,
    });
  }

  if (input.reservationFee !== undefined) {
    validateMoneyRange({
      path: "reservationFee",
      label: "reservationFee",
      value: input.reservationFee,
      min: MIN_RESERVATION_FEE_VND,
      max: MAX_RESERVATION_FEE_VND,
      issues,
    });
  }

  if (input.depositRequired !== undefined) {
    validateMoneyRange({
      path: "depositRequired",
      label: "depositRequired",
      value: input.depositRequired,
      min: MIN_DEPOSIT_REQUIRED_VND,
      max: MAX_DEPOSIT_REQUIRED_VND,
      issues,
    });
  }

  if (input.billingUnitMinutes !== undefined) {
    validateBillingUnitMinutes(input.billingUnitMinutes, issues);
  }

  return issues.length === 0
    ? Effect.void
    : Effect.fail(new PricingPolicyInvalidInput({ issues }));
}

/**
 * Command service cho pricing policy.
 *
 * Layer này sở hữu rule nghiệp vụ quanh việc tạo draft, bất biến sau lần dùng
 * đầu tiên, và chuyển policy đang active một cách tường minh. Theo rule đã chốt:
 * tạo draft mới luôn được phép, cập nhật chỉ bị chặn sau lần tham chiếu đầu tiên,
 * còn activate mới bị khóa theo cửa sổ ban đêm.
 *
 * @param args Dependency cần thiết cho command flow pricing policy.
 * @param args.client Prisma client gốc để chạy transaction activation.
 * @param args.queryRepo Read capability cần cho usage check trước khi update.
 * @param args.commandRepo Write capability cần cho create và update policy.
 * @returns Command service áp dụng đầy đủ rule nghiệp vụ cho pricing policy.
 */
export function makePricingPolicyCommandService(args: {
  client: PrismaClient;
  queryRepo: Pick<PricingPolicyReadRepo, "getUsageSummary">;
  commandRepo: Pick<
    PricingPolicyWriteRepo,
    "createPricingPolicy" | "updatePricingPolicy"
  >;
}): PricingPolicyCommandService {
  /**
   * Tạo mới một pricing policy ở trạng thái draft/inactive.
   *
   * Hàm này không áp dụng giới hạn theo khung giờ. Rule hiện tại cho phép admin
   * tạo thêm draft mới bất kỳ lúc nào; việc đưa draft đó live là flow activate
   * riêng.
   *
   * @param input Dữ liệu đầu vào để tạo draft pricing policy.
   * @returns Effect trả về policy vừa tạo ở trạng thái INACTIVE.
   */
  const createPolicy: PricingPolicyCommandService["createPolicy"] = input =>
    Effect.gen(function* () {
      const now = input.now ?? new Date();
      yield* ensureCreateInputValid(input);

      // Policy mới luôn bắt đầu ở trạng thái draft/inactive. Việc đổi policy
      // đang live là một command riêng, chạy tường minh.
      return yield* args.commandRepo.createPricingPolicy({
        name: input.name.trim(),
        baseRate: input.baseRate,
        billingUnitMinutes: input.billingUnitMinutes,
        reservationFee: input.reservationFee,
        depositRequired: input.depositRequired,
        lateReturnCutoff: input.lateReturnCutoff,
        status: "INACTIVE",
        updatedAt: now,
      });
    });

  /**
   * Cập nhật nội dung của một pricing policy chưa từng được dùng.
   *
   * Ngay khi policy đã bị tham chiếu bởi reservation, rental hoặc billing
   * record, hàm này sẽ fail để tránh làm sai nghĩa dữ liệu lịch sử.
   *
   * @param input Dữ liệu cập nhật cho pricing policy mục tiêu.
   * @returns Effect trả về policy mới nhất hoặc lỗi nghiệp vụ tương ứng.
   */
  const updatePolicy: PricingPolicyCommandService["updatePolicy"] = input =>
    Effect.gen(function* () {
      const now = input.now ?? new Date();
      yield* ensureUpdateInputValid(input);

      // Khi đã có bất kỳ bản ghi giao dịch nào tham chiếu policy này, việc sửa
      // nội dung có thể làm sai nghĩa dữ liệu lịch sử nên phải chặn lại.
      const usage = yield* args.queryRepo.getUsageSummary(input.pricingPolicyId);
      if (usage.isUsed) {
        return yield* Effect.fail(new PricingPolicyAlreadyUsed({
          pricingPolicyId: input.pricingPolicyId,
          reservationCount: usage.reservationCount,
          rentalCount: usage.rentalCount,
          billingRecordCount: usage.billingRecordCount,
        }));
      }

      const updatedOpt = yield* args.commandRepo.updatePricingPolicy({
        pricingPolicyId: input.pricingPolicyId,
        name: input.name?.trim(),
        baseRate: input.baseRate,
        billingUnitMinutes: input.billingUnitMinutes,
        reservationFee: input.reservationFee,
        depositRequired: input.depositRequired,
        lateReturnCutoff: input.lateReturnCutoff,
        updatedAt: now,
      });

      if (Option.isNone(updatedOpt)) {
        return yield* Effect.fail(new PricingPolicyNotFound({
          pricingPolicyId: input.pricingPolicyId,
        }));
      }

      return updatedOpt.value;
    });

  /**
   * Chuyển policy được chỉ định thành policy đang active của hệ thống.
   *
   * Flow này chạy trong một transaction: xác nhận target tồn tại, hạ active row
   * cũ xuống, rồi nâng target lên ACTIVE.
   *
   * @param pricingPolicyId Id policy cần kích hoạt.
   * @param now Thời điểm hiện tại để kiểm tra mutation window và gắn timestamp.
   * @returns Effect trả về policy vừa được kích hoạt hoặc lỗi nghiệp vụ tương ứng.
   */
  const activatePolicy: PricingPolicyCommandService["activatePolicy"] = (
    pricingPolicyId,
    now = new Date(),
  ) =>
    Effect.gen(function* () {
      yield* ensureActivationWindowOpen(now);

      return yield* runPrismaTransaction(args.client, tx =>
        Effect.gen(function* () {
          const txRepo = makePricingPolicyRepository(tx);

          // Activation chạy tường minh trong transaction: xác nhận target tồn
          // tại, hạ policy active cũ xuống, rồi mới nâng target lên active.
          yield* txRepo.getById(pricingPolicyId);
          yield* txRepo.deactivateActivePolicies({
            excludePricingPolicyId: pricingPolicyId,
            updatedAt: now,
          });

          const activatedOpt = yield* txRepo.updatePricingPolicyStatus({
            pricingPolicyId,
            status: "ACTIVE",
            updatedAt: now,
          });

          if (Option.isNone(activatedOpt)) {
            return yield* Effect.fail(new PricingPolicyNotFound({ pricingPolicyId }));
          }

          return activatedOpt.value;
        })).pipe(defectOn(PrismaTransactionError));
    });

  return {
    createPolicy,
    updatePolicy,
    activatePolicy,
  };
}

export type { PricingPolicyCommandService } from "./pricing-policy.service.types";

const makePricingPolicyCommandServiceEffect = Effect.gen(function* () {
  const { client } = yield* Prisma;
  const queryRepo = yield* PricingPolicyQueryRepository;
  const commandRepo = yield* PricingPolicyCommandRepository;

  return makePricingPolicyCommandService({
    client,
    queryRepo,
    commandRepo,
  });
});

/**
 * Effect tag cho các use-case ghi pricing policy.
 */
export class PricingPolicyCommandServiceTag extends Effect.Service<PricingPolicyCommandServiceTag>()(
  "PricingPolicyCommandService",
  {
    effect: makePricingPolicyCommandServiceEffect,
  },
) {}

export const PricingPolicyCommandServiceLive = Layer.effect(
  PricingPolicyCommandServiceTag,
  makePricingPolicyCommandServiceEffect.pipe(Effect.map(PricingPolicyCommandServiceTag.make)),
);
