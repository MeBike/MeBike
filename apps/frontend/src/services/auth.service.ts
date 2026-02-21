import fetchHttpClient from "@/lib/httpClient";
import type {
  UpdateProfileSchemaFormData,
  ChangePasswordSchemaFormData,
  ForgotPasswordSchemaFormData,
  LoginSchemaFormData,
  RegisterSchemaFormData,
  ConfirmResetPasswordSchemaFormData,
  VerifyEmailSchemaFormData,
  VerifyOTPForForgotPasswordSchemaFormData
} from "@schemas/authSchema";
import type { AxiosResponse } from "axios";
import { ProfileUserResponse , AuthResponse , MessageResponse , ResetTokenResponse} from "@/types";
import { ENDPOINT } from "@/constants/end-point";
export const authService = {
  login: async (
    data: LoginSchemaFormData
  ): Promise<AxiosResponse<AuthResponse>> => {
    const response = await fetchHttpClient.post<AuthResponse>(
      ENDPOINT.AUTH.LOGIN,
      data
    );
    return response;
  },
  register: async (
    data: RegisterSchemaFormData
  ): Promise<AxiosResponse<AuthResponse>> => {
    const response = await fetchHttpClient.post<AuthResponse>(
      ENDPOINT.AUTH.REGISTER,
      data
    );
    return response;
  },
  logout: async (
    refreshToken: string
  ): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>(
      ENDPOINT.AUTH.LOGOUT,
      { refreshToken }
    );
    return response;
  },
  logOutAll : async (
    refreshToken : string
  ): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>(
      ENDPOINT.AUTH.LOGOUT_ALL,
      { refreshToken }
    );
    return response;
  },
  resendVerifyEmail: async (): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>(
      ENDPOINT.AUTH.RESEND_VERIFY_EMAIL
    );
    return response;
  },
  sendVerifyEmail: async (): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>(
      ENDPOINT.AUTH.SEND_VERIFY_EMAIL
    );
    return response;
  },
  verifyEmail: async (data:VerifyEmailSchemaFormData): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>(
      ENDPOINT.AUTH.VERIFY_EMAIL,
      data
    );
    return response;
  },
  getMe: async (): Promise<AxiosResponse<ProfileUserResponse>> => {
    const response =
      await fetchHttpClient.get<ProfileUserResponse>(ENDPOINT.AUTH.GET_ME);
    return response;
  },
  refreshToken: async (
    refreshToken: string
  ): Promise<AxiosResponse<AuthResponse>> => {
    const response = await fetchHttpClient.post<AuthResponse>(
      ENDPOINT.AUTH.REFRESH_TOKEN,
      { refreshToken }
    );
    return response;
  },
  updateProfile: async (
    data: Partial<UpdateProfileSchemaFormData>
  ): Promise<AxiosResponse<ProfileUserResponse>> => {
    const response = await fetchHttpClient.patch<ProfileUserResponse>(
      ENDPOINT.AUTH.GET_ME,
      data
    );
    return response;
  },
  changePassword: async (
    data: ChangePasswordSchemaFormData
  ): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.put<MessageResponse>(
      ENDPOINT.AUTH.CHANGE_PASSWORD,
      data
    );
    return response;
  },
  verifyOTP: async (
    data : VerifyOTPForForgotPasswordSchemaFormData
  ): Promise<AxiosResponse<ResetTokenResponse>> => {
    const response = await fetchHttpClient.post<ResetTokenResponse>(
      ENDPOINT.AUTH.VERIFY_FORGOT_PASSWORD,
      data
    );
    return response;
  },
  forgotPassword: async (
    data: ForgotPasswordSchemaFormData
  ): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>(
      ENDPOINT.AUTH.FORGOT_PASSWORD,
      data
    );
    return response;
  },
  confirmForgotPassword: async (
    data : ConfirmResetPasswordSchemaFormData
  ): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>(
      ENDPOINT.AUTH.RESET_PASSWORD,
      data
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
