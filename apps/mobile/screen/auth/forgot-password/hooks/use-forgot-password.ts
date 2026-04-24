import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "react-native";

import { presentAuthError } from "@/presenters/auth/auth-error-presenter";
import { authService } from "@services/auth/auth-service";

import type { ForgotPasswordNavigationProp } from "../../../../types/navigation";
import type { ForgotPasswordFormValues } from "../forgot-password.schema";

import { forgotPasswordSchema } from "../forgot-password.schema";

export function useForgotPassword() {
  const navigation = useNavigation<ForgotPasswordNavigationProp>();

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
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
      Alert.alert("Lỗi", presentAuthError(result.error, "Không thể gửi OTP."));
      return;
    }

    Alert.alert("Thành công", "Mã OTP đã được gửi đến email của bạn.", [
      {
        text: "Tiếp tục",
        onPress: () => {
          navigation.navigate("ResetPasswordOTP", { email: data.email });
        },
      },
    ]);
  });

  return {
    control,
    errors,
    submit,
    isSubmitting,
    goBack,
  };
}
