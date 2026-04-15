import { spaceScale } from "@theme/metrics";
import { AppText } from "@ui/primitives/app-text";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  View,
} from "react-native";
import { useTheme, YStack } from "tamagui";

import type { FixedSlotTemplate } from "@/contracts/server";

import { IconSymbol } from "@/components/IconSymbol";

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
      contentContainerStyle={{
        paddingBottom: spaceScale[9],
        paddingTop: spaceScale[5],
        flexGrow: templates.length === 0 ? 1 : undefined,
      }}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      onContentSizeChange={(width, height) => {
        setContentHeight(height);
      }}
      ListFooterComponent={
        isFetchingMore
          ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator color={theme.actionPrimary.val} />
              </View>
            )
          : null
      }
      ListEmptyComponent={
        isLoading
          ? (
              <View style={{ paddingHorizontal: spaceScale[5], paddingTop: spaceScale[5], flex: 1 }}>
                <YStack alignItems="center" backgroundColor="$surfaceDefault" borderColor="$borderSubtle" borderRadius="$5" borderWidth={1} gap="$3" padding="$7">
                  <ActivityIndicator color={theme.actionPrimary.val} size="large" />
                  <AppText tone="muted" variant="bodySmall">Đang tải khung giờ...</AppText>
                </YStack>
              </View>
            )
          : (
              <View style={{ paddingHorizontal: spaceScale[5], paddingTop: spaceScale[5], flex: 1 }}>
                <YStack alignItems="center" backgroundColor="$surfaceDefault" borderColor="$borderSubtle" borderRadius="$5" borderWidth={1} gap="$3" padding="$7">
                  <IconSymbol color={theme.textTertiary.val} name="calendar" size="display" />
                  <AppText variant="sectionTitle">Chưa có khung giờ nào</AppText>
                  <AppText align="center" tone="muted" variant="bodySmall">
                    Tạo khung giờ cố định để giữ nhịp thuê xe nhanh hơn tại trạm quen thuộc.
                  </AppText>
                </YStack>
              </View>
            )
      }
      ItemSeparatorComponent={() => <View style={{ height: spaceScale[4] }} />}
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: spaceScale[5] }}>
          <FixedSlotTemplateCard
            template={item}
            onSelect={() => onSelect(item.id)}
          />
        </View>
      )}
    />
  );
}
