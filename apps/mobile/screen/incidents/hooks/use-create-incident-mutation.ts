import type { IncidentError } from "@services/incidents";

import { incidentService } from "@services/incidents";
import { useMutation } from "@tanstack/react-query";

import type { CreateIncidentPayload, IncidentSummary } from "@/contracts/server";

import { useIncidentCache } from "./incident-cache";

export function useCreateIncidentMutation() {
  const { invalidateIncidentQueries } = useIncidentCache();

  return useMutation<IncidentSummary, IncidentError, CreateIncidentPayload>({
    mutationFn: async (payload) => {
      const result = await incidentService.createIncident(payload);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
    onSuccess: (result) => {
      void invalidateIncidentQueries(result.id);
    },
  });
}
