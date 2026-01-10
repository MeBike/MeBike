import type { AxiosResponse } from "axios";

import type { ChangePasswordSchemaFormData, ForgotPasswordSchemaFormData, LoginSchemaFormData, RegisterSchemaFormData, ResetPasswordSchemaFormData, UpdateProfileSchemaFormData } from "@schemas/authSchema";

import fetchHttpClient from "@lib/httpClient";

type AuthResponse = {
  message: string;
  result: {
    access_token: string;
    refresh_token: string;
  };
};
type MessageResponse = {
  result?: {
    access_token: string;
    refresh_token: string;
  };
  message: string;
};
export const ROLES = ["USER", "ADMIN", "STAFF" , "SOS"] as const;
export type RoleType = typeof ROLES[number];
export type DetailUser = {
  _id: string;
  fullname: string;
  email: string;
  verify: string;
  location: string;
  username: string;
  phone_number: string;
  avatar: string;
  role: "STAFF" | "ADMIN" | "USER" | "SOS";
  created_at: string;
  updated_at: string;
};
export type ProfileUserResponse = {
  message: string;
  result: DetailUser;
};
import { LoginResponse , LogOutResponse  , RegisterResponse , GetMeResponse , VerifyEmailResponse , VerifyForgotPasswordTokenResponse , VerifyEmailProcessResponse} from "@/types";
import { LOGIN_MUTATION , LOGOUT_MUTATION , REGISTER_MUTATION , GET_ME , VERIFY_EMAIL, VERIFY_EMAIL_PROCESS} from "@graphql";
import { print } from "graphql";
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
  resendVerifyEmail: async (): Promise<AxiosResponse<VerifyEmailResponse>> => {
    const response = await fetchHttpClient.mutation<VerifyEmailResponse>(
      print(VERIFY_EMAIL)
    );
    return response;
  },
  verifyEmail: async ({
    otp,
  }: {
    otp: string;
  }): Promise<AxiosResponse<VerifyEmailProcessResponse>> => {
    const response = await fetchHttpClient.mutation<VerifyEmailProcessResponse>(
      print(VERIFY_EMAIL_PROCESS),
      {
        "otp" : otp
      }
    );
    return response;
  },
   getMe: async (): Promise<AxiosResponse<GetMeResponse>> => {
    const response = await fetchHttpClient.query<GetMeResponse>(print(GET_ME));
    return response;
  },
  refreshToken: async (refresh_token: string): Promise<AxiosResponse<AuthResponse>> => {
    const response = await fetchHttpClient.post<AuthResponse>("/users/refresh-token", { refresh_token });
    return response;
  },
  updateProfile: async (data: Partial<UpdateProfileSchemaFormData>): Promise<AxiosResponse<ProfileUserResponse>> => {
    const response = await fetchHttpClient.patch<ProfileUserResponse>("/users/me", data);
    return response;
  },
  changePassword: async (data: ChangePasswordSchemaFormData): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.put<MessageResponse>("/users/change-password", data);
    return response;
  },
  forgotPassword: async (data: ForgotPasswordSchemaFormData): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>("/users/forgot-password", data);
    return response;
  },
  verifyForgotPassword: async (email_forgot_password_token: string): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>("/users/verify-forgot-password", { email_forgot_password_token });
    return response;
  },
  resetPassword: async (data: ResetPasswordSchemaFormData): Promise<AxiosResponse<MessageResponse>> => {
    const response = await fetchHttpClient.post<MessageResponse>("/users/reset-password", data);
    return response;
  },
};
