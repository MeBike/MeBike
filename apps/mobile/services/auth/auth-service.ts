import type { Result } from "@lib/result";
import type { z } from "zod";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { clearTokens, setTokens } from "@lib/auth-tokens";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { AuthContracts } from "@mebike/shared";
import { StatusCodes } from "http-status-codes";

import type { ApiAuthError, AuthError } from "./auth-error";

export type Tokens = z.output<typeof AuthContracts.TokensSchema>;

export type LoginRequest = z.output<typeof AuthContracts.LoginRequestSchema>;

export type RegisterRequest = z.output<typeof AuthContracts.RegisterRequestSchema>;

export type RefreshRequest = z.output<typeof AuthContracts.RefreshRequestSchema>;

async function parseAuthError(response: Response): Promise<AuthError> {
  try {
    const data = await readJson(response);
    const parsed = decodeWithSchema(AuthContracts.AuthErrorResponseSchema, data);
    if (parsed.ok) {
      return {
        _tag: "ApiError",
        code: parsed.value.details.code as ApiAuthError["code"],
        message: parsed.value.error,
      };
    }
  }
  catch {
    return { _tag: "DecodeError" };
  }

  return { _tag: "UnknownError", message: "Unknown auth error" };
}

async function parseTokens(response: Response): Promise<Result<Tokens, AuthError>> {
  try {
    const data = await readJson(response);
    const parsed = decodeWithSchema(AuthContracts.TokensEnvelopeSchema, data);
    return parsed.ok ? ok(parsed.value.data) : err({ _tag: "DecodeError" });
  }
  catch {
    return err({ _tag: "DecodeError" });
  }
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
      return err({
        _tag: "NetworkError",
        message: error instanceof Error ? error.message : undefined,
      });
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

      if (response.status === StatusCodes.CONFLICT) {
        return err(await parseAuthError(response));
      }

      return err({ _tag: "UnknownError", message: `Unexpected status ${response.status}` });
    }
    catch (error) {
      return err({
        _tag: "NetworkError",
        message: error instanceof Error ? error.message : undefined,
      });
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
      return err({
        _tag: "NetworkError",
        message: error instanceof Error ? error.message : undefined,
      });
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
      return err({
        _tag: "NetworkError",
        message: error instanceof Error ? error.message : undefined,
      });
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
      return err({
        _tag: "NetworkError",
        message: error instanceof Error ? error.message : undefined,
      });
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
      return err({
        _tag: "NetworkError",
        message: error instanceof Error ? error.message : undefined,
      });
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
      return err({
        _tag: "NetworkError",
        message: error instanceof Error ? error.message : undefined,
      });
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
      return err({
        _tag: "NetworkError",
        message: error instanceof Error ? error.message : undefined,
      });
    }
  },
};
