import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {clearTokens , setTokens} from "@utils/tokenManager"
import { useChangePasswordMutation } from "./mutations/Auth/Password/useChangePasswordMutation";
import { useLoginMutation } from "./mutations/Auth/useLoginMutation";
import { useRegisterMutation } from "./mutations/Auth/useRegisterMutation";
import { useLogoutMutation } from "./mutations/Auth/useLogoutMutation";
import { LoginSchemaFormData, RegisterSchemaFormData } from "@/schemas/authSchema";
import { authService } from "@/services/authService";

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

export const useAuthActions = (setHasToken: React.Dispatch<React.SetStateAction<boolean>>) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const useLogin = useLoginMutation();
    const useRegister = useRegisterMutation();
    const useLogout = useLogoutMutation();  
    const useChangePassword = useChangePasswordMutation();
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
                    setHasToken(true);
                    toast.success("Logged in successfully");
                    const fetchUserAndRedirect = async () => {
                        try {
                            const userResponse = await authService.getMe();
                            if (userResponse.status === 200) {
                                const userProfile = userResponse.data.result;
                                queryClient.setQueryData(["user", "me"], userProfile);
                                if (userProfile?.role === "ADMIN") {
                                    router.push("/admin");
                                } else if (userProfile?.role === "STAFF") {
                                    router.push("/staff");
                                } else {
                                    router.push("/");
                                }
                            } else {
                                console.error('Failed to fetch user profile:', userResponse.status);
                                router.push("/");
                            }
                        } catch (error) {
                            console.error('Error fetching user profile:', error);
                            router.push("/");
                        }
                    };
                    
                    fetchUserAndRedirect();
                },
                onError: (error: unknown) => {
                    const errorMessage = getErrorMessage(error, "Error logging in");
                    toast.error(errorMessage);
                }
            });
        },[useLogin, queryClient , setHasToken, router]
    )
    const register = useCallback((
        data:RegisterSchemaFormData) => {
        useRegister.mutate(data,{
            onSuccess: (result) => {
                if(result.status === 201){
                    const { access_token, refresh_token } = result.data.result;
                    setTokens(access_token, refresh_token);
                    setHasToken(true);
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
    },[useRegister, router, queryClient , setHasToken]);
    const logOut = useCallback((refresh_token : string) => {
        useLogout.mutate(refresh_token,{
            onSuccess: (result) => {
                if(result.status === 200){
                    clearTokens();
                    setHasToken(false);
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
    },[useLogout, queryClient, setHasToken, router]);
    return {
        changePassword,
        logIn,
        register,
        logOut
    
    };
}
