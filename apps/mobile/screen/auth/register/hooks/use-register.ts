import { zodResolver } from "@hookform/resolvers/zod";
import { log } from "@lib/log";
import { AuthContracts } from "@mebike/shared";
import { useAuthNext } from "@providers/auth-provider-next";
import { useNavigation } from "@react-navigation/native";
import { authService } from "@services/auth/auth-service";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "react-native";
import * as z from "zod";

import { presentAuthError, presentRegisterFieldError } from "@/presenters/auth/auth-error-presenter";

import type { RegisterScreenNavigationProp } from "../../../../types/navigation";

const registerSchema = AuthContracts.RegisterRequestSchema
  .extend({
    fullname: z.string().min(1, { message: "Họ tên là bắt buộc" }),
    email: z.string().min(1, { message: "Email là bắt buộc" }).email("Email không hợp lệ"),
    password: z.string()
      .min(1, { message: "Mật khẩu là bắt buộc" })
      .min(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" }),
    phoneNumber: z.string().trim().refine(
      value => value.length === 0 || /^\d{10}$/.test(value),
      { message: "Số điện thoại phải gồm đúng 10 chữ số" },
    ),
    confirmPassword: z.string()
      .min(1, { message: "Xác nhận mật khẩu là bắt buộc" })
      .min(8, { message: "Mật khẩu xác nhận phải có ít nhất 8 ký tự" }),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export function useRegister() {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const { hydrate } = useAuthNext();
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
      phoneNumber: data.phoneNumber.trim() ? data.phoneNumber.trim() : null,
    });

    if (!result.ok) {
      const fieldError = presentRegisterFieldError(result.error);
      if (fieldError) {
        setError(fieldError.field, { message: fieldError.message });
        return;
      }

      log.warn("Register failed", result.error);
      Alert.alert("Không thể đăng ký", presentAuthError(result.error, "Không thể đăng ký. Vui lòng thử lại."));
      return;
    }

    const email = data.email;
    reset();
    await hydrate();
    navigation.navigate("EmailVerification", { email });
  });

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
