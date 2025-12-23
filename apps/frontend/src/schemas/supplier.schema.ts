import * as z from "zod";
export const createSupplierSchema = z.object({
  name: z.string().min(1, { message: "Tên nhà cung cấp không được để trống" }),
  address: z.string().min(1, { message: "Địa chỉ không được để trống" }),
  phone: z.string().min(1, { message: "Số điện thoại không được để trống" }),
  contactFee: z.number().min(0, "Phí tối thiểu là 0").max(1, "Phí tối đa là 1"),
});
export type CreateSupplierSchema = z.infer<typeof createSupplierSchema>;
