import React from "react";
import { FlatList, Text, View } from "react-native";

import { LoadingSpinner } from "../loading-spinner";
import { TransactionItem } from "../transaction-item";
import { styles } from "./styles";

type RefundRequest = {
  _id: string;
  amount: number;
  created_at: string;
  status: string;
  transaction_id: string;
};

type RefundsTabProps = {
  refundRequests: RefundRequest[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
};

export function RefundsTab({
  refundRequests,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: RefundsTabProps) {
  const renderRequest = ({ item }: { item: RefundRequest }) => (
    <TransactionItem type="refund" item={item} />
  );

  const renderFooter = () => {
    if (!isFetchingNextPage)
      return null;

    return (
      <View style={styles.loadingFooter}>
        <Text style={styles.loadingText}>Đang tải thêm...</Text>
      </View>
    );
  };

  if (isLoading) {
    return <LoadingSpinner message="Đang tải..." />;
  }

  if (!refundRequests || refundRequests.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>Chưa có yêu cầu hoàn tiền nào</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={refundRequests}
      renderItem={renderRequest}
      keyExtractor={item => item._id}
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      }}
      onEndReachedThreshold={0.3}
      ListFooterComponent={renderFooter}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
    />
  );
}
