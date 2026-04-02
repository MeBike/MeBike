import type { IncidentError } from "@services/incidents";

import { incidentService } from "@services/incidents";
import { useMutation } from "@tanstack/react-query";

import type { CreateIncidentPayload, IncidentSummary } from "@/contracts/server";

export function useCreateIncidentMutation() {
  return useMutation<IncidentSummary, IncidentError, CreateIncidentPayload>({
    mutationFn: async (payload) => {
      const result = await incidentService.createIncident(payload);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
  });
}
