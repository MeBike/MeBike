import * as z from "zod";
export const updateAgencyStatusSchema = z.object({
    status : z.enum(["ACTIVE","INACTIVE","SUSPENDED","BANNED"]),
})
export type UpdateAgencyStatusFormData = z.infer<typeof updateAgencyStatusSchema>;
export const updateSchema = z.object({
    contactPhone :  z.string().min(10, "Số điện thoại phải ít nhất 10 ký tự"),
    name : z.string(),
})
export type UpdateAgencyFormData = z.infer<typeof updateSchema>;
