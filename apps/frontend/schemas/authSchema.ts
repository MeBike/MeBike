import * as z from "zod";
const vietnamesePhoneNumberRegex = /^(0[3|5|7|8|9])+([0-9]{8})\b/;


export const loginSchema = z.object({
    email:z.email({message:"Email không hợp lệ"}),
    password:z.string().min(8,{message:"Mật khẩu phải có ít nhất 8 ký tự"}),
    rememberMe:z.boolean().optional(),
})

export type LoginFormData = z.infer<typeof loginSchema>;

