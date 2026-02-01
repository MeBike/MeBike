import { SuppliersContracts } from "@mebike/shared";

import type { SupplierRow } from "@/domain/suppliers";

export type SuppliersRoutes = typeof import("@mebike/shared")["serverRoutes"]["suppliers"];

export type SupplierSummary = SuppliersContracts.SupplierSummary;
export type SupplierErrorResponse = SuppliersContracts.SupplierErrorResponse;
export type SupplierStats = SuppliersContracts.SupplierBikeStats;

export const { SupplierErrorCodeSchema, supplierErrorMessages } = SuppliersContracts;

export function toSupplierSummary(row: SupplierRow): SupplierSummary {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    phoneNumber: row.phoneNumber,
    contractFee: row.contractFee ? Number(row.contractFee) : null,
    status: row.status,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
  };
}
