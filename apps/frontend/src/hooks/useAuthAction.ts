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
  ForgotPasswordSchemaFormData,
  LoginSchemaFormData,
  RegisterSchemaFormData,
  ResetPasswordSchemaFormData,
  UpdateProfileSchemaFormData,
} from "@/schemas/authSchema";
import { useVerifyEmailMutation } from "./mutations/Auth/useVerifyEmail";
import { useResendVerifyEmailMutation } from "./mutations/Auth/useResendVerifyEmailMutaiton";
import { useForgotPasswordMutation } from "./mutations/Auth/Password/useForgotPasswordMutation";
import { useResetPasswordMutation } from "./mutations/Auth/Password/useResetPasswordMutation";
import { useUpdateProfileMutation } from "./mutations/Auth/useUpdateProfileMutation";
import { MESSAGE , QUERY_KEYS , HTTP_STATUS } from "@constants/index"
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
  const useResetPassword = useResetPasswordMutation();
  const useResendVerifyEmail = useResendVerifyEmailMutation();
  const changePassword = useCallback(
    (old_password: string, password: string, confirm_password: string) => {
      useChangePassword.mutate(
        { old_password, password, confirm_password },
        {
          onSuccess: (result) => {
            if (result.status === HTTP_STATUS.OK) {
              toast.success(
                result.data?.message || MESSAGE.CHANGE_PASSWORD_SUCCESS
              );
            } else {
              toast.error(
                result.data?.message || MESSAGE.CHANGE_PASSWORD_ERROR
              );
            }
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(
              error,
              MESSAGE.CHANGE_PASSWORD_ERROR
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
            const { access_token, refresh_token } = result.data.result;
            setTokens(access_token, refresh_token);
            window.dispatchEvent(new Event("token:changed"));
            window.dispatchEvent(
              new StorageEvent("storage", { key: "auth_tokens" })
            );
            await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ME });
            toast.success(result.data?.message || MESSAGE.LOGIN_SUCCESS, {
              description: MESSAGE.WELCOME_BACK,
            });
            resolve();
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(error, MESSAGE.LOGIN_NOT_SUCCESS);
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
            if (result.status === HTTP_STATUS.OK) {
              const { access_token, refresh_token } = result.data.result;
              setTokens(access_token, refresh_token);
              // Dispatch token change event
              window.dispatchEvent(new Event("token:changed"));
              // Wait for token to be set
              await new Promise(resolve => setTimeout(resolve, 100));
              await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ME });
              toast.success(result.data?.message || MESSAGE.REGISTER_SUCCESS, {
                description: "Tài khoản của bạn đã được tạo.",
              });
              resolve();
              // router.push("/user/profile");
            } else {
              const errorMessage = result.data?.message || MESSAGE.REGISTER_NOT_SUCCESS;
              toast.error(errorMessage);
              reject(new Error(errorMessage));
            }
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(error, MESSAGE.REGISTER_NOT_SUCCESS);
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
          if (result.status === HTTP_STATUS.OK) {
            clearTokens();
            window.dispatchEvent(
              new StorageEvent("storage", { key: "auth_tokens" })
            );
            queryClient.removeQueries({ queryKey: QUERY_KEYS.ME });
            queryClient.clear();
            toast.success(result.data?.message || MESSAGE.LOGOUT_SUCCESS);
            router.push("/auth/login");
          } else {
            const errorMessage = result.data?.message || MESSAGE.LOGOUT_FAIL;
            toast.error(errorMessage);
          }
        },
        onError: (error: unknown) => {
          const errorMessage = getErrorMessage(error, MESSAGE.LOGOUT_FAIL);
          toast.error(errorMessage);
        },
      });
    },
    [useLogout, queryClient, router]
  );
  const verifyEmail = useCallback(
    ({email , otp} : {email: string; otp: string}): Promise<void> => {
      return new Promise((resolve, reject) => {
        useVerifyEmail.mutate({ email, otp }, {
          onSuccess: (result) => {
            console.log("verifyEmail onSuccess:", result.status);
            if (result.status === HTTP_STATUS.OK) {
              const accessToken = result.data.result?.access_token;
              const refreshToken = result.data.result?.refresh_token;
              if (!accessToken || !refreshToken) {
                const errMsg = "Thiếu access hoặc refresh token";
                toast.error(errMsg);
                reject(new Error(errMsg));
                return;
              }
              setTokens(accessToken, refreshToken);
              window.dispatchEvent(new StorageEvent("storage", { key: "auth_tokens" }));
              toast.success(result.data?.message || MESSAGE.EMAIL_VERIFY_SUCCESS);
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ME });
              resolve();
            } else {
              const errorMessage =
                result.data?.message || MESSAGE.EMAIL_VERIFY_ERROR;
              toast.error(errorMessage);
              reject(new Error(errorMessage));
            }
          },
          onError: (error: unknown) => {
            console.log("verifyEmail onError:", error);
            const errorMessage = getErrorMessage(
              error,
              MESSAGE.OTP_EXPIRED
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
          if (result.status === HTTP_STATUS.OK) {
            toast.success(result.data?.message || MESSAGE.RESEND_VERIFY_EMAIL_SUCCESS);
            resolve();
          } else {
            const errorMessage =
              result.data?.message || MESSAGE.RESEND_VERIFY_EMAIL_FAILED;
            toast.error(errorMessage);
            reject(new Error(errorMessage));
          }
        },
        onError: (error: unknown) => {
          const errorMessage = getErrorMessage(
            error,
            MESSAGE.RESEND_VERIFY_EMAIL_FAILED
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
          if (result.status === HTTP_STATUS.OK) {
            toast.success(result.data?.message || MESSAGE.FORGOT_PASSWORD_SUCCESS);
          } else {
            const errorMessage =
              result.data?.message || MESSAGE.FORGOT_PASSWORD_FAILED;
            toast.error(errorMessage);
          }
        },
        onError: (error: unknown) => {
          const errorMessage = getErrorMessage(
            error,
            MESSAGE.FORGOT_PASSWORD_FAILED
          );
          toast.error(errorMessage);
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
            if (result.status === HTTP_STATUS.OK) {
              toast.success(result.data?.message || MESSAGE.RESET_PASSWORD_SUCCESS);
              resolve();
            } else {
              const errorMessage =
                result.data?.message || MESSAGE.RESET_PASSWORD_FAILED;
              toast.error(errorMessage);
              reject(new Error(errorMessage));
            }
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(
              error,
              MESSAGE.RESET_PASSWORD_FAILED
            );
            toast.error(errorMessage);
            reject(error);
          },
        });
      });
    },
    [useResetPassword]
  );
  const updateProfile = useCallback(
    (data: Partial<UpdateProfileSchemaFormData>) => {
      useUpdateProfile.mutate(data, {
        onSuccess: (result) => {
          if (result.status === HTTP_STATUS.OK) {
            toast.success(result.data?.message || MESSAGE.UPDATE_PROFILE_SUCCESS);
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ME });
          } else {
            const errorMessage =
              result.data?.message || MESSAGE.UPDATE_PROFILE_FAILED;
            toast.error(errorMessage);
          }
        },
        onError: (error: unknown) => {
          const errorMessage = getErrorMessage(error, MESSAGE.UPDATE_PROFILE_FAILED);
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
    isReseting: useResetPassword.isPending,
    isLoadingForgottingPassword: useForgotPassword.isPending,
    isLoggingIn: useLogin.isPending,
    isLoggingOut: useLogout.isPending,  
  };
};
