import type { IncidentError } from "@services/incidents";

import { incidentService } from "@services/incidents";
import { useMutation } from "@tanstack/react-query";

import type { IncidentDetail } from "@/contracts/server";

export function useResolveIncidentMutation() {
  return useMutation<IncidentDetail, IncidentError, string>({
    mutationFn: async (incidentId) => {
      const result = await incidentService.resolveIncident(incidentId);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
