import { Effect, Layer, Option } from "effect";

import type { PrismaClient } from "generated/prisma/client";

import {
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
  PricingPolicyMutationWindowClosed,
  PricingPolicyNotFound,
} from "../domain-errors";
import { PricingPolicyCommandRepository } from "../repository/pricing-policy-command.repository";
import { PricingPolicyQueryRepository } from "../repository/pricing-policy-query.repository";
import { makePricingPolicyRepository } from "../repository/pricing-policy.repository";

/**
 * Format thời điểm theo giờ Việt Nam cho payload lỗi chặn theo khung giờ.
 *
 * Rule quản trị pricing policy bám theo giờ địa phương ở Việt Nam, nên thông tin trả
 * ra cũng nên cùng hệ quy chiếu đó để dễ đọc và debug.
 *
 * @param date Mốc thời gian gốc cần format.
 * @returns Chuỗi thời gian theo múi giờ Việt Nam để trả trong payload lỗi.
 */
function formatVietnamDateTime(date: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: VIETNAM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);

  const year = parts.find(part => part.type === "year")?.value ?? "0000";
  const month = parts.find(part => part.type === "month")?.value ?? "01";
  const day = parts.find(part => part.type === "day")?.value ?? "01";
  const hour = parts.find(part => part.type === "hour")?.value ?? "00";
  const minute = parts.find(part => part.type === "minute")?.value ?? "00";
  const second = parts.find(part => part.type === "second")?.value ?? "00";

  return `${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`;
}

/**
 * Mọi mutation của pricing policy chỉ được phép chạy trong khung giờ quản trị
 * ban đêm.
 *
 * @param now Thời điểm hiện tại để kiểm tra cửa sổ mutation.
 * @returns Effect thành công nếu đang trong cửa sổ cho phép; ngược lại fail với
 * `PricingPolicyMutationWindowClosed`.
 */
function ensureMutationWindowOpen(now: Date) {
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

/**
 * Command service cho pricing policy.
 *
 * Layer này sở hữu rule nghiệp vụ quanh việc tạo draft, bất biến sau lần dùng
 * đầu tiên, và chuyển policy đang active một cách tường minh. Phần persist vẫn
 * nằm ở repository để bên gọi có thể test hành vi mà chưa cần HTTP wiring.
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
   * Hàm này chỉ kiểm tra mutation window và persist draft mới. Việc chuyển
   * policy này thành policy đang active là flow khác.
   *
   * @param input Dữ liệu đầu vào để tạo draft pricing policy.
   * @returns Effect trả về policy vừa tạo hoặc lỗi nếu ngoài khung giờ mutate.
   */
  const createPolicy: PricingPolicyCommandService["createPolicy"] = input =>
    Effect.gen(function* () {
      const now = input.now ?? new Date();
      yield* ensureMutationWindowOpen(now);

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
      yield* ensureMutationWindowOpen(now);

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
      yield* ensureMutationWindowOpen(now);

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
