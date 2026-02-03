import type { ExecuteWithdrawalOutcome } from "./services/execute-withdrawal.service";

export type ExecuteWithdrawalDecision
  = | { readonly action: "complete" }
    | { readonly action: "retry"; readonly reason: string };

export function decideExecuteWithdrawalOutcome(
  outcome: ExecuteWithdrawalOutcome,
): ExecuteWithdrawalDecision {
  if (outcome.status === "ignored" && outcome.reason === "processing_locked") {
    return { action: "retry", reason: outcome.reason };
  }
  return { action: "complete" };
}
