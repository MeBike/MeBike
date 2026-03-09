import * as z from "zod";
import { BikeStatus } from "@/types";
import { isValidUUID } from "@/utils/is-valid-UUID";
export const bikeSchema = z.object({
  stationId: z
    .string()
    .min(24, "Mã trạm phải là một ObjectId hợp lệ")
    .max(24, "Mã trạm phải là một ObjectId hợp lệ")
    .refine(isValidUUID, {
      message: "Mã trạm phải là một ObjectId hợp lệ",
    }),
  status: z.enum([
    "AVAILABLE",
    "RENTED",
    "BROKEN",
    "MAINTENANCE",
    "BOOKED",
    "UNAVAILABLE",
  ] as BikeStatus[]),
  supplierId: z
    .string()
    .min(24, "Mã nhà cung cấp phải là một ObjectId hợp lệ")
    .max(24, "Mã nhà cung cấp phải là một ObjectId hợp lệ")
    .refine(isValidUUID, {
      message: "Mã nhà cung cấp phải là một ObjectId hợp lệ",
    })
    .optional(),
  chipId: z.string(),
});
export const updateBikeSchema = z.object({
  stationId: z
    .string()
    .min(24, "Mã trạm phải là một ObjectId hợp lệ")
    .max(24, "Mã trạm phải là một ObjectId hợp lệ")
    .refine(isValidUUID, {
      message: "Mã trạm phải là một ObjectId hợp lệ",
    }),
  status: z.enum(["AVAILABLE", "RENTED", "BROKEN", "MAINTENANCE", "BOOKED", "UNAVAILABLE"] as BikeStatus[]),
  supplierId: z
    .string()
    .min(24, "Mã nhà cung cấp phải là một ObjectId hợp lệ")
    .max(24, "Mã nhà cung cấp phải là một ObjectId hợp lệ")
    .refine(isValidUUID, {
      message: "Mã nhà cung cấp phải là một ObjectId hợp lệ",
    }),
  chipId: z.string(),
});
export type BikeSchemaFormData = z.infer<typeof bikeSchema>;
export type UpdateBikeSchemaFormData = z.infer<typeof updateBikeSchema>;
