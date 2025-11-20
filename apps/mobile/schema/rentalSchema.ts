import * as z from "zod";

function isValidObjectId(id: string): boolean {
  return /^[0-9a-f]{24}$/i.test(id);
}
export const rentalSchema = z.object({
  bike_id: z
    .string()
    .min(24, "Mã xe đạp phải là một ObjectId hợp lệ")
    .max(24, "Mã xe đạp phải là một ObjectId hợp lệ")
    .refine(isValidObjectId, {
      message: "Mã xe đạp phải là một ObjectId hợp lệ",
    }),
  subscription_id: z
    .string()
    .min(24, "Mã đăng ký phải là một ObjectId hợp lệ")
    .max(24, "Mã đăng ký phải là một ObjectId hợp lệ")
    .refine(isValidObjectId, {
      message: "Mã đăng ký phải là một ObjectId hợp lệ",
    })
    .optional(),
});
export const endRentalSchema = z.object({
  end_station: z.string()
    .min(24, "Mã trạm kết thúc phải là một ObjectId hợp lệ")
    .max(24, "Mã trạm kết thúc phải là một ObjectId hợp lệ")
    .refine(isValidObjectId, {
      message: "Mã trạm kết thúc phải là một ObjectId hợp lệ",
    }),
});
export type EndRentalSchema = z.infer<typeof endRentalSchema>;
export type RentalSchemaFormData = z.infer<typeof rentalSchema>;
