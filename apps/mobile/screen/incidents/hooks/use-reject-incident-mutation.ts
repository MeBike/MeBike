import type { IncidentError } from "@services/incidents";

import { incidentService } from "@services/incidents";
import { useMutation } from "@tanstack/react-query";

import type { TechnicianAssignmentSummary } from "@/contracts/server";

export function useRejectIncidentMutation() {
  return useMutation<TechnicianAssignmentSummary, IncidentError, string>({
    mutationFn: async (incidentId) => {
      const result = await incidentService.rejectIncident(incidentId);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
