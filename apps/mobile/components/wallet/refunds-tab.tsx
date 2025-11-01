import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

import { refundsTabStyles as styles } from "../../styles/wallet/refundsTab";
import { LoadingSpinner } from "./loading-spinner";
import { TransactionItem } from "./transaction-item";

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
  totalRefunds: number;
  onLoadMore: () => void;
};

export function RefundsTab({
  refundRequests,
  isLoading,
  hasNextPage: _hasNextPage,
  isFetchingNextPage,
  totalRefunds,
  onLoadMore,
}: RefundsTabProps) {
  if (isLoading) {
    return <LoadingSpinner message="Đang tải..." />;
  }

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.title}>Yêu cầu hoàn tiền</Text>
        {refundRequests.length < totalRefunds && (
          <TouchableOpacity onPress={onLoadMore} disabled={isFetchingNextPage}>
            <Text style={styles.loadMoreText}>
              {isFetchingNextPage ? "Đang tải..." : "Tải thêm"}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {refundRequests.map(request => (
        <TransactionItem
          key={request._id}
          type="refund"
          item={request}
        />
      ))}
    </>
  );
}
