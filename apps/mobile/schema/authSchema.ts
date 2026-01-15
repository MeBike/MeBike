import * as z from "zod";

const vietnamesePhoneNumberRegex = /^(0[3|5789])+(\d{8})\b/;
export const loginSchema = z.object({
  email: z.email({ message: "Email không hợp lệ" }),
  password: z.string().min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" }),
  rememberMe: z.boolean().optional(),
});
export type LoginSchemaFormData = z.infer<typeof loginSchema>;
export type RegisterSchemaFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordSchemaFormData = z.infer<typeof forgotPasswordSchema>;
export type ChangePasswordSchemaFormData = z.infer<typeof changePasswordSchema>;
export type UpdateProfileSchemaFormData = z.infer<typeof profileUpdateSchema>;
export type ResetPasswordSchemaFormData = z.infer<typeof resetPasswordSchema>;
export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, { message: "Họ không được để trống" })
      .max(30, { message: "Họ không được vượt quá 30 ký tự" }),
    email: z.email({ message: "Email không hợp lệ" }),
    YOB: z
      .number()
      .min(1900, { message: "Năm sinh không hợp lệ" })
      .max(2025, { message: "Năm sinh không hợp lệ" }),
    password: z
      .string()
      .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" }),
    phone: z
      .string()
      .regex(vietnamesePhoneNumberRegex, {
        message: "Số điện thoại không hợp lệ",
      })
      .or(z.literal("")),
    confirmPassword: z
      .string()
      .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });
export const forgotPasswordSchema = z.object({
email: z.email({ message: "Email không hợp lệ" }),
});
export const changePasswordSchema = z
  .object({
    oldPassword: z
      .string()
      .min(8, { message: "Mật khẩu cũ phải có ít nhất 8 ký tự" })
      .max(30, { message: "Mật khẩu cũ không được vượt quá 32 ký tự" }),
    newPassword: z
      .string()
      .min(8, { message: "Mật khẩu mới phải có ít nhất 8 ký tự" })
      .max(30, { message: "Mật khẩu không được vượt quá 32 ký tự" }),
    confirmPassword: z
      .string()
      .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" })
      .max(30, { message: "Mật khẩu không được vượt quá 30 ký tự" }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });
  export const profileUpdateSchema = z.object({
    name: z
      .string()
      .min(3, { message: "Họ và tên phải có ít nhất 3 ký tự" })
      .max(50, { message: "Họ và tên không được vượt quá 50 ký tự" }),
    YOB: z
      .number()
      .min(1900, { message: "Năm sinh không hợp lệ" })
      .max(2025, { message: "Năm sinh không hợp lệ" }),
    address: z
      .string()
      .min(10, { message: "Địa chỉ phải có ít nhất 10 ký tự" })
      .max(100, { message: "Địa chỉ không được vượt quá 100 ký tự" }),
    phone: z
      .string()
      .regex(vietnamesePhoneNumberRegex, {
        message: "Số điện thoại không hợp lệ",
      })
      .optional()
      .or(z.literal("")),
    avatarUrl: z
      .string()
      .url({ message: "Avatar phải là một URL hợp lệ" })
      .optional(),
    nfcCardUid: z
      .string()
      .min(1, { message: "NFC không được để trống" })
      .max(30, { message: "NFC không được vượt quá 30 ký tự" })
      .optional(),
  });
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Mật khẩu mới phải có ít nhất 8 ký tự" })
    .max(30, { message: "Mật khẩu không được vượt quá 32 ký tự" }),
  confirmPassword: z
    .string()
    .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" })
    .max(30, { message: "Mật khẩu không được vượt quá 30 ký tự" }),
  resetToken: z.string() .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" })
  .max(30, { message: "Mật khẩu không được vượt quá 30 ký tự" }),
});
