import * as z from "zod";
export const stationSchema = z
  .object({
    name: z
      .string()
      .min(1, "Tên trạm không được để trống")
      .max(200, "Tên trạm phải có nhiều nhất 200 ký tự"),
    address: z.string().min(10, "Địa chỉ không được để trống"),
    latitude: z.number(),
    longitude: z.number(),
    totalCapacity: z
      .number()
      .min(1, "Sức chứa không được để trống")
      .max(40, "Không được quá 40 chiếc"),
    stationType: z.enum(["INTERNAL", "AGENCY"]),
    returnSlotLimit: z
      .number()
      .min(1, "Số lượng trả xe tối đa không được để trống")
      .max(40, "Không được quá 40 chiếc"),
  })
  .refine((data) => data.returnSlotLimit < data.totalCapacity, {
    message: "Số lượng trả xe phải nhỏ hơn sức chứa",
    path: ["returnSlotLimit"],
  });
export type StationSchemaFormData = z.infer<typeof stationSchema>;
