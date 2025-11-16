import { BikeColors } from "@constants/BikeColors";
import { useCancelFixedSlotTemplateMutation } from "@hooks/mutations/FixedSlots/useCancelFixedSlotTemplateMutation";
import { useAuth } from "@providers/auth-providers";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "@utils/error";
import React, { useCallback, useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { FixedSlotStatus } from "@/types/fixed-slot-types";
import type {
  FixedSlotTemplatesNavigationProp,
  FixedSlotTemplatesRouteProp,
} from "@/types/navigation";

import { FixedSlotFilterBar } from "./components/filter-bar";
import { FixedSlotTemplatesHeader } from "./components/header";
import { FixedSlotTemplatesList } from "./components/templates-list";
import { useFixedSlotTemplatesQuery } from "@hooks/query/FixedSlots/useFixedSlotTemplatesQuery";

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
  { label: "ĐANG HOẠT ĐỘNG", value: "ĐANG HOẠT ĐỘNG" },
  { label: "ĐÃ HUỶ", value: "ĐÃ HUỶ" },
];

export default function FixedSlotTemplatesScreen() {
  const navigation = useNavigation<FixedSlotTemplatesNavigationProp>();
  const route = useRoute<FixedSlotTemplatesRouteProp>();
  const { stationId, stationName } = route.params ?? {};
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const hasToken = Boolean(user?._id);

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
    { limit: pageLimit, station_id: stationId, status: statusFilter },
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
              Alert.alert("Không thể huỷ khung giờ", getApiErrorMessage(error, "Vui lòng thử lại sau."));
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
        topInset={insets.top}
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
