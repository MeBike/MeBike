import * as z from "zod";
import type { WithdrawStatus } from "@/types";
export const updateWithdrawSchema = z.object({
  newStatus: z.enum([] as WithdrawStatus[]),
  reason: z.string().min(10, "Lý do phải có ít nhất 10 ký tự").max(500, "Lý do phải có nhiều nhất 500 ký tự").optional(),
});
export const createWithdrawSchema = z.object({
  amount: z
    .number()
    .min(10000, "Số tiền phải lớn hơn hoặc bằng 10,000")
    .max(1000000000, "Số tiền phải nhỏ hơn hoặc bằng 1,000,000,000"),
  bank: z
    .string()
    .min(5, "Tài khoản ngân hàng phải có ít nhất 5 ký tự")
    .max(30, "Tài khoản ngân hàng phải có nhiều nhất 30 ký tự"),
  account: z
    .string()
    .min(5, "Số tài khoản phải có ít nhất 5 ký tự")
    .max(30, "Số tài khoản phải có nhiều nhất 30 ký tự"),
  account_owner: z
    .string()
    .min(5, "Tên chủ tài khoản phải có ít nhất 5 ký tự")
    .max(50, "Tên chủ tài khoản phải có nhiều nhất 50 ký tự"),
  note: z
    .string()
    .min(10, "Lý do phải có ít nhất 10 ký tự")
    .max(500, "Lý do phải có nhiều nhất 500 ký tự")
    .optional(),
});
export type CreateWithdrawSchemaFormData = z.infer<typeof createWithdrawSchema>;
export type UpdateWithdrawSchemaFormData = z.infer<typeof updateWithdrawSchema>;
