import * as z from "zod";

const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
export const rentalSchema = z.object({
    bike_id : z
      .string()
      .min(24, "Mã xe phải là một ObjectId hợp lệ")
      .max(24, "Mã xe phải là một ObjectId hợp lệ")
      .refine(isValidObjectId, {
        message: "Mã xe phải là một ObjectId hợp lệ",
      }),
});
export const updateRentalSchema = z.object({
  status: z.enum(["ĐANG THUÊ", "HOÀN THÀNH", "ĐÃ HỦY", "ĐÃ ĐẶT TRƯỚC"]),
  end_time: z.string(),
  end_station: z
    .string()
    .min(24, "Mã trạm phải là một ObjectId hợp lệ")
    .max(24, "Mã trạm phải là một ObjectId hợp lệ")
    .refine(isValidObjectId, {
      message: "Mã trạm phải là một ObjectId hợp lệ",
    }),
  total_price: z.number().min(0, "Tổng giá phải là một số không âm"),
  reason: z.string().min(5, "Lý do phải có ít nhất 5 ký tự").max(500, "Lý do phải có nhiều nhất 500 ký tự"),
});
export const endRentalSchema = z.object({
  end_station: z
    .string()
    .min(24, "Mã trạm phải là một ObjectId hợp lệ")
    .max(24, "Mã trạm phải là một ObjectId hợp lệ")
    .refine(isValidObjectId, {
      message: "Mã trạm phải là một ObjectId hợp lệ",
    }),
  reason: z
    .string()
    .min(5, "Lý do phải có ít nhất 5 ký tự")
    .max(500, "Lý do phải có nhiều nhất 500 ký tự"),
});
export type EndRentalSchema = z.infer<typeof endRentalSchema>;
export type RentalSchemaFormData = z.infer<typeof rentalSchema>;
export type UpdateRentalSchema = z.infer<typeof updateRentalSchema>;