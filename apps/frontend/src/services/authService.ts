import fetchHttpClient from "@/lib/httpClient";
import type {UpdateProfileSchemaFormData , ChangePasswordSchemaFormData , ForgotPasswordSchemaFormData , LoginSchemaFormData, RegisterSchemaFormData , ResetPasswordSchemaFormData}  from "@schemas/authSchema";

interface AuthResponse {
    message : string;
    result : {
        access_token : string;
        refresh_token : string;
    }
}
interface MessageResponse{
    message:string;
}
export const ROLES = ["USER", "ADMIN", "STAFF"] as const;
export type RoleType = typeof ROLES[number];
export interface DetailUser{
    _id : string;
    fullName:string;
    email:string;
    verify:string;
    location:string;
    username:string;
    phone_number:string;
    avatar:string;
    role: RoleType;
    created_at:string;
    updated_at:string;
}
export interface ProfileUserResponse{
    message:string;
    result:DetailUser;
}
interface ChangePasswordReqBody { 
    old_password: string;
    password: string;
    confirm_password: string;
}
interface UpdateProfileReqBody {
    fullName: string;
    email: string;
    location: string;
    username: string;
    phone_number: string;
    avatar: string;
}
export const authService = {
    login:async (data : LoginSchemaFormData) : Promise<AuthResponse>=>{
        const response = await fetchHttpClient.post<AuthResponse>("/users/login",data);
        return response.data;
    },
    register: async (data : RegisterSchemaFormData) : Promise<AuthResponse>=>{
        const response = await fetchHttpClient.post<AuthResponse>("/users/register",data);
        return response.data;
    },
    logout : async (refresh_token : string) : Promise<MessageResponse> => {
        const response = await fetchHttpClient.post<MessageResponse>("/users/logout", { refresh_token });
        return response.data;
    },
    resendVerifyEmail : async () : Promise<MessageResponse> => {
        const response = await fetchHttpClient.post<MessageResponse>("/users/resend-verify-email");
        return response.data;
    },
    verifyEmail : async (email_refresh_token : string) : Promise<MessageResponse> => {
        const response = await fetchHttpClient.post<MessageResponse>("/users/verify-email", { email_refresh_token });
        return response.data;
    },
    getMe : async() : Promise<ProfileUserResponse> => {
        const response = await fetchHttpClient.get<ProfileUserResponse>("/users/me");
        return response.data;
    },
    refreshToken : async (refresh_token : string) : Promise<AuthResponse> => {
        const response = await fetchHttpClient.post<AuthResponse>("/users/refresh-token", { refresh_token });
        return response.data;
    },
    updateProfile : async(data : UpdateProfileSchemaFormData) : Promise<ProfileUserResponse> => {
        const response = await fetchHttpClient.patch<ProfileUserResponse>("/users/me", data);
        return response.data;
    },
    changePassword:async(data:ChangePasswordSchemaFormData) : Promise<MessageResponse> => {
        const response = await fetchHttpClient.put<MessageResponse>("/users/change-password", data);
        return response.data;
    },
    forgotPassword : async(data:ForgotPasswordSchemaFormData) : Promise<MessageResponse> => {
        const response = await fetchHttpClient.post<MessageResponse>("/users/forgot-password", data);
        return response.data;   
    },
    verifyForgotPassword: async (email_forgot_password_token : string) : Promise<MessageResponse> => {
        const response = await fetchHttpClient.post<MessageResponse>("/users/verify-forgot-password", { email_forgot_password_token });
        return response.data;
    },
    resetPassword : async ( data : ResetPasswordSchemaFormData) => {
        const response = await fetchHttpClient.post<MessageResponse>("/users/reset-password", data);
        return response.data;
    }
}