import type { QueryClient } from "@tanstack/react-query";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { incidentKeys } from "./incident-query-keys";

export function invalidateIncidentListQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
}

export function invalidateIncidentDetailQuery(
  queryClient: QueryClient,
  incidentId: string,
) {
  return queryClient.invalidateQueries({ queryKey: incidentKeys.detail(incidentId) });
}

export function invalidateIncidentQueries(
  queryClient: QueryClient,
  incidentId?: string,
) {
  const jobs: Array<Promise<unknown>> = [invalidateIncidentListQueries(queryClient)];

  if (incidentId) {
    jobs.push(invalidateIncidentDetailQuery(queryClient, incidentId));
  }

  return Promise.all(jobs);
}

export function useIncidentCache() {
  const queryClient = useQueryClient();

  return {
    invalidateIncidentListQueries: useCallback(
      () => invalidateIncidentListQueries(queryClient),
      [queryClient],
    ),
    invalidateIncidentDetailQuery: useCallback(
      (incidentId: string) => invalidateIncidentDetailQuery(queryClient, incidentId),
      [queryClient],
    ),
    invalidateIncidentQueries: useCallback(
      (incidentId?: string) => invalidateIncidentQueries(queryClient, incidentId),
      [queryClient],
    ),
  };
}
