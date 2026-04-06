import * as z from "zod";

export const forgotPasswordSchema = z.object({
  email: z.email({ message: "Email không hợp lệ" }),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
