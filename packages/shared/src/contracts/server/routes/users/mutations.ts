import { createRoute, z } from "@hono/zod-openapi";

import {
} from "../../schemas";
import {
  UserErrorCodeSchema,
  userErrorMessages,
} from "../../users/schemas";
import { forbiddenResponse, unauthorizedResponse } from "../helpers";
import {
  AdminCreateUserRequestSchema,
  AdminResetPasswordRequestSchema,
  AdminUpdateUserRequestSchema,
  AdminUserDetailResponseSchema,
  ChangePasswordRequestSchema,
  PushTokenSummarySchema,
  RegisterPushTokenRequestSchema,
  UnregisterPushTokenRequestSchema,
  UpdateMeRequestSchema,
  UpdateMeResponseSchema,
  UserErrorResponseSchema,
} from "./shared";

export const changePasswordRoute = createRoute({
  method: "put",
  path: "/v1/users/change-password",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: ChangePasswordRequestSchema,
        },
      },
    },
  },
  responses: {
    204: { description: "Password changed" },
    400: {
      description: "Current password is invalid",
      content: {
        "application/json": {
          schema: UserErrorResponseSchema,
          examples: {
            InvalidCurrentPassword: {
              value: {
                error: userErrorMessages.INVALID_CURRENT_PASSWORD,
                details: { code: UserErrorCodeSchema.enum.INVALID_CURRENT_PASSWORD },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
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
    401: unauthorizedResponse(),
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

export const registerPushTokenRoute = createRoute({
  method: "post",
  path: "/v1/users/me/push-tokens",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: RegisterPushTokenRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Push token registered",
      content: {
        "application/json": {
          schema: PushTokenSummarySchema,
        },
      },
    },
    400: {
      description: "Invalid push token",
      content: {
        "application/json": {
          schema: UserErrorResponseSchema,
          examples: {
            InvalidPushToken: {
              value: {
                error: userErrorMessages.INVALID_PUSH_TOKEN,
                details: { code: UserErrorCodeSchema.enum.INVALID_PUSH_TOKEN },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
  },
});

export const unregisterPushTokenRoute = createRoute({
  method: "delete",
  path: "/v1/users/me/push-tokens",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: UnregisterPushTokenRequestSchema,
        },
      },
    },
  },
  responses: {
    204: { description: "Push token unregistered" },
    400: {
      description: "Invalid push token",
      content: {
        "application/json": {
          schema: UserErrorResponseSchema,
          examples: {
            InvalidPushToken: {
              value: {
                error: userErrorMessages.INVALID_PUSH_TOKEN,
                details: { code: UserErrorCodeSchema.enum.INVALID_PUSH_TOKEN },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
  },
});

export const unregisterAllPushTokensRoute = createRoute({
  method: "delete",
  path: "/v1/users/me/push-tokens/all",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  responses: {
    204: { description: "All push tokens unregistered" },
    401: unauthorizedResponse(),
  },
});

export const adminUpdateUserRoute = createRoute({
  method: "patch",
  path: "/v1/users/manage-users/{userId}",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      userId: z.uuidv7().openapi({
        example: "019d1b13-eacb-76f4-adbc-bc02662d4fdf",
      }),
    }),
    body: {
      content: {
        "application/json": {
          schema: AdminUpdateUserRequestSchema,
          examples: {
            AssignStaffToStation: {
              value: {
                role: "STAFF",
                accountStatus: "ACTIVE",
                verify: "VERIFIED",
                orgAssignment: {
                  stationId: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2210",
                },
              },
            },
            AssignTechnicianTeam: {
              value: {
                role: "TECHNICIAN",
                orgAssignment: {
                  technicianTeamId: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2211",
                },
              },
            },
            UpdateBasicFields: {
              value: {
                fullname: "Nguyen Van B",
                email: "nguyen.van.b@example.com",
                phoneNumber: "0901123456",
                username: "nguyenvanb",
                avatar: "https://example.com/avatars/nguyen-van-b.jpg",
                location: "Binh Thanh, TP.HCM",
                accountStatus: "ACTIVE",
                verify: "VERIFIED",
              },
            },
            ClearOrgAssignment: {
              value: {
                role: "MANAGER",
                orgAssignment: null,
                nfcCardUid: null,
              },
            },
          },
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
    400: {
      description: "Invalid org assignment for role",
      content: {
        "application/json": {
          schema: UserErrorResponseSchema,
          examples: {
            InvalidOrgAssignment: {
              value: {
                error: userErrorMessages.INVALID_ORG_ASSIGNMENT,
                details: { code: UserErrorCodeSchema.enum.INVALID_ORG_ASSIGNMENT },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
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
          examples: {
            BasicUser: {
              value: {
                fullname: "Nguyen Van A",
                email: "nguyen.van.a@example.com",
                password: "password123",
                phoneNumber: "0987654321",
                username: "nguyenvana",
                avatar: "https://example.com/avatars/nguyen-van-a.jpg",
                location: "Thu Duc, TP.HCM",
                role: "USER",
                accountStatus: "ACTIVE",
                verify: "VERIFIED",
                orgAssignment: null,
                nfcCardUid: null,
              },
            },
            StaffWithStation: {
              value: {
                fullname: "Tran Staff",
                email: "tran.staff@example.com",
                password: "password123",
                phoneNumber: "0912345678",
                username: "transtaff",
                avatar: null,
                location: "Thu Duc, TP.HCM",
                role: "STAFF",
                accountStatus: "ACTIVE",
                verify: "VERIFIED",
                orgAssignment: {
                  stationId: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2210",
                },
                nfcCardUid: null,
              },
            },
            TechnicianWithTeam: {
              value: {
                fullname: "Tran Technician",
                email: "tran.technician@example.com",
                password: "password123",
                phoneNumber: "0912345678",
                username: "trantech",
                avatar: null,
                location: "Quan 9, TP.HCM",
                role: "TECHNICIAN",
                accountStatus: "ACTIVE",
                verify: "VERIFIED",
                orgAssignment: {
                  technicianTeamId: "019d1c26-9d34-7f97-ae3c-4c3f0c2d2211",
                },
                nfcCardUid: null,
              },
            },
            AdminOperator: {
              value: {
                fullname: "Le Admin",
                email: "le.admin@example.com",
                password: "password123",
                phoneNumber: "0934567890",
                username: "leadmin",
                avatar: null,
                location: "District 1, TP.HCM",
                role: "ADMIN",
                accountStatus: "ACTIVE",
                verify: "VERIFIED",
                orgAssignment: null,
                nfcCardUid: null,
              },
            },
          },
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
    400: {
      description: "Invalid org assignment for role",
      content: {
        "application/json": {
          schema: UserErrorResponseSchema,
          examples: {
            InvalidOrgAssignment: {
              value: {
                error: userErrorMessages.INVALID_ORG_ASSIGNMENT,
                details: { code: UserErrorCodeSchema.enum.INVALID_ORG_ASSIGNMENT },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
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
      userId: z.uuidv7(),
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
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
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
