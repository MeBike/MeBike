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
import {
  LOGIN_MUTATION,
  REGISTER_MUTATION,
  REFRESH_TOKEN_MUTATION,
  GET_ME,
  LOGOUT_MUTATION,
  CHANGE_PASSWORD_MUTATION,
  UPDATE_PROFILE,
} from "@/graphql";
import {print} from "graphql"
import {
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
  GetMeResponse,
  LogOutResponse,
  ChangePasswordResponse,
  UpdateProfileResponse,
} from "@/types/auth.type";
interface AuthResponse {
  message: string;
  result: {
    accessToken: string;
    refreshToken: string;
  };
}
interface MessageResponse {
  result?: {
    access_token: string;
    refresh_token: string;
  };
  message: string;
}
export interface LoginMutationResponse {
  authResponse: AuthResponse;
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
  role: "STAFF" | "ADMIN" | "USER" | "SOS";
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
  ): Promise<AxiosResponse<LoginResponse>> => {
    return fetchHttpClient.mutation<LoginResponse>(print(LOGIN_MUTATION), {
      body: {
        email: data.email,
        password: data.password,
      },
    });
  },
  register: async (
    data: RegisterSchemaFormData
  ): Promise<AxiosResponse<RegisterResponse>> => {
    const response = await fetchHttpClient.mutation<RegisterResponse>(
      print(REGISTER_MUTATION),
      {
        body: {
          email: data.email,
          name: data.name,
          YOB: data.YOB,
          phone: data.phone,
          password: data.password,
          confirmPassword: data.confirmPassword,
        },
      }
    );
    return response;
  },
  logout: async (): Promise<AxiosResponse<LogOutResponse>> => {
    const response = await fetchHttpClient.mutation<LogOutResponse>(
      print(LOGOUT_MUTATION)
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
  getMe: async (): Promise<AxiosResponse<GetMeResponse>> => {
    const response = await fetchHttpClient.query<GetMeResponse>(print(GET_ME));
    return response;
  },
  refreshToken: async (
    refresh_token: string
  ): Promise<AxiosResponse<RefreshTokenResponse>> => {
    const response = await fetchHttpClient.mutation<RefreshTokenResponse>(
      print(REFRESH_TOKEN_MUTATION),
      { refreshToken: refresh_token }
    );
    return response;
  },
  updateProfile: async (
    data: Partial<UpdateProfileSchemaFormData>
  ): Promise<AxiosResponse<UpdateProfileResponse>> => {
    const response = await fetchHttpClient.mutation<UpdateProfileResponse>(
      print(UPDATE_PROFILE),
      {
        data,
      }
    );
    return response;
  },
  changePassword: async (
    data: ChangePasswordSchemaFormData
  ): Promise<AxiosResponse<ChangePasswordResponse>> => {
    const response = await fetchHttpClient.mutation<ChangePasswordResponse>(
      print(CHANGE_PASSWORD_MUTATION),
      {
        body: {
          oldPassword : data.oldPassword,
          newPassword : data.newPassword,
          confirmPassword : data.confirmPassword
        },
      }
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
