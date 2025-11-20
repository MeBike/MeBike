import * as z from "zod";
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
export const assignSOSSchema = z.object({
  replaced_bike_id: z
    .string()
    .min(24, "Mã xe đạp phải là một ObjectId hợp lệ")
    .max(24, "Mã xe đạp phải là một ObjectId hợp lệ")
    .refine(isValidObjectId, {
      message: "Mã xe đạp phải là một ObjectId hợp lệ",
    }),
  sos_agent_id: z
    .string()
    .min(24, "Mã SOS Agent phải là một ObjectId hợp lệ")
    .max(24, "Mã SOS Agent phải là một ObjectId hợp lệ")
    .refine(isValidObjectId, {
      message: "Mã SOS Agent phải là một ObjectId hợp lệ",
    }),
});
export const resolveSOSSchema = z.object({
  solvable: z.boolean(),
  agent_notes: z
    .string()
    .min(1, "Note phải ít nhất 1 ký tự")
    .max(500, "Note phải nhiều nhất 500 ký tự")
    .optional(),
  photos: z.array(z.string().min(1, "URI không hợp lệ")).min(1, "Phải có ít nhất 1 ảnh"),
});
export const createSOSSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  rental_id: z
    .string()
    .min(24, "Mã xe đạp phải là một ObjectId hợp lệ")
    .max(24, "Mã xe đạp phải là một ObjectId hợp lệ")
    .refine(isValidObjectId, {
      message: "Mã xe đạp phải là một ObjectId hợp lệ",
    }),
  issue : z.string().min(5, "Vấn đề phải ít nhất 5 ký tự").max(1000, "Vấn đề phải nhiều nhất 1000 ký tự"),  
});
export const cancelSOSSchema = z.object({
  reason: z
    .string()
    .min(1, "Lý do phải ít nhất 1 ký tự")
    .max(500, "Lý do phải nhiều nhất 500 ký tự"),
});
export type AssignSOSSchema = z.infer<typeof assignSOSSchema>;
export type ResolveSOSSchema = z.infer<typeof resolveSOSSchema>;
export type CreateSOSSchema = z.infer<typeof createSOSSchema>;
export type CancelSOSSchema = z.infer<typeof cancelSOSSchema>;