import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { Alert } from "react-native";

import type { ForgotPasswordSchemaFormData, LoginSchemaFormData, RegisterSchemaFormData, ResetPasswordSchemaFormData, UpdateProfileSchemaFormData } from "@schemas/authSchema";

import { clearTokens, setTokens } from "@utils/tokenManager";

import { useChangePasswordMutation } from "./mutations/Auth/Password/useChangePasswordMutation";
import { useForgotPasswordMutation } from "./mutations/Auth/Password/useForgotPasswordMutation";
import { useResetPasswordMutation } from "./mutations/Auth/Password/useResetPasswordMutation";
import { useLoginMutation } from "./mutations/Auth/useLoginMutation";
import { useLogoutMutation } from "./mutations/Auth/useLogoutMutation";
import { useRegisterMutation } from "./mutations/Auth/useRegisterMutation";
import { useResendVerifyEmailMutation } from "./mutations/Auth/useResendVerifyEmailMutaiton";
import { useUpdateProfileMutation } from "./mutations/Auth/useUpdateProfileMutation";
import { useVerifyEmailMutation } from "./mutations/Auth/useVerifyEmail";
import { AuthTokens } from "@/types";
import { HTTP_STATUS } from "@constants";
interface ErrorResponse {
  response?: {
    data?: {
      errors?: Record<string, { msg?: string }>;
      message?: string;
    };
  };
}

interface ErrorWithMessage {
  message: string;
}

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  const axiosError = error as ErrorResponse;
  if (axiosError?.response?.data) {
    const { errors, message } = axiosError.response.data;
    if (errors) {
      const firstError = Object.values(errors)[0];
      if (firstError?.msg) return firstError.msg;
    }
    if (message) return message;
  }
  const simpleError = error as ErrorWithMessage;
  if (simpleError?.message) {
    return simpleError.message;
  }

  return defaultMessage;
};

export const useAuthActions = (navigation?: { navigate: (route: string) => void }, onTokenUpdate?: () => void) => {
  const queryClient = useQueryClient();
  const useLogin = useLoginMutation();
  const useRegister = useRegisterMutation();
  const useLogout = useLogoutMutation();
  const useChangePassword = useChangePasswordMutation();
  const useVerifyEmail = useVerifyEmailMutation();
  const useUpdateProfile = useUpdateProfileMutation();
  const useForgotPassword = useForgotPasswordMutation();
  const useResetPassword = useResetPasswordMutation();
  const useResendVerifyEmail = useResendVerifyEmailMutation();
  const changePassword = useCallback(
    (old_password: string, password: string, confirm_password: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        useChangePassword.mutate(
          { old_password, password, confirm_password },
          {
            onSuccess: (result) => {
              if (result.status === 200) {
                Alert.alert("Success", result.data.message);
                resolve();
              } else {
                const errorMessage = result.data?.message || "Error changing password";
                Alert.alert("Lỗi", errorMessage);
                reject(new Error(errorMessage));
              }
            },
            onError: (error: unknown) => {
              const errorMessage = getErrorMessage(
                error,
                "Error changing password"
              );
              Alert.alert("Lỗi", errorMessage);
              reject(error);
            },
          }
        );
      });
    },
    [useChangePassword]
  );
  const logIn = useCallback(
    (data: LoginSchemaFormData) => {
      return new Promise<void>((resolve, reject) => {
        useLogin.mutate(data, {
          onSuccess: async (result) => {
            const { accessToken, refreshToken } = result.data.data?.LoginUser.data as AuthTokens
            console.log(result.data.data?.LoginUser.data);
            setTokens(accessToken, refreshToken);
            await queryClient.invalidateQueries({ queryKey: ["user", "me"] });
            Alert.alert("Đăng nhập thành công", "Chào mừng trở lại!");
            navigation?.navigate("Main");
            resolve();
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(error, "Lỗi khi đăng nhập");
            Alert.alert("Lỗi đăng nhập", errorMessage);
            reject(error);
          },
        });
      });
    },
    [useLogin, queryClient, onTokenUpdate, navigation]
  );
  const register = useCallback(
    (data: RegisterSchemaFormData) => {
      return new Promise<void>((resolve, reject) => {
        useRegister.mutate(data, {
          onSuccess: async (result) => {
            if (result.status === 200) {
              const { accessToken, refreshToken } = result.data.data?.RegisterUser.data as AuthTokens;
              setTokens(accessToken, refreshToken);
              await onTokenUpdate?.();
              await queryClient.invalidateQueries({ queryKey: ["user", "me"] });
              Alert.alert("Thành công", "Đăng ký thành công. Tài khoản của bạn đã được tạo.");
              navigation?.navigate("Main");
              resolve();
            }
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(error, "Lỗi khi đăng ký");
            Alert.alert("Lỗi", errorMessage);
            reject(error);
          },
        });
      });
    },
    [useRegister, queryClient, onTokenUpdate, navigation]
  );
  const logOut = useCallback(
    (refresh_token: string) => {
      useLogout.mutate(refresh_token, {
        onSuccess: (result) => {
          if (result.status === 200) {
            clearTokens();
            onTokenUpdate?.();
            queryClient.clear();
            Alert.alert("Thành công", "Đăng xuất thành công");
            navigation?.navigate("Login");
          }
        },
        onError: (error: unknown) => {
          const errorMessage = getErrorMessage(error, "Lỗi khi đăng xuất");
          Alert.alert("Lỗi", errorMessage);
        },
      });
    },
    [useLogout, queryClient, onTokenUpdate, navigation]
  );
  const verifyEmail = useCallback(
    ({otp} : {otp: string}): Promise<void> => {
      return new Promise((resolve, reject) => {
        useVerifyEmail.mutate({ otp }, {
          onSuccess: (result) => {
            console.log("verifyEmail onSuccess:", result.status);
            if (result.status === HTTP_STATUS.OK) {
              // const accessToken = result.data.data?.VerifyOTP.data.?.access_token;
              // const refreshToken = result.data.result?.refresh_token;
              // if (!accessToken || !refreshToken) {
              //   const errMsg = "Thiếu access hoặc refresh token";
              //   toast.error(errMsg);
              //   reject(new Error(errMsg));
              //   return;
              // }
              // setTokens(accessToken, refreshToken);
              // window.dispatchEvent(new StorageEvent("storage", { key: "auth_tokens" }));
              Alert.alert("Thành công", result.data?.data?.VerifyEmailProcess.message || "Xác thực email thành công");
              queryClient.invalidateQueries({ queryKey: ["user", "me"] });
              resolve();
            }
          },
          onError: (error: unknown) => {
            console.log("verifyEmail onError:", error);
            const errorMessage = getErrorMessage(
              error,
              "Lỗi khi xác thực email"
            );
            Alert.alert("Lỗi", errorMessage);
            reject(error);
          },
        });
      });
    },
    [useVerifyEmail, queryClient]
  );
  const resendVerifyEmail = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      useResendVerifyEmail.mutate(undefined, {
        onSuccess: (result) => {
          if (result.status === HTTP_STATUS.OK) {
            Alert.alert("Thành công", result.data?.data?.VerifyEmail.message || "Gửi lại mã xác thực thành công");
            resolve();
          }
        },
        onError: (error: unknown) => {
          const errorMessage = getErrorMessage(
            error,
            "Lỗi khi gửi lại mã xác thực"
          );
          Alert.alert("Lỗi", errorMessage);
          reject(error);
        },
      });
    });
  }, [useResendVerifyEmail]);
  const forgotPassword = useCallback(
    (data: ForgotPasswordSchemaFormData) => {
      useForgotPassword.mutate(data, {
        onSuccess: (result) => {
          if (result.status === 200) {
            Alert.alert("Thành công", "Email đặt lại mật khẩu đã được gửi thành công");
          } else {
            const errorMessage =
              result.data?.message || "Lỗi khi gửi email đặt lại mật khẩu";
            Alert.alert("Lỗi", errorMessage);
          }
        },
        onError: (error: unknown) => {
          const errorMessage = getErrorMessage(
            error,
            "Lỗi khi gửi email đặt lại mật khẩu"
          );
          Alert.alert("Lỗi", errorMessage);
        },
      });
    },
    [useForgotPassword]
  );
  

  const resetPassword = useCallback(
    (data: ResetPasswordSchemaFormData): Promise<void> => {
      return new Promise((resolve, reject) => {
        useResetPassword.mutate(data, {
          onSuccess: (result) => {
            if (result.status === 200) {
              Alert.alert("Thành công", "Đặt lại mật khẩu thành công");
              navigation?.navigate("Login");
              resolve();
            } else {
              const errorMessage =
                result.data?.message || "Lỗi khi đặt lại mật khẩu";
              Alert.alert("Lỗi", errorMessage);
              reject(new Error(errorMessage));
            }
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(
              error,
              "OTP không hợp lệ hoặc đã hết hạn"
            );
            Alert.alert("Error", errorMessage);
            reject(error);
          },
        });
      });
    },
    [useResetPassword, navigation]
  );
  const updateProfile = useCallback(
    (data: Partial<UpdateProfileSchemaFormData>): Promise<void> => {
      return new Promise((resolve, reject) => {
        useUpdateProfile.mutate(data, {
          onSuccess: (result) => {
            if (result.status === 200) {
              Alert.alert("Thành công", "Cập nhật thông tin thành công");
              queryClient.invalidateQueries({ queryKey: ["user", "me"] });
              resolve();
            } else {
              const errorMessage =
                result.data?.message || "Lỗi khi cập nhật thông tin";
              reject(new Error(errorMessage));
            }
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(error, "Lỗi khi cập nhật thông tin");
            reject(new Error(errorMessage));
          },
        });
      });
    },
    [useUpdateProfile, queryClient]
  );
  return {
    changePassword,
    logIn,
    register,
    logOut,
    verifyEmail,
    resendVerifyEmail,
    forgotPassword,
    resetPassword,
    updateProfile,
    isUpdatingProfile: useUpdateProfile.isPending,
    isChangingPassword: useChangePassword.isPending,
    isRegistering: useRegister.isPending,
    isReseting: useResetPassword.isPending,
    isLoadingForgottingPassword: useForgotPassword.isPending,
    isLoggingIn: useLogin.isPending,
    isLoggingOut: useLogout.isPending,
  };
};
