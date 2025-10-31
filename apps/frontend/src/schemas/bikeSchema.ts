import * as z from "zod";
import { BikeStatus } from "@/types";
// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
export const bikeSchema = z.object({
  station_id: z
    .string()
    .min(24, "Station ID must be a valid ObjectId")
    .max(24, "Station ID must be a valid ObjectId")
    .refine(isValidObjectId, {
      message: "Station ID must be a valid MongoDB ObjectId",
    }),
  status: z.enum([
    "CÓ SẴN",
    "ĐANG ĐƯỢC THUÊ",
    "BỊ HỎNG",
    "ĐANG BẢO TRÌ",
    "ĐÃ ĐẶT TRƯỚC",
    "KHÔNG CÓ SẴN",
  ] as BikeStatus[]),
  supplier_id: z
    .string()
    .min(24, "Supplier ID must be a valid ObjectId")
    .max(24, "Supplier ID must be a valid ObjectId")
    .refine(isValidObjectId, {
      message: "Supplier ID must be a valid MongoDB ObjectId",
    })
    .optional(),
  chip_id: z.string(),
});
export const updateBikeSchema = z.object({
  station_id: z
    .string()
    .min(24, "Station ID must be a valid ObjectId")
    .max(24, "Station ID must be a valid ObjectId")
    .refine(isValidObjectId, {
      message: "Station ID must be a valid MongoDB ObjectId",
    }),
  status: z.enum(["CÓ SẴN", "ĐANG ĐƯỢC THUÊ", "BỊ HỎNG", "ĐANG BẢO TRÌ" , "ĐÃ ĐẶT TRƯỚC" , "KHÔNG CÓ SẴN"] as BikeStatus[]),
  supplier_id: z
    .string()
    .min(24, "Supplier ID must be a valid ObjectId")
    .max(24, "Supplier ID must be a valid ObjectId")
    .refine(isValidObjectId, {
      message: "Supplier ID must be a valid MongoDB ObjectId",
    }),
  chip_id: z.string(),
});
export type BikeSchemaFormData = z.infer<typeof bikeSchema>;
export type UpdateBikeSchemaFormData = z.infer<typeof updateBikeSchema>;
