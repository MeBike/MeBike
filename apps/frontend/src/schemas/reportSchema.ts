import * as z from "zod";

export const UpdateReportSchema = z.object({
  newStatus: z.enum([
    "ĐANG CHỜ XỬ LÝ",
    "ĐANG XỬ LÝ",
    "ĐÃ GIẢI QUYẾT",
    "KHÔNG GIẢI QUYẾT ĐƯỢC",
    "ĐÃ HỦY",
  ]),
  staff_id: z.string().refine(
    (id) => {
      if (id === "") return true;
      return /^[0-9a-fA-F]{24}$/.test(id);
    },
    { message: "Staff ID must be a valid MongoDB ObjectId or empty" }
  ),
  priority: z.enum(["4 - THẤP", "3 - BÌNH THƯỜNG", "2 - CAO", "1 - KHẨN CẤP"]),
});
export const ResolveReportSchema = z.object({
  newStatus: z.enum([
    "ĐANG CHỜ XỬ LÝ",
    "ĐANG XỬ LÝ",
    "ĐÃ GIẢI QUYẾT",
    "KHÔNG GIẢI QUYẾT ĐƯỢC",
    "ĐÃ HỦY",
  ]),
  reason: z.string().min(1, "Không được để trống"),
  files: z.array(z.string().min(1, "URI không hợp lệ")),
});
export type UpdateReportSchemaFormData = z.infer<typeof UpdateReportSchema>;
export type ResolveReportSchemaFormData = z.infer<typeof ResolveReportSchema>;