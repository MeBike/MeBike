import { z } from "../../../zod";

import {
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../schemas";

type JsonContent<TSchema extends z.ZodTypeAny> = {
  "application/json": {
    schema: TSchema;
    examples?: Record<string, { value: unknown }>;
  };
};

export function jsonBody<TSchema extends z.ZodTypeAny>(schema: TSchema) {
  return {
    body: {
      content: {
        "application/json": { schema },
      },
    },
  } as const;
}

export function paginatedResponse<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  description: string,
) {
  return {
    description,
    content: {
      "application/json": {
        schema,
      },
    },
  } as const;
}

export function unauthorizedResponse() {
  return {
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
  } as const;
}

export function forbiddenResponse(roleLabel: string) {
  return {
    description: `Forbidden - ${roleLabel} access required`,
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
  } as const;
}

export function notFoundResponse<TSchema extends z.ZodTypeAny>(params: {
  schema: TSchema;
  example?: unknown;
  description: string;
}) {
  const content: JsonContent<TSchema> = {
    "application/json": {
      schema: params.schema,
    },
  };

  if (params.example) {
    content["application/json"].examples = {
      NotFound: {
        value: params.example,
      },
    };
  }

  return {
    description: params.description,
    content,
  } as const;
}
