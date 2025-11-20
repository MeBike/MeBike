import * as z from "zod";
import { RefundStatus } from "../types/RefundType";
export const updateRefundSchema = z.object({
  newStatus: z.enum([] as RefundStatus[]),
});
export const createRefundSchema = z.object({
  transaction_id: z.string().min(1, "Mã giao dịch không được để trống"),
  amount: z.number().min(1, "Số tiền phải lớn hơn 0"),
});
export type CreateRefundSchemaFormData = z.infer<typeof createRefundSchema>;
export type UpdateRefundSchemaFormData = z.infer<typeof updateRefundSchema>;
