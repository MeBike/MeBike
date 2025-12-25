import { createRoute, z } from "@hono/zod-openapi";

import {
  SortDirectionSchema,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../../schemas";
import {
  UserErrorCodeSchema,
  userErrorMessages,
  UserRoleSchema,
  UserStatsErrorCodeSchema,
  userStatsErrorMessages,
  UserStatsErrorResponseSchema,
  VerifyStatusSchema,
} from "../../users/schemas";
import {
  ActiveUsersQuerySchema,
  ActiveUsersSeriesResponseSchema,
  AdminUserDetailResponseSchema,
  AdminUserListResponseSchema,
  AdminUserSearchResponseSchema,
  AdminUserStatsResponseSchema,
  DashboardStatsResponseSchema,
  MeResponseSchema,
  NewUsersStatsResponseSchema,
  StatsPaginationQuerySchema,
  TopRentersResponseSchema,
  UserErrorResponseSchema,
} from "./shared";

export const meRoute = createRoute({
  method: "get",
  path: "/v1/users/me",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Current user profile",
      content: {
        "application/json": {
          schema: MeResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Unauthorized: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
    404: {
      description: "User not found",
      content: {
        "application/json": {
          schema: UserErrorResponseSchema,
          examples: {
            NotFound: {
              value: {
                error: userErrorMessages.USER_NOT_FOUND,
                details: { code: UserErrorCodeSchema.enum.USER_NOT_FOUND },
              },
            },
          },
        },
      },
    },
  },
});

export const adminListUsersRoute = createRoute({
  method: "get",
  path: "/v1/users/manage-users/get-all",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      ...StatsPaginationQuerySchema.shape,
      fullname: z.string().optional(),
      role: UserRoleSchema.optional(),
      verify: VerifyStatusSchema.optional(),
      sortBy: z.enum(["fullname", "email", "role", "verify", "updatedAt"]).optional(),
      sortDir: SortDirectionSchema.optional(),
    }),
  },
  responses: {
    200: {
      description: "Admin list of users",
      content: {
        "application/json": {
          schema: AdminUserListResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Unauthorized: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Forbidden: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
  },
});

export const adminSearchUsersRoute = createRoute({
  method: "get",
  path: "/v1/users/manage-users/search",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      q: z.string().min(1),
    }),
  },
  responses: {
    200: {
      description: "Search users by email or phone",
      content: {
        "application/json": {
          schema: AdminUserSearchResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Unauthorized: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Forbidden: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
  },
});

export const adminUserDetailRoute = createRoute({
  method: "get",
  path: "/v1/users/manage-users/{userId}",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      userId: z.string().min(1),
    }),
  },
  responses: {
    200: {
      description: "User detail",
      content: {
        "application/json": {
          schema: AdminUserDetailResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Unauthorized: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Forbidden: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
    404: {
      description: "User not found",
      content: {
        "application/json": {
          schema: UserErrorResponseSchema,
          examples: {
            NotFound: {
              value: {
                error: userErrorMessages.USER_NOT_FOUND,
                details: { code: UserErrorCodeSchema.enum.USER_NOT_FOUND },
              },
            },
          },
        },
      },
    },
  },
});

export const adminStatsRoute = createRoute({
  method: "get",
  path: "/v1/users/manage-users/stats",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "User stats overview",
      content: {
        "application/json": {
          schema: AdminUserStatsResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Unauthorized: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Forbidden: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
  },
});

export const adminActiveUsersRoute = createRoute({
  method: "get",
  path: "/v1/users/manage-users/stats/active-users",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    query: ActiveUsersQuerySchema,
  },
  responses: {
    200: {
      description: "Active users series",
      content: {
        "application/json": {
          schema: ActiveUsersSeriesResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid query",
      content: {
        "application/json": {
          schema: UserStatsErrorResponseSchema,
          examples: {
            InvalidDateRange: {
              value: {
                error: userStatsErrorMessages.INVALID_DATE_RANGE,
                details: { code: UserStatsErrorCodeSchema.enum.INVALID_DATE_RANGE },
              },
            },
            InvalidGroupBy: {
              value: {
                error: userStatsErrorMessages.INVALID_GROUP_BY,
                details: { code: UserStatsErrorCodeSchema.enum.INVALID_GROUP_BY },
              },
            },
          },
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Unauthorized: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Forbidden: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
  },
});

export const adminTopRentersRoute = createRoute({
  method: "get",
  path: "/v1/users/manage-users/stats/top-renters",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    query: StatsPaginationQuerySchema,
  },
  responses: {
    200: {
      description: "Top renters stats",
      content: {
        "application/json": {
          schema: TopRentersResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Unauthorized: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Forbidden: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
  },
});

export const adminNewUsersRoute = createRoute({
  method: "get",
  path: "/v1/users/manage-users/stats/new-users",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "New users stats",
      content: {
        "application/json": {
          schema: NewUsersStatsResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Unauthorized: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Forbidden: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
  },
});

export const adminDashboardStatsRoute = createRoute({
  method: "get",
  path: "/v1/users/manage-users/dashboard-stats",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "User dashboard stats",
      content: {
        "application/json": {
          schema: DashboardStatsResponseSchema,
        },
      },
    },
    401: {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Unauthorized: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
    403: {
      description: "Forbidden",
      content: {
        "application/json": {
          schema: UnauthorizedErrorResponseSchema,
          examples: {
            Forbidden: {
              value: {
                error: unauthorizedErrorMessages.UNAUTHORIZED,
                details: { code: UnauthorizedErrorCodeSchema.enum.UNAUTHORIZED },
              },
            },
          },
        },
      },
    },
  },
});
