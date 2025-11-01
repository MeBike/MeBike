import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { withdrawalsTabStyles as styles } from "../../styles/wallet/withdrawalsTab";
import { LoadingSpinner } from "./loading-spinner";
import { TransactionItem } from "./transaction-item";

type WithdrawalRequest = {
  _id: string;
  amount: number;
  created_at: string;
  status: string;
  bank_name: string;
};

type WithdrawalsTabProps = {
  withdrawalRequests: WithdrawalRequest[];
  isLoading: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  totalWithdrawals: number;
  onLoadMore: () => void;
};

export function WithdrawalsTab({
  withdrawalRequests,
  isLoading,
  hasNextPage: _hasNextPage,
  isFetchingNextPage,
  totalWithdrawals,
  onLoadMore,
}: WithdrawalsTabProps) {
  if (isLoading) {
    return <LoadingSpinner message="Đang tải..." />;
  }

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Yêu cầu rút tiền</Text>
        {withdrawalRequests.length < totalWithdrawals && (
          <TouchableOpacity onPress={onLoadMore} disabled={isFetchingNextPage}>
            <Text style={styles.loadMoreText}>
              {isFetchingNextPage ? "Đang tải..." : "Tải thêm"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {withdrawalRequests.map(request => (
        <TransactionItem
          key={request._id}
          type="withdrawal"
          item={request}
        />
      ))}
    </>
  );
}
