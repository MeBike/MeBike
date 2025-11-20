import * as z from "zod";

function isValidObjectId(id: string): boolean {
  return /^[0-9a-f]{24}$/i.test(id);
}
const baseWalletSchema = z.object({
  user_id: z
    .string()
    .length(24, "Mã người dùng phải là một ObjectId hợp lệ")
    .refine(isValidObjectId, {
      message: "Mã người dùng phải là một ObjectId hợp lệ",
    }),
  amount: z.number().min(0, "Số tiền phải là một số dương"),
  fee: z.number().min(0, "Phí phải là một số dương"),
  description: z
    .string()
    .max(500, "Mô tả không được vượt quá 500 ký tự"),
  message: z.string().max(1000, "Tin nhắn không được vượt quá 1000 ký tự"),
});

export const topUpWalletSchema = baseWalletSchema.extend({
  transaction_hash: z
    .string()
    .length(64, "Mã giao dịch phải là 64 ký tự")
    .refine(hash => /^[0-9a-f]{64}$/i.test(hash), {
      message: "Mã giao dịch phải là một chuỗi hex hợp lệ gồm 64 ký tự",
    }),
});
export const decreaseWalletSchema = baseWalletSchema.extend({
  transaction_hash: z
    .string()
    .length(64, "Mã giao dịch phải là 64 ký tự")
    .refine(hash => /^[0-9a-f]{64}$/i.test(hash), {
      message: "Mã giao dịch phải là một chuỗi hex hợp lệ gồm 64 ký tự",
    }),
});
export type WalletSchemaFormData = z.infer<typeof baseWalletSchema>;
export type TopUpSchemaFormData = z.infer<typeof topUpWalletSchema>;
export type DecreaseSchemaFormData = z.infer<typeof decreaseWalletSchema>;
