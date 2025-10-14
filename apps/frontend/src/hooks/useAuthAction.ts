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

// Helper function để xử lý error message từ API response
const getErrorMessage = (error: any, defaultMessage: string): string => {
    if (error?.response?.data) {
        const errorData = error.response.data;
        
        // Nếu có errors field với thông tin chi tiết
        if (errorData.errors) {
            const firstErrorKey = Object.keys(errorData.errors)[0];
            if (firstErrorKey && errorData.errors[firstErrorKey]?.msg) {
                return errorData.errors[firstErrorKey].msg;
            }
        }
        // Nếu chỉ có message
        else if (errorData.message) {
            return errorData.message;
        }
    }
    // Fallback cho error.message
    else if (error?.message) {
        return error.message;
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
                    onError: (error: any) => {
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
                    queryClient.invalidateQueries({ queryKey: ["user", "me"] });
                    toast.success("Logged in successfully");
                },
                onError: (error: any) => {
                    const errorMessage = getErrorMessage(error, "Error logging in");
                    toast.error(errorMessage);
                }
            });
        },[useLogin, queryClient , setHasToken]
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
            onError: (error: any) => {
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
            onError: (error: any) => {
                const errorMessage = getErrorMessage(error, "Error logging out");
                toast.error(errorMessage);
            }
        });
    },[useLogout, queryClient, setHasToken]);
    return {
        changePassword,
        logIn,
        register,
        logOut
    
    };
}
