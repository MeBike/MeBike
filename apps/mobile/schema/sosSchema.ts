import * as z from "zod";
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
export const assignSOSSchema = z.object({
  replaced_bike_id: z
    .string()
    .min(24, "Bike ID must be a valid ObjectId")
    .max(24, "Bike ID must be a valid ObjectId")
    .refine(isValidObjectId, {
      message: "Bike ID must be a valid MongoDB ObjectId",
    }),
  sos_agent_id: z
    .string()
    .min(24, "SOS Agent ID must be a valid ObjectId")
    .max(24, "SOS Agent ID must be a valid ObjectId")
    .refine(isValidObjectId, {
      message: "SOS Agent ID must be a valid MongoDB ObjectId",
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
export type AssignSOSSchema = z.infer<typeof assignSOSSchema>;
export type ResolveSOSSchema = z.infer<typeof resolveSOSSchema>;
