import * as z from "zod";
import { isValidUUID } from "@/utils/validatorObjectId";
const vietnamesePhoneNumberRegex = /^(0[3|5|7|8|9])+([0-9]{8})\b/;
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
    fullname: z
      .string()
      .min(1, { message: "Họ không được để trống" })
      .max(30, { message: "Họ không được vượt quá 30 ký tự" }),
    email: z.email({ message: "Email không hợp lệ" }),
    password: z
      .string()
      .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" }),
    phoneNumber: z
      .string()
      .regex(vietnamesePhoneNumberRegex, {
        message: "Số điện thoại không hợp lệ",
      })
      .optional(),
  })
;
export const forgotPasswordSchema = z.object({
  email: z.email({ message: "Email không hợp lệ" }),
});
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, { message: "Mật khẩu cũ phải có ít nhất 8 ký tự" })
      .max(30, { message: "Mật khẩu cũ không được vượt quá 32 ký tự" }),
    newPassword: z
      .string()
      .min(8, { message: "Mật khẩu mới phải có ít nhất 8 ký tự" })
      .max(30, { message: "Mật khẩu không được vượt quá 32 ký tự" }),
});
export const changePasswordForAdminSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, { message: "Mật khẩu cũ phải có ít nhất 8 ký tự" })
      .max(30, { message: "Mật khẩu cũ không được vượt quá 32 ký tự" }),
    password: z
      .string()
      .min(8, { message: "Mật khẩu mới phải có ít nhất 8 ký tự" })
      .max(30, { message: "Mật khẩu không được vượt quá 32 ký tự" }),
    confirm_password: z
      .string()
      .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" })
      .max(30, { message: "Mật khẩu không được vượt quá 30 ký tự" }),
})
export type ChangePasswordForAdminSchemaFormData = z.infer<typeof changePasswordForAdminSchema>;
export const profileUpdateSchema = z.object({
  fullname: z
    .string()
    .min(3, { message: "Họ và tên phải có ít nhất 3 ký tự" })
    .max(50, { message: "Họ và tên không được vượt quá 50 ký tự" }),
  location: z
    .string()
    .min(10, { message: "Địa điểm phải có ít nhất 10 ký tự" })
    .max(50, { message: "Địa điểm không được vượt quá 100 ký tự" }),
  username: z
    .string()
    .min(3, "Tên tài khoản phải có ít nhất 3 ký tự.")
    .max(30, "Tên tài khoản không được vượt quá 30 ký tự.")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Tên tài khoản chỉ được chứa chữ cái, số và dấu gạch dưới."
    )
    .optional()
    .or(z.literal("")),
  phoneNumber: z
    .string()
    .regex(vietnamesePhoneNumberRegex, {  
      message: "Số điện thoại không hợp lệ",
    })
    .optional()
    .or(z.literal("")),
  avatar : z.url({ message: "Avatar phải là một URL hợp lệ" }).optional(),  
});
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { message: "Mật khẩu mới phải có ít nhất 8 ký tự" })
    .max(30, { message: "Mật khẩu không được vượt quá 32 ký tự" }),
  confirm_password: z
    .string()
    .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" })
    .max(30, { message: "Mật khẩu không được vượt quá 30 ký tự" }),
  forgot_password_token: z.string().optional(),
  email: z.string().optional(),
  otp: z.string().optional(),
});
export const confirmResetPasswordSchema = z.object({
  email: z.email({ message: "Email không hợp lệ" }),
  otp: z.string().min(1, { message: "Mã OTP không được để trống" }),
  newPassword: z
    .string()
    .min(8, { message: "Mật khẩu mới phải có ít nhất 8 ký tự" })
    .max(30, { message: "Mật khẩu không được vượt quá 32 ký tự" }),
})
export type ConfirmResetPasswordSchemaFormData = z.infer<typeof confirmResetPasswordSchema>;
export const verifyEmailSchema = z.object({
  userId: z.string().refine(isValidUUID, { message: "User ID không hợp lệ" }),
  otp: z.string().min(1, { message: "Mã OTP không được để trống" }),
});
export type VerifyEmailSchemaFormData = z.infer<typeof verifyEmailSchema>;
