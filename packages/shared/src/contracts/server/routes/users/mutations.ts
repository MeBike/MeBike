import { createRoute, z } from "@hono/zod-openapi";

import {
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../../schemas";
import {
  UserErrorCodeSchema,
  userErrorMessages,
} from "../../users/schemas";
import {
  AdminCreateUserRequestSchema,
  AdminResetPasswordRequestSchema,
  AdminUpdateUserRequestSchema,
  AdminUserDetailResponseSchema,
  UpdateMeRequestSchema,
  UpdateMeResponseSchema,
  UserErrorResponseSchema,
} from "./shared";

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
