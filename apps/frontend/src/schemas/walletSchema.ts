
import * as z from "zod";
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
const baseWalletSchema = z.object({
  user_id: z
    .string()
    .min(24, "Mã người dùng phải là một ObjectId hợp lệ")
    .refine(isValidObjectId, {
      message: "Mã người dùng phải là một ObjectId hợp lệ",
    }),
  amount: z
    .any()
    .transform((val) => {
      if (typeof val === "string") {
        return parseInt(val.replace(/\./g, ""));
      }
      return val;
    })
    .refine((val) => val >= 1000, "Số tiền phải lớn hơn hoặc bằng 1000"),
  fee: z
    .any()
    .transform((val) => {
      if (typeof val === "string") {
        return parseInt(val.replace(/\./g, ""));
      }
      return val;
    })
    .refine((val) => val >= 0, "Phí phải là một số không âm"),
  description: z
    .string()
    .min(1, "Mô tả không được để trống")
    .max(500, "Mô tả phải có nhiều nhất 500 ký tự"),
  message: z.string().min(1).max(1000, "Tin nhắn phải có nhiều nhất 1000 ký tự").optional(),
});


export const topUpWalletSchema = baseWalletSchema.extend({
  transaction_hash: z
    .string()
    .min(1, "Mã giao dịch không được để trống"),
});
export const decreaseWalletSchema = baseWalletSchema.extend({
  transaction_hash: z.string().optional(),
});
export type WalletSchemaFormData = z.infer<typeof baseWalletSchema>;
export type TopUpSchemaFormData = z.infer<typeof topUpWalletSchema>;
export type DecreaseSchemaFormData = z.infer<typeof decreaseWalletSchema>;