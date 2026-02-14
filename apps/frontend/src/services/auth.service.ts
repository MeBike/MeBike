import fetchHttpClient from "@/lib/httpClient";
import type {
  UpdateProfileSchemaFormData,
  ChangePasswordSchemaFormData,
  ForgotPasswordSchemaFormData,
  LoginSchemaFormData,
  RegisterSchemaFormData,
  ResetPasswordSchemaFormData,
  ConfirmResetPasswordSchemaFormData,
} from "@schemas/authSchema";
import type { AxiosResponse } from "axios";
import { ProfileUserResponse , AuthResponse , MessageResponse} from "@/types";
export const authService = {
  login: async (
    data: LoginSchemaFormData
  ): Promise<AxiosResponse<AuthResponse>> => {
    const response = await fetchHttpClient.post<AuthResponse>(
      "/auth/login",
      data
    );
    return response;
  },
  register: async (
    data: RegisterSchemaFormData
  ): Promise<AxiosResponse<AuthResponse>> => {
    const response = await fetchHttpClient.post<AuthResponse>(
      "/auth/register",
      data
    );
    return response;
  },
  logout: async (
    refreshToken: string
  ): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>(
      "/auth/logout",
      { refreshToken }
    );
    return response;
  },
  logOutAll : async (
    refreshToken : string
  ): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>(
      "/auth/logout-all",
      { refreshToken }
    );
    return response;
  },
  resendVerifyEmail: async (): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>(
      "/auth/verify-email/resend"
    );
    return response;
  },
  sendVerifyEmail: async (): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>(
      "/auth/verify-email/send"
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
      "/auth/verify-email/otp",
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
    refreshToken: string
  ): Promise<AxiosResponse<AuthResponse>> => {
    const response = await fetchHttpClient.post<AuthResponse>(
      "/auth/refresh",
      { refreshToken }
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
      "/auth/password/reset/send",
      data
    );
    return response;
  },
  confirmForgotPassword: async (
    data : ConfirmResetPasswordSchemaFormData
  ): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>(
      "/auth/password/reset/confirm",
      {data}
    );
    return response;
  },
  // verifyForgotPassword: async (
  //   email_forgot_password_token: string
  // ): Promise<AxiosResponse<MessageResponse>> => {
  //   const response = await fetchHttpClient.post<MessageResponse>(
  //     "/users/verify-forgot-password",
  //     { email_forgot_password_token }
  //   );
  //   return response;
  // },
  // resetPassword: async (
  //   data: ResetPasswordSchemaFormData
  // ): Promise<AxiosResponse<MessageResponse>> => {
  //   const response = await fetchHttpClient.post<MessageResponse>(
  //     "/users/reset-password",
  //     data
  //   );
  //   return response;
  // },
};
