import { createRoute, z } from "@hono/zod-openapi";

import {
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../schemas";
import { UserDetailSchema, UserErrorCodeSchema, userErrorMessages } from "./schemas";

export const MeResponseSchema = z.object({
  data: UserDetailSchema,
}).openapi("MeResponse");

export const UpdateMeRequestSchema = z.object({
  fullname: z.string().min(1).optional(),
  phoneNumber: z.string().optional().nullable(),
  username: z.string().optional().nullable(),
  avatar: z.string().url().optional().nullable(),
  location: z.string().optional().nullable(),
}).openapi("UpdateMeRequest");

export const UpdateMeResponseSchema = MeResponseSchema;

export const meRoute = createRoute({
  method: "get",
  path: "/v1/users/me",
  tags: ["Users"],
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
          schema: z.object({
            error: z.string(),
            details: z.object({
              code: UserErrorCodeSchema,
            }),
          }),
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
          schema: z.object({
            error: z.string(),
            details: z.object({
              code: UserErrorCodeSchema,
            }),
          }),
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
          schema: z.object({
            error: z.string(),
            details: z.object({
              code: UserErrorCodeSchema,
            }),
          }),
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

export const usersRoutes = {
  me: meRoute,
  updateMe: updateMeRoute,
} as const;

export type MeResponse = z.infer<typeof MeResponseSchema>;
export type UpdateMeResponse = z.infer<typeof UpdateMeResponseSchema>;
export type UserErrorResponse = {
  error: string;
  details: {
    code: z.infer<typeof UserErrorCodeSchema>;
  };
};
