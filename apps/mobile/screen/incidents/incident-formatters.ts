import { formatVietnamDateTime } from "@/utils/date";

export function formatIncidentCode(incidentId: string) {
  return `SC-${incidentId.slice(-6).toUpperCase()}`;
}

export function formatIncidentDateTime(value: Date | string | null) {
  if (!value) {
    return null;
  }

  return formatVietnamDateTime(value instanceof Date ? value.toISOString() : value);
}
