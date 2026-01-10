import { FixedSlotTemplateCard } from "@components/reservation-flow/FixedSlotTemplateCard";
import { BikeColors } from "@constants";
import type { FixedSlotTemplateListItem } from "@/types/fixed-slot-types";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    color: BikeColors.textSecondary,
  },
  footerLoader: {
    paddingVertical: 16,
  },
});

type FixedSlotTemplatesListProps = {
  templates: FixedSlotTemplateListItem[];
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
      style={styles.list}
      data={templates}
      keyExtractor={(item) => item._id}
      contentContainerStyle={styles.content}
      refreshing={refreshing}
      onRefresh={onRefresh}
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.4}
      onContentSizeChange={(width, height) => {
        setContentHeight(height);
      }}
      ListFooterComponent={
        isFetchingMore ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator color={BikeColors.primary} />
          </View>
        ) : null
      }
      ListEmptyComponent={
        isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator color={BikeColors.primary} size="large" />
            <Text style={styles.emptyText}>Đang tải khung giờ...</Text>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Chưa có khung giờ nào.</Text>
          </View>
        )
      }
      renderItem={({ item }) => (
        <FixedSlotTemplateCard
          template={item}
          onCancel={() => onCancel(item._id)}
          onSelect={() => onSelect(item._id)}
        />
      )}
    />
  );
}
