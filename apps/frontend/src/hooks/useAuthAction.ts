import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { clearTokens, setTokens, setResetToken } from "@utils/tokenManager";
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
import { AuthTokens } from "@/types/GraphQL";
import { getErrorMessage } from "@/utils/message";
import { useVerifyOTPMutation } from "./mutations/Auth/useVerifyOTPMutation";
import { VerifyForgotPasswordTokenResponse } from "@/types/auth.type";
import { set } from "zod";

export const useAuthActions = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const useLogin = useLoginMutation();
  const useRegister = useRegisterMutation();
  const useLogout = useLogoutMutation();
  const useChangePassword = useChangePasswordMutation();
  const useVerifyEmail = useVerifyEmailMutation();
  const useVerifyOTP = useVerifyOTPMutation();
  const useUpdateProfile = useUpdateProfileMutation();
  const useForgotPassword = useForgotPasswordMutation();
  const useResetPassword = useResetPasswordMutation();
  const useResendVerifyEmail = useResendVerifyEmailMutation();
  const changePassword = useCallback(
    (oldPassword: string, newPassword: string, confirmPassword : string) => {
      useChangePassword.mutate(
        { oldPassword, newPassword, confirmPassword },
        {
          onSuccess: (result) => {
            if (result.status === HTTP_STATUS.OK) {
              const messsage = getErrorMessage(result.data?.data?.ChangePassword.errors, MESSAGE.CHANGE_PASSWORD_SUCCESS);
              toast.success(
                messsage
              );
            } else {
              const messsage = getErrorMessage(result.data?.data?.ChangePassword.errors, MESSAGE.CHANGE_PASSWORD_ERROR);
              toast.error(  
                messsage
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
              const { accessToken, refreshToken } = result.data.data?.LoginUser
                .data as AuthTokens;
              setTokens(accessToken, refreshToken);
              window.dispatchEvent(new Event("token:changed"));
              window.dispatchEvent(
                new StorageEvent("storage", { key: "auth_tokens" })
              );
              await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ME });
              toast.success(
                result.data?.data?.LoginUser.message || MESSAGE.LOGIN_SUCCESS,
                {
                  description: MESSAGE.WELCOME_BACK,
                }
              );
              resolve();
          },
          onError: (error: unknown) => {
            console.log(error);
            const errorMessage = getErrorMessage<"LoginUser">(error, MESSAGE.LOGIN_NOT_SUCCESS);
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
              const { accessToken, refreshToken } = result.data.data
                ?.RegisterUser.data as AuthTokens;
              setTokens(accessToken, refreshToken);
              window.dispatchEvent(new Event("token:changed"));
              await new Promise((resolve) => setTimeout(resolve, 100));
              await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ME });
              toast.success(MESSAGE.REGISTER_SUCCESS, {
                description:"Tài khoản của bạn đã được tạo.",
              });
              resolve();
            } else {
              const errorMessage = MESSAGE.REGISTER_NOT_SUCCESS;
              toast.error(errorMessage);
              reject(new Error(errorMessage));
            }
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage<"RegisterUser">(
              error,
              MESSAGE.REGISTER_NOT_SUCCESS
            );
            toast.error(errorMessage);
            reject(error);
          },
        });
      });
    },
    [useRegister, queryClient]
  );
  const logOut = useCallback(
    () => {
      useLogout.mutate(undefined,{
        onSuccess: (result) => {
          if (result.status === HTTP_STATUS.OK) {
            clearTokens();
            window.dispatchEvent(
              new StorageEvent("storage", { key: "auth_tokens" })
            );
            queryClient.removeQueries({ queryKey: QUERY_KEYS.ME });
            queryClient.clear();
            toast.success(MESSAGE.LOGOUT_SUCCESS);
            router.push("/auth/login");
          } else {
            toast.error(MESSAGE.LOGOUT_FAIL);
          }
        },
        onError: (error: unknown) => {
          toast.error(MESSAGE.LOGOUT_FAIL);
        },
      });
    },
    [useLogout, queryClient, router]
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
              toast.success(result.data?.data?.VerifyEmailProcess.message || MESSAGE.EMAIL_VERIFY_SUCCESS);
              queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ME });
              resolve();
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
            toast.success(result.data?.data?.VerifyEmail.message || MESSAGE.RESEND_VERIFY_EMAIL_SUCCESS);
            resolve();
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
  const verifyOTP = useCallback(({email, otp}: {email: string; otp: string}) => {
    return new Promise<void>((resolve, reject) => {
      useVerifyOTP.mutate({email, otp}, {
        onSuccess: (result) => {
          if (result.status === HTTP_STATUS.OK) {
            toast.success(
              result.data?.data?.VerifyOTP.message || MESSAGE.RESEND_VERIFY_EMAIL_SUCCESS
            );
            setResetToken(result.data?.data?.VerifyOTP.data?.resetToken || "");
            resolve();
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
            toast.success(result.data?.data?.ResetPasswordRequest.data || MESSAGE.FORGOT_PASSWORD_SUCCESS);
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
              toast.success(result.data?.data?.ResetPassword.message || MESSAGE.RESET_PASSWORD_SUCCESS);
              resolve();
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
            toast.success(result.data?.data?.UpdateProfile.message || MESSAGE.UPDATE_PROFILE_SUCCESS);
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ME });
          } else {
            const errorMessage =
              result.data?.data?.UpdateProfile.message || MESSAGE.UPDATE_PROFILE_FAILED;
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
