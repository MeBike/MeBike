import type { AgenciesContracts } from "@mebike/shared";

import type { AgencyRow } from "@/domain/agencies";

export function toAgencySummary(
  row: AgencyRow,
): AgenciesContracts.AgencySummary {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    contactPhone: row.contactPhone,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
