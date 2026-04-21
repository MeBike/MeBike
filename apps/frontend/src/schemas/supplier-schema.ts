import * as z from "zod";
export const createSupplierSchema = z.object({
  name: z.string().min(1, { message: "Tên nhà cung cấp không được để trống" }),
  address: z.string().min(1, { message: "Địa chỉ không được để trống" }),
  phoneNumber: z
  .string()
  .length(10, "Số điện thoại phải bao gồm chính xác 10 chữ số")
  .regex(/^[0-9]+$/, "Chỉ được nhập số"),
  contractFee: z
    .number()
    .min(0, { message: "Phí hợp đồng phải lớn hơn 0" }),
});
export const updateSupplierSchema = z.object({
  name: z.string().min(1, { message: "Tên nhà cung cấp không được để trống" }),
  address: z.string().min(1, { message: "Địa chỉ không được để trống" }),
  phoneNumber: z
  .string()
  .length(10, "Số điện thoại phải bao gồm chính xác 10 chữ số")
  .regex(/^[0-9]+$/, "Chỉ được nhập số"),
  contractFee: z
    .number()
    .min(0, { message: "Phí hợp đồng phải lớn hơn 0" }),
  status: z.enum(["ACTIVE", "INACTIVE", "TERMINATED"]),
})
export type CreateSupplierSchema = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierSchema = z.infer<typeof updateSupplierSchema>;