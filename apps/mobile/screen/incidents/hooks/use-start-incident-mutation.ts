import type { IncidentError } from "@services/incidents";

import { incidentService } from "@services/incidents";
import { useMutation } from "@tanstack/react-query";

import type { IncidentDetail } from "@/contracts/server";

import { useIncidentCache } from "./incident-cache";

export function useStartIncidentMutation() {
  const { invalidateIncidentQueries } = useIncidentCache();

  return useMutation<IncidentDetail, IncidentError, string>({
    mutationFn: async (incidentId) => {
      const result = await incidentService.startIncident(incidentId);
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
