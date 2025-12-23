import type {
  ServerErrorResponse,
} from "@mebike/shared";

import {
  serverRoutes,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UsersContracts,
} from "@mebike/shared";
import { Effect, Match } from "effect";

import { withLoggedCause } from "@/domain/shared";
import {
  adminCreateUserUseCase,
  adminResetPasswordUseCase,
  getUserByIdUseCase,
  listAdminUsersUseCase,
  searchAdminUsersUseCase,
  updateAdminUserUseCase,
  updateProfileUseCase,
  UserStatsServiceTag,
} from "@/domain/users";
import { withUserDeps, withUserStatsDeps } from "@/http/shared/providers";

function pickDefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export function registerUserRoutes(app: import("@hono/zod-openapi").OpenAPIHono) {
  const users = serverRoutes.users;

  app.openapi(users.me, async (c) => {
    const userId = c.var.currentUser?.userId;
    if (!userId) {
      return c.json({
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      }, 401);
    }

    const eff = withLoggedCause(withUserDeps(getUserByIdUseCase(userId)), "GET /v1/users/me");
    const result = await Effect.runPromise(eff);

    if (result._tag === "Some") {
      return c.json<UsersContracts.MeResponse, 200>(
        { data: mapUserDetail(result.value) },
        200,
      );
    }

    return c.json<UsersContracts.UserErrorResponse, 404>({
      error: UsersContracts.userErrorMessages.USER_NOT_FOUND,
      details: { code: UsersContracts.UserErrorCodeSchema.enum.USER_NOT_FOUND },
    }, 404);
  });

  app.openapi(users.updateMe, async (c) => {
    const userId = c.var.currentUser?.userId;
    if (!userId) {
      return c.json({
        error: unauthorizedErrorMessages.UNAUTHORIZED,
        details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
      }, 401);
    }

    const body = c.req.valid("json");
    const eff = withLoggedCause(
      withUserDeps(updateProfileUseCase({
        userId,
        patch: pickDefined(body),
      })),
      "PATCH /v1/users/me",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));

    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) => {
        if (right._tag === "Some") {
          return c.json<UsersContracts.UpdateMeResponse, 200>(
            { data: mapUserDetail(right.value) },
            200,
          );
        }
        return c.json<UsersContracts.UserErrorResponse, 404>({
          error: UsersContracts.userErrorMessages.USER_NOT_FOUND,
          details: { code: UsersContracts.UserErrorCodeSchema.enum.USER_NOT_FOUND },
        }, 404);
      }),
      Match.tag("Left", ({ left }) => Match.value(left).pipe(
        Match.tag("DuplicateUserEmail", () => c.json<UsersContracts.UserErrorResponse, 409>({
          error: UsersContracts.userErrorMessages.DUPLICATE_EMAIL,
          details: { code: UsersContracts.UserErrorCodeSchema.enum.DUPLICATE_EMAIL },
        }, 409)),
        Match.tag("DuplicateUserPhoneNumber", () => c.json<UsersContracts.UserErrorResponse, 409>({
          error: UsersContracts.userErrorMessages.DUPLICATE_PHONE_NUMBER,
          details: { code: UsersContracts.UserErrorCodeSchema.enum.DUPLICATE_PHONE_NUMBER },
        }, 409)),
        Match.orElse(() => c.json<UsersContracts.UserErrorResponse, 404>({
          error: UsersContracts.userErrorMessages.USER_NOT_FOUND,
          details: { code: UsersContracts.UserErrorCodeSchema.enum.USER_NOT_FOUND },
        }, 404)),
      )),
      Match.exhaustive,
    );
  });

  app.openapi(users.adminList, async (c) => {
    const query = c.req.valid("query");
    const eff = withLoggedCause(
      withUserDeps(listAdminUsersUseCase({
        filter: {
          fullname: query.fullname,
          role: query.role,
          verify: query.verify,
        },
        page: {
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 50,
          sortBy: query.sortBy,
          sortDir: query.sortDir,
        },
      })),
      "GET /v1/users/manage-users/get-all",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));
    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        c.json<UsersContracts.AdminUserListResponse, 200>(
          {
            data: right.items.map(mapUserDetail),
            pagination: {
              page: right.page,
              pageSize: right.pageSize,
              total: right.total,
              totalPages: right.totalPages,
            },
          },
          200,
        )),
      Match.tag("Left", ({ left }) => {
        throw left;
      }),
      Match.exhaustive,
    );
  });

  app.openapi(users.adminSearch, async (c) => {
    const query = c.req.valid("query");
    const eff = withLoggedCause(
      withUserDeps(searchAdminUsersUseCase(query.q)),
      "GET /v1/users/manage-users/search",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));
    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        c.json<UsersContracts.AdminUserSearchResponse, 200>(
          { data: right.map(mapUserDetail) },
          200,
        )),
      Match.tag("Left", ({ left }) => {
        throw left;
      }),
      Match.exhaustive,
    );
  });

  app.openapi(users.adminDetail, async (c) => {
    const { userId } = c.req.valid("param");
    const eff = withLoggedCause(
      withUserDeps(getUserByIdUseCase(userId)),
      "GET /v1/users/manage-users/{userId}",
    );

    const result = await Effect.runPromise(eff);
    if (result._tag === "Some") {
      return c.json<UsersContracts.AdminUserDetailResponse, 200>(
        { data: mapUserDetail(result.value) },
        200,
      );
    }

    return c.json<UsersContracts.UserErrorResponse, 404>({
      error: UsersContracts.userErrorMessages.USER_NOT_FOUND,
      details: { code: UsersContracts.UserErrorCodeSchema.enum.USER_NOT_FOUND },
    }, 404);
  });

  app.openapi(users.adminUpdate, async (c) => {
    const { userId } = c.req.valid("param");
    const body = c.req.valid("json");
    const eff = withLoggedCause(
      withUserDeps(updateAdminUserUseCase({
        userId,
        patch: pickDefined(body),
      })),
      "PATCH /v1/users/manage-users/{userId}",
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
        return c.json<UsersContracts.UserErrorResponse, 404>({
          error: UsersContracts.userErrorMessages.USER_NOT_FOUND,
          details: { code: UsersContracts.UserErrorCodeSchema.enum.USER_NOT_FOUND },
        }, 404);
      }),
      Match.tag("Left", ({ left }) => Match.value(left).pipe(
        Match.tag("DuplicateUserEmail", () => c.json<UsersContracts.UserErrorResponse, 409>({
          error: UsersContracts.userErrorMessages.DUPLICATE_EMAIL,
          details: { code: UsersContracts.UserErrorCodeSchema.enum.DUPLICATE_EMAIL },
        }, 409)),
        Match.tag("DuplicateUserPhoneNumber", () => c.json<UsersContracts.UserErrorResponse, 409>({
          error: UsersContracts.userErrorMessages.DUPLICATE_PHONE_NUMBER,
          details: { code: UsersContracts.UserErrorCodeSchema.enum.DUPLICATE_PHONE_NUMBER },
        }, 409)),
        Match.orElse(() => c.json<UsersContracts.UserErrorResponse, 404>({
          error: UsersContracts.userErrorMessages.USER_NOT_FOUND,
          details: { code: UsersContracts.UserErrorCodeSchema.enum.USER_NOT_FOUND },
        }, 404)),
      )),
      Match.exhaustive,
    );
  });

  app.openapi(users.adminCreate, async (c) => {
    const body = c.req.valid("json");
    const eff = withLoggedCause(
      withUserDeps(adminCreateUserUseCase(body)),
      "POST /v1/users/manage-users/create",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));
    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        c.json<UsersContracts.AdminUserDetailResponse, 201>(
          { data: mapUserDetail(right) },
          201,
        )),
      Match.tag("Left", ({ left }) => Match.value(left).pipe(
        Match.tag("DuplicateUserEmail", () => c.json<UsersContracts.UserErrorResponse, 409>({
          error: UsersContracts.userErrorMessages.DUPLICATE_EMAIL,
          details: { code: UsersContracts.UserErrorCodeSchema.enum.DUPLICATE_EMAIL },
        }, 409)),
        Match.tag("DuplicateUserPhoneNumber", () => c.json<UsersContracts.UserErrorResponse, 409>({
          error: UsersContracts.userErrorMessages.DUPLICATE_PHONE_NUMBER,
          details: { code: UsersContracts.UserErrorCodeSchema.enum.DUPLICATE_PHONE_NUMBER },
        }, 409)),
        Match.orElse((err) => {
          throw err;
        }),
      )),
      Match.exhaustive,
    );
  });

  app.openapi(users.adminResetPassword, async (c) => {
    const { userId } = c.req.valid("param");
    const body = c.req.valid("json");
    const eff = withLoggedCause(
      withUserDeps(adminResetPasswordUseCase({
        userId,
        newPassword: body.newPassword,
      })),
      "POST /v1/users/manage-users/admin-reset-password/{userId}",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));
    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) => {
        if (right._tag === "Some") {
          return c.json<undefined, 200>(undefined, 200);
        }
        return c.json<UsersContracts.UserErrorResponse, 404>({
          error: UsersContracts.userErrorMessages.USER_NOT_FOUND,
          details: { code: UsersContracts.UserErrorCodeSchema.enum.USER_NOT_FOUND },
        }, 404);
      }),
      Match.tag("Left", ({ left }) => {
        throw left;
      }),
      Match.exhaustive,
    );
  });

  app.openapi(users.adminStats, async (c) => {
    const eff = withLoggedCause(
      withUserStatsDeps(Effect.gen(function* () {
        const service = yield* UserStatsServiceTag;
        return yield* service.getOverviewStats();
      })),
      "GET /v1/users/manage-users/stats",
    );

    const data = await Effect.runPromise(eff);
    return c.json<UsersContracts.AdminUserStatsResponse, 200>({ data }, 200);
  });

  app.openapi(users.adminActiveUsers, async (c) => {
    const query = c.req.valid("query");
    const startDate = new Date(query.startDate);
    const endDate = new Date(query.endDate);

    const eff = withLoggedCause(
      withUserStatsDeps(Effect.gen(function* () {
        const service = yield* UserStatsServiceTag;
        return yield* service.getActiveUsersSeries({
          groupBy: query.groupBy,
          startDate,
          endDate,
        });
      })),
      "GET /v1/users/manage-users/stats/active-users",
    );

    const result = await Effect.runPromise(eff.pipe(Effect.either));

    return Match.value(result).pipe(
      Match.tag("Right", ({ right }) =>
        c.json<UsersContracts.ActiveUsersSeriesResponse, 200>(
          { data: Array.from(right) },
          200,
        )),
      Match.tag("Left", ({ left }) =>
        Match.value(left).pipe(
          Match.tag("InvalidStatsRange", () =>
            c.json<ServerErrorResponse, 400>(
              {
                error: "Invalid date range",
                details: { code: "INVALID_DATE_RANGE" },
              },
              400,
            )),
          Match.tag("InvalidStatsGroupBy", () =>
            c.json<ServerErrorResponse, 400>(
              {
                error: "Invalid groupBy value",
                details: { code: "INVALID_GROUP_BY" },
              },
              400,
            )),
          Match.orElse(() => {
            throw left;
          }),
        )),
      Match.exhaustive,
    );
  });

  app.openapi(users.adminTopRenters, async (c) => {
    const query = c.req.valid("query");
    const eff = withLoggedCause(
      withUserStatsDeps(Effect.gen(function* () {
        const service = yield* UserStatsServiceTag;
        return yield* service.getTopRenters({
          page: query.page ?? 1,
          pageSize: query.pageSize ?? 50,
        });
      })),
      "GET /v1/users/manage-users/stats/top-renters",
    );

    const data = await Effect.runPromise(eff);
    return c.json<UsersContracts.TopRentersResponse, 200>(
      { data: data.items, pagination: {
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        totalPages: data.totalPages,
      } },
      200,
    );
  });

  app.openapi(users.adminNewUsers, async (c) => {
    const eff = withLoggedCause(
      withUserStatsDeps(Effect.gen(function* () {
        const service = yield* UserStatsServiceTag;
        return yield* service.getNewUsersStats(new Date());
      })),
      "GET /v1/users/manage-users/stats/new-users",
    );

    const data = await Effect.runPromise(eff);
    return c.json<UsersContracts.NewUsersStatsResponse, 200>({ data }, 200);
  });

  app.openapi(users.adminDashboardStats, async (c) => {
    const eff = withLoggedCause(
      withUserStatsDeps(Effect.gen(function* () {
        const service = yield* UserStatsServiceTag;
        return yield* service.getDashboardStats(new Date());
      })),
      "GET /v1/users/manage-users/dashboard-stats",
    );

    const data = await Effect.runPromise(eff);
    return c.json<UsersContracts.DashboardStatsResponse, 200>({ data }, 200);
  });
}

function mapUserDetail(row: import("@/domain/users").UserRow): UsersContracts.UserDetail {
  return {
    id: row.id,
    fullname: row.fullname,
    email: row.email,
    verify: row.verify,
    location: row.location,
    username: row.username,
    phoneNumber: row.phoneNumber,
    avatar: row.avatar,
    role: row.role,
    nfcCardUid: row.nfcCardUid,
    updatedAt: row.updatedAt.toISOString(),
  };
}
