import React from "react";
import { FlatList, Text, View } from "react-native";

import { LoadingSpinner } from "../loading-spinner";
import { TransactionItem } from "../transaction-item";
import { styles } from "./styles";

type Transaction = {
  id: string;
  amount: string;
  createdAt: string;
  status: string;
  description?: string;
  type?: string;
};

type TransactionsTabProps = {
  transactions: Transaction[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
};

export function TransactionsTab({
  transactions,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: TransactionsTabProps) {
  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TransactionItem type="transaction" item={item} />
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
    return <LoadingSpinner message="Đang tải giao dịch..." />;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>Chưa có giao dịch nào</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={transactions}
      renderItem={renderTransaction}
      keyExtractor={item => item.id}
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
