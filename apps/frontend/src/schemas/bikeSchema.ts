import * as z from "zod";
import { BikeStatus } from "@/types";
// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
export const bikeSchema = z.object({
  station_id: z
    .string()
    .min(24, "Mã trạm phải là một ObjectId hợp lệ")
    .max(24, "Mã trạm phải là một ObjectId hợp lệ")
    .refine(isValidObjectId, {
      message: "Mã trạm phải là một ObjectId hợp lệ",
    }),
  supplier_id: z
    .string()
    .min(24, "Mã nhà cung cấp phải là một ObjectId hợp lệ")
    .max(24, "Mã nhà cung cấp phải là một ObjectId hợp lệ")
    .refine(isValidObjectId, {
      message: "Mã nhà cung cấp phải là một ObjectId hợp lệ",
    })
    .optional(),
  chip_id: z.string().max(100, "Mã chip phải có độ dài tối đa là 100 ký tự"),
});
export const updateBikeSchema = z.object({
  station_id: z
    .string()
    .min(24, "Mã trạm phải là một ObjectId hợp lệ")
    .max(24, "Mã trạm phải là một ObjectId hợp lệ")
    .refine(isValidObjectId, {
      message: "Mã trạm phải là một ObjectId hợp lệ",
    }),
  status: z.enum(["Available", "Booked", "Broken", "Maintained" , "Reserved" , "Unavailable"] as BikeStatus[]),
  supplier_id: z
    .string()
    .min(24, "Mã nhà cung cấp phải là một ObjectId hợp lệ")
    .max(24, "Mã nhà cung cấp phải là một ObjectId hợp lệ")
    .refine(isValidObjectId, {
      message: "Mã nhà cung cấp phải là một ObjectId hợp lệ",
    }),
  chip_id: z.string(),
});
export type BikeSchemaFormData = z.infer<typeof bikeSchema>;
export type UpdateBikeSchemaFormData = z.infer<typeof updateBikeSchema>;
