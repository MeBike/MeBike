import * as z from "zod";
export const createSupplierSchema = z.object({
  name: z.string().min(1, { message: "Tên nhà cung cấp không được để trống" }),
  address: z.string().min(1, { message: "Địa chỉ không được để trống" }),
  phone_number: z
    .string()
    .min(1, { message: "Số điện thoại không được để trống" }),
  contract_fee: z
    .string()
    .min(1, { message: "Phí hợp đồng không được để trống" }),
});
export type CreateSupplierSchema = z.infer<typeof createSupplierSchema>;
