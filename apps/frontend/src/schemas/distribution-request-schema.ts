import { z } from "zod";
import { isValidUUID } from "@utils";
export const CreateRedistributionRequestSchema = z.object({
  requestedQuantity: z
    .int("Phải là số nguyên")
    .min(1, "Số lượng phải lớn hơn 0")
    .max(20, "Số lượng tối đa là 20"),
  sourceStationId: z
    .string()
    .min(1, "Mã trạm không được để trống")
    .refine(isValidUUID, {
      message: "Mã trạm phải là một UUID hợp lệ",
    }),
  targetStationId: z
    .string()
    .min(1, "Mã trạm không được để trống")
    .refine(isValidUUID, {
      message: "Mã trạm phải là một UUID hợp lệ",
    }),
  reason: z.string().optional().or(z.literal("")), 
});

export type CreateRedistributionRequestInput = z.infer<
  typeof CreateRedistributionRequestSchema
>;
