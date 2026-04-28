import type { ExecuteWithdrawalOutcome } from "./execute-withdrawal.service";

export type ExecuteWithdrawalDecision
  = | { readonly action: "complete" }
    | { readonly action: "retry"; readonly reason: string };

/**
 * Quyết định PgBoss job nên complete hay retry sau khi execute withdrawal.
 *
 * `processing_locked` nghĩa là withdrawal đang được xử lý bởi worker khác hoặc chưa stale,
 * nên job hiện tại retry thay vì complete để không mất cơ hội execute sau TTL.
 *
 * @param outcome Outcome từ `executeWithdrawalUseCase`.
 */
export function decideExecuteWithdrawalOutcome(
  outcome: ExecuteWithdrawalOutcome,
): ExecuteWithdrawalDecision {
  if (outcome.status === "ignored" && outcome.reason === "processing_locked") {
    return { action: "retry", reason: outcome.reason };
  }
  return { action: "complete" };
}
