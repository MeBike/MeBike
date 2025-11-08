
import * as z from "zod";
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
const baseWalletSchema = z.object({
  user_id: z
    .string()
    .min(24, "User ID must be a valid ObjectId")
    .refine(isValidObjectId, {
      message: "User ID must be a valid MongoDB ObjectId",
    }),
  amount: z
    .any()
    .transform((val) => {
      if (typeof val === "string") {
        return parseInt(val.replace(/\./g, ""));
      }
      return val;
    })
    .refine((val) => val >= 1000, "Amount must be at least 1000"),
  fee: z
    .any()
    .transform((val) => {
      if (typeof val === "string") {
        return parseInt(val.replace(/\./g, ""));
      }
      return val;
    })
    .refine((val) => val >= 0, "Fee must be a positive number"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be at most 500 characters"),
  message: z.string().min(1).max(1000, "Message must be at most 1000 characters").optional(),
});


export const topUpWalletSchema = baseWalletSchema.extend({
  transaction_hash: z
    .string()
    .min(1, "Transaction is required"),
});
export const decreaseWalletSchema = baseWalletSchema.extend({
  transaction_hash: z.string().optional(),
});
export type WalletSchemaFormData = z.infer<typeof baseWalletSchema>;
export type TopUpSchemaFormData = z.infer<typeof topUpWalletSchema>;
export type DecreaseSchemaFormData = z.infer<typeof decreaseWalletSchema>;