import { Effect, Layer } from "effect";

import type { PricingPolicyReadRepo } from "../repository/pricing-policy.repository.types";
import type { PricingPolicyQueryService } from "./pricing-policy.service.types";

import { PricingPolicyQueryRepository } from "../repository/pricing-policy-query.repository";

/**
 * Query service mỏng bọc quanh repository đọc của pricing policy.
 *
 * Service này cố tình giữ nhẹ để bên gọi có một phụ thuộc ổn định cho các tác
 * vụ đọc, còn rule nghiệp vụ nặng hơn nằm ở command flow.
 *
 * @param repo Read repository cung cấp dữ liệu pricing policy.
 * @returns Query service cho pricing policy.
 */
export function makePricingPolicyQueryService(
  repo: PricingPolicyReadRepo,
): PricingPolicyQueryService {
  /**
   * Lấy pricing policy theo id và fail nếu không tồn tại.
   *
   * @param pricingPolicyId Id policy cần lấy.
   * @returns Effect trả về policy tương ứng hoặc lỗi not found.
   */
  const getById: PricingPolicyQueryService["getById"] = pricingPolicyId =>
    repo.getById(pricingPolicyId);

  /**
   * Lấy policy đang active theo rule hiện tại của hệ thống.
   *
   * @returns Effect trả về active policy hiện tại.
   */
  const getActive: PricingPolicyQueryService["getActive"] = () =>
    repo.getActive();

  /**
   * Liệt kê pricing policy, có thể lọc theo status khi caller cần.
   *
   * @param status Status cần lọc; bỏ qua nếu muốn lấy toàn bộ.
   * @returns Effect trả về danh sách policy phù hợp điều kiện lọc.
   */
  const listPolicies: PricingPolicyQueryService["listPolicies"] = (status, pageReq) =>
    repo.listByStatus(status, pageReq);

  /**
   * Trả về usage summary để caller biết policy đã bị “khóa lịch sử” hay chưa.
   *
   * @param pricingPolicyId Id policy cần kiểm tra usage.
   * @returns Effect trả về số lượng tham chiếu ở từng nơi và cờ `isUsed`.
   */
  const getUsageSummary: PricingPolicyQueryService["getUsageSummary"] = pricingPolicyId =>
    repo.getUsageSummary(pricingPolicyId);

  return {
    getById,
    getActive,
    listPolicies,
    getUsageSummary,
  };
}

export type { PricingPolicyQueryService } from "./pricing-policy.service.types";

const makePricingPolicyQueryServiceEffect = Effect.gen(function* () {
  const repo = yield* PricingPolicyQueryRepository;
  return makePricingPolicyQueryService(repo);
});

/**
 * Effect tag cho các use-case đọc của pricing policy.
 */
export class PricingPolicyQueryServiceTag extends Effect.Service<PricingPolicyQueryServiceTag>()(
  "PricingPolicyQueryService",
  {
    effect: makePricingPolicyQueryServiceEffect,
  },
) {}

export const PricingPolicyQueryServiceLive = Layer.effect(
  PricingPolicyQueryServiceTag,
  makePricingPolicyQueryServiceEffect.pipe(Effect.map(PricingPolicyQueryServiceTag.make)),
);
