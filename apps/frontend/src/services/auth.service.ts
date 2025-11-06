import fetchHttpClient from "@/lib/httpClient";
import type {
  UpdateProfileSchemaFormData,
  ChangePasswordSchemaFormData,
  ForgotPasswordSchemaFormData,
  LoginSchemaFormData,
  RegisterSchemaFormData,
  ResetPasswordSchemaFormData,
} from "@schemas/authSchema";
import type { AxiosResponse } from "axios";
interface AuthResponse {
  message: string;
  result: {
    access_token: string;
    refresh_token: string;
  };
}
interface MessageResponse {
  message: string;
}
export const ROLES = ["USER", "ADMIN", "STAFF"] as const;
export type RoleType = (typeof ROLES)[number];
export interface DetailUser {
  _id: string;
  fullname: string;
  email: string;
  verify: string;
  location: string;
  username: string;
  phone_number: string;
  avatar: string;
  role: "STAFF" | "ADMIN" | "USER";
  nfc_card_uid: string;
  email_verify_otp_expires: string;
  forgot_password_otp_expires: string;
  created_at: string;
  updated_at: string;
}
export interface ProfileUserResponse {
  message: string;
  result: DetailUser;
}
export const authService = {
  login: async (
    data: LoginSchemaFormData
  ): Promise<AxiosResponse<AuthResponse>> => {
    const response = await fetchHttpClient.post<AuthResponse>(
      "/users/login",
      data
    );
    return response;
  },
  register: async (
    data: RegisterSchemaFormData
  ): Promise<AxiosResponse<AuthResponse>> => {
    const response = await fetchHttpClient.post<AuthResponse>(
      "/users/register",
      data
    );
    return response;
  },
  logout: async (
    refresh_token: string
  ): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>(
      "/users/logout",
      { refresh_token }
    );
    return response;
  },
  resendVerifyEmail: async (): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>(
      "/users/resend-verify-email"
    );
    return response;
  },
  verifyEmail: async ({
    email,
    otp,
  }: {
    email: string;
    otp: string;
  }): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>(
      "/users/verify-email",
      { email, otp }
    );
    return response;
  },
  getMe: async (): Promise<AxiosResponse<ProfileUserResponse>> => {
    const response =
      await fetchHttpClient.get<ProfileUserResponse>("/users/me");
    return response;
  },
  refreshToken: async (
    refresh_token: string
  ): Promise<AxiosResponse<AuthResponse>> => {
    const response = await fetchHttpClient.post<AuthResponse>(
      "/users/refresh-token",
      { refresh_token }
    );
    return response;
  },
  updateProfile: async (
    data: Partial<UpdateProfileSchemaFormData>
  ): Promise<AxiosResponse<ProfileUserResponse>> => {
    const response = await fetchHttpClient.patch<ProfileUserResponse>(
      "/users/me",
      data
    );
    return response;
  },
  changePassword: async (
    data: ChangePasswordSchemaFormData
  ): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.put<MessageResponse>(
      "/users/change-password",
      data
    );
    return response;
  },
  forgotPassword: async (
    data: ForgotPasswordSchemaFormData
  ): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>(
      "/users/forgot-password",
      data
    );
    return response;
  },
  verifyForgotPassword: async (
    email_forgot_password_token: string
  ): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>(
      "/users/verify-forgot-password",
      { email_forgot_password_token }
    );
    return response;
  },
  resetPassword: async (
    data: ResetPasswordSchemaFormData
  ): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>(
      "/users/reset-password",
      data
    );
    return response;
  },
};
