import * as z from "zod";

const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
export const rentalSchema = z.object({
    bike_id : z
      .string()
      .min(24, "Station ID must be a valid ObjectId")
      .max(24, "Station ID must be a valid ObjectId")
      .refine(isValidObjectId, {
        message: "Station ID must be a valid MongoDB ObjectId",
      }),
});
export const updateRentalSchema = z.object({
  status: z.enum(["ĐANG THUÊ", "HOÀN THÀNH", "ĐÃ HỦY", "ĐÃ ĐẶT TRƯỚC"]),
  end_time: z.string(),
  end_station: z
    .string()
    .min(24, "Station ID must be a valid ObjectId")
    .max(24, "Station ID must be a valid ObjectId")
    .refine(isValidObjectId, {
      message: "Station ID must be a valid MongoDB ObjectId",
    }),
  total_price: z.number().min(0, "Total price must be a non-negative number"),
  reason: z.string().min(5, "Reason must be at least 5 characters long").max(500, "Reason must be at most 500 characters long"),
});
export type RentalSchemaFormData = z.infer<typeof rentalSchema>;
export type UpdateRentalSchema = z.infer<typeof updateRentalSchema>;