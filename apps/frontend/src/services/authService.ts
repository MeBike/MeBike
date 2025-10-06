import fetchHttpClient from "@/lib/httpClient";
import type {ForgotPasswordFormData,LoginFormData,RegisterFormData,ResetPasswordSchemaFormData , UpdateProfileSchemaFormData} from "@schemas/authSchema";

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
    login:async (data : LoginFormData) : Promise<AuthResponse>=>{
        const response = await fetchHttpClient.post<AuthResponse>("/auth/login",data);
        return response.data;
    },
    register: async (data : RegisterFormData) : Promise<AuthResponse>=>{
        const response = await fetchHttpClient.post<AuthResponse>("/auth/register",data);
        return response.data;
    },
    logout : async (refresh_token : string) : Promise<MessageResponse> => {
        const response = await fetchHttpClient.post<MessageResponse>("/auth/logout", { refresh_token });
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
    changePassword : async(data: ResetPasswordSchemaFormData) : Promise<MessageResponse> => {
        const response = await fetchHttpClient.put<MessageResponse>("/users/change-password", data);
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
    forgotPassword : async(data:ForgotPasswordFormData) : Promise<MessageResponse> => {
        const response = await fetchHttpClient.post<MessageResponse>("/users/forgot-password", data);
        return response.data;   
    }
}