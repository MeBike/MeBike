import type { RouteHandler } from "@hono/zod-openapi";

import {
  serverRoutes,
  UsersContracts,
} from "@mebike/shared";
import { Effect, Match } from "effect";

import { adminCreateAgencyAccountUseCase } from "@/domain/agency-account-provisioning";
import { hashPassword } from "@/domain/auth/services/auth.service";
import { withLoggedCause } from "@/domain/shared";
import {
  adminCreateUserUseCase,
  UserCommandServiceTag,
  UserQueryServiceTag,
} from "@/domain/users";
import { routeContext } from "@/http/shared/route-context";

import {
  mapUserDetail,
  mapUserSummary,
  pickDefined,
} from "../shared";

type UsersRoutes = typeof import("@mebike/shared")["serverRoutes"]["users"];
const users = serverRoutes.users;

const adminList: RouteHandler<UsersRoutes["adminList"]> = async (c) => {
  const query = c.req.valid("query");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* UserQueryServiceTag;
      return yield* service.listWithOffset({
        fullname: query.fullName,
        accountStatus: query.accountStatus,
        role: query.role,
        roles: query.roles,
        verify: query.verify,
        agencyId: query.agencyId,
        stationId: query.stationId,
        technicianTeamId: query.technicianTeamId,
      }, {
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 50,
        sortBy: query.sortBy,
        sortDir: query.sortDir,
      });
    }),
    routeContext(users.adminList),
  );

  const data = await c.var.runPromise(eff);
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
    Effect.gen(function* () {
      const service = yield* UserQueryServiceTag;
      return yield* service.searchByQuery(query.q);
    }),
    routeContext(users.adminSearch),
  );

  const data = await c.var.runPromise(eff);
  return c.json<UsersContracts.AdminUserSearchResponse, 200>({ data: data.map(mapUserDetail) }, 200);
};

const adminTechnicians: RouteHandler<UsersRoutes["adminTechnicians"]> = async (c) => {
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* UserQueryServiceTag;
      return yield* service.listTechnicianSummaries();
    }),
    routeContext(users.adminTechnicians),
  );

  const data = await c.var.runPromise(eff);
  return c.json<UsersContracts.AdminTechnicianListResponse, 200>({ data: data.map(mapUserSummary) }, 200);
};

const adminDetail: RouteHandler<UsersRoutes["adminDetail"]> = async (c) => {
  const { userId } = c.req.valid("param");
  const eff = withLoggedCause(
    Effect.gen(function* () {
      const service = yield* UserQueryServiceTag;
      return yield* service.getById(userId);
    }),
    routeContext(users.adminDetail),
  );

  const result = await c.var.runPromise(eff);
  if (result._tag === "Some") {
    return c.json<UsersContracts.AdminUserDetailResponse, 200>(mapUserDetail(result.value), 200);
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
    Effect.gen(function* () {
      const service = yield* UserCommandServiceTag;
      return yield* service.updateAdminById(userId, pickDefined(body));
    }),
    routeContext(users.adminUpdate),
  );

  const result = await c.var.runPromise(eff.pipe(Effect.either));
  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) => {
      if (right._tag === "Some") {
        return c.json<UsersContracts.AdminUserDetailResponse, 200>(
          mapUserDetail(right.value),
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
        Match.tag("InvalidOrgAssignment", () =>
          c.json<UsersContracts.UserErrorResponse, 400>(
            {
              error: UsersContracts.userErrorMessages.INVALID_ORG_ASSIGNMENT,
              details: {
                code: UsersContracts.UserErrorCodeSchema.enum.INVALID_ORG_ASSIGNMENT,
              },
            },
            400,
          )),
        Match.tag("TechnicianTeamMemberLimitExceeded", () =>
          c.json<UsersContracts.UserErrorResponse, 409>(
            {
              error: UsersContracts.userErrorMessages.TECHNICIAN_TEAM_MEMBER_LIMIT_EXCEEDED,
              details: {
                code: UsersContracts.UserErrorCodeSchema.enum.TECHNICIAN_TEAM_MEMBER_LIMIT_EXCEEDED,
              },
            },
            409,
          )),
        Match.tag("StationRoleAssignmentLimitExceeded", err =>
          c.json<UsersContracts.UserErrorResponse, 409>(
            {
              error: err.role === "STAFF"
                ? UsersContracts.userErrorMessages.STATION_STAFF_ASSIGNMENT_LIMIT_EXCEEDED
                : UsersContracts.userErrorMessages.STATION_MANAGER_ASSIGNMENT_LIMIT_EXCEEDED,
              details: {
                code: err.role === "STAFF"
                  ? UsersContracts.UserErrorCodeSchema.enum.STATION_STAFF_ASSIGNMENT_LIMIT_EXCEEDED
                  : UsersContracts.UserErrorCodeSchema.enum.STATION_MANAGER_ASSIGNMENT_LIMIT_EXCEEDED,
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

const adminCreate: RouteHandler<UsersRoutes["adminCreate"]> = async (c) => {
  const body = c.req.valid("json");
  const result = body.role === "AGENCY"
    ? await c.var.runPromise(
        withLoggedCause(
          adminCreateAgencyAccountUseCase({
            requesterEmail: body.requesterEmail,
            requesterPhone: body.requesterPhone ?? null,
            agencyName: body.agencyName,
            agencyAddress: body.agencyAddress ?? null,
            agencyContactPhone: body.agencyContactPhone ?? null,
            stationName: body.stationName,
            stationAddress: body.stationAddress,
            stationLatitude: body.stationLatitude,
            stationLongitude: body.stationLongitude,
            stationTotalCapacity: body.stationTotalCapacity,
            stationReturnSlotLimit: body.stationReturnSlotLimit ?? null,
            description: body.description ?? null,
            reviewedByUserId: c.var.currentUser!.userId,
          }),
          routeContext(users.adminCreate),
        ).pipe(Effect.either),
      )
    : await c.var.runPromise(
        withLoggedCause(
          adminCreateUserUseCase(body),
          routeContext(users.adminCreate),
        ).pipe(Effect.either),
      );

  return Match.value(result).pipe(
    Match.tag("Right", ({ right }) =>
      c.json<UsersContracts.AdminUserDetailResponse, 201>(mapUserDetail(right), 201)),
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
        Match.tag("InvalidOrgAssignment", () =>
          c.json<UsersContracts.UserErrorResponse, 400>(
            {
              error: UsersContracts.userErrorMessages.INVALID_ORG_ASSIGNMENT,
              details: {
                code: UsersContracts.UserErrorCodeSchema.enum.INVALID_ORG_ASSIGNMENT,
              },
            },
            400,
          )),
        Match.tag("StationNameAlreadyExists", () =>
          c.json<UsersContracts.UserErrorResponse, 400>(
            {
              error: UsersContracts.userErrorMessages.STATION_NAME_ALREADY_EXISTS,
              details: {
                code: UsersContracts.UserErrorCodeSchema.enum.STATION_NAME_ALREADY_EXISTS,
              },
            },
            400,
          )),
        Match.tag("StationCapacityLimitExceeded", () =>
          c.json<UsersContracts.UserErrorResponse, 400>(
            {
              error: UsersContracts.userErrorMessages.CAPACITY_LIMIT_EXCEEDED,
              details: {
                code: UsersContracts.UserErrorCodeSchema.enum.CAPACITY_LIMIT_EXCEEDED,
              },
            },
            400,
          )),
        Match.tag("StationCapacitySplitInvalid", () =>
          c.json<UsersContracts.UserErrorResponse, 400>(
            {
              error: UsersContracts.userErrorMessages.CAPACITY_SPLIT_INVALID,
              details: {
                code: UsersContracts.UserErrorCodeSchema.enum.CAPACITY_SPLIT_INVALID,
              },
            },
            400,
          )),
        Match.tag("StationOutsideSupportedArea", () =>
          c.json<UsersContracts.UserErrorResponse, 400>(
            {
              error: UsersContracts.userErrorMessages.OUTSIDE_SUPPORTED_AREA,
              details: {
                code: UsersContracts.UserErrorCodeSchema.enum.OUTSIDE_SUPPORTED_AREA,
              },
            },
            400,
          )),
        Match.tag("TechnicianTeamMemberLimitExceeded", () =>
          c.json<UsersContracts.UserErrorResponse, 409>(
            {
              error: UsersContracts.userErrorMessages.TECHNICIAN_TEAM_MEMBER_LIMIT_EXCEEDED,
              details: {
                code: UsersContracts.UserErrorCodeSchema.enum.TECHNICIAN_TEAM_MEMBER_LIMIT_EXCEEDED,
              },
            },
            409,
          )),
        Match.tag("StationRoleAssignmentLimitExceeded", err =>
          c.json<UsersContracts.UserErrorResponse, 409>(
            {
              error: err.role === "STAFF"
                ? UsersContracts.userErrorMessages.STATION_STAFF_ASSIGNMENT_LIMIT_EXCEEDED
                : UsersContracts.userErrorMessages.STATION_MANAGER_ASSIGNMENT_LIMIT_EXCEEDED,
              details: {
                code: err.role === "STAFF"
                  ? UsersContracts.UserErrorCodeSchema.enum.STATION_STAFF_ASSIGNMENT_LIMIT_EXCEEDED
                  : UsersContracts.UserErrorCodeSchema.enum.STATION_MANAGER_ASSIGNMENT_LIMIT_EXCEEDED,
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
    Effect.gen(function* () {
      const service = yield* UserCommandServiceTag;
      const passwordHash = yield* hashPassword(body.newPassword);
      return yield* service.updatePassword(userId, passwordHash);
    }),
    routeContext(users.adminResetPassword),
  );

  const result = await c.var.runPromise(eff);
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
  adminTechnicians,
  adminDetail,
  adminUpdate,
  adminCreate,
  adminResetPassword,
} as const;
