import * as z from "zod";
const isValidObjectId = (id: string): boolean => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
export const createSOSSchema = z.object({
  rental_id: z
    .string()
    .min(24, "Station ID must be a valid ObjectId")
    .max(24, "Station ID must be a valid ObjectId")
    .refine(isValidObjectId, {
      message: "Station ID must be a valid MongoDB ObjectId",
    }),
  agent_id: z
    .string()
    .min(24, "Station ID must be a valid ObjectId")
    .max(24, "Station ID must be a valid ObjectId")
    .refine(isValidObjectId, {
      message: "Station ID must be a valid MongoDB ObjectId",
    }),
  issue: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập issue")
    .min(10, "Issue phải có tối thiểu 10 ký tự")
    .max(1000, "Issue tối đa 1000 ký tự"),
  latitude: z
    .string()
    .min(1, "Vui lòng nhập latitude")
    .min(2, "Latitude phải có tối thiểu 2 ký tự")
    .max(100, "Latitude tối đa 100 ký tự"),
  longitude: z
    .string()
    .min(1, "Vui lòng nhập longitude")
    .min(2, "Longitude phải có tối thiểu 2 ký tự")
    .max(100, "Longitude tối đa 100 ký tự"),
  staff_notes: z
    .string()
    .trim()
    .min(1, "Vui lòng ghi chú")
    .min(10, "Ghi chú tối thiểu 10 ký tự")
    .max(1000, "Ghi chú tối đa 1000 ký tự"),
});
export const confirmSOSSchema = z.object({
  solvable: z.boolean().refine((val) => val === true || val === false, {
    message: "Giá trị phải là true hoặc false",
  }),
  agent_notes: z
    .string()
    .trim()
    .min(1, "Vui lòng ghi chú")
    .min(10, "Ghi chú tối thiểu 10 ký tự")
    .max(1000, "Ghi chú tối đa 1000 ký tự"),
  photos: z
    .array(z.string().url("Mỗi phần tử phải là một URL hợp lệ"))
    .optional(),
});

export const rejectSOSSchema = z.object({
  agent_notes: z
    .string()
    .trim()
    .min(1, "Vui lòng ghi chú")
    .min(10, "Ghi chú tối thiểu 10 ký tự")
    .max(1000, "Ghi chú tối đa 1000 ký tự"),
  photos: z
    .array(z.string().url("Mỗi phần tử phải là một URL hợp lệ"))
    .optional(),
});
export type CreateSOSSchema = z.infer<typeof createSOSSchema>;
export type ConfirmSOSSchema = z.infer<typeof confirmSOSSchema>;
export type RejectSOSSchema = z.infer<typeof rejectSOSSchema>;
