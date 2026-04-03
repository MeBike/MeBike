import { z } from "../../../zod";
import { SupplierStatusSchema } from "./schemas";

export const SupplierSummarySchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  address: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  contractFee: z.number().nullable(),
  status: SupplierStatusSchema,
  createdAt: z.iso.datetime(),
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

export const SupplierStatusSummarySchema = z.object({
  active: z.number().int().nonnegative(),
  inactive: z.number().int().nonnegative(),
});

export type SupplierSummary = z.infer<typeof SupplierSummarySchema>;
export type SupplierBikeStats = z.infer<typeof SupplierBikeStatsSchema>;
export type SupplierStatusSummary = z.infer<typeof SupplierStatusSummarySchema>;
