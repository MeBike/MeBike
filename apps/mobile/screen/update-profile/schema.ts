import * as z from "zod";

export const updateProfileSchema = z.object({
  fullname: z.string().min(1, { message: "Vui lòng nhập họ tên" }).max(50),
  username: z.string().max(30).optional().or(z.literal("")),
  phoneNumber: z.string().min(1, { message: "Vui lòng nhập số điện thoại" }),
  location: z.string().optional().or(z.literal("")),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>;
