import type { IncidentError } from "@services/incidents";

import { incidentService } from "@services/incidents";
import { useQuery } from "@tanstack/react-query";

import type { IncidentDetail } from "@/contracts/server";

import { isIncidentTerminalStatus } from "../incident-presenters";
import { incidentKeys } from "./incident-query-keys";

function pickRentalIncident(incidents: IncidentDetail[], rentalId: string) {
  const rentalIncidents = incidents
    .filter(incident => incident.rental?.id === rentalId)
    .sort((left, right) => right.reportedAt.getTime() - left.reportedAt.getTime());

  const activeIncident = rentalIncidents.find(incident => !isIncidentTerminalStatus(incident.status));

  return activeIncident ?? rentalIncidents[0] ?? null;
}

export function useRentalIncidentQuery(rentalId: string, enabled: boolean = true) {
  return useQuery<IncidentDetail | null, IncidentError>({
    queryKey: incidentKeys.rental(rentalId),
    enabled: enabled && Boolean(rentalId),
    queryFn: async () => {
      const result = await incidentService.listIncidents({
        page: 1,
        pageSize: 20,
        rentalId,
        sortBy: "resolvedAt",
        sortDir: "desc",
      });

      if (!result.ok) {
        throw result.error;
      }

      return pickRentalIncident(result.value.data, rentalId);
    },
  });
}
