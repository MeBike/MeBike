import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";

import { useAuthNext } from "@providers/auth-provider-next";

import { useReservationMutations } from "./reservation/use-reservation-mutations";
import { useReservationQueries } from "./reservation/use-reservation-queries";

type UseReservationActionsParams = {
  hasToken: boolean;
  pendingPage?: number;
  pendingLimit?: number;
  historyPage?: number;
  historyLimit?: number;
  historyVersion?: number;
  reservationId?: string;
  enableDetailQuery?: boolean;
  autoFetch?: boolean;
};

export function useReservationActions({
  hasToken,
  pendingPage = 1,
  pendingLimit = 10,
  historyPage = 1,
  historyLimit = 10,
  historyVersion = 0,
  reservationId,
  enableDetailQuery = false,
  autoFetch = true,
}: UseReservationActionsParams) {
  const navigation = useNavigation();
  const { user } = useAuthNext();

  const ensureAuthenticated = useCallback(() => {
    if (!hasToken) {
      navigation.navigate("Login" as never);
      return false;
    }
    return true;
  }, [hasToken, navigation]);

  const queryState = useReservationQueries({
    hasToken,
    userId: user?.id,
    pendingPage,
    pendingLimit,
    historyPage,
    historyLimit,
    historyVersion,
    reservationId,
    enableDetailQuery,
    autoFetch,
    ensureAuthenticated,
  });

  const mutationState = useReservationMutations({
    ensureAuthenticated,
  });

  return {
    ...queryState,
    ...mutationState,
  };
}
