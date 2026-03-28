import type { Result } from "@lib/result";
import type { UsersContracts } from "@mebike/shared";
import type { z } from "zod";

import { decodeWithSchema, readJson } from "@lib/api-decode";
import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { StatusCodes } from "http-status-codes";

import type { UserError } from "./user-error";

import { asNetworkError, parseUserError } from "./user-error";

export type UserDetail = z.output<typeof UsersContracts.UserDetailSchema>;
type MeStatus = keyof typeof ServerRoutes.users.me.responses;
type UpdateMeStatus = keyof typeof ServerRoutes.users.updateMe.responses;
type UploadMyAvatarStatus = keyof typeof ServerRoutes.users.uploadMyAvatar.responses;
type RegisterPushTokenStatus = keyof typeof ServerRoutes.users.registerPushToken.responses;
type UnregisterPushTokenStatus = keyof typeof ServerRoutes.users.unregisterPushToken.responses;
type UnregisterAllPushTokensStatus = keyof typeof ServerRoutes.users.unregisterAllPushTokens.responses;
export type UpdateMeRequest = z.output<typeof UsersContracts.UpdateMeRequestSchema>;
export type RegisterPushTokenRequest = z.output<typeof UsersContracts.RegisterPushTokenRequestSchema>;
export type PushTokenSummary = z.output<typeof UsersContracts.PushTokenSummarySchema>;
export type UploadAvatarPayload = {
  uri: string;
  name?: string | null;
  type?: string | null;
};

export const userService = {
  me: async (): Promise<Result<UserDetail, UserError>> => {
    try {
      const response = await kyClient.get(routePath(ServerRoutes.users.me), {
        throwHttpErrors: false,
      });

      const status = response.status as MeStatus | number;
      switch (status) {
        case StatusCodes.OK: {
          const data = await readJson(response);
          const okSchema = ServerRoutes.users.me.responses[200].content["application/json"].schema;
          const parsed = decodeWithSchema(okSchema, data);
          return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
        }
        case StatusCodes.UNAUTHORIZED:
        case StatusCodes.NOT_FOUND:
          return err(await parseUserError(response));
        default:
          return err({ _tag: "UnknownError", message: `Unexpected status ${response.status}` });
      }
    }
    catch (error) {
      return asNetworkError(error);
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
        case StatusCodes.OK: {
          const data = await readJson(response);
          const okSchema = ServerRoutes.users.updateMe.responses[200].content["application/json"].schema;
          const parsed = decodeWithSchema(okSchema, data);
          return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
        }
        case StatusCodes.UNAUTHORIZED:
        case StatusCodes.NOT_FOUND:
        case StatusCodes.CONFLICT:
          return err(await parseUserError(response));
        default:
          return err({ _tag: "UnknownError", message: `Unexpected status ${response.status}` });
      }
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  uploadMyAvatar: async (
    payload: UploadAvatarPayload,
  ): Promise<Result<UserDetail, UserError>> => {
    try {
      const formData = new FormData();
      formData.append("avatar", {
        uri: payload.uri,
        name: payload.name ?? "avatar.jpg",
        type: payload.type ?? "image/jpeg",
      } as never);

      const response = await kyClient.put(routePath(ServerRoutes.users.uploadMyAvatar), {
        body: formData,
        throwHttpErrors: false,
      });

      const status = response.status as UploadMyAvatarStatus | number;
      switch (status) {
        case StatusCodes.OK: {
          const data = await readJson(response);
          const okSchema = ServerRoutes.users.uploadMyAvatar.responses[200].content["application/json"].schema;
          const parsed = decodeWithSchema(okSchema, data);
          return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
        }
        case StatusCodes.BAD_REQUEST:
        case StatusCodes.UNAUTHORIZED:
        case StatusCodes.NOT_FOUND:
        case 413:
        case StatusCodes.SERVICE_UNAVAILABLE:
          return err(await parseUserError(response));
        default:
          return err({ _tag: "UnknownError", message: `Unexpected status ${response.status}` });
      }
    }
    catch (error) {
      return asNetworkError(error);
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
        case StatusCodes.OK: {
          const data = await readJson(response);
          const okSchema = ServerRoutes.users.registerPushToken.responses[200].content["application/json"].schema;
          const parsed = decodeWithSchema(okSchema, data);
          return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
        }
        case StatusCodes.UNAUTHORIZED:
        case StatusCodes.BAD_REQUEST:
          return err(await parseUserError(response));
        default:
          return err({ _tag: "UnknownError", message: `Unexpected status ${response.status}` });
      }
    }
    catch (error) {
      return asNetworkError(error);
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
        case StatusCodes.NO_CONTENT:
          return ok(undefined);
        case StatusCodes.UNAUTHORIZED:
        case StatusCodes.BAD_REQUEST:
          return err(await parseUserError(response));
        default:
          return err({ _tag: "UnknownError", message: `Unexpected status ${response.status}` });
      }
    }
    catch (error) {
      return asNetworkError(error);
    }
  },

  unregisterAllPushTokens: async (): Promise<Result<void, UserError>> => {
    try {
      const response = await kyClient.delete(routePath(ServerRoutes.users.unregisterAllPushTokens), {
        throwHttpErrors: false,
      });

      const status = response.status as UnregisterAllPushTokensStatus | number;
      switch (status) {
        case StatusCodes.NO_CONTENT:
          return ok(undefined);
        case StatusCodes.UNAUTHORIZED:
          return err(await parseUserError(response));
        default:
          return err({ _tag: "UnknownError", message: `Unexpected status ${response.status}` });
      }
    }
    catch (error) {
      return asNetworkError(error);
    }
  },
};
