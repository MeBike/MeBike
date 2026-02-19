import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clearTokens, setTokens } from "@utils/tokenManager";
import { useChangePasswordMutation } from "./mutations/Auth/Password/useChangePasswordMutation";
import { useLoginMutation } from "./mutations/Auth/useLoginMutation";
import { useRegisterMutation } from "./mutations/Auth/useRegisterMutation";
import { useLogoutMutation } from "./mutations/Auth/useLogoutMutation";
import {
  ConfirmResetPasswordSchemaFormData,
  ChangePasswordSchemaFormData,
  ForgotPasswordSchemaFormData,
  LoginSchemaFormData,
  RegisterSchemaFormData,
  UpdateProfileSchemaFormData,
  VerifyEmailSchemaFormData,
  VerifyOTPForForgotPasswordSchemaFormData,
} from "@/schemas/authSchema";
import { useVerifyEmailMutation } from "./mutations/Auth/useVerifyEmail";
import { useResendVerifyEmailMutation } from "./mutations/Auth/useResendVerifyEmailMutaiton";
import { useForgotPasswordMutation } from "./mutations/Auth/Password/useForgotPasswordMutation";
import { useConfirmResetPasswordMutation } from "./mutations/Auth/Password/useConfirmResetPasswordMutation";
import { useUpdateProfileMutation } from "./mutations/Auth/useUpdateProfileMutation";
import getErrorMessage from "@/utils/error-message";
import { AxiosError } from "axios";
import getAxiosErrorCodeMessage from "@/utils/error-util";
import { USERS_MESSAGES } from "@/constants/messages";
import { getErrorMessageUserFromCode } from "@/utils/map-message";
import { useVerifyOTPResetPasswordMutation } from "./mutations/Auth/Password/useVerifyOTPResetPasswordMutation";
import { ResetTokenResponse } from "@/types/Auth.type";
export const useAuthActions = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const useLogin = useLoginMutation();
  const useRegister = useRegisterMutation();
  const useLogout = useLogoutMutation();
  const useChangePassword = useChangePasswordMutation();
  const useVerifyEmail = useVerifyEmailMutation();
  const useUpdateProfile = useUpdateProfileMutation();
  const useForgotPassword = useForgotPasswordMutation();
  const useConfirmResetPassword = useConfirmResetPasswordMutation();
  const useResendVerifyEmail = useResendVerifyEmailMutation();
  const useVerifyOTPResetPassword = useVerifyOTPResetPasswordMutation();
  const changePassword = useCallback(
    (data: ChangePasswordSchemaFormData) => {
      return new Promise<void>((resolve, reject) => {
        useChangePassword.mutate(data, {
          onSuccess: async (result) => {
            if (result.status === 204) {
              toast.success(
                USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS ||
                  "Mật khẩu đã được thay đổi thành công",
              );
              resolve();
            }
          },
          onError: (error: unknown) => {
            const errorMessage =
              error instanceof AxiosError
                ? error.response?.data?.error || error.message
                : "Error changing password";
            console.log("Change password error:", error);
            toast.error(errorMessage);
            reject(error);
          },
        });
      });
    },
    [useChangePassword],
  );
  const logIn = useCallback(
    (data: LoginSchemaFormData) => {
      return new Promise<void>((resolve, reject) => {
        useLogin.mutate(data, {
          onSuccess: async (result) => {
            const { accessToken, refreshToken } = result.data.data;
            setTokens(accessToken, refreshToken);
            window.dispatchEvent(new Event("token:changed"));
            window.dispatchEvent(
              new StorageEvent("storage", { key: "auth_tokens" }),
            );
            await queryClient.invalidateQueries({ queryKey: ["user", "me"] });
            toast.success(
              USERS_MESSAGES.LOGIN_SUCCESS || "Đăng nhập thành công",
              {
                description: "Chào mừng bạn trở lại!",
              },
            );
            resolve();
          },
          onError: (error: unknown) => {
            // const errorMessage = error instanceof AxiosError ? error.response?.data?.error || error.message : "Error registering";
            // console.log("Login error:", error);
            // toast.error(errorMessage);
            const code_error = getAxiosErrorCodeMessage(error);
            toast.error(getErrorMessageUserFromCode(code_error));
            reject(error);
          },
        });
      });
    },
    [useLogin, queryClient],
  );
  const register = useCallback(
    (data: RegisterSchemaFormData) => {
      return new Promise<void>((resolve, reject) => {
        useRegister.mutate(data, {
          onSuccess: async (result) => {
            if (result.status === 201) {
              const { accessToken, refreshToken } = result.data.data;
              setTokens(accessToken, refreshToken);
              // Dispatch token change event
              window.dispatchEvent(new Event("token:changed"));
              // Wait for token to be set
              await new Promise((resolve) => setTimeout(resolve, 100));
              await queryClient.invalidateQueries({ queryKey: ["user", "me"] });
              toast.success(
                USERS_MESSAGES.REGISTER_SUCCESS || "Đăng ký thành công",
                {
                  description: "Tài khoản của bạn đã được tạo.",
                },
              );
              resolve();
              // router.push("/user/profile");
            }
          },
          onError: (error: unknown) => {
            const code_error = getAxiosErrorCodeMessage(error);
            toast.error(getErrorMessageUserFromCode(code_error));
            reject(error);
          },
        });
      });
    },
    [useRegister, queryClient],
  );
  const logOut = useCallback(
    (refresh_token: string) => {
      return new Promise<void>((resolve, reject) => {
        useLogout.mutate(refresh_token, {
          onSuccess: (result) => {
            if (result.status === 200) {
              clearTokens();
              window.dispatchEvent(
                new StorageEvent("storage", { key: "auth_tokens" }),
              );
              queryClient.removeQueries({ queryKey: ["user", "me"] });
              queryClient.clear();
              toast.success(
                USERS_MESSAGES.LOGOUT_SUCCESS || "Đăng xuất thành công",
              );
              resolve();
              router.push("/auth/login");
            } else {
              const errorMessage = result.data?.message || "Lỗi khi đăng xuất";
              toast.error(errorMessage);
              reject();
            }
          },
          onError: (error: unknown) => {
            const code_error = getAxiosErrorCodeMessage(error);
            toast.error(getErrorMessageUserFromCode(code_error));
          },
        });
      });
    },
    [useLogout, queryClient],
  );
  const verifyEmail = useCallback(
    (data: VerifyEmailSchemaFormData): Promise<void> => {
      return new Promise((resolve, reject) => {
        useVerifyEmail.mutate(data, {
          onSuccess: (result) => {
            console.log("verifyEmail onSuccess:", result.status);
            if (result.status === 200) {
              // const accessToken = result.data.data?.accessToken;
              // const refreshToken = result.data.data?.refreshToken;
              // if (!accessToken || !refreshToken) {
              //   const errMsg = "Thiếu access hoặc refresh token";
              //   toast.error(errMsg);
              //   reject(new Error(errMsg));
              //   return;
              // }
              // setTokens(accessToken, refreshToken);
              // window.dispatchEvent(new StorageEvent("storage", { key: "auth_tokens" }));
              toast.success(
                USERS_MESSAGES.VERIFY_EMAIL_SUCCESS ||
                  "Email đã được xác minh thành công",
              );
              queryClient.invalidateQueries({ queryKey: ["user", "me"] });
              resolve();
            }
          },
          onError: (error: unknown) => {
            const code_error = getAxiosErrorCodeMessage(error);
            toast.error(getErrorMessageUserFromCode(code_error));
            reject(error);
          },
        });
      });
    },
    [useVerifyEmail, queryClient],
  );
  const resendVerifyEmail = useCallback(() => {
    return new Promise<void>((resolve, reject) => {
      useResendVerifyEmail.mutate(undefined, {
        onSuccess: (result) => {
          if (result.status === 200) {
            toast.success(
              USERS_MESSAGES.RESEND_EMAIL_VERIFY_SUCCESS ||
                "Email xác minh đã được gửi lại thành công",
            );
            resolve();
          } else {
            const errorMessage =
              result.data?.message || "Lỗi khi gửi lại email xác minh";
            toast.error(errorMessage);
            reject(new Error(errorMessage));
          }
        },
        onError: (error: unknown) => {
          const code_error = getAxiosErrorCodeMessage(error);
          toast.error(getErrorMessageUserFromCode(code_error));
          reject(error);
        },
      });
    });
  }, [useResendVerifyEmail]);
  const forgotPassword = useCallback(
    (data: ForgotPasswordSchemaFormData) => {
      return new Promise<void>((resolve, reject) => {
        useForgotPassword.mutate(data, {
          onSuccess: (result) => {
            if (result.status === 200) {
              toast.success(
                USERS_MESSAGES.FORGOT_PASSWORD_REQUEST_IS_CREATED ||
                  "Email đặt lại mật khẩu đã được gửi thành công",
              );
            }
            resolve();
          },
          onError: (error: unknown) => {
            const code_error = getAxiosErrorCodeMessage(error);
            toast.error(getErrorMessageUserFromCode(code_error));
            reject(error);
          },
        });
      });
    },
    [useForgotPassword],
  );
  const resetPassword = useCallback(
    (data: ConfirmResetPasswordSchemaFormData): Promise<void> => {
      return new Promise((resolve, reject) => {
        useConfirmResetPassword.mutate(data, {
          onSuccess: (result) => {
            if (result.status === 200) {
              toast.success(
                result.data?.message || "Đặt lại mật khẩu thành công",
              );
              resolve();
            } else {
              const errorMessage =
                result.data?.message || "Lỗi khi đặt lại mật khẩu";
              toast.error(errorMessage);
              reject(new Error(errorMessage));
            }
          },
          onError: (error: unknown) => {
            const code_error = getAxiosErrorCodeMessage(error);
            toast.error(getErrorMessageUserFromCode(code_error));
            reject(error);
          },
        });
      });
    },
    [useConfirmResetPassword],
  );
  const updateProfile = useCallback(
    (data: Partial<UpdateProfileSchemaFormData>) => {
      useUpdateProfile.mutate(data, {
        onSuccess: (result) => {
          if (result.status === 200) {
            toast.success(result.data?.message || "Cập nhật hồ sơ thành công");
            queryClient.invalidateQueries({ queryKey: ["user", "me"] });
          } else {
            const errorMessage =
              result.data?.message || "Lỗi khi cập nhật hồ sơ";
            toast.error(errorMessage);
          }
        },
        onError: (error: unknown) => {
          const errorMessage = getErrorMessage(error, "Lỗi khi cập nhật hồ sơ");
          toast.error(errorMessage);
        },
      });
    },
    [useUpdateProfile, queryClient],
  );
  const verifyOTPResetPassword = useCallback(
    (data: VerifyOTPForForgotPasswordSchemaFormData) => {
      return new Promise<ResetTokenResponse>((resolve, reject) => {
        useVerifyOTPResetPassword.mutate(data, {
          onSuccess: (result) => {
            if (result.status === 200) {
              resolve(result.data as ResetTokenResponse);
            }
          },
          onError: (error: unknown) => {
            const code_error = getAxiosErrorCodeMessage(error);
            toast.error(getErrorMessageUserFromCode(code_error));
            reject(error);
          },
        });
      });
    },
    [queryClient, useVerifyOTPResetPassword],
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
    isConfirmingResetPassword: useConfirmResetPassword.isPending,
    isLoadingForgottingPassword: useForgotPassword.isPending,
    isLoggingIn: useLogin.isPending,
    isLoggingOut: useLogout.isPending,
    isResetingPassword: useConfirmResetPassword.isPending,
    verifyOTPResetPassword,
    isVerifyResetingPassword: useVerifyOTPResetPassword.isPending,
  };
};
