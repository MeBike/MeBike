import React from "react";
import { FlatList, Text, View } from "react-native";

import type { DetailWithdrawRequest } from "../../../types/Withdrawal";

import { LoadingSpinner } from "../loading-spinner";
import { TransactionItem } from "../transaction-item";
import { styles } from "./styles";

type WithdrawalRequest = Omit<DetailWithdrawRequest, "amount"> & {
  amount: number;
};

type WithdrawalsTabProps = {
  withdrawalRequests: WithdrawalRequest[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
};

export function WithdrawalsTab({
  withdrawalRequests,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: WithdrawalsTabProps) {
  const renderRequest = ({ item }: { item: WithdrawalRequest }) => (
    <TransactionItem type="withdrawal" item={item} />
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

  if (!withdrawalRequests || withdrawalRequests.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>Chưa có yêu cầu rút tiền nào</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={withdrawalRequests}
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
