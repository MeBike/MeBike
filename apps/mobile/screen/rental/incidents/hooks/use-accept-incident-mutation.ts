import type { IncidentError } from "@services/incidents";

import { incidentService } from "@services/incidents";
import { useMutation } from "@tanstack/react-query";

import type { TechnicianAssignmentSummary } from "@/contracts/server";

import { useIncidentCache } from "./incident-cache";

export function useAcceptIncidentMutation() {
  const { invalidateIncidentQueries } = useIncidentCache();

  return useMutation<TechnicianAssignmentSummary, IncidentError, string>({
    mutationFn: async (incidentId) => {
      const result = await incidentService.acceptIncident(incidentId);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
    onSuccess: (_, incidentId) => {
      void invalidateIncidentQueries(incidentId);
    },
  });
}
