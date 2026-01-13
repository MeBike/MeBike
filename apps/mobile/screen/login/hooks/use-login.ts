import { zodResolver } from "@hookform/resolvers/zod";
import { AuthContracts } from "@mebike/shared";
import { useAuthNext } from "@providers/auth-provider-next";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, Animated } from "react-native";
import * as z from "zod";

import type { LoginScreenNavigationProp } from "@/types/navigation";

import { log } from "@/lib/log";
import { testBackendConnection } from "@/utils/test-connection";

export type BackendStatus = "checking" | "online" | "offline";

const loginSchema = AuthContracts.LoginRequestSchema.extend({
  email: z.string().min(1, { message: "Email là bắt buộc" }).email("Email không hợp lệ"),
  password: z.string().min(1, { message: "Mật khẩu là bắt buộc" }),
});
type LoginFormValues = z.infer<typeof loginSchema>;

export function useLogin() {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [showPassword, setShowPassword] = useState(false);
  const [backendStatus, setBackendStatus] = useState<BackendStatus>("checking");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const { login } = useAuthNext();
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    const checkBackend = async () => {
      const isOnline = await testBackendConnection();
      setBackendStatus(isOnline ? "online" : "offline");
    };
    checkBackend();
  }, []);

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      log.warn("Login form errors", { errors });
    }
  }, [errors]);

  const toggleShowPassword = () => {
    setShowPassword(value => !value);
  };

  const submit = handleSubmit(async (data) => {
    const rotationAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    );

    try {
      setIsSubmitting(true);
      rotationAnimation.start();
      const { email, password } = data;
      const result = await login({ email, password });
      if (result) {
        Alert.alert("Đăng nhập thất bại", result._tag === "ApiError" && result.message
          ? result.message
          : "Không thể đăng nhập. Vui lòng thử lại.");
      }
    }
    catch {
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
    }
    finally {
      rotationAnimation.stop();
      rotateAnim.setValue(0);
      setIsSubmitting(false);
    }
  });

  const goToRegister = () => {
    navigation.navigate("Register");
  };

  const goBack = () => {
    navigation.goBack();
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  return {
    control,
    errors,
    showPassword,
    toggleShowPassword,
    backendStatus,
    rotateAnim,
    submit,
    isSubmitting,
    goToRegister,
    goBack,
    handleForgotPassword,
  };
}
