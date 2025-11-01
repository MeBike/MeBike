import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

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
  hasNextPage: _hasNextPage,
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

  if (isLoading) {
    return <LoadingSpinner message="Đang tải giao dịch..." />;
  }

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Lịch sử giao dịch</Text>
        {transactions.length < totalTransactions && (
          <TouchableOpacity onPress={onLoadMore} disabled={isFetchingNextPage}>
            <Text style={styles.loadMoreText}>
              {isFetchingNextPage ? "Đang tải..." : "Tải thêm"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {transactions.map((transaction, index) => (
        <TransactionItem
          key={`${transaction._id}-${index}`}
          type="transaction"
          item={transaction}
          onPress={() => handleTransactionPress(transaction)}
          showRefundHint={transaction.type === "THANH TOÁN"}
        />
      ))}
    </>
  );
}
