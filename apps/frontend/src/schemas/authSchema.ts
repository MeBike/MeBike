import * as z from "zod";
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
    phone_number: z
      .string()
      .regex(vietnamesePhoneNumberRegex, {
        message: "Số điện thoại không hợp lệ",
      })
      .optional(),
    confirm_password: z
      .string()
      .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirm_password"],
  });
export const forgotPasswordSchema = z.object({
  email: z.email({ message: "Email không hợp lệ" }),
});
export const changePasswordSchema = z
  .object({
    old_password: z
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
  .refine((data) => data.password === data.confirm_password, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirm_password"],
  });
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
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username cannot exceed 30 characters.")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores."
    )
    .optional()
    .or(z.literal("")),
  phone_number: z
    .string()
    .regex(vietnamesePhoneNumberRegex, {  
      message: "Số điện thoại không hợp lệ",
    })
    .optional()
    .or(z.literal("")),
  avatar : z.string().url({ message: "Avatar phải là một URL hợp lệ" }).optional(),  
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
