import * as z from "zod";
export const stationSchema = z.object({
  name: z
    .string()
    .min(1, "Tên trạm không được để trống")
    .max(200, "Tên trạm phải có nhiều nhất 200 ký tự"),
  address: z.string().min(10, "Địa chỉ không được để trống"),
  latitude: z.number(),
  longitude: z.number(),
  capacity: z.number().min(1,"Sức chứa không được để trống").max(20,"Không được quá 20 chiếc"),
});
export type StationSchemaFormData = z.infer<typeof stationSchema>;
