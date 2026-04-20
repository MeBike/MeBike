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
type ChangePasswordStatus = keyof typeof ServerRoutes.users.changePassword.responses;
type UpdateMeStatus = keyof typeof ServerRoutes.users.updateMe.responses;
type UploadMyAvatarStatus = keyof typeof ServerRoutes.users.uploadMyAvatar.responses;
export type UpdateMeRequest = z.output<typeof UsersContracts.UpdateMeRequestSchema>;
export type ChangePasswordRequest = z.output<typeof UsersContracts.ChangePasswordRequestSchema>;
export type UploadAvatarPayload = {
  uri: string;
  name?: string | null;
  type?: string | null;
};

async function decodeResponse<TValue>(
  response: Response,
  schema: z.ZodType<TValue>,
): Promise<Result<TValue, UserError>> {
  try {
    const data = await readJson(response);
    const parsed = decodeWithSchema(schema, data);
    return parsed.ok ? ok(parsed.value) : err({ _tag: "DecodeError" });
  }
  catch {
    return err({ _tag: "DecodeError" });
  }
}

export const userService = {
  me: async (): Promise<Result<UserDetail, UserError>> => {
    try {
      const response = await kyClient.get(routePath(ServerRoutes.users.me), {
        throwHttpErrors: false,
      });

      const status = response.status as MeStatus | number;
      switch (status) {
        case StatusCodes.OK: {
          const okSchema = ServerRoutes.users.me.responses[200].content["application/json"].schema;
          return decodeResponse(response, okSchema as z.ZodType<UserDetail>);
        }
        case StatusCodes.UNAUTHORIZED:
        case StatusCodes.FORBIDDEN:
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

  changePassword: async (
    payload: ChangePasswordRequest,
  ): Promise<Result<void, UserError>> => {
    try {
      const response = await kyClient.put(routePath(ServerRoutes.users.changePassword), {
        json: payload,
        throwHttpErrors: false,
      });

      const status = response.status as ChangePasswordStatus | number;
      switch (status) {
        case StatusCodes.NO_CONTENT:
          return ok(undefined);
        case StatusCodes.BAD_REQUEST:
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
          const okSchema = ServerRoutes.users.updateMe.responses[200].content["application/json"].schema;
          return decodeResponse(response, okSchema as z.ZodType<UserDetail>);
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
          const okSchema = ServerRoutes.users.uploadMyAvatar.responses[200].content["application/json"].schema;
          return decodeResponse(response, okSchema as z.ZodType<UserDetail>);
        }
        case StatusCodes.BAD_REQUEST:
        case StatusCodes.UNAUTHORIZED:
        case StatusCodes.NOT_FOUND:
        case StatusCodes.REQUEST_TOO_LONG:
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
};
