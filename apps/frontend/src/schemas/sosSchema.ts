import * as z from "zod";
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
export const assignSOSSchema = z.object({
  replaced_bike_id: z
    .string()
    .min(24, "Mã xe phải là một ObjectId hợp lệ")
    .max(24, "Mã xe phải là một ObjectId hợp lệ")
    .refine(isValidObjectId, {
      message: "Mã xe phải là một ObjectId hợp lệ",
    }),
  sos_agent_id : z
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
  photos: z.array(z.string().min(1, "URI không hợp lệ")),
});
export const cancelSOSSchema = z.object({
  reason: z
    .string()
    .min(1, "Lý do phải ít nhất 1 ký tự")
    .max(500, "Lý do phải nhiều nhất 500 ký tự"),
});
export type AssignSOSSchema = z.infer<typeof assignSOSSchema>;
export type ResolveSOSSchema = z.infer<typeof resolveSOSSchema>;
export type CancelSOSSchema = z.infer<typeof cancelSOSSchema>;