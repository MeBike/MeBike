import * as z from "zod";
import type { WithdrawStatus } from "@/types";
export const updateWithdrawSchema = z.object({
  newStatus: z.enum([] as WithdrawStatus[]),
  reason: z.string().min(10, "Reason must be at least 10 characters").max(500, "Reason must be at most 500 characters").optional(),
});
export const createWithdrawSchema = z.object({
  amount: z
    .number()
    .min(10000, "Amount must be at least 10,000")
    .max(1000000000, "Amount must be at most 1,000,000,000"),
  bank: z
    .string()
    .min(5, "Bank account must be at least 5 characters")
    .max(30, "Bank account must be at most 30 characters"),
  account: z
    .string()
    .min(5, "Account number must be at least 5 characters")
    .max(30, "Account number must be at most 30 characters"),
  account_owner: z
    .string()
    .min(5, "Account owner name must be at least 5 characters")
    .max(50, "Account owner name must be at most 50 characters"),
  note: z
    .string()
    .min(10, "Reason must be at least 10 characters")
    .max(500, "Reason must be at most 500 characters")
    .optional(),
});
export type CreateWithdrawSchemaFormData = z.infer<typeof createWithdrawSchema>;
export type UpdateWithdrawSchemaFormData = z.infer<typeof updateWithdrawSchema>;
