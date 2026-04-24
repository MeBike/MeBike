import { useFixedSlotTemplatesQuery } from "@hooks/query/fixed-slots/use-fixed-slot-templates-query";
import { useAuthNext } from "@providers/auth-provider-next";
import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";

import type { FixedSlotStatus } from "@/contracts/server";
import type { FixedSlotTemplatesNavigationProp, FixedSlotTemplatesRouteProp } from "@/types/navigation";

type UseFixedSlotTemplatesScreenParams = {
  navigation: FixedSlotTemplatesNavigationProp;
  routeParams?: FixedSlotTemplatesRouteProp["params"];
};

export function useFixedSlotTemplatesScreen({ navigation, routeParams }: UseFixedSlotTemplatesScreenParams) {
  const { stationId, stationName } = routeParams ?? {};
  const { isAuthenticated, user } = useAuthNext();

  const [statusFilter, setStatusFilter] = useState<FixedSlotStatus | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [listHeight, setListHeight] = useState(0);
  const pageSize = 5;

  const templatesQuery = useFixedSlotTemplatesQuery(
    { pageSize, stationId, status: statusFilter },
    isAuthenticated,
    user?.id,
  );

  const templates = useMemo(
    () => templatesQuery.data?.pages.flatMap(page => page.data) ?? [],
    [templatesQuery.data],
  );

  const headerTitle = useMemo(() => stationName ?? "Lịch đặt cố định", [stationName]);

  const handleCreateTemplate = useCallback(() => {
    Alert.alert(
      "Tạo khung giờ mới",
      "Lịch chỉ bị trừ lượt gói hoặc số dư ví khi hệ thống tạo đặt trước cho từng ngày. Không trừ tiền ngay lúc tạo lịch. Bạn có muốn tiếp tục?",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Tiếp tục",
          onPress: () => {
            navigation.navigate("FixedSlotEditor", {
              stationId,
              stationName,
            });
          },
        },
      ],
    );
  }, [navigation, stationId, stationName]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);

    try {
      await templatesQuery.refetch();
    }
    finally {
      setIsRefreshing(false);
    }
  }, [templatesQuery]);

  const handleLoadMore = useCallback(() => {
    if (templatesQuery.hasNextPage && !templatesQuery.isFetchingNextPage) {
      templatesQuery.fetchNextPage();
    }
  }, [templatesQuery]);

  const handleSelectTemplate = useCallback((templateId: string) => {
    navigation.navigate("FixedSlotDetail", { templateId });
  }, [navigation]);

  return {
    headerTitle,
    statusFilter,
    setStatusFilter,
    listHeight,
    setListHeight,
    templates,
    isLoading: templatesQuery.isLoading,
    isRefreshing: isRefreshing || templatesQuery.isRefetching,
    isFetchingMore: templatesQuery.isFetchingNextPage,
    hasNextPage: Boolean(templatesQuery.hasNextPage),
    handleCreateTemplate,
    handleRefresh,
    handleLoadMore,
    handleSelectTemplate,
  };
}
