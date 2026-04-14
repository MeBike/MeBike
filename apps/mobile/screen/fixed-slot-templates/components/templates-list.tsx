import { AppText } from "@ui/primitives/app-text";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  View,
} from "react-native";
import { useTheme, YStack } from "tamagui";

import type { FixedSlotTemplate } from "@/contracts/server";
import { FixedSlotTemplateCard } from "./fixed-slot-template-card";

type FixedSlotTemplatesListProps = {
  templates: FixedSlotTemplate[];
  refreshing: boolean;
  isLoading: boolean;
  isFetchingMore: boolean;
  hasNextPage: boolean;
  containerHeight: number;
  onRefresh: () => void;
  onLoadMore: () => void;
  onCancel: (templateId: string) => void;
  onSelect: (templateId: string) => void;
};

export function FixedSlotTemplatesList({
  templates,
  refreshing,
  isLoading,
  isFetchingMore,
  hasNextPage,
  containerHeight,
  onRefresh,
  onLoadMore,
  onCancel,
  onSelect,
}: FixedSlotTemplatesListProps) {
  const theme = useTheme();
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (!hasNextPage || isFetchingMore)
      return;
    if (templates.length === 0)
      return;
    if (!containerHeight || !contentHeight)
      return;
    if (contentHeight >= containerHeight)
      return;

    onLoadMore();
  }, [hasNextPage, isFetchingMore, contentHeight, containerHeight, templates.length, onLoadMore]);

  const handleEndReached = () => {
    onLoadMore();
  };

  return (
    <FlatList
      data={templates}
      keyExtractor={item => item.id}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      onContentSizeChange={(width, height) => {
        setContentHeight(height);
      }}
      ListFooterComponent={
        isFetchingMore ? (
          <View style={{ paddingVertical: 16 }}>
            <ActivityIndicator color={theme.actionPrimary.val} />
          </View>
        ) : null
      }
      ListEmptyComponent={
        isLoading ? (
          <YStack alignItems="center" gap="$3" padding="$7">
            <ActivityIndicator color={theme.actionPrimary.val} size="large" />
            <AppText tone="muted" variant="bodySmall">Đang tải khung giờ...</AppText>
          </YStack>
        ) : (
          <YStack alignItems="center" gap="$2" padding="$7">
            <AppText variant="sectionTitle">Chưa có khung giờ nào</AppText>
            <AppText align="center" tone="muted" variant="bodySmall">
              Tạo khung giờ cố định để giữ nhịp thuê xe nhanh hơn tại trạm quen thuộc.
            </AppText>
          </YStack>
        )
      }
      renderItem={({ item }) => (
        <FixedSlotTemplateCard
          template={item}
          onCancel={() => onCancel(item.id)}
          onSelect={() => onSelect(item.id)}
        />
      )}
    />
  );
}
