import { AuthContracts } from "@mebike/shared";
import * as z from "zod";

export const loginSchema = AuthContracts.LoginRequestSchema.extend({
  email: z.string().min(1, { message: "Email là bắt buộc" }).email("Email không hợp lệ"),
  password: z.string().min(1, { message: "Mật khẩu là bắt buộc" }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
