import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthNext } from "@providers/auth-provider-next";
import { useNavigation } from "@react-navigation/native";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "react-native";

import { presentUserError } from "@/presenters/users/user-error-presenter";
import { userService } from "@/services/users/user-service";

import type { ChangePasswordNavigationProp } from "../../../../types/navigation";
import type { ChangePasswordFormValues } from "../change-password.schema";

import { changePasswordSchema } from "../change-password.schema";

type PasswordField = "oldPassword" | "newPassword" | "confirmPassword";

export function useChangePassword() {
  const navigation = useNavigation<ChangePasswordNavigationProp>();
  const { isAuthenticated, status } = useAuthNext();
  const [visibleFields, setVisibleFields] = useState<Record<PasswordField, boolean>>({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const toggleFieldVisibility = (field: PasswordField) => {
    setVisibleFields(current => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const goBack = () => {
    navigation.goBack();
  };

  const submit = handleSubmit(async (data) => {
    if (status === "loading") {
      return;
    }

    if (!isAuthenticated) {
      navigation.navigate("Login");
      return;
    }

    try {
      const result = await userService.changePassword({
        currentPassword: data.oldPassword,
        newPassword: data.newPassword,
      });

      if (result.ok) {
        Alert.alert("Thành công", "Đổi mật khẩu thành công");
        reset();
        navigation.goBack();
        return;
      }

      Alert.alert("Lỗi", presentUserError(result.error, "Đổi mật khẩu thất bại"));
    }
    catch (error) {
      const message = error instanceof Error ? error.message : "Đổi mật khẩu thất bại";
      Alert.alert("Lỗi", message);
    }
  });

  return {
    control,
    errors,
    goBack,
    isSubmitting,
    submit,
    toggleFieldVisibility,
    visibleFields,
  };
}
