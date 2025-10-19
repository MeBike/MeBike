import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { Alert } from "react-native";
import {clearTokens , getAccessToken, setTokens} from "@utils/tokenManager";
import { useChangePasswordMutation } from "./mutations/Auth/Password/useChangePasswordMutation";
import { useLoginMutation } from "./mutations/Auth/useLoginMutation";
import { useRegisterMutation } from "./mutations/Auth/useRegisterMutation";
import { useLogoutMutation } from "./mutations/Auth/useLogoutMutation";
import { ForgotPasswordSchemaFormData, LoginSchemaFormData, RegisterSchemaFormData, ResetPasswordSchemaFormData, UpdateProfileSchemaFormData } from "@schemas/authSchema";
import { useVerifyEmailMutation } from "./mutations/Auth/useVerifyEmail";
import { useResendVerifyEmailMutation } from "./mutations/Auth/useResendVerifyEmailMutaiton";
import { useForgotPasswordMutation } from "./mutations/Auth/Password/useForgotPasswordMutation";
import { useResetPasswordMutation } from "./mutations/Auth/Password/useResetPasswordMutation";
import { useUpdateProfileMutation } from "./mutations/Auth/useUpdateProfileMutation";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";
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
        (old_password: string, password: string , confirm_password : string) => {
            useChangePassword.mutate(
                {old_password, password , confirm_password},{
                    onSuccess: (result) => {
                        if(result.status === 200){
                            Alert.alert("Success", "Password changed successfully");
                        } else{
                            Alert.alert("Error", "Error changing password");
                        }
                    },
                    onError: (error: unknown) => {
                        const errorMessage = getErrorMessage(error, "Error changing password");
                        Alert.alert("Error", errorMessage);
                    }
                }
            )
        },[useChangePassword]
    );
    const logIn = useCallback(
        (data : LoginSchemaFormData) => {
            useLogin.mutate(data, {
                onSuccess: async (result) => {
                    const { access_token, refresh_token } = result.data.result;
                    console.log("Login successful:", { access_token, refresh_token });
                    await setTokens(access_token, refresh_token);
                    console.log("access_token", String(getAccessToken()));
                    Alert.alert("Success", "Logged in successfully");
                    onTokenUpdate?.();
                    queryClient.invalidateQueries({ queryKey: ["user", "me"] });
                },
                onError: (error: unknown) => {
                    const errorMessage = getErrorMessage(error, "Error logging in");
                    Alert.alert("Error", errorMessage);
                }
            });
        },[useLogin , queryClient, onTokenUpdate]
    )
    const register = useCallback((
        data:RegisterSchemaFormData) => {
        useRegister.mutate(data,{
            onSuccess: async (result) => {
                if(result.status === 200){
                    const { access_token, refresh_token } = result.data.result;
                    await setTokens(access_token, refresh_token);
                    console.log("Registration successful:", { access_token, refresh_token });
                    const accesstoken = await getAccessToken();
                    console.log("Current access token:", accesstoken);
                    await onTokenUpdate?.();
                    queryClient.invalidateQueries({ queryKey: ["user", "me"] });
                    Alert.alert("Success", "Registration Successful. Your account has been created.");
                    
                }else{
                    const errorMessage = result.data?.message || "Error registering";
                    Alert.alert("Error", errorMessage);
                }
            },
            onError: (error: unknown) => {
                const errorMessage = getErrorMessage(error, "Error registering");
                Alert.alert("Error", errorMessage);
            }
        });
    },[useRegister,queryClient,navigation,onTokenUpdate]);
    const logOut = useCallback((refresh_token : string) => {
        useLogout.mutate(refresh_token,{
            onSuccess: async (result) => {
                if(result.status === 200){
                    await clearTokens();
                    onTokenUpdate?.(); 
                    queryClient.clear(); 
                    Alert.alert("Success", "Logged out successfully");
                    navigation?.navigate("Login");
                }else{
                    const errorMessage = result.data?.message || "Error logging out";
                    Alert.alert("Error", errorMessage);
                }
            },
            onError: async (error: unknown) => {
                console.log("Logout API failed, clearing tokens locally:", error);
                await clearTokens();
                queryClient.clear();
                Alert.alert("Success", "Logged out successfully");
                navigation?.navigate("Login");
            }
        });
    },[useLogout, queryClient, navigation, onTokenUpdate]);
    const verifyEmail = useCallback((email_verify_token: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            useVerifyEmail.mutate(email_verify_token, {
                onSuccess: (result) => {
                    if(result.status === 200){
                        Alert.alert("Success", "Email verified successfully");
                        queryClient.invalidateQueries({ queryKey: ["user", "me"] });
                        resolve();
                    } else {
                        const errorMessage = result.data?.message || "Error verifying email";
                        Alert.alert("Error", errorMessage);
                        reject(new Error(errorMessage));
                    }
                },
                onError: (error: unknown) => {
                    const errorMessage = getErrorMessage(error, "Error verifying email");
                    Alert.alert("Error", errorMessage);
                    reject(error);
                }
            });
        });
    }, [useVerifyEmail,queryClient]);
    const resendVerifyEmail = useCallback(() => {
        useResendVerifyEmail.mutate(undefined,{
            onSuccess: (result) => {
                if(result.status === 200){
                    Alert.alert("Success", "Verification email resent successfully");
                }else{
                    const errorMessage = result.data?.message || "Error resending verification email";
                    Alert.alert("Error", errorMessage);
                }
            },
            onError: (error: unknown) => {
                const errorMessage = getErrorMessage(error, "Error resending verification email");
                Alert.alert("Error", errorMessage);
            }
        });
    }, [useResendVerifyEmail]);
    const forgotPassword = useCallback(
      (data: ForgotPasswordSchemaFormData) => {
        useForgotPassword.mutate(data, {
          onSuccess: (result) => {
            if (result.status === 200) {
              Alert.alert("Success", "Password reset email sent successfully");
            } else {
              const errorMessage =
                result.data?.message || "Error sending password reset email";
              Alert.alert("Error", errorMessage);
            }
          },
          onError: (error: unknown) => {
            const errorMessage = getErrorMessage(
              error,
              "Error sending password reset email"
            );
            Alert.alert("Error", errorMessage);
          },
        });
      },
      [useForgotPassword]
    );
    
    const resetPassword = useCallback((data: ResetPasswordSchemaFormData) => {
        useResetPassword.mutate(data,{
            onSuccess: (result) => {
                if(result.status === 200){ 
                    Alert.alert("Success", "Password reset successfully");
                    navigation?.navigate("Login");
                } else{
                    const errorMessage = result.data?.message || "Error resetting password";
                    Alert.alert("Error", errorMessage);
                }
            },
            onError: (error: unknown) => {
                const errorMessage = getErrorMessage(error, "Error resetting password");
                Alert.alert("Error", errorMessage);
            }
        });
    }, [useResetPassword, navigation]);
    const updateProfile = useCallback((data: Partial<UpdateProfileSchemaFormData>) => {
        useUpdateProfile.mutate(data, {
            onSuccess: (result) => {
                if(result.status === 200){
                    Alert.alert("Success", "Profile updated successfully");
                    queryClient.invalidateQueries({ queryKey: ["user", "me"] });
                } else {
                    const errorMessage = result.data?.message || "Error updating profile";
                    Alert.alert("Error", errorMessage);
                }
            },
            onError: (error: unknown) => {
                const errorMessage = getErrorMessage(error, "Error updating profile");
                Alert.alert("Error", errorMessage);
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
