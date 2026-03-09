import * as z from "zod";
export const createSupplierSchema = z.object({
  name: z.string().min(1, { message: "Tên nhà cung cấp không được để trống" }),
  address: z.string().min(1, { message: "Địa chỉ không được để trống" }),
  phoneNumber: z
    .string()
    .min(1, { message: "Số điện thoại không được để trống" }),
  contractFee: z
    .number()
    .min(0, { message: "Phí hợp đồng phải lớn hơn 0" }),
});
export type CreateSupplierSchema = z.infer<typeof createSupplierSchema>;
