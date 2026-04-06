import type { IncidentError } from "@services/incidents";

import { incidentService } from "@services/incidents";
import { useQuery } from "@tanstack/react-query";

import type { IncidentDetail } from "@/contracts/server";

import { incidentKeys } from "./incident-query-keys";

export function useIncidentDetailQuery(
  incidentId: string,
  enabled: boolean = true,
) {
  return useQuery<IncidentDetail, IncidentError>({
    queryKey: incidentKeys.detail(incidentId),
    enabled: enabled && Boolean(incidentId),
    queryFn: async () => {
      const result = await incidentService.getIncident(incidentId);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
