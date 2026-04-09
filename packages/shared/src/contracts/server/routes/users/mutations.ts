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
  UploadAvatarRequestSchema,
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
      description: "Duplicate email, phone number, or technician team capacity conflict",
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
            TechnicianTeamFull: {
              value: {
                error: userErrorMessages.TECHNICIAN_TEAM_MEMBER_LIMIT_EXCEEDED,
                details: {
                  code: UserErrorCodeSchema.enum.TECHNICIAN_TEAM_MEMBER_LIMIT_EXCEEDED,
                },
              },
            },
          },
        },
      },
    },
  },
});

export const uploadMyAvatarRoute = createRoute({
  method: "put",
  path: "/v1/users/me/avatar",
  tags: ["Users"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: UploadAvatarRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Updated avatar",
      content: {
        "application/json": {
          schema: UpdateMeResponseSchema,
        },
      },
    },
    400: {
      description: "Invalid avatar image",
      content: {
        "application/json": {
          schema: UserErrorResponseSchema,
          examples: {
            AvatarTooLarge: {
              value: {
                error: userErrorMessages.AVATAR_IMAGE_TOO_LARGE,
                details: { code: UserErrorCodeSchema.enum.AVATAR_IMAGE_TOO_LARGE },
              },
            },
            InvalidAvatar: {
              value: {
                error: userErrorMessages.INVALID_AVATAR_IMAGE,
                details: { code: UserErrorCodeSchema.enum.INVALID_AVATAR_IMAGE },
              },
            },
            AvatarDimensionsTooLarge: {
              value: {
                error: userErrorMessages.AVATAR_IMAGE_DIMENSIONS_TOO_LARGE,
                details: {
                  code: UserErrorCodeSchema.enum.AVATAR_IMAGE_DIMENSIONS_TOO_LARGE,
                },
              },
            },
          },
        },
      },
    },
    413: {
      description: "Avatar image exceeds request size limit",
      content: {
        "application/json": {
          schema: UserErrorResponseSchema,
          examples: {
            AvatarTooLarge: {
              value: {
                error: userErrorMessages.AVATAR_IMAGE_TOO_LARGE,
                details: { code: UserErrorCodeSchema.enum.AVATAR_IMAGE_TOO_LARGE },
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
    503: {
      description: "Avatar upload storage is unavailable",
      content: {
        "application/json": {
          schema: UserErrorResponseSchema,
          examples: {
            AvatarUploadUnavailable: {
              value: {
                error: userErrorMessages.AVATAR_UPLOAD_UNAVAILABLE,
                details: { code: UserErrorCodeSchema.enum.AVATAR_UPLOAD_UNAVAILABLE },
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
            AssignManagerToStation: {
              value: {
                role: "MANAGER",
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
      description: "Duplicate email, phone number, station role conflict, or technician team capacity conflict",
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
            TechnicianTeamFull: {
              value: {
                error: userErrorMessages.TECHNICIAN_TEAM_MEMBER_LIMIT_EXCEEDED,
                details: {
                  code: UserErrorCodeSchema.enum.TECHNICIAN_TEAM_MEMBER_LIMIT_EXCEEDED,
                },
              },
            },
            StationStaffRoleAssigned: {
              value: {
                error: userErrorMessages.STATION_STAFF_ASSIGNMENT_LIMIT_EXCEEDED,
                details: {
                  code: UserErrorCodeSchema.enum.STATION_STAFF_ASSIGNMENT_LIMIT_EXCEEDED,
                },
              },
            },
            StationManagerRoleAssigned: {
              value: {
                error: userErrorMessages.STATION_MANAGER_ASSIGNMENT_LIMIT_EXCEEDED,
                details: {
                  code: UserErrorCodeSchema.enum.STATION_MANAGER_ASSIGNMENT_LIMIT_EXCEEDED,
                },
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
            ManagerWithStation: {
              value: {
                fullname: "Tran Manager",
                email: "tran.manager@example.com",
                password: "password123",
                phoneNumber: "0912345678",
                username: "tranmanager",
                avatar: null,
                location: "Thu Duc, TP.HCM",
                role: "MANAGER",
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
            DirectAgencyProvision: {
              value: {
                role: "AGENCY",
                requesterEmail: "ops.metro.thuduc@example.com",
                requesterPhone: "0912345678",
                agencyName: "Metro Agency Thu Duc",
                agencyAddress: "Tret toa nha Metro Thu Duc",
                agencyContactPhone: "0987654321",
                stationName: "Ga Metro Thu Duc",
                stationAddress: "01 Xa Lo Ha Noi, Thu Duc, TP.HCM",
                stationLatitude: 10.8486,
                stationLongitude: 106.7717,
                stationTotalCapacity: 20,
                stationPickupSlotLimit: 12,
                stationReturnSlotLimit: 18,
                description: "Admin tao truc tiep doi tac agency moi.",
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
      description: "Invalid org assignment, invalid agency station provisioning data, or unsupported station coordinates",
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
            StationNameAlreadyExists: {
              value: {
                error: userErrorMessages.STATION_NAME_ALREADY_EXISTS,
                details: { code: UserErrorCodeSchema.enum.STATION_NAME_ALREADY_EXISTS },
              },
            },
            CapacityLimitExceeded: {
              value: {
                error: userErrorMessages.CAPACITY_LIMIT_EXCEEDED,
                details: { code: UserErrorCodeSchema.enum.CAPACITY_LIMIT_EXCEEDED },
              },
            },
            CapacitySplitInvalid: {
              value: {
                error: userErrorMessages.CAPACITY_SPLIT_INVALID,
                details: { code: UserErrorCodeSchema.enum.CAPACITY_SPLIT_INVALID },
              },
            },
            OutsideSupportedArea: {
              value: {
                error: userErrorMessages.OUTSIDE_SUPPORTED_AREA,
                details: { code: UserErrorCodeSchema.enum.OUTSIDE_SUPPORTED_AREA },
              },
            },
          },
        },
      },
    },
    401: unauthorizedResponse(),
    403: forbiddenResponse("Admin"),
    409: {
      description: "Duplicate email, phone number, station role conflict, or technician team capacity conflict",
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
            StationStaffRoleAssigned: {
              value: {
                error: userErrorMessages.STATION_STAFF_ASSIGNMENT_LIMIT_EXCEEDED,
                details: {
                  code: UserErrorCodeSchema.enum.STATION_STAFF_ASSIGNMENT_LIMIT_EXCEEDED,
                },
              },
            },
            StationManagerRoleAssigned: {
              value: {
                error: userErrorMessages.STATION_MANAGER_ASSIGNMENT_LIMIT_EXCEEDED,
                details: {
                  code: UserErrorCodeSchema.enum.STATION_MANAGER_ASSIGNMENT_LIMIT_EXCEEDED,
                },
              },
            },
            TechnicianTeamFull: {
              value: {
                error: userErrorMessages.TECHNICIAN_TEAM_MEMBER_LIMIT_EXCEEDED,
                details: {
                  code: UserErrorCodeSchema.enum.TECHNICIAN_TEAM_MEMBER_LIMIT_EXCEEDED,
                },
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
