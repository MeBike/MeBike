import type { IncidentListParams } from "@services/incidents";

export const incidentKeys = {
  all: () => ["incidents"] as const,
  lists: () => ["incidents", "list"] as const,
  list: (params: Omit<IncidentListParams, "page"> = {}) => ["incidents", "list", params] as const,
  details: () => ["incidents", "detail"] as const,
  detail: (incidentId: string) => ["incidents", "detail", incidentId] as const,
} as const;
