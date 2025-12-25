import * as z from "zod";
import type { VerifyStatus } from "@/types";
export const userProfileSchema = z.object({
  // fullname: z.string().min(1, "Họ tên là bắt buộc"),
  // email: z.email("Email không hợp lệ"),
  // phone_number: z.string().min(10, "Số điện thoại phải ít nhất 10 ký tự"),
  // password: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
  // role: z.enum(["USER", "STAFF", "ADMIN", "SOS"]),
  // verify: z.enum([] as VerifyStatus[]).optional(),
  // location: z.string().optional(),
  // username: z.string().optional(),
  // nfc_card_uid: z.string().optional(),
  name: z.string().min(1, "Họ tên là bắt buộc"),
  email: z.email("Email không hợp lệ"),
  phone: z.string().min(10, "Số điện thoại phải ít nhất 10 ký tự"),
  password: z.string().min(6, "Mật khẩu phải ít nhất 6 ký tự"),
  role: z.enum(["USER", "STAFF", "ADMIN", "SOS"]),
  YOB: z.number().min(1900, "Năm sinh phải ít nhất 1900").max(new Date().getFullYear(), "Năm sinh phải nhỏ hơn năm hiện tại"),
});
export const resetPasswordSchema = z
  .object({
    new_password: z.string().min(8, "Mật khẩu phải ít nhất 6 ký tự"),
    confirm_new_password: z
      .string()
      .min(30, "Mật khẩu xác nhận phải ít nhất 6 ký tự"),
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    message: "Mật khẩu xác nhận không khớp",
  });
export type UserProfile = z.infer<typeof userProfileSchema>;
export type ResetPasswordRequest = z.infer<typeof resetPasswordSchema>;

export const adminUpdateUserSchema = z.object({
  fullname: z.string().min(1, "Họ tên là bắt buộc"),
  email: z.string().optional(), // Email usually not editable here or read-only, but form doesn't show it? Form handles it in handleUpdateProfile using original email.
  phone_number: z.string().min(10, "Số điện thoại phải ít nhất 10 ký tự").or(z.literal("")).optional(),
  location: z.string().optional(),
  username: z.string().optional(),
});

export type AdminUpdateUserSchemaFormData = z.infer<typeof adminUpdateUserSchema>;
