import { zodResolver } from "@hookform/resolvers/zod";
import { log } from "@lib/log";
import { AuthContracts } from "@mebike/shared";
import { useNavigation } from "@react-navigation/native";
import { authService } from "@services/auth/auth-service";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import type { RegisterScreenNavigationProp } from "../../../types/navigation";

const registerSchema = AuthContracts.RegisterRequestSchema
  .extend({
    fullname: z.string().min(1, { message: "Họ tên là bắt buộc" }),
    email: z.string().min(1, { message: "Email là bắt buộc" }).email("Email không hợp lệ"),
    password: z.string().min(1, { message: "Mật khẩu là bắt buộc" }),
    phoneNumber: z.string().optional().nullable().or(z.literal("")),
    confirmPassword: z.string().min(1, { message: "Xác nhận mật khẩu là bắt buộc" }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export function useRegister() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const {
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullname: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
    },
  });

  const submit = handleSubmit(async (data) => {
    const result = await authService.register({
      fullname: data.fullname,
      email: data.email,
      password: data.password,
      phoneNumber: data.phoneNumber ? data.phoneNumber : null,
    });

    if (!result.ok) {
      if (result.error._tag === "ApiError") {
        if (result.error.code === "DUPLICATE_EMAIL") {
          setError("email", { message: result.error.message ?? "Email đã được sử dụng" });
          return;
        }
        if (result.error.code === "DUPLICATE_PHONE_NUMBER") {
          setError("phoneNumber", { message: result.error.message ?? "Số điện thoại đã được sử dụng" });
          return;
        }
      }
      log.warn("Register failed", result.error);
      return;
    }

    const email = data.email;
    reset();
    navigation.navigate("EmailVerification", { email });
  });

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      log.warn("Register form errors", { errors });
    }
  }, [errors]);

  const goBack = () => {
    navigation.goBack();
  };

  return {
    control,
    errors,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    submit,
    isSubmitting,
    goBack,
  };
}
