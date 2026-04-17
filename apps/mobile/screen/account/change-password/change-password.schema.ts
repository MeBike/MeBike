import * as z from "zod";

export const changePasswordSchema = z
  .object({
    oldPassword: z.string()
      .min(1, { message: "Vui lòng nhập mật khẩu hiện tại." })
      .min(8, { message: "Mật khẩu hiện tại phải có ít nhất 8 ký tự." }),
    newPassword: z.string()
      .min(1, { message: "Vui lòng nhập mật khẩu mới." })
      .min(8, { message: "Mật khẩu mới phải có ít nhất 8 ký tự." }),
    confirmPassword: z.string()
      .min(1, { message: "Vui lòng xác nhận mật khẩu mới." })
      .min(8, { message: "Mật khẩu xác nhận phải có ít nhất 8 ký tự." }),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp.",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
