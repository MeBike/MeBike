import { createRoute } from "@hono/zod-openapi";

import {
  ServerErrorResponseSchema,
  UnauthorizedErrorCodeSchema,
  unauthorizedErrorMessages,
  UnauthorizedErrorResponseSchema,
} from "../../schemas";
import {
  SupplierErrorCodeSchema,
  SupplierErrorResponseSchema,
  SupplierIdParamSchema,
  SupplierListQuerySchema,
  SupplierListResponseSchema,
  SupplierStatsListResponseSchema,
  SupplierStatsResponseSchema,
  SupplierSummarySchema,
} from "./shared";

export const listSuppliers = createRoute({
  method: "get",
  path: "/v1/suppliers",
  tags: ["Suppliers"],
  security: [{ bearerAuth: [] }],
  request: {
    query: SupplierListQuerySchema,
  },
  responses: {
    200: {
      description: "List suppliers",
      content: {
        "application/json": { schema: SupplierListResponseSchema },
      },
    },
    400: {
      description: "Invalid query",
      content: {
        "application/json": {
          schema: SupplierErrorResponseSchema,
          examples: {
            InvalidStatus: {
              value: {
                error: "Invalid query parameters",
                details: {
                  code: SupplierErrorCodeSchema.enum.INVALID_QUERY_PARAMS,
                  issues: [
                    {
                      path: "query.status",
                      message: "Expected enum value",
                      code: "invalid_enum_value",
                    },
                  ],
                },
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

export const getSupplier = createRoute({
  method: "get",
  path: "/v1/suppliers/{supplierId}",
  tags: ["Suppliers"],
  security: [{ bearerAuth: [] }],
  request: {
    params: SupplierIdParamSchema,
  },
  responses: {
    200: {
      description: "Get supplier details",
      content: {
        "application/json": { schema: SupplierSummarySchema },
      },
    },
    400: {
      description: "Invalid path parameter",
      content: {
        "application/json": {
          schema: ServerErrorResponseSchema,
        },
      },
    },
    404: {
      description: "Supplier not found",
      content: {
        "application/json": {
          schema: SupplierErrorResponseSchema,
          examples: {
            NotFound: {
              value: {
                error: "Supplier not found",
                details: {
                  code: SupplierErrorCodeSchema.enum.SUPPLIER_NOT_FOUND,
                },
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

export const getAllSupplierStats = createRoute({
  method: "get",
  path: "/v1/suppliers/stats",
  tags: ["Suppliers"],
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "Bike stats for all suppliers",
      content: {
        "application/json": { schema: SupplierStatsListResponseSchema },
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

export const getSupplierStats = createRoute({
  method: "get",
  path: "/v1/suppliers/{supplierId}/stats",
  tags: ["Suppliers"],
  security: [{ bearerAuth: [] }],
  request: {
    params: SupplierIdParamSchema,
  },
  responses: {
    200: {
      description: "Bike stats for one supplier",
      content: {
        "application/json": { schema: SupplierStatsResponseSchema },
      },
    },
    404: {
      description: "Supplier not found",
      content: {
        "application/json": {
          schema: SupplierErrorResponseSchema,
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

export const suppliersQueries = {
  listSuppliers,
  getSupplier,
  getAllSupplierStats,
  getSupplierStats,
} as const;
