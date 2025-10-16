import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {clearTokens , setTokens} from "@utils/tokenManager"
import { useChangePasswordMutation } from "./mutations/Auth/Password/useChangePasswordMutation";
import { useLoginMutation } from "./mutations/Auth/useLoginMutation";
import { useRegisterMutation } from "./mutations/Auth/useRegisterMutation";
import { useLogoutMutation } from "./mutations/Auth/useLogoutMutation";
import { ForgotPasswordSchemaFormData, LoginSchemaFormData, RegisterSchemaFormData, ResetPasswordSchemaFormData, UpdateProfileSchemaFormData } from "@/schemas/authSchema";
import { useVerifyEmailMutation } from "./mutations/Auth/useVerifyEmail";
import { useResendVerifyEmailMutation } from "./mutations/Auth/useResendVerifyEmailMutaiton";
import { useForgotPasswordMutation } from "./mutations/Auth/Password/useForgotPasswordMutation";
import { useResetPasswordMutation } from "./mutations/Auth/Password/useResetPasswordMutation";
import { useUpdateProfileMutation } from "./mutations/Auth/useUpdateProfileMutation";
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
        (old_password: string, password: string , confirm_password : string) => {
            useChangePassword.mutate(
                {old_password, password , confirm_password},{
                    onSuccess: (result) => {
                        if(result.status === 200){
                            toast.success("Password changed successfully");
                        } else{
                            toast.error("Error changing password");
                        }
                    },
                    onError: (error: unknown) => {
                        const errorMessage = getErrorMessage(error, "Error changing password");
                        toast.error(errorMessage);
                    }
                }
            )
        },[useChangePassword]
    );
    const logIn = useCallback(
        (data : LoginSchemaFormData) => {
            useLogin.mutate(data, {
                onSuccess: (result) => {
                    const { access_token, refresh_token } = result.data.result;
                    setTokens(access_token, refresh_token);
                    window.dispatchEvent(new StorageEvent('storage', { key: 'auth_tokens' }));
                    toast.success("Logged in successfully");
                    queryClient.invalidateQueries({ queryKey: ["user", "me"] });
                    // const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
                    //     if (event?.query?.queryKey?.[0] === "user" && 
                    //         event?.query?.queryKey?.[1] === "me" && 
                    //         event.type === "updated" &&
                    //         event.query.state.data) {
                    //         const userProfile = event.query.state.data as unknown as { role: string };
                    //         if (userProfile?.role === "ADMIN") {
                    //             router.push("/admin");
                    //         } else if (userProfile?.role === "STAFF") {
                    //             router.push("/staff");
                    //         } else {
                    //             router.push("/user");
                    //         }
                    //         unsubscribe(); 
                    //     }
                    // });
                    // setTimeout(() => {
                    //     unsubscribe();
                    // }, 3000);
                },
                onError: (error: unknown) => {
                    const errorMessage = getErrorMessage(error, "Error logging in");
                    toast.error(errorMessage);
                }
            });
        },[useLogin , queryClient,router]
    )
    const register = useCallback((
        data:RegisterSchemaFormData) => {
        useRegister.mutate(data,{
            onSuccess: (result) => {
                if(result.status === 201){
                    const { access_token, refresh_token } = result.data.result;
                    setTokens(access_token, refresh_token);
                    queryClient.invalidateQueries({ queryKey: ["user", "me"] });
                    toast.success("Registration Successful", { description: "Your account has been created." });
                    router.push("/auth/login");
                }else{
                    const errorMessage = result.data?.message || "Error registering";
                    toast.error(errorMessage);
                }
            },
            onError: (error: unknown) => {
                const errorMessage = getErrorMessage(error, "Error registering");
                toast.error(errorMessage);
            }
        });
    },[useRegister,queryClient,router]);
    const logOut = useCallback((refresh_token : string) => {
        useLogout.mutate(refresh_token,{
            onSuccess: (result) => {
                if(result.status === 200){
                    clearTokens();
                    // Trigger storage event to update hasToken state
                    window.dispatchEvent(new StorageEvent('storage', { key: 'auth_tokens' }));
                    queryClient.invalidateQueries({ queryKey: ["user", "me"] });
                    toast.success("Logged out successfully");
                    router.push("/auth/login");
                }else{
                    const errorMessage = result.data?.message || "Error logging out";
                    toast.error(errorMessage);
                }
            },
            onError: (error: unknown) => {
                const errorMessage = getErrorMessage(error, "Error logging out");
                toast.error(errorMessage);
            }
        });
    },[useLogout, queryClient, router]);
    const verifyEmail = useCallback((email_verify_token: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            useVerifyEmail.mutate(email_verify_token, {
                onSuccess: (result) => {
                    if(result.status === 200){
                        toast.success("Email verified successfully");
                        queryClient.invalidateQueries({ queryKey: ["user", "me"] });
                        resolve();
                    } else {
                        const errorMessage = result.data?.message || "Error verifying email";
                        toast.error(errorMessage);
                        reject(new Error(errorMessage));
                    }
                },
                onError: (error: unknown) => {
                    const errorMessage = getErrorMessage(error, "Error verifying email");
                    toast.error(errorMessage);
                    reject(error);
                }
            });
        });
    }, [useVerifyEmail,queryClient]);
    const resendVerifyEmail = useCallback(() => {
        useResendVerifyEmail.mutate(undefined,{
            onSuccess: (result) => {
                if(result.status === 200){
                    toast.success("Verification email resent successfully");
                }else{
                    const errorMessage = result.data?.message || "Error resending verification email";
                    toast.error(errorMessage);
                }
            },
            onError: (error: unknown) => {
                const errorMessage = getErrorMessage(error, "Error resending verification email");
                toast.error(errorMessage);
            }
        });
    }, [useResendVerifyEmail]);
    const forgotPassword = useCallback(
      (data: ForgotPasswordSchemaFormData) => {
        useForgotPassword.mutate(data, {
          onSuccess: (result) => {
            if (result.status === 200) {
              toast.success("Password reset email sent successfully");
            } else {
              const errorMessage =
                result.data?.message || "Error sending password reset email";
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
    
    const resetPassword = useCallback((data: ResetPasswordSchemaFormData) => {
        useResetPassword.mutate(data,{
            onSuccess: (result) => {
                if(result.status === 200){ 
                    toast.success("Password reset successfully");
                    router.push("/auth/login");
                } else{
                    const errorMessage = result.data?.message || "Error resetting password";
                    toast.error(errorMessage);
                }
            },
            onError: (error: unknown) => {
                const errorMessage = getErrorMessage(error, "Error resetting password");
                toast.error(errorMessage);
            }
        });
    }, [useResetPassword, router]);
    const updateProfile = useCallback((data: UpdateProfileSchemaFormData) => {
        useUpdateProfile.mutate(data, {
            onSuccess: (result) => {
                if(result.status === 200){
                    toast.success("Profile updated successfully");
                    queryClient.invalidateQueries({ queryKey: ["user", "me"] });
                } else {
                    const errorMessage = result.data?.message || "Error updating profile";
                    toast.error(errorMessage);
                }
            },
            onError: (error: unknown) => {
                const errorMessage = getErrorMessage(error, "Error updating profile");
                toast.error(errorMessage);
            }
        });
    }, [useUpdateProfile, queryClient]);
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
    };
}
