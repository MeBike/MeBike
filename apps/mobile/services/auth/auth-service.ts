import type { Result } from "@lib/result";
import type { z } from "zod";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { clearTokens, setTokens } from "@lib/auth-tokens";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { AuthContracts } from "@mebike/shared";
import { StatusCodes } from "http-status-codes";

import type { AuthError } from "./auth-error";

import { asNetworkError, parseAuthError } from "./auth-error";

export type Tokens = z.output<typeof AuthContracts.TokensSchema>;

export type LoginRequest = z.output<typeof AuthContracts.LoginRequestSchema>;

export type RegisterRequest = z.output<typeof AuthContracts.RegisterRequestSchema>;

export type RefreshRequest = z.output<typeof AuthContracts.RefreshRequestSchema>;

export type VerifyResetPasswordOtpRequest = z.output<typeof AuthContracts.VerifyResetPasswordOtpRequestSchema>;

async function decodeEnvelopeData<TEnvelope, TValue>(
  response: Response,
  schema: z.ZodType<TEnvelope>,
  select: (value: TEnvelope) => TValue,
): Promise<Result<TValue, AuthError>> {
  try {
    const data = await readJson(response);
    const parsed = decodeWithSchema(schema, data);
    return parsed.ok ? ok(select(parsed.value)) : err({ _tag: "DecodeError" });
  }
  catch {
    return err({ _tag: "DecodeError" });
  }
}

async function parseTokens(response: Response): Promise<Result<Tokens, AuthError>> {
  return decodeEnvelopeData(response, AuthContracts.TokensEnvelopeSchema, value => value.data);
}

async function parseResetToken(response: Response): Promise<Result<string, AuthError>> {
  return decodeEnvelopeData(response, AuthContracts.ResetPasswordTokenEnvelopeSchema, value => value.data.resetToken);
}

export const authService = {
  login: async (payload: LoginRequest): Promise<Result<Tokens, AuthError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.auth.login), {
        json: payload,
        throwHttpErrors: false,
        skipAuth: true,
      });

      if (response.status === StatusCodes.OK) {
        const tokens = await parseTokens(response);
        if (tokens.ok) {
          await setTokens(tokens.value.accessToken, tokens.value.refreshToken);
        }
        return tokens;
      }

      if (response.status === StatusCodes.UNAUTHORIZED) {
        return err(await parseAuthError(response));
      }

      return err({ _tag: "UnknownError", message: `Unexpected status ${response.status}` });
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  register: async (payload: RegisterRequest): Promise<Result<Tokens, AuthError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.auth.register), {
        json: payload,
        throwHttpErrors: false,
        skipAuth: true,
      });

      if (response.status === StatusCodes.CREATED) {
        const tokens = await parseTokens(response);
        if (tokens.ok) {
          await setTokens(tokens.value.accessToken, tokens.value.refreshToken);
        }
        return tokens;
      }

      if (response.status === StatusCodes.BAD_REQUEST || response.status === StatusCodes.CONFLICT) {
        return err(await parseAuthError(response));
      }

      return err({ _tag: "UnknownError", message: `Unexpected status ${response.status}` });
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  refresh: async (payload: RefreshRequest): Promise<Result<Tokens, AuthError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.auth.refresh), {
        json: payload,
        throwHttpErrors: false,
        skipAuth: true,
      });

      if (response.status === StatusCodes.OK) {
        const tokens = await parseTokens(response);
        if (tokens.ok) {
          await setTokens(tokens.value.accessToken, tokens.value.refreshToken);
        }
        return tokens;
      }

      if (response.status === StatusCodes.UNAUTHORIZED) {
        return err(await parseAuthError(response));
      }

      return err({ _tag: "UnknownError", message: `Unexpected status ${response.status}` });
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  logout: async (payload: RefreshRequest): Promise<Result<void, AuthError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.auth.logout), {
        json: payload,
        throwHttpErrors: false,
        skipAuth: true,
      });

      if (response.status === StatusCodes.OK) {
        await clearTokens();
        return ok(undefined);
      }

      if (response.status === StatusCodes.UNAUTHORIZED) {
        return err(await parseAuthError(response));
      }

      return err({ _tag: "UnknownError", message: `Unexpected status ${response.status}` });
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  resendVerifyEmail: async (payload: z.output<typeof AuthContracts.SendVerifyEmailRequestSchema>): Promise<Result<void, AuthError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.auth.resendVerifyEmail), {
        json: payload,
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        return ok(undefined);
      }

      return err(await parseAuthError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  verifyEmailOtp: async (payload: z.output<typeof AuthContracts.VerifyEmailOtpRequestSchema>): Promise<Result<void, AuthError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.auth.verifyEmailOtp), {
        json: payload,
        throwHttpErrors: false,
      });

      if (response.status === StatusCodes.OK) {
        return ok(undefined);
      }

      return err(await parseAuthError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  sendResetPassword: async (payload: z.output<typeof AuthContracts.SendResetPasswordRequestSchema>): Promise<Result<void, AuthError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.auth.sendResetPassword), {
        json: payload,
        throwHttpErrors: false,
        skipAuth: true,
      });

      if (response.status === StatusCodes.OK) {
        return ok(undefined);
      }

      return err(await parseAuthError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  verifyResetPasswordOtp: async (payload: VerifyResetPasswordOtpRequest): Promise<Result<{ resetToken: string }, AuthError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.auth.verifyResetPasswordOtp), {
        json: payload,
        throwHttpErrors: false,
        skipAuth: true,
      });

      if (response.status === StatusCodes.OK) {
        const resetToken = await parseResetToken(response);
        return resetToken.ok ? ok({ resetToken: resetToken.value }) : err(resetToken.error);
      }

      return err(await parseAuthError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  resetPassword: async (payload: z.output<typeof AuthContracts.ResetPasswordRequestSchema>): Promise<Result<void, AuthError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.auth.resetPassword), {
        json: payload,
        throwHttpErrors: false,
        skipAuth: true,
      });

      if (response.status === StatusCodes.OK) {
        return ok(undefined);
      }

      return err(await parseAuthError(response));
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
};
