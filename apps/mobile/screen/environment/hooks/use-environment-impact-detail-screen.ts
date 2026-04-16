import { useEnvironmentImpactDetailQuery } from "@hooks/query/environment/use-environment-impact-detail-query";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";

import type { EnvironmentImpactDetailNavigationProp } from "@/types/navigation";

export function useEnvironmentImpactDetailScreen(rentalId: string) {
  const navigation = useNavigation<EnvironmentImpactDetailNavigationProp>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const detailQuery = useEnvironmentImpactDetailQuery(rentalId);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await detailQuery.refetch();
    }
    finally {
      setIsRefreshing(false);
    }
  }, [detailQuery]);

  const handleOpenRentalDetail = useCallback(() => {
    navigation.navigate("BookingHistoryDetail", { bookingId: rentalId });
  }, [navigation, rentalId]);

  return {
    detail: detailQuery.data,
    error: detailQuery.error,
    isInitialLoading: !detailQuery.data && detailQuery.isLoading,
    isRefreshing: isRefreshing || detailQuery.isRefetching,
    actions: {
      goBack: () => navigation.goBack(),
      onRefresh: handleRefresh,
      openRentalDetail: handleOpenRentalDetail,
    },
  };
}
