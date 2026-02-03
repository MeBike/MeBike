import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "react-native";

import { authService } from "@services/auth/auth-service";
import { forgotPasswordSchema, type ForgotPasswordSchemaFormData } from "@schemas/authSchema";

import type { ForgotPasswordNavigationProp } from "../../../types/navigation";

export function useForgotPassword() {
  const navigation = useNavigation<ForgotPasswordNavigationProp>();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordSchemaFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const goBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const submit = handleSubmit(async (data) => {
    const result = await authService.sendResetPassword({ email: data.email });
    if (!result.ok) {
      if (result.error._tag === "ApiError") {
        Alert.alert("Lỗi", result.error.message ?? "Không thể gửi OTP");
        return;
      }
      if (result.error._tag === "NetworkError") {
        Alert.alert("Lỗi", "Không thể kết nối tới máy chủ");
        return;
      }
      Alert.alert("Lỗi", "Không thể gửi OTP");
      return;
    }

    navigation.navigate("ResetPasswordOTP", { email: data.email });
  });

  return {
    control,
    errors,
    submit,
    isSubmitting,
    goBack,
  };
}
