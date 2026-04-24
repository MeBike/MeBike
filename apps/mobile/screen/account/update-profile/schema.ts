import { ServerContracts } from "@mebike/shared";
import * as z from "zod";

const updateProfileContractSchema = ServerContracts.UsersContracts.UpdateMeRequestSchema.pick({
  fullname: true,
  location: true,
  phoneNumber: true,
  username: true,
});

export const updateProfileSchema = updateProfileContractSchema.extend({
  fullname: z.string().trim().min(1, { message: "Vui lòng nhập họ tên" }).max(50),
  username: z.string().trim().max(30).optional().or(z.literal("")),
  phoneNumber: z.string()
    .trim()
    .min(1, { message: "Vui lòng nhập số điện thoại" })
    .regex(/^\d{10}$/, { message: "Số điện thoại phải gồm đúng 10 chữ số" }),
  location: z.string().trim().optional().or(z.literal("")),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
