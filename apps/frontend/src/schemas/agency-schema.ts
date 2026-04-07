import * as z from "zod";
import { isValidUUID } from "@utils";
export const updateStatusAgencySchema = z.object({
    status : z.enum(["ACTIVE","INACTIVE","SUSPENDED","BANNED"]),
})
export type UpdateStatusAgencyFormData = z.infer<typeof updateStatusAgencySchema>;
export const updateSchema = z.object({
    address : z.string(),
    contactPhone :  z.string().min(10, "Số điện thoại phải ít nhất 10 ký tự"),
    name : z.string(),
})
export type UpdateAgencyFormData = z.infer<typeof updateSchema>;
