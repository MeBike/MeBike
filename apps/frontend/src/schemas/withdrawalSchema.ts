import * as z from "zod";
import type { RefundStatus, WithdrawStatus } from "@/types";
export const updateWithdrawSchema = z.object({
  newStatus: z.enum([] as WithdrawStatus[]),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500, "Reason must be at most 500 characters").optional(),
});
export type UpdateWithdrawSchemaFormData = z.infer<typeof updateWithdrawSchema>;