import { BikeColors } from "@constants/BikeColors";
import { useCancelFixedSlotTemplateMutation } from "@hooks/mutations/fixed-slots/use-cancel-fixed-slot-template-mutation";
import { useFixedSlotTemplatesQuery } from "@hooks/query/fixed-slots/use-fixed-slot-templates-query";
import { useAuthNext } from "@providers/auth-provider-next";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";

import type { FixedSlotStatus } from "@/contracts/server";
import { presentFixedSlotError } from "@/presenters/fixed-slots/fixed-slot-presenter";
import type {
  FixedSlotTemplatesNavigationProp,
  FixedSlotTemplatesRouteProp,
} from "@/types/navigation";

import { FixedSlotFilterBar } from "./components/filter-bar";
import { FixedSlotTemplatesHeader } from "./components/header";
import { FixedSlotTemplatesList } from "./components/templates-list";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BikeColors.background,
  },
  listContainer: {
    flex: 1,
  },
});

const STATUS_FILTERS: Array<{ label: string; value?: FixedSlotStatus }> = [
  { label: "Tất cả" },
  { label: "Đang hoạt động", value: "ACTIVE" },
  { label: "Đã hủy", value: "CANCELLED" },
];

export default function FixedSlotTemplatesScreen() {
  const navigation = useNavigation<FixedSlotTemplatesNavigationProp>();
  const route = useRoute<FixedSlotTemplatesRouteProp>();
  const { stationId, stationName } = route.params ?? {};
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthNext();
  const hasToken = isAuthenticated;

  const [statusFilter, setStatusFilter] = useState<FixedSlotStatus | undefined>();
  const pageLimit = 5;
  const [listHeight, setListHeight] = useState(0);

  const {
    data,
    refetch,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = useFixedSlotTemplatesQuery(
    { pageSize: pageLimit, stationId, status: statusFilter },
    hasToken,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const templates = useMemo(
    () => data?.pages.flatMap(page => page.data) ?? [],
    [data],
  );

  const cancelMutation = useCancelFixedSlotTemplateMutation();

  const handleInvalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["fixed-slots"] });
  }, [queryClient]);

  const handleCancel = useCallback((id: string) => {
    Alert.alert("Huỷ khung giờ", "Hành động này không thể hoàn tác.", [
      { text: "Đóng", style: "cancel" },
      {
        text: "Huỷ khung giờ",
        style: "destructive",
        onPress: () => {
          cancelMutation.mutate(id, {
            onSuccess: () => handleInvalidate(),
            onError: (error) => {
              Alert.alert("Không thể hủy khung giờ", presentFixedSlotError(error, "Vui lòng thử lại sau."));
            },
          });
        },
      },
    ]);
  }, [cancelMutation, handleInvalidate]);

  const handleCreateTemplate = useCallback(() => {
    Alert.alert(
      "Tạo khung giờ mới",
      "Việc tạo khung giờ sẽ trừ lượt sử dụng trong gói đăng ký tháng. Nếu đã hết lượt, số dư ví sẽ bị trừ tương ứng. Bạn có chắc chắn muốn tiếp tục?",
      [
        { text: "Huỷ", style: "cancel" },
        {
          text: "Tiếp tục",
          onPress: () =>
            navigation.navigate("FixedSlotEditor", {
              stationId,
              stationName,
            }),
        },
      ],
    );
  }, [navigation, stationId, stationName]);

  const headerTitle = useMemo(() => {
    if (stationName)
      return stationName;
    return "Khung giờ cố định";
  }, [stationName]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetch();
    }
    finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <View style={styles.container}>
      <FixedSlotTemplatesHeader
        title={headerTitle}
        onBack={() => navigation.goBack()}
      />
      <FixedSlotFilterBar
        filters={STATUS_FILTERS}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        onCreate={handleCreateTemplate}
      />
      <View
        style={styles.listContainer}
        onLayout={({ nativeEvent }) => {
          setListHeight(nativeEvent.layout.height);
        }}
      >
        <FixedSlotTemplatesList
          templates={templates}
          refreshing={isRefreshing || isRefetching}
          isLoading={isLoading}
          isFetchingMore={isFetchingNextPage}
          hasNextPage={Boolean(hasNextPage)}
          containerHeight={listHeight}
          onRefresh={handleRefresh}
          onLoadMore={handleLoadMore}
          onCancel={handleCancel}
          onSelect={templateId => navigation.navigate("FixedSlotDetail", { templateId })}
        />
      </View>
    </View>
  );
}
