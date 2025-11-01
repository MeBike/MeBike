import React from "react";
import { FlatList, Text, View } from "react-native";

import { useRefund } from "../../hooks/wallet/useRefund";
import { transactionsTabStyles as styles } from "../../styles/wallet/transactionsTab";
import { LoadingSpinner } from "./loading-spinner";
import { TransactionItem } from "./transaction-item";

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
  totalTransactions: number;
  onLoadMore: () => void;
};

export function TransactionsTab({
  transactions,
  isLoading,
  hasNextPage,
  isFetchingNextPage,
  totalTransactions,
  onLoadMore,
}: TransactionsTabProps) {
  const { handleRefundFromTransaction } = useRefund();

  const handleTransactionPress = (transaction: Transaction) => {
    if (transaction.type === "THANH TOÁN") {
      handleRefundFromTransaction(transaction._id, transaction.amount);
    }
  };

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TransactionItem
      type="transaction"
      item={item}
      onPress={() => handleTransactionPress(item)}
      showRefundHint={item.type === "THANH TOÁN"}
    />
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
