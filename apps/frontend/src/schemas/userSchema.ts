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

export type UserProfile = z.infer<typeof userProfileSchema>;
