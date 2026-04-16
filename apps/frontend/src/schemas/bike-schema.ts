import * as z from "zod";
import { BikeStatus } from "@custom-types";
import { isValidUUID } from "@utils";
export const bikeSchema = z.object({
  stationId: z
    .string()
    .min(1, "Mã trạm không được để trống")
    .refine(isValidUUID, {
      message: "Mã trạm phải là một UUID hợp lệ",
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
    .min(1, "Mã nhà cung cấp không được để trống")
    .refine(isValidUUID, {
      message: "Mã nhà cung cấp phải là một UUID hợp lệ",
    }),
  chipId: z.string().optional().or(z.literal("")),
});
export const updateBikeSchema = z.object({
  stationId: z
    .string()
    .min(1, "Mã trạm không được để trống")
    .refine(isValidUUID, {
      message: "Mã trạm phải là một UUID hợp lệ",
    }),
  status: z.enum(["AVAILABLE", "RENTED", "BROKEN", "MAINTENANCE", "BOOKED", "UNAVAILABLE"] as BikeStatus[]),
  supplierId: z
    .string()
    .refine(isValidUUID, {
      message: "Mã nhà cung cấp phải là một UUID hợp lệ",
    })
    .optional()
    .or(z.literal("")),
  chipId: z.string(),
});
export type BikeSchemaFormData = z.infer<typeof bikeSchema>;
export type UpdateBikeSchemaFormData = z.infer<typeof updateBikeSchema>;
