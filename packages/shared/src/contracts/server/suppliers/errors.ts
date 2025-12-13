import { z } from "../../../zod";
import { ServerErrorDetailSchema, ServerErrorResponseSchema } from "../schemas";

export const supplierErrorCodes = [
  "SUPPLIER_NOT_FOUND",
  "DUPLICATE_SUPPLIER_NAME",
  "INVALID_SUPPLIER_STATUS",
  "INVALID_QUERY_PARAMS",
] as const;

export const SupplierErrorCodeSchema = z.enum(supplierErrorCodes);

export const SupplierErrorDetailSchema = ServerErrorDetailSchema.extend({
  code: SupplierErrorCodeSchema,
  supplierId: z.string().optional(), //
  name: z.string().optional(),
  status: z.string().optional(),
}).openapi({
  description: "Supplier-specific error detail",
  example: {
    code: "SUPPLIER_NOT_FOUND",
    supplierId: "018fa0f9-8f3b-752c-8f3d-2c9000000000",
  },
});

export type SupplierErrorCode = (typeof supplierErrorCodes)[number];
export type SupplierErrorDetail = z.infer<typeof SupplierErrorDetailSchema>;
export type SupplierErrorResponse = {
  error: string;
  details?: SupplierErrorDetail;
};

export const SupplierErrorResponseSchema = ServerErrorResponseSchema.extend({
  details: SupplierErrorDetailSchema.optional(),
}).openapi("SupplierErrorResponse", {
  description: "Standard error payload for supplier endpoints",
});

export const supplierErrorMessages: Record<SupplierErrorCode, string> = {
  SUPPLIER_NOT_FOUND: "Supplier not found",
  DUPLICATE_SUPPLIER_NAME: "Supplier name already exists",
  INVALID_SUPPLIER_STATUS: "Invalid supplier status",
  INVALID_QUERY_PARAMS: "Invalid query parameters",
};
