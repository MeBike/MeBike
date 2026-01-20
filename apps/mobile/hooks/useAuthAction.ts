import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { Alert } from "react-native";

import type {
  ForgotPasswordSchemaFormData,
  LoginSchemaFormData,
  RegisterSchemaFormData,
  ResetPasswordSchemaFormData,
  UpdateProfileSchemaFormData,
} from "@schemas/authSchema";

import { clearTokens, setTokens , setResetToken ,} from "@utils/tokenManager";

import { useChangePasswordMutation } from "./mutations/Auth/Password/useChangePasswordMutation";
import { useForgotPasswordMutation } from "./mutations/Auth/Password/useForgotPasswordMutation";
import { useResetPasswordMutation } from "./mutations/Auth/Password/useResetPasswordMutation";
import { useLoginMutation } from "./mutations/Auth/useLoginMutation";
import { useLogoutMutation } from "./mutations/Auth/useLogoutMutation";
import { useRegisterMutation } from "./mutations/Auth/useRegisterMutation";
import { useResendVerifyEmailMutation } from "./mutations/Auth/useResendVerifyEmailMutaiton";
import { useUpdateProfileMutation } from "./mutations/Auth/useUpdateProfileMutation";
import { useVerifyEmailMutation } from "./mutations/Auth/useVerifyEmail";
import { useVerifyOTPMutation } from "./mutations/Auth/Password/useVerifyOTPMutation";
import { AuthTokens } from "@/types";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { HTTP_STATUS } from "@/lib/httpClient";
interface ErrorWithMessage {
  message: string;
}


export const useAuthActions = (
  navigation?: { navigate: (route: string) => void },
  onTokenUpdate?: () => void
) => {
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
    (
      oldPassword: string,
      newPassword: string,
      confirmPassword: string
    ): Promise<void> => {
      return new Promise((resolve, reject) => {
        useChangePassword.mutate(
          { oldPassword, newPassword, confirmPassword },
          {
            onSuccess: (result) => {
              const changeData = result.data.data?.ChangePassword;
              if (changeData?.success) {
                Alert.alert("Thành công", changeData.message);
                resolve();
              } else {
                const errorMessage =
                  changeData?.message || "Lỗi khi đổi mật khẩu";
                Alert.alert("Lỗi", errorMessage);
                reject(new Error(errorMessage));
              }
            },
            onError: (error: unknown) => {
              const errorMessage = getErrorMessage(
                error,
                "Lỗi khi đổi mật khẩu"
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
            const loginData = result.data.data?.LoginUser;
            if (result.status === HTTP_STATUS.OK && loginData?.success) {
              const { accessToken, refreshToken } = loginData?.data as AuthTokens;
              await setTokens(accessToken, refreshToken);
              await onTokenUpdate?.();
              await queryClient.invalidateQueries({ queryKey: ["user", "me"] });             
              Alert.alert(
                "Đăng nhập thành công",
                loginData?.message || "Chào mừng bạn quay lại!"
              );
              navigation?.navigate("Main");
              resolve();
            } else {
              const errorMsg = loginData?.message || "Đăng nhập thất bại";
              Alert.alert("Lỗi", errorMsg);
              reject(new Error(errorMsg));
            }
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(error, "Lỗi khi đăng nhập");
            Alert.alert("Lỗi", errorMessage);
            reject(error);
          },
        });
      });
    },
    [useLogin, queryClient, navigation, onTokenUpdate]
  );
  const register = useCallback(
    (data: RegisterSchemaFormData) => {
      return new Promise<void>((resolve, reject) => {
        useRegister.mutate(data, {
          onSuccess: async (result) => {
            const registerData = result.data.data?.RegisterUser;
            if (registerData?.success && result.status === HTTP_STATUS.OK) {
              const { accessToken, refreshToken } = registerData.data as AuthTokens;
              await setTokens(accessToken, refreshToken);
              await onTokenUpdate?.();
              await queryClient.invalidateQueries({ queryKey: ["user", "me"] });
              Alert.alert(
                "Đăng ký thành công",
                registerData.message || "Tài khoản của bạn đã được tạo."
              );
              navigation?.navigate("Main");
              resolve();
            } else {
              const errorMsg = registerData?.message || "Lỗi khi đăng ký";
              Alert.alert("Lỗi", errorMsg);
              reject(new Error(errorMsg));
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
    () => {
      return new Promise<void>((resolve) => {
        console.log(">>> [AuthAction] logOut starting...");
        useLogout.mutate(undefined, {
          onSuccess: async (result) => {
            console.log(">>> [AuthAction] logOut onSuccess");
            await clearTokens();
            await onTokenUpdate?.();
            queryClient.clear();
            Alert.alert("Thành công", "Đăng xuất thành công", [
              {
                text: "OK",
                onPress: () => {
                  navigation?.navigate("Login");
                  resolve();
                },
              },
            ]);
          },
          onError: async (error: unknown) => {
            console.log(">>> [AuthAction] logOut onError:", error);
            // Always force local logout even if server fails
            await clearTokens();
            await onTokenUpdate?.();
            queryClient.clear();
            Alert.alert("Thông báo", "Đã đăng xuất (phiên làm việc kết thúc).", [
              {
                text: "OK",
                onPress: () => {
                  navigation?.navigate("Login");
                  resolve();
                },
              },
            ]);
          },
        });
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
              Alert.alert(result.data?.data?.VerifyEmailProcess.message || "Verify email successfuly");
              queryClient.invalidateQueries({ queryKey: ["user","me"] });
              resolve();
            }
          },
          onError: (error: unknown) => {
            console.log("verifyEmail onError:", error);
            const errorMessage = getErrorMessage(
              error,
              "OTP expired"
            );
            Alert.alert(errorMessage);
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
          const resendData = result.data.data?.VerifyEmail;
          if (resendData?.success) {
            Alert.alert(
              "Thành công",
              resendData.message || "Email xác minh đã được gửi lại thành công"
            );
            resolve();
          } else {
            const errorMessage =
              resendData?.message || "Lỗi khi gửi lại email xác minh";
            Alert.alert("Lỗi", errorMessage);
            reject(new Error(errorMessage));
          }
        },
        onError: (error: unknown) => {
          const errorMessage = getErrorMessage(
            error,
            "Lỗi khi gửi lại email xác minh"
          );
          Alert.alert("Error", errorMessage);
          reject(error);
        },
      });
    });
  }, [useResendVerifyEmail]);
  const forgotPassword = useCallback(
    (data: ForgotPasswordSchemaFormData) => {
      useForgotPassword.mutate(data, {
        onSuccess: (result) => {
          const forgotData = result.data.data?.ResetPasswordRequest;
          if (forgotData?.success) {
            Alert.alert(
              "Thành công",
              forgotData.message || "Email đặt lại mật khẩu đã được gửi thành công"
            );
          } else {
            const errorMessage =
              forgotData?.message || "Lỗi khi gửi email đặt lại mật khẩu";
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
            const resetData = result.data.data?.ResetPassword;
            if (resetData?.success) {
              Alert.alert("Thành công", resetData.message || "Đặt lại mật khẩu thành công");
              navigation?.navigate("Login");
              resolve();
            } else {
              const errorMessage =
                resetData?.message || "Lỗi khi đặt lại mật khẩu";
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
            const updateData = result.data.data?.UpdateProfile;
            if (updateData?.success) {
              Alert.alert("Thành công", updateData.message || "Cập nhật thông tin thành công");
              queryClient.invalidateQueries({ queryKey: ["user", "me"] });
              resolve();
            } else {
              const errorMessage =
                updateData?.message || "Lỗi khi cập nhật thông tin";
              reject(new Error(errorMessage));
            }
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(
              error,
              "Lỗi khi cập nhật thông tin"
            );
            reject(new Error(errorMessage));
          },
        });
      });
    },
    [useUpdateProfile, queryClient]
  );
  const useVerifyOTP = useVerifyOTPMutation();
  const verifyOTP = useCallback(({email, otp}: {email: string; otp: string}) => {
    return new Promise<void>((resolve, reject) => {
      useVerifyOTP.mutate({email, otp}, {
        onSuccess: async (result) => {
          if (result.status === HTTP_STATUS.OK) {
            const resetToken = result.data?.data?.VerifyOTP.data?.resetToken;
            console.log("Reset token from API:", resetToken);
            if (resetToken) {
              await setResetToken(resetToken);
              console.log("Reset token saved to AsyncStorage");
            } else {
              console.warn("No reset token in API response");
            }
            Alert.alert ("Thành công", result.data?.data?.VerifyOTP.message || "Mã OTP đã được xác minh thành công");
            resolve();
          } else {
            reject(new Error("Xác minh OTP thất bại"));
          }
        },
        onError: (error: unknown) => {
          const errorMessage = getErrorMessage(
            error,
            "Lỗi khi xác minh OTP"
          );
          Alert.alert("Lỗi", errorMessage);
          reject(error);
        },
      });
    });
  }, [useVerifyOTP]);
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
    verifyOTP,
    isUpdatingProfile: useUpdateProfile.isPending,
    isChangingPassword: useChangePassword.isPending,
    isRegistering: useRegister.isPending,
    isReseting: useResetPassword.isPending,
    isLoadingForgottingPassword: useForgotPassword.isPending,
    isLoggingIn: useLogin.isPending,
    isLoggingOut: useLogout.isPending,
  };
};
