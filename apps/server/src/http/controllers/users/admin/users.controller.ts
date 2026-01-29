import type { RouteHandler } from "@hono/zod-openapi";

import {
  serverRoutes,
  UsersContracts,
} from "@mebike/shared";
import { Effect, Match } from "effect";

import { hashPassword } from "@/domain/auth/services/auth.service";
import { withLoggedCause } from "@/domain/shared";
import {
  adminCreateUserUseCase,
  UserServiceTag,
} from "@/domain/users";
import { withUserDeps } from "@/http/shared/providers";
import { routeContext } from "@/http/shared/route-context";

import { mapUserDetail, pickDefined } from "../shared";

type UsersRoutes = typeof import("@mebike/shared")["serverRoutes"]["users"];
const users = serverRoutes.users;

const adminList: RouteHandler<UsersRoutes["adminList"]> = async (c) => {
  const query = c.req.valid("query");
  const eff = withLoggedCause(
    withUserDeps(Effect.gen(function* () {
      const service = yield* UserServiceTag;
      return yield* service.listWithOffset({
        fullname: query.fullname,
        role: query.role,
        verify: query.verify,
      }, {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 50,
        sortBy: query.sortBy,
        sortDir: query.sortDir,
      });
    })),
    routeContext(users.adminList),
  );

  const data = await Effect.runPromise(eff);
  return c.json<UsersContracts.AdminUserListResponse, 200>(
    {
      data: data.items.map(mapUserDetail),
      pagination: {
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        totalPages: data.totalPages,
      },
    },
    200,
  );
};

const adminSearch: RouteHandler<UsersRoutes["adminSearch"]> = async (c) => {
  const query = c.req.valid("query");
  const eff = withLoggedCause(
    withUserDeps(Effect.gen(function* () {
      const service = yield* UserServiceTag;
      return yield* service.searchByQuery(query.q);
    })),
    routeContext(users.adminSearch),
  );

  const data = await Effect.runPromise(eff);
  return c.json<UsersContracts.AdminUserSearchResponse, 200>({ data: data.map(mapUserDetail) }, 200);
};

const adminDetail: RouteHandler<UsersRoutes["adminDetail"]> = async (c) => {
  const { userId } = c.req.valid("param");
  const eff = withLoggedCause(
    withUserDeps(Effect.gen(function* () {
      const service = yield* UserServiceTag;
      return yield* service.getById(userId);
    })),
    routeContext(users.adminDetail),
  );

  const result = await Effect.runPromise(eff);
  if (result._tag === "Some") {
    return c.json<UsersContracts.AdminUserDetailResponse, 200>({ data: mapUserDetail(result.value) }, 200);
  }

  return c.json<UsersContracts.UserErrorResponse, 404>(
    {
      error: UsersContracts.userErrorMessages.USER_NOT_FOUND,
      details: { code: UsersContracts.UserErrorCodeSchema.enum.USER_NOT_FOUND },
    },
    404,
  );
};

const adminUpdate: RouteHandler<UsersRoutes["adminUpdate"]> = async (c) => {
  const { userId } = c.req.valid("param");
  const body = c.req.valid("json");
  const eff = withLoggedCause(
    withUserDeps(Effect.gen(function* () {
      const service = yield* UserServiceTag;
      return yield* service.updateAdminById(userId, pickDefined(body));
    })),
    routeContext(users.adminUpdate),
  );

  const result = await Effect.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      if (right._tag === "Some") {
        return c.json<UsersContracts.AdminUserDetailResponse, 200>(
          { data: mapUserDetail(right.value) },
          200,
        );
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
        Match.orElse(() =>
          c.json<UsersContracts.UserErrorResponse, 404>(
            {
              error: UsersContracts.userErrorMessages.USER_NOT_FOUND,
              details: { code: UsersContracts.UserErrorCodeSchema.enum.USER_NOT_FOUND },
            },
            404,
          )),
      )),
    Match.exhaustive,
  );
};

const adminCreate: RouteHandler<UsersRoutes["adminCreate"]> = async (c) => {
  const body = c.req.valid("json");
  const eff = withLoggedCause(withUserDeps(adminCreateUserUseCase(body)), routeContext(users.adminCreate));

  const result = await Effect.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<UsersContracts.AdminUserDetailResponse, 201>({ data: mapUserDetail(right) }, 201)),
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

const adminResetPassword: RouteHandler<UsersRoutes["adminResetPassword"]> = async (c) => {
  const { userId } = c.req.valid("param");
  const body = c.req.valid("json");
  const eff = withLoggedCause(
    withUserDeps(Effect.gen(function* () {
      const service = yield* UserServiceTag;
      const passwordHash = yield* hashPassword(body.newPassword);
      return yield* service.updatePassword(userId, passwordHash);
    })),
    routeContext(users.adminResetPassword),
  );

  const result = await Effect.runPromise(eff);
  if (result._tag === "Some") {
    return c.json<undefined, 200>(undefined, 200);
  }
  return c.json<UsersContracts.UserErrorResponse, 404>(
    {
      error: UsersContracts.userErrorMessages.USER_NOT_FOUND,
      details: { code: UsersContracts.UserErrorCodeSchema.enum.USER_NOT_FOUND },
    },
    404,
  );
};

export const AdminUsersController = {
  adminList,
  adminSearch,
  adminDetail,
  adminUpdate,
  adminCreate,
  adminResetPassword,
} as const;
