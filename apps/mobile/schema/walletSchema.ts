import { de } from "date-fns/locale";
import * as z from "zod";
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
const baseWalletSchema = z.object({
  user_id: z
    .string()
    .length(24, "User ID must be a valid ObjectId")
    .refine(isValidObjectId, {
      message: "User ID must be a valid MongoDB ObjectId",
    }),
  amount: z.number().min(0, "Amount must be a positive number"),
  fee: z.number().min(0, "Fee must be a positive number"),
  description: z
    .string()
    .max(500, "Description must be at most 500 characters"),
  message: z.string().max(1000, "Message must be at most 1000 characters"),
});


export const topUpWalletSchema = baseWalletSchema.extend({
  transaction_hash: z
    .string()
    .length(64, "Transaction hash must be 64 characters")
    .refine((hash) => /^[0-9a-fA-F]{64}$/.test(hash), {
      message: "Transaction hash must be a valid 64-character hex string",
    }),
});
export const decreaseWalletSchema = baseWalletSchema.extend({
  transaction_hash: z
    .string()
    .length(64, "Transaction hash must be 64 characters")
    .refine((hash) => /^[0-9a-fA-F]{64}$/.test(hash), {
      message: "Transaction hash must be a valid 64-character hex string",
    }),
}); 
export type WalletSchemaFormData = z.infer<typeof baseWalletSchema>;
export type TopUpSchemaFormData = z.infer<typeof topUpWalletSchema>;
export type DecreaseSchemaFormData = z.infer<typeof decreaseWalletSchema>;