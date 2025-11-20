import * as z from "zod";
export const stationSchema = z.object({
  name: z
    .string()
    .min(1, "Tên trạm không được để trống")
    .max(200, "Tên trạm phải có nhiều nhất 200 ký tự"),
  address: z.string().min(10, "Địa chỉ không được để trống"),
  latitude: z
    .string({
      error: "Vĩ độ không được để trống",
    })
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Vĩ độ phải là một số",
    }),
  longitude: z
    .string({
      error: "Kinh độ không được để trống",
    })
    .refine((val) => !isNaN(parseFloat(val)), {
      message: "Kinh độ phải là một số",
    }),
  capacity: z
    .string({
      error: "Sức chứa không được để trống",
    })
    .refine((val) => !isNaN(parseInt(val)), {
      message: "Sức chứa phải là một số nguyên",
    }),
});
export type StationSchemaFormData = z.infer<typeof stationSchema>;
