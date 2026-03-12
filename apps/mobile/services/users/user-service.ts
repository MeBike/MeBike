import type { Result } from "@lib/result";
import type { UsersContracts } from "@mebike/shared";
import type { z } from "zod";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";

import type { ApiUserError, UserError } from "./user-error";

export type UserDetail = z.output<typeof UsersContracts.UserDetailSchema>;
type MeStatus = keyof typeof ServerRoutes.users.me.responses;
type UpdateMeStatus = keyof typeof ServerRoutes.users.updateMe.responses;
type RegisterPushTokenStatus = keyof typeof ServerRoutes.users.registerPushToken.responses;
type UnregisterPushTokenStatus = keyof typeof ServerRoutes.users.unregisterPushToken.responses;
type UnregisterAllPushTokensStatus = keyof typeof ServerRoutes.users.unregisterAllPushTokens.responses;
export type UpdateMeRequest = z.output<typeof UsersContracts.UpdateMeRequestSchema>;
export type RegisterPushTokenRequest = z.output<typeof UsersContracts.RegisterPushTokenRequestSchema>;
export type PushTokenSummary = z.output<typeof UsersContracts.PushTokenSummarySchema>;

const HTTP_STATUS = {
  OK: 200,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
};

function parseUserError(data: unknown): UserError {
  const unauthorizedSchema
    = ServerRoutes.users.me.responses[401].content["application/json"].schema;
  const notFoundSchema
    = ServerRoutes.users.me.responses[404].content["application/json"].schema;

  const unauthorized = decodeWithSchema(unauthorizedSchema, data);
  if (unauthorized.ok) {
    return {
      _tag: "ApiError",
      code: unauthorized.value.details.code as ApiUserError["code"],
      message: unauthorized.value.error,
    };
  }

  const notFound = decodeWithSchema(notFoundSchema, data);
  if (notFound.ok) {
    return {
      _tag: "ApiError",
      code: notFound.value.details.code as ApiUserError["code"],
      message: notFound.value.error,
    };
  }

  return { _tag: "DecodeError" };
}

function parsePushTokenError(data: unknown): UserError {
  const unauthorizedSchema
    = ServerRoutes.users.registerPushToken.responses[401].content["application/json"].schema;
  const badRequestSchema
    = ServerRoutes.users.registerPushToken.responses[400].content["application/json"].schema;

  const unauthorized = decodeWithSchema(unauthorizedSchema, data);
  if (unauthorized.ok) {
    return {
      _tag: "ApiError",
      code: unauthorized.value.details.code as ApiUserError["code"],
      message: unauthorized.value.error,
    };
  }

  const badRequest = decodeWithSchema(badRequestSchema, data);
  if (badRequest.ok) {
    return {
      _tag: "ApiError",
      code: badRequest.value.details.code as ApiUserError["code"],
      message: badRequest.value.error,
    };
  }

  return { _tag: "DecodeError" };
}

export const userService = {
  me: async (): Promise<Result<UserDetail, UserError>> => {
    try {
      const response = await kyClient.get(routePath(ServerRoutes.users.me), {
        throwHttpErrors: false,
      });

      const status = response.status as MeStatus | number;
      switch (status) {
        case HTTP_STATUS.OK: {
          const data = await readJson(response);
          const okSchema = ServerRoutes.users.me.responses[200].content["application/json"].schema;
          const parsed = decodeWithSchema(okSchema, data);
          return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
        }
        case HTTP_STATUS.UNAUTHORIZED:
        case HTTP_STATUS.NOT_FOUND: {
          const data = await readJson(response);
          return err(parseUserError(data));
        }
        default:
          return err({ _tag: "UnknownError", message: `Unexpected status ${response.status}` });
      }
    }
    catch (error) {
      return err({
        _tag: "NetworkError",
        message: error instanceof Error ? error.message : undefined,
      });
    }
  },

  updateMe: async (
    payload: UpdateMeRequest,
  ): Promise<Result<UserDetail, UserError>> => {
    try {
      const response = await kyClient.patch(routePath(ServerRoutes.users.updateMe), {
        json: payload,
        throwHttpErrors: false,
      });

      const status = response.status as UpdateMeStatus | number;
      switch (status) {
        case HTTP_STATUS.OK: {
          const data = await readJson(response);
          const okSchema = ServerRoutes.users.updateMe.responses[200].content["application/json"].schema;
          const parsed = decodeWithSchema(okSchema, data);
          return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
        }
        case HTTP_STATUS.UNAUTHORIZED:
        case HTTP_STATUS.NOT_FOUND:
        case 409: {
          const data = await readJson(response);

          const unauthorizedSchema
            = ServerRoutes.users.updateMe.responses[401].content["application/json"].schema;
          const notFoundSchema
            = ServerRoutes.users.updateMe.responses[404].content["application/json"].schema;
          const conflictSchema
            = ServerRoutes.users.updateMe.responses[409].content["application/json"].schema;

          const unauthorized = decodeWithSchema(unauthorizedSchema, data);
          if (unauthorized.ok) {
            return err({
              _tag: "ApiError",
              code: unauthorized.value.details.code as ApiUserError["code"],
              message: unauthorized.value.error,
            });
          }

          const notFound = decodeWithSchema(notFoundSchema, data);
          if (notFound.ok) {
            return err({
              _tag: "ApiError",
              code: notFound.value.details.code as ApiUserError["code"],
              message: notFound.value.error,
            });
          }

          const conflict = decodeWithSchema(conflictSchema, data);
          if (conflict.ok) {
            return err({
              _tag: "ApiError",
              code: conflict.value.details.code as ApiUserError["code"],
              message: conflict.value.error,
            });
          }

          return err({ _tag: "DecodeError" });
        }
        default:
          return err({ _tag: "UnknownError", message: `Unexpected status ${response.status}` });
      }
    }
    catch (error) {
      return err({
        _tag: "NetworkError",
        message: error instanceof Error ? error.message : undefined,
      });
    }
  },

  registerPushToken: async (
    payload: RegisterPushTokenRequest,
  ): Promise<Result<PushTokenSummary, UserError>> => {
    try {
      const response = await kyClient.post(routePath(ServerRoutes.users.registerPushToken), {
        json: payload,
        throwHttpErrors: false,
      });

      const status = response.status as RegisterPushTokenStatus | number;
      switch (status) {
        case HTTP_STATUS.OK: {
          const data = await readJson(response);
          const okSchema = ServerRoutes.users.registerPushToken.responses[200]
            .content["application/json"].schema;
          const parsed = decodeWithSchema(okSchema, data);
          return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
        }
        case HTTP_STATUS.UNAUTHORIZED:
        case 400: {
          const data = await readJson(response);
          return err(parsePushTokenError(data));
        }
        default:
          return err({ _tag: "UnknownError", message: `Unexpected status ${response.status}` });
      }
    }
    catch (error) {
      return err({
        _tag: "NetworkError",
        message: error instanceof Error ? error.message : undefined,
      });
    }
  },

  unregisterPushToken: async (token: string): Promise<Result<void, UserError>> => {
    try {
      const response = await kyClient.delete(routePath(ServerRoutes.users.unregisterPushToken), {
        json: { token },
        throwHttpErrors: false,
      });

      const status = response.status as UnregisterPushTokenStatus | number;
      switch (status) {
        case 204:
          return ok(undefined);
        case HTTP_STATUS.UNAUTHORIZED:
        case 400: {
          const data = await readJson(response);
          return err(parsePushTokenError(data));
        }
        default:
          return err({ _tag: "UnknownError", message: `Unexpected status ${response.status}` });
      }
    }
    catch (error) {
      return err({
        _tag: "NetworkError",
        message: error instanceof Error ? error.message : undefined,
      });
    }
  },

  unregisterAllPushTokens: async (): Promise<Result<void, UserError>> => {
    try {
      const response = await kyClient.delete(routePath(ServerRoutes.users.unregisterAllPushTokens), {
        throwHttpErrors: false,
      });

      const status = response.status as UnregisterAllPushTokensStatus | number;
      switch (status) {
        case 204:
          return ok(undefined);
        case HTTP_STATUS.UNAUTHORIZED: {
          const data = await readJson(response);
          return err(parsePushTokenError(data));
        }
        default:
          return err({ _tag: "UnknownError", message: `Unexpected status ${response.status}` });
      }
    }
    catch (error) {
      return err({
        _tag: "NetworkError",
        message: error instanceof Error ? error.message : undefined,
      });
    }
  },
};
