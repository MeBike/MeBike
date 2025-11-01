import React from "react";
import { FlatList, Text, View } from "react-native";

import { LoadingSpinner } from "../loading-spinner";
import { TransactionItem } from "../transaction-item";
import { styles } from "./styles";

type Transaction = {
  _id: string;
  amount: number;
  created_at: string;
  status: string;
  description?: string;
  type?: string;
};

type TransactionsTabProps = {
  transactions: Transaction[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  _totalTransactions: number;
  onLoadMore: () => void;
};

export function TransactionsTab({
  transactions,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  _totalTransactions,
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
        <Text style={styles.emptyStateText}>No transactions yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={transactions}
      renderItem={renderTransaction}
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
