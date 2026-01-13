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
          return parsed.ok ? ok(parsed.value.data) : err({ _tag: "DecodeError" });
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
};
