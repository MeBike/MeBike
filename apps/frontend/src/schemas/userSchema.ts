import * as z from "zod";
import type { VerifyStatus } from "@/types";
export const userProfileSchema = z.object({
  fullname: z.string().min(1, "Họ tên là bắt buộc"),
  email: z.email("Email không hợp lệ"),
  phone_number: z.string().min(10, "Số điện thoại phải ít nhất 10 ký tự"),
  password: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
  role: z.enum(["USER", "STAFF", "ADMIN"]),
  verify: z.enum([] as VerifyStatus[]).optional(),
});
export const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Mật khẩu phải ít nhất 6 ký tự"),
    confirmNewPassword: z
      .string()
      .min(8, "Mật khẩu xác nhận phải ít nhất 6 ký tự"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Mật khẩu xác nhận không khớp",
  });
export type UserProfile = z.infer<typeof userProfileSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;
