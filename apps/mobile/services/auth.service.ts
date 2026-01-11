import type { AxiosResponse } from "axios";

import type {
  ChangePasswordSchemaFormData,
  ForgotPasswordSchemaFormData,
  LoginSchemaFormData,
  RegisterSchemaFormData,
  ResetPasswordSchemaFormData,
  UpdateProfileSchemaFormData,
} from "@schemas/authSchema";

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
export const ROLES = ["USER", "ADMIN", "STAFF", "SOS"] as const;
export type RoleType = (typeof ROLES)[number];
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
import {
  LoginResponse,
  GetMeResponse,
  LogOutResponse,
  RegisterResponse,
  VerifyEmailResponse,
  VerifyEmailProcessResponse,
  RefreshTokenResponse,
  UpdateProfileResponse,
  ChangePasswordResponse,
  ForgotPasswordRequestResponse,
  VerifyForgotPasswordTokenResponse,
  ResetPasswordResponse,
} from "@/types";
import {
  LOGIN_MUTATION,
  GET_ME,
  LOGOUT_MUTATION,
  REGISTER_MUTATION,
  VERIFY_EMAIL,
  VERIFY_EMAIL_PROCESS,
  REFRESH_TOKEN_MUTATION,
  UPDATE_PROFILE,
  CHANGE_PASSWORD_MUTATION,
  CREATE_FORGOT_PASSWORD_REQUEST,
  VERIFY_FORGOT_PASSWORD_TOKEN,
  RESET_PASSWORD,
} from "@/graphql";
import { print } from "graphql";

export const authService = {
  getMe: async (): Promise<AxiosResponse<GetMeResponse>> => {
    return fetchHttpClient.query<GetMeResponse>(print(GET_ME));
  },
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
    return fetchHttpClient.mutation<RegisterResponse>(
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
  },
  logout: async (): Promise<AxiosResponse<LogOutResponse>> => {
    console.log(">>> [AuthService] logout called");
    const response = await fetchHttpClient.mutation<LogOutResponse>(
      print(LOGOUT_MUTATION)
    );
    console.log(">>> [AuthService] logout response received:", response.status);
    return response;
  },
  resendVerifyEmail: async (): Promise<AxiosResponse<VerifyEmailResponse>> => {
    return fetchHttpClient.mutation<VerifyEmailResponse>(print(VERIFY_EMAIL));
  },
  verifyEmail: async ({
    otp,
  }: {
    email: string;
    otp: string;
  }): Promise<AxiosResponse<VerifyEmailProcessResponse>> => {
    return fetchHttpClient.mutation<VerifyEmailProcessResponse>(
      print(VERIFY_EMAIL_PROCESS),
      { otp }
    );
  },
  refreshToken: async (
    refresh_token: string
  ): Promise<AxiosResponse<RefreshTokenResponse>> => {
    return fetchHttpClient.mutation<RefreshTokenResponse>(
      print(REFRESH_TOKEN_MUTATION)
    );
  },
  updateProfile: async (
    data: Partial<UpdateProfileSchemaFormData>
  ): Promise<AxiosResponse<UpdateProfileResponse>> => {
    return fetchHttpClient.mutation<UpdateProfileResponse>(
      print(UPDATE_PROFILE),
      { data }
    );
  },
  changePassword: async (
    data: ChangePasswordSchemaFormData
  ): Promise<AxiosResponse<ChangePasswordResponse>> => {
    return fetchHttpClient.mutation<ChangePasswordResponse>(
      print(CHANGE_PASSWORD_MUTATION),
      {
        body: {
          oldPassword: data.oldPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword,
        },
      }
    );
  },
  forgotPassword: async (
    data: ForgotPasswordSchemaFormData
  ): Promise<AxiosResponse<ForgotPasswordRequestResponse>> => {
    return fetchHttpClient.mutation<ForgotPasswordRequestResponse>(
      print(CREATE_FORGOT_PASSWORD_REQUEST),
      { email: data.email }
    );
  },
  verifyForgotPassword: async (data: {
    email: string;
    otp: string;
  }): Promise<AxiosResponse<VerifyForgotPasswordTokenResponse>> => {
    return fetchHttpClient.mutation<VerifyForgotPasswordTokenResponse>(
      print(VERIFY_FORGOT_PASSWORD_TOKEN),
      { data }
    );
  },
  resetPassword: async (
    data: ResetPasswordSchemaFormData
  ): Promise<AxiosResponse<ResetPasswordResponse>> => {
    return fetchHttpClient.mutation<ResetPasswordResponse>(
      print(RESET_PASSWORD),
      {
        data: {
          email: data.email,
          otp: data.otp,
          password: data.password,
          confirm_password: data.confirm_password,
        },
      }
    );
  },
};
