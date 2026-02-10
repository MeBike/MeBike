import type { RouteHandler } from "@hono/zod-openapi";

import {
  serverRoutes,
  UsersContracts,
} from "@mebike/shared";
import { Effect, Match } from "effect";

import { withLoggedCause } from "@/domain/shared";
import { UserStatsServiceTag } from "@/domain/users";
import { routeContext } from "@/http/shared/route-context";

type UsersRoutes = typeof import("@mebike/shared")["serverRoutes"]["users"];
const users = serverRoutes.users;

const adminStats: RouteHandler<UsersRoutes["adminStats"]> = async (c) => {
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* UserStatsServiceTag;
      return yield* service.getOverviewStats();
    }),
    routeContext(users.adminStats),
  );

  const data = await c.var.runPromise(eff);
  return c.json<UsersContracts.AdminUserStatsResponse, 200>({ data }, 200);
};

const adminActiveUsers: RouteHandler<UsersRoutes["adminActiveUsers"]> = async (c) => {
  const query = c.req.valid("query");
  const startDate = new Date(query.startDate);
  const endDate = new Date(query.endDate);

  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* UserStatsServiceTag;
      return yield* service.getActiveUsersSeries({
        groupBy: query.groupBy,
        startDate,
        endDate,
      });
    }),
    routeContext(users.adminActiveUsers),
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<UsersContracts.ActiveUsersSeriesResponse, 200>({ data: Array.from(right) }, 200)),
    Match.tag("Left", ({ left }) =>
      Match.value(left).pipe(
        Match.tag("InvalidStatsRange", () =>
          c.json<UsersContracts.UserStatsErrorResponse, 400>(
            {
              error: UsersContracts.userStatsErrorMessages.INVALID_DATE_RANGE,
              details: {
                code: UsersContracts.UserStatsErrorCodeSchema.enum.INVALID_DATE_RANGE,
              },
            },
            400,
          )),
        Match.tag("InvalidStatsGroupBy", () =>
          c.json<UsersContracts.UserStatsErrorResponse, 400>(
            {
              error: UsersContracts.userStatsErrorMessages.INVALID_GROUP_BY,
              details: {
                code: UsersContracts.UserStatsErrorCodeSchema.enum.INVALID_GROUP_BY,
              },
            },
            400,
          )),
        Match.orElse(() => {
          throw left;
        }),
      )),
    Match.exhaustive,
  );
};

const adminTopRenters: RouteHandler<UsersRoutes["adminTopRenters"]> = async (c) => {
  const query = c.req.valid("query");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* UserStatsServiceTag;
      return yield* service.getTopRenters({
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 50,
      });
    }),
    routeContext(users.adminTopRenters),
  );

  const data = await c.var.runPromise(eff);
  return c.json<UsersContracts.TopRentersResponse, 200>(
    {
      data: data.items,
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

const adminNewUsers: RouteHandler<UsersRoutes["adminNewUsers"]> = async (c) => {
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* UserStatsServiceTag;
      return yield* service.getNewUsersStats(new Date());
    }),
    routeContext(users.adminNewUsers),
  );

  const data = await c.var.runPromise(eff);
  return c.json<UsersContracts.NewUsersStatsResponse, 200>({ data }, 200);
};

const adminDashboardStats: RouteHandler<UsersRoutes["adminDashboardStats"]> = async (c) => {
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* UserStatsServiceTag;
      return yield* service.getDashboardStats(new Date());
    }),
    routeContext(users.adminDashboardStats),
  );

  const data = await c.var.runPromise(eff);
  return c.json<UsersContracts.DashboardStatsResponse, 200>({ data }, 200);
};

export const AdminUserStatsController = {
  adminStats,
  adminActiveUsers,
  adminTopRenters,
  adminNewUsers,
  adminDashboardStats,
} as const;
