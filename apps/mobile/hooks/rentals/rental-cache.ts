import type { QueryClient } from "@tanstack/react-query";

import { rentalKeys } from "@hooks/query/rentals/rental-query-keys";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

const bikeQueryKeys = {
  all: () => ["bikes", "all"] as const,
} as const;

const stationQueryKeys = {
  list: () => ["stations", "list"] as const,
  detailRoot: () => ["station"] as const,
} as const;

const subscriptionQueryKeys = {
  all: () => ["subscriptions"] as const,
} as const;

export function invalidateAllRentalQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: rentalKeys.all() });
}

export function invalidateMyRentalQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: rentalKeys.meRoot() });
}

export function invalidateMyRentalCountsQuery(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: rentalKeys.meRoot() });
}

export function invalidateStaffRentalQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: rentalKeys.staff() });
}

export function invalidateStaffBikeSwapQueries(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: rentalKeys.bikeSwap.staff() });
}

export function invalidateRentalSupportQueries(
  queryClient: QueryClient,
  options?: { includeSubscriptions?: boolean },
) {
  const jobs: Array<Promise<unknown>> = [
    queryClient.invalidateQueries({ queryKey: bikeQueryKeys.all() }),
    queryClient.invalidateQueries({ queryKey: stationQueryKeys.list() }),
    queryClient.invalidateQueries({ queryKey: stationQueryKeys.detailRoot() }),
  ];

  if (options?.includeSubscriptions) {
    jobs.push(queryClient.invalidateQueries({ queryKey: subscriptionQueryKeys.all() }));
  }

  return Promise.all(jobs);
}

export function invalidateRentalCreationQueries(
  queryClient: QueryClient,
  options?: { includeSubscriptions?: boolean },
) {
  return Promise.all([
    invalidateMyRentalQueries(queryClient),
    invalidateRentalSupportQueries(queryClient, options),
  ]);
}

export function useRentalCache() {
  const queryClient = useQueryClient();

  return {
    invalidateAllRentalQueries: useCallback(
      () => invalidateAllRentalQueries(queryClient),
      [queryClient],
    ),
    invalidateMyRentalQueries: useCallback(
      () => invalidateMyRentalQueries(queryClient),
      [queryClient],
    ),
    invalidateMyRentalCountsQuery: useCallback(
      () => invalidateMyRentalCountsQuery(queryClient),
      [queryClient],
    ),
    invalidateStaffRentalQueries: useCallback(
      () => invalidateStaffRentalQueries(queryClient),
      [queryClient],
    ),
    invalidateStaffBikeSwapQueries: useCallback(
      () => invalidateStaffBikeSwapQueries(queryClient),
      [queryClient],
    ),
    invalidateRentalSupportQueries: useCallback(
      (options?: { includeSubscriptions?: boolean }) =>
        invalidateRentalSupportQueries(queryClient, options),
      [queryClient],
    ),
    invalidateRentalCreationQueries: useCallback(
      (options?: { includeSubscriptions?: boolean }) =>
        invalidateRentalCreationQueries(queryClient, options),
      [queryClient],
    ),
  };
}
