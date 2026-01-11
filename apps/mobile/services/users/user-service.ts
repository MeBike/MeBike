import type { Result } from "@lib/result";

import { kyClient } from "@lib/ky-client";
import { err, ok } from "@lib/result";
import { routePath, ServerRoutes } from "@lib/server-routes";
import { ServerContracts } from "@mebike/shared";

import type { UserError } from "./user-error";

type UserDetail = ServerContracts.UsersContracts.UserDetail;

const HTTP_STATUS = {
  OK: 200,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
};

async function parseUserError(response: Response): Promise<UserError> {
  try {
    const data = await response.json();
    const unauthorizedParsed = ServerContracts.UnauthorizedErrorResponseSchema.safeParse(data);
    if (unauthorizedParsed.success) {
      return {
        _tag: "ApiError",
        code: unauthorizedParsed.data.details.code,
        message: unauthorizedParsed.data.error,
      };
    }

    const userParsed = ServerContracts.UsersContracts.UserErrorResponseSchema.safeParse(data);
    if (userParsed.success) {
      return {
        _tag: "ApiError",
        code: userParsed.data.details.code,
        message: userParsed.data.error,
      };
    }
  }
  catch {
    return { _tag: "DecodeError" };
  }

  return { _tag: "UnknownError" };
}

async function parseMeResponse(response: Response): Promise<Result<UserDetail, UserError>> {
  try {
    const data = await response.json();
    const parsed = ServerContracts.UsersContracts.MeResponseSchema.safeParse(data);
    if (!parsed.success) {
      return err({ _tag: "DecodeError" });
    }
    return ok(parsed.data.data);
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

      if (response.status === HTTP_STATUS.OK) {
        return await parseMeResponse(response);
      }

      if (response.status === HTTP_STATUS.UNAUTHORIZED || response.status === HTTP_STATUS.NOT_FOUND) {
        return err(await parseUserError(response));
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
};
