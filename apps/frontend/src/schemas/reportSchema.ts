import * as z from "zod";

export const UpdateReportSchema = z.object({
  newStatus: z.enum([
    "ĐANG CHỜ XỬ LÝ",
    "ĐANG XỬ LÝ",
    "ĐÃ GIẢI QUYẾT",
    "ĐÃ HỦY",
  ]),
  staff_id: z.string().refine(
    (id) => {
      if (id === "") return true;
      return /^[0-9a-fA-F]{24}$/.test(id);
    },
    { message: "Staff ID must be a valid MongoDB ObjectId or empty" }
  ),
  priority: z.enum(["THẤP", "BÌNH THƯỜNG", "CAO", "KHẨN CẤP"]),
});
export type UpdateReportSchemaFormData = z.infer<typeof UpdateReportSchema>;