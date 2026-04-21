import { z } from "zod";

export const CreateEnvironmentPolicySchema = z.object({
  name: z.string().min(1, "Tên chính sách không được để trống"),

  average_speed_kmh: z
    .number()
    .min(0, "Tốc độ trung bình phải lớn hơn 0")
    .max(40, "Tốc độ trung bình tối đa là 40 km/h"),

  co2_saved_per_km: z
    .number()
    .min(0, "Lượng CO2 tiết kiệm không được âm")
    .max(500, "Lượng CO2 tiết kiệm tối đa là 500"),

  confidence_factor: z
    .number()
    .min(0, "Hệ số tin cậy tối thiểu là 0")
    .max(1, "Hệ số tin cậy tối đa là 1"),

  return_scan_buffer_minutes: z
    .number()
    .int("Thời gian phải là số nguyên")
    .min(0, "Thời gian không được âm")
    .max(30, "Thời gian tối đa là 30 phút")
    .optional(),

  status: z.enum(["INACTIVE"]),
});

export type CreateEnvironmentPolicyInput = z.infer<
  typeof CreateEnvironmentPolicySchema
>;
