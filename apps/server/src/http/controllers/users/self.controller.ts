import type { RouteHandler } from "@hono/zod-openapi";

import {
  serverRoutes,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UsersContracts,
} from "@mebike/shared";
import { Effect, Match } from "effect";

import { withLoggedCause } from "@/domain/shared";
import { UserServiceTag } from "@/domain/users";
import { routeContext } from "@/http/shared/route-context";

import { mapUserDetail, pickDefined } from "./shared";

type UsersRoutes = typeof import("@mebike/shared")["serverRoutes"]["users"];
const users = serverRoutes.users;

const me: RouteHandler<UsersRoutes["me"]> = async (c) => {
  const userId = c.var.currentUser?.userId;
  if (!userId) {
    return c.json(
      {
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      },
      401,
    );
  }

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* UserServiceTag;
      return yield* service.getById(userId);
    }),
    routeContext(users.me),
  );
  const result = await c.var.runPromise(eff);

  if (result._tag === "Some") {
    return c.json<UsersContracts.MeResponse, 200>({ data: mapUserDetail(result.value) }, 200);
  }

  return c.json<UsersContracts.UserErrorResponse, 404>(
    {
      error: UsersContracts.userErrorMessages.USER_NOT_FOUND,
      details: { code: UsersContracts.UserErrorCodeSchema.enum.USER_NOT_FOUND },
    },
    404,
  );
};

const updateMe: RouteHandler<UsersRoutes["updateMe"]> = async (c) => {
  const userId = c.var.currentUser?.userId;
  if (!userId) {
    return c.json(
      {
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      },
      401,
    );
  }

  const body = c.req.valid("json");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* UserServiceTag;
      return yield* service.updateProfile(userId, pickDefined(body));
    }),
    routeContext(users.updateMe),
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      if (right._tag === "Some") {
        return c.json<UsersContracts.UpdateMeResponse, 200>({ data: mapUserDetail(right.value) }, 200);
      }
      return c.json<UsersContracts.UserErrorResponse, 404>(
        {
          error: UsersContracts.userErrorMessages.USER_NOT_FOUND,
          details: { code: UsersContracts.UserErrorCodeSchema.enum.USER_NOT_FOUND },
        },
        404,
      );
    }),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("DuplicateUserEmail", () =>
          c.json<UsersContracts.UserErrorResponse, 409>(
            {
              error: UsersContracts.userErrorMessages.DUPLICATE_EMAIL,
              details: { code: UsersContracts.UserErrorCodeSchema.enum.DUPLICATE_EMAIL },
            },
            409,
          )),
        Match.tag("DuplicateUserPhoneNumber", () =>
          c.json<UsersContracts.UserErrorResponse, 409>(
            {
              error: UsersContracts.userErrorMessages.DUPLICATE_PHONE_NUMBER,
              details: {
                code: UsersContracts.UserErrorCodeSchema.enum.DUPLICATE_PHONE_NUMBER,
              },
            },
            409,
          )),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

const changePassword: RouteHandler<UsersRoutes["changePassword"]> = async (c) => {
  const userId = c.var.currentUser?.userId;
  if (!userId) {
    return c.json(
      {
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      },
      401,
    );
  }

  const body = c.req.valid("json");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* UserServiceTag;
      return yield* service.changePassword({
        id: userId,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      });
    }),
    routeContext(users.changePassword),
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      if (right._tag === "Some") {
        return c.body(null, 204);
      }
      return c.json<UsersContracts.UserErrorResponse, 404>(
        {
          error: UsersContracts.userErrorMessages.USER_NOT_FOUND,
          details: { code: UsersContracts.UserErrorCodeSchema.enum.USER_NOT_FOUND },
        },
        404,
      );
    }),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("InvalidCurrentPassword", () =>
          c.json<UsersContracts.UserErrorResponse, 400>(
            {
              error: UsersContracts.userErrorMessages.INVALID_CURRENT_PASSWORD,
              details: { code: UsersContracts.UserErrorCodeSchema.enum.INVALID_CURRENT_PASSWORD },
            },
            400,
          )),
        Match.orElse((err) => {
          throw err;
        }),
      )),
    Match.exhaustive,
  );
};

export const UsersController = {
  me,
  updateMe,
  changePassword,
} as const;
