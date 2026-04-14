import { createRoute } from "@hono/zod-openapi";

import {
  CreateEnvironmentPolicyBodySchema,
  EnvironmentPolicySchema,
  ServerErrorResponseSchema,
  UnauthorizedErrorResponseSchema,
} from "./shared";

export const createEnvironmentPolicy = createRoute({
  method: "post",
  path: "/environment/policies",
  tags: ["Environment"],
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": { schema: CreateEnvironmentPolicyBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: "Environment policy created as an inactive draft",
      content: {
        "application/json": { schema: EnvironmentPolicySchema },
      },
    },
    400: {
      description: "Invalid request payload",
      content: {
        "application/json": { schema: ServerErrorResponseSchema },
      },
    },
    401: {
      description: "Authentication is required",
      content: {
        "application/json": { schema: UnauthorizedErrorResponseSchema },
      },
    },
    403: {
      description: "Admin role is required",
      content: {
        "application/json": { schema: UnauthorizedErrorResponseSchema },
      },
    },
  },
});

export const environmentMutations = {
  createEnvironmentPolicy,
} as const;
