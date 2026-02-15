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
  ForgotPasswordSchemaFormData,
  LoginSchemaFormData,
  RegisterSchemaFormData,
  UpdateProfileSchemaFormData,
  VerifyEmailSchemaFormData,
} from "@/schemas/authSchema";
import { useVerifyEmailMutation } from "./mutations/Auth/useVerifyEmail";
import { useResendVerifyEmailMutation } from "./mutations/Auth/useResendVerifyEmailMutaiton";
import { useForgotPasswordMutation } from "./mutations/Auth/Password/useForgotPasswordMutation";
import { useConfirmResetPasswordMutation } from "./mutations/Auth/Password/useConfirmResetPasswordMutation";
import { useUpdateProfileMutation } from "./mutations/Auth/useUpdateProfileMutation";
import getErrorMessage from "@/utils/error-message";
import { AxiosError } from "axios";
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
  const changePassword = useCallback(
    (old_password: string, password: string, confirm_password: string) => {
      useChangePassword.mutate(
        { old_password, password, confirm_password },
        {
          onSuccess: (result) => {
            if (result.status === 200) {
              toast.success(result.data?.message || "Mật khẩu đã được thay đổi thành công");
            } else {
              toast.error(result.data?.message || "Lỗi khi thay đổi mật khẩu");
            }
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(
              error,
              "Error changing password"
            );
            toast.error(errorMessage);
          },
        }
      );
    },
    [useChangePassword]
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
              new StorageEvent("storage", { key: "auth_tokens" })
            );
            await queryClient.invalidateQueries({ queryKey: ["user", "me"] });
            toast.success(result.data?.message || "Đăng nhập thành công", {
              description: "Chào mừng bạn trở lại!",
            });
            resolve();
          },
          onError: (error: unknown) => {
            const errorMessage = error instanceof AxiosError ? error.response?.data?.error || error.message : "Error registering";
            console.log("Login error:", error);
            toast.error(errorMessage);
            reject(error);
          },
        });
      });
    },
    [useLogin, queryClient]
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
              await new Promise(resolve => setTimeout(resolve, 100));
              await queryClient.invalidateQueries({ queryKey: ["user", "me"] });
              toast.success(result.data?.message || "Đăng ký thành công", {
                description: "Tài khoản của bạn đã được tạo.",
              });
              resolve();
              // router.push("/user/profile");
            }
          },
          onError: (error: unknown) => {
            const errorMessage = error instanceof AxiosError ? error.response?.data?.error || error.message : "Error registering";
            console.log("Registration error:", error);
            toast.error(errorMessage);
            reject(error);
          },
        });
      });
    },
    [useRegister, queryClient]
  );
  const logOut = useCallback(
    (refresh_token: string) => {
      useLogout.mutate(refresh_token, {
        onSuccess: (result) => {
          if (result.status === 200) {
            clearTokens();
            window.dispatchEvent(
              new StorageEvent("storage", { key: "auth_tokens" })
            );
            queryClient.removeQueries({ queryKey: ["user", "me"] });
            queryClient.clear();
            toast.success(result.data?.message || "Đăng xuất thành công");
            router.push("/auth/login");
          } else {
            const errorMessage = result.data?.message || "Lỗi khi đăng xuất";
            toast.error(errorMessage);
          }
        },
        onError: (error: unknown) => {
          const errorMessage = getErrorMessage(error, "Lỗi khi đăng xuất");
          toast.error(errorMessage);
        },
      });
    },
    [useLogout, queryClient, router]
  );
  const verifyEmail = useCallback(
    (data : VerifyEmailSchemaFormData): Promise<void> => {
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
              // toast.success(result.data?.message || "Email đã được xác minh thành công");
              queryClient.invalidateQueries({ queryKey: ["user", "me"] });
              resolve();
            } else {
              const errorMessage =
                result.data?.message || "Lỗi khi xác minh email";
              toast.error(errorMessage);
              reject(new Error(errorMessage));
            }
          },
          onError: (error: unknown) => {
            console.log("verifyEmail onError:", error);
            const errorMessage = getErrorMessage(
              error,
              "OTP không hợp lệ hoặc đã hết hạn"
            );
            toast.error(errorMessage);
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
          if (result.status === 200) {
            toast.success(result.data?.message || "Email xác minh đã được gửi lại thành công");
            resolve();
          } else {
            const errorMessage =
              result.data?.message || "Lỗi khi gửi lại email xác minh";
            toast.error(errorMessage);
            reject(new Error(errorMessage));
          }
        },
        onError: (error: unknown) => {
          const errorMessage = getErrorMessage(
            error,
            "Error resending verification email"
          );
          toast.error(errorMessage);
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
            toast.success(result.data?.message || "Email đặt lại mật khẩu đã được gửi thành công");
          } else {
            const errorMessage =
              result.data?.message || "Lỗi khi gửi email đặt lại mật khẩu";
            toast.error(errorMessage);
          }
        },
        onError: (error: unknown) => {
          const errorMessage = getErrorMessage(
            error,
            "Error sending password reset email"
          );
          toast.error(errorMessage);
        },
      });
    },
    [useForgotPassword]
  );
  const resetPassword = useCallback(
    (data: ConfirmResetPasswordSchemaFormData): Promise<void> => {
      return new Promise((resolve, reject) => {
        useConfirmResetPassword.mutate(data, {
          onSuccess: (result) => {
            if (result.status === 200) {
              toast.success(result.data?.message || "Đặt lại mật khẩu thành công");
              resolve();
            } else {
              const errorMessage =
                result.data?.message || "Lỗi khi đặt lại mật khẩu";
              toast.error(errorMessage);
              reject(new Error(errorMessage));
            }
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(
              error,
              "OTP không hợp lệ hoặc đã hết hạn"
            );
            toast.error(errorMessage);
            reject(error);
          },
        });
      });
    },
    [useConfirmResetPassword]
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
    isConfirmingResetPassword: useConfirmResetPassword.isPending,
    isLoadingForgottingPassword: useForgotPassword.isPending,
    isLoggingIn: useLogin.isPending,
    isLoggingOut: useLogout.isPending,  
  };
};
