import { z } from "../../../zod";
import { SupplierStatusSchema } from "./schemas";

export const SupplierSummarySchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  address: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  contractFee: z.number().nullable(),
  status: SupplierStatusSchema,
  updatedAt: z.iso.datetime(),
});

export const SupplierBikeStatsSchema = z.object({
  supplierId: z.uuidv7(),
  supplierName: z.string(),
  totalBikes: z.number(),
  available: z.number(),
  booked: z.number(),
  broken: z.number(),
  reserved: z.number(),
  maintained: z.number(),
  unavailable: z.number(),
});

export type SupplierSummary = z.infer<typeof SupplierSummarySchema>;
export type SupplierBikeStats = z.infer<typeof SupplierBikeStatsSchema>;

export const SupplierListResponseSchema = z.object({
  data: z.array(SupplierSummarySchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type SupplierListResponse = z.infer<typeof SupplierListResponseSchema>;
