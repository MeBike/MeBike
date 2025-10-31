import * as z from "zod";
import { RefundStatus } from "../types/RefundType";
export const updateRefundSchema = z.object({
  newStatus: z.enum([] as RefundStatus[]),
});
export const createRefundSchema = z.object({
  transaction_id: z.string().min(1, "Transaction ID is required"),
  amount: z.number().min(1, "Amount must be greater than 0"),
});
export type CreateRefundSchemaFormData = z.infer<typeof createRefundSchema>;
export type UpdateRefundSchemaFormData = z.infer<typeof updateRefundSchema>;
