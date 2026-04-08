import type { IncidentError } from "@services/incidents";

import { incidentService } from "@services/incidents";
import { useMutation } from "@tanstack/react-query";

import type { IncidentDetail, UpdateIncidentPayload } from "@/contracts/server";

import { useIncidentCache } from "./incident-cache";

export type UpdateIncidentVariables = {
  incidentId: string;
  payload: UpdateIncidentPayload;
};

export function useUpdateIncidentMutation() {
  const { invalidateIncidentQueries } = useIncidentCache();

  return useMutation<IncidentDetail, IncidentError, UpdateIncidentVariables>({
    mutationFn: async ({ incidentId, payload }) => {
      const result = await incidentService.updateIncident(incidentId, payload);
      if (!result.ok) {
        throw result.error;
      }
      return result.value;
    },
    onSuccess: (_, { incidentId }) => {
      void invalidateIncidentQueries(incidentId);
    },
  });
}
