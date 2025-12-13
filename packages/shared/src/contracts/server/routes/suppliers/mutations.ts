import { createRoute } from "@hono/zod-openapi";

import {
  SupplierCreateBodySchema,
  SupplierErrorCodeSchema,
  SupplierErrorResponseSchema,
  SupplierIdParamSchema,
  SupplierStatusPatchSchema,
  SupplierSummarySchema,
  SupplierUpdateBodySchema,
} from "./shared";

export const createSupplier = createRoute({
  method: "post",
  path: "/v1/suppliers",
  tags: ["Suppliers"],
  request: {
    body: {
      content: {
        "application/json": { schema: SupplierCreateBodySchema },
      },
    },
  },
  responses: {
    201: {
      description: "Supplier created",
      content: {
        "application/json": { schema: SupplierSummarySchema },
      },
    },
    400: {
      description: "Invalid payload or duplicate name",
      content: {
        "application/json": {
          schema: SupplierErrorResponseSchema,
          examples: {
            DuplicateName: {
              value: {
                error: "Supplier name already exists",
                details: {
                  code: SupplierErrorCodeSchema.enum.DUPLICATE_SUPPLIER_NAME,
                },
              },
            },
          },
        },
      },
    },
  },
});

export const updateSupplier = createRoute({
  method: "put",
  path: "/v1/suppliers/{supplierId}",
  tags: ["Suppliers"],
  request: {
    params: SupplierIdParamSchema,
    body: {
      content: {
        "application/json": { schema: SupplierUpdateBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: "Supplier updated",
      content: {
        "application/json": { schema: SupplierSummarySchema },
      },
    },
    400: {
      description: "Invalid payload or duplicate name",
      content: {
        "application/json": {
          schema: SupplierErrorResponseSchema,
        },
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
  },
});

export const updateSupplierStatus = createRoute({
  method: "patch",
  path: "/v1/suppliers/{supplierId}",
  tags: ["Suppliers"],
  request: {
    params: SupplierIdParamSchema,
    body: {
      content: {
        "application/json": { schema: SupplierStatusPatchSchema },
      },
    },
  },
  responses: {
    200: {
      description: "Supplier status updated",
      content: {
        "application/json": { schema: SupplierSummarySchema },
      },
    },
    400: {
      description: "Invalid status",
      content: {
        "application/json": {
          schema: SupplierErrorResponseSchema,
        },
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
  },
});

export const suppliersMutations = {
  createSupplier,
  updateSupplier,
  updateSupplierStatus,
} as const;
