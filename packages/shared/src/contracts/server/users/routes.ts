import { createRoute, z } from "@hono/zod-openapi";

import {
  OptionalTrimmedNullableStringSchema,
  paginationQueryFields,
  PaginationSchema,
  ServerErrorResponseSchema,
  SortDirectionSchema,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../schemas";
import {
  ActiveUsersSeriesRowSchema,
  DashboardStatsSchema,
  NewUsersStatsSchema,
  TopRenterRowSchema,
  UserDetailSchema,
  UserErrorCodeSchema,
  userErrorMessages,
  UserRoleSchema,
  UserStatsOverviewSchema,
  VerifyStatusSchema,
} from "./schemas";

const UserErrorResponseSchema = z.object({
  error: z.string(),
  details: z.object({
    code: UserErrorCodeSchema,
  }),
}).openapi("UserErrorResponse");

export const MeResponseSchema = z.object({
  data: UserDetailSchema,
}).openapi("MeResponse");

export const UpdateMeRequestSchema = z.object({
  fullname: z.string().min(1).optional(),
  phoneNumber: OptionalTrimmedNullableStringSchema,
  username: z.string().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  location: z.string().optional().nullable(),
}).openapi("UpdateMeRequest");

export const UpdateMeResponseSchema = MeResponseSchema;

const AdminUserListResponseSchema = z.object({
  data: z.array(UserDetailSchema),
  pagination: PaginationSchema,
}).openapi("AdminUserListResponse");

const AdminUserSearchResponseSchema = z.object({
  data: z.array(UserDetailSchema),
}).openapi("AdminUserSearchResponse");

const AdminUserDetailResponseSchema = z.object({
  data: UserDetailSchema,
}).openapi("AdminUserDetailResponse");

const AdminCreateUserRequestSchema = z.object({
  fullname: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phoneNumber: OptionalTrimmedNullableStringSchema,
  username: z.string().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  location: z.string().optional().nullable(),
  role: UserRoleSchema.optional(),
  verify: VerifyStatusSchema.optional(),
  nfcCardUid: z.string().optional().nullable(),
}).openapi("AdminCreateUserRequest");

const AdminUpdateUserRequestSchema = z.object({
  fullname: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phoneNumber: OptionalTrimmedNullableStringSchema,
  username: z.string().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  location: z.string().optional().nullable(),
  role: UserRoleSchema.optional(),
  verify: VerifyStatusSchema.optional(),
  nfcCardUid: z.string().optional().nullable(),
}).openapi("AdminUpdateUserRequest");

const AdminResetPasswordRequestSchema = z.object({
  newPassword: z.string().min(8),
  confirmNewPassword: z.string().min(8),
}).openapi("AdminResetPasswordRequest");

const AdminUserStatsResponseSchema = z.object({
  data: UserStatsOverviewSchema,
}).openapi("AdminUserStatsResponse");

const ActiveUsersSeriesResponseSchema = z.object({
  data: z.array(ActiveUsersSeriesRowSchema),
}).openapi("ActiveUsersSeriesResponse");

const TopRentersResponseSchema = z.object({
  data: z.array(TopRenterRowSchema),
  pagination: PaginationSchema,
}).openapi("TopRentersResponse");

const NewUsersStatsResponseSchema = z.object({
  data: NewUsersStatsSchema,
}).openapi("NewUsersStatsResponse");

const DashboardStatsResponseSchema = z.object({
  data: DashboardStatsSchema,
}).openapi("DashboardStatsResponse");

const ActiveUsersQuerySchema = z.object({
  groupBy: z.enum(["day", "month"]),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

const StatsPaginationQuerySchema = z.object({
  ...paginationQueryFields,
});

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

export const updateMeRoute = createRoute({
  method: "patch",
  path: "/v1/users/me",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UpdateMeRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated profile",
      content: {
        "application/json": {
          schema: UpdateMeResponseSchema,
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
    409: {
      description: "Duplicate email or phone number",
      content: {
        "application/json": {
          schema: UserErrorResponseSchema,
          examples: {
            DuplicateEmail: {
              value: {
                error: userErrorMessages.DUPLICATE_EMAIL,
                details: { code: UserErrorCodeSchema.enum.DUPLICATE_EMAIL },
              },
            },
            DuplicatePhone: {
              value: {
                error: userErrorMessages.DUPLICATE_PHONE_NUMBER,
                details: { code: UserErrorCodeSchema.enum.DUPLICATE_PHONE_NUMBER },
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
      ...paginationQueryFields,
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

export const adminUpdateUserRoute = createRoute({
  method: "patch",
  path: "/v1/users/manage-users/{userId}",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      userId: z.string().min(1),
    }),
    body: {
      content: {
        "application/json": {
          schema: AdminUpdateUserRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User updated",
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
    409: {
      description: "Duplicate email or phone number",
      content: {
        "application/json": {
          schema: UserErrorResponseSchema,
          examples: {
            DuplicateEmail: {
              value: {
                error: userErrorMessages.DUPLICATE_EMAIL,
                details: { code: UserErrorCodeSchema.enum.DUPLICATE_EMAIL },
              },
            },
            DuplicatePhone: {
              value: {
                error: userErrorMessages.DUPLICATE_PHONE_NUMBER,
                details: { code: UserErrorCodeSchema.enum.DUPLICATE_PHONE_NUMBER },
              },
            },
          },
        },
      },
    },
  },
});

export const adminCreateUserRoute = createRoute({
  method: "post",
  path: "/v1/users/manage-users/create",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: AdminCreateUserRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "User created",
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
    409: {
      description: "Duplicate email or phone number",
      content: {
        "application/json": {
          schema: UserErrorResponseSchema,
          examples: {
            DuplicateEmail: {
              value: {
                error: userErrorMessages.DUPLICATE_EMAIL,
                details: { code: UserErrorCodeSchema.enum.DUPLICATE_EMAIL },
              },
            },
            DuplicatePhone: {
              value: {
                error: userErrorMessages.DUPLICATE_PHONE_NUMBER,
                details: { code: UserErrorCodeSchema.enum.DUPLICATE_PHONE_NUMBER },
              },
            },
          },
        },
      },
    },
  },
});

export const adminResetPasswordRoute = createRoute({
  method: "post",
  path: "/v1/users/manage-users/admin-reset-password/{userId}",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      userId: z.string().min(1),
    }),
    body: {
      content: {
        "application/json": {
          schema: AdminResetPasswordRequestSchema,
        },
      },
    },
  },
  responses: {
    200: { description: "Password reset" },
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
          schema: ServerErrorResponseSchema,
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

export const usersRoutes = {
  me: meRoute,
  updateMe: updateMeRoute,
  adminList: adminListUsersRoute,
  adminSearch: adminSearchUsersRoute,
  adminDetail: adminUserDetailRoute,
  adminUpdate: adminUpdateUserRoute,
  adminCreate: adminCreateUserRoute,
  adminResetPassword: adminResetPasswordRoute,
  adminStats: adminStatsRoute,
  adminActiveUsers: adminActiveUsersRoute,
  adminTopRenters: adminTopRentersRoute,
  adminNewUsers: adminNewUsersRoute,
  adminDashboardStats: adminDashboardStatsRoute,
} as const;

export type MeResponse = z.infer<typeof MeResponseSchema>;
export type UpdateMeResponse = z.infer<typeof UpdateMeResponseSchema>;
export type AdminUserListResponse = z.infer<typeof AdminUserListResponseSchema>;
export type AdminUserSearchResponse = z.infer<typeof AdminUserSearchResponseSchema>;
export type AdminUserDetailResponse = z.infer<typeof AdminUserDetailResponseSchema>;
export type AdminCreateUserRequest = z.infer<typeof AdminCreateUserRequestSchema>;
export type AdminUpdateUserRequest = z.infer<typeof AdminUpdateUserRequestSchema>;
export type AdminResetPasswordRequest = z.infer<typeof AdminResetPasswordRequestSchema>;
export type AdminUserStatsResponse = z.infer<typeof AdminUserStatsResponseSchema>;
export type ActiveUsersSeriesResponse = z.infer<typeof ActiveUsersSeriesResponseSchema>;
export type TopRentersResponse = z.infer<typeof TopRentersResponseSchema>;
export type NewUsersStatsResponse = z.infer<typeof NewUsersStatsResponseSchema>;
export type DashboardStatsResponse = z.infer<typeof DashboardStatsResponseSchema>;
export type UserErrorResponse = {
  error: string;
  details: {
    code: z.infer<typeof UserErrorCodeSchema>;
  };
};
