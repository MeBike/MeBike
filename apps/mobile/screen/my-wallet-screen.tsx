import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { FlatList, StatusBar, Text, View } from "react-native";

import { LoadingSpinner } from "../components/wallet/loading-spinner";
import { QRModal } from "../components/wallet/qr-modal";
import { RefundDetailModal } from "../components/wallet/refund-detail-modal";
import { TransactionDetailModal } from "../components/wallet/transaction-detail-modal";
import { TransactionItem } from "../components/wallet/transaction-item";
import { WalletActions } from "../components/wallet/wallet-actions";
import { WalletBalance } from "../components/wallet/wallet-balance";
import { WalletHeader, WalletSettings } from "../components/wallet/wallet-header";
import { WalletTabs } from "../components/wallet/wallet-tabs";
import { WithdrawDetailModal } from "../components/wallet/withdraw-detail-modal";
import { useWallet } from "../hooks/wallet/use-wallet";
import { useWithdraw } from "../hooks/wallet/use-withdraw";
import { myWalletScreenStyles as styles } from "../styles/wallet/my-wallet-screen";
import { TAB_TYPES } from "../utils/wallet/constants";

function MyWalletScreen() {
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState<"transactions" | "withdrawals" | "refunds">("transactions");
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [showWithdrawDetail, setShowWithdrawDetail] = useState(false);
  const [showRefundDetail, setShowRefundDetail] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [selectedWithdraw, setSelectedWithdraw] = useState<any>(null);
  const [selectedRefund, setSelectedRefund] = useState<any>(null);

  const wallet = useWallet();
  const withdraw = useWithdraw();
  const _navigation = useNavigation();

  useEffect(() => {
    wallet.getMyWallet();
    wallet.getMyTransaction();
  }, []);

  const handleTopUp = () => {
    setShowQR(true);
  };

  const handleWithdraw = () => {
    withdraw.handleWithdraw();
  };

  if (wallet.isLoadingWallet || wallet.isLoadingTransactions) {
    return <LoadingSpinner message={wallet.isLoadingWallet ? "Đang tải ví..." : "Đang tải giao dịch..."} />;
  }

  if (!wallet.myWallet) {
    return <LoadingSpinner message="Chưa có ví nào" />;
  }

  const renderListHeader = () => (
    <>
      <LinearGradient
        style={styles.gradient}
        colors={["#0066FF", "#00B4D8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <WalletHeader />
        <WalletSettings />
        <WalletBalance
          balance={wallet.myWallet?.balance?.$numberDecimal || "0"}
          status={wallet.myWallet?.status || ""}
        />
      </LinearGradient>

      <WalletActions
        onTopUp={handleTopUp}
        onWithdraw={handleWithdraw}
      />

      <View style={styles.content}>
        <WalletTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </View>
    </>
  );

  const getCurrentData = () => {
    switch (activeTab) {
      case TAB_TYPES.TRANSACTIONS:
        return wallet.transactions || [];
      case TAB_TYPES.WITHDRAWALS:
        return wallet.withdrawalRequests || [];
      case TAB_TYPES.REFUNDS:
        return wallet.refundRequests || [];
      default:
        return [];
    }
  };

  const getCurrentTabTitle = () => {
    switch (activeTab) {
      case TAB_TYPES.TRANSACTIONS:
        return "giao dịch";
      case TAB_TYPES.WITHDRAWALS:
        return "yêu cầu rút tiền";
      case TAB_TYPES.REFUNDS:
        return "yêu cầu hoàn tiền";
      default:
        return "";
    }
  };

  const getCurrentLoadMore = () => {
    switch (activeTab) {
      case TAB_TYPES.TRANSACTIONS:
        return wallet.loadMoreTransactions;
      case TAB_TYPES.WITHDRAWALS:
        return wallet.loadMoreWithdrawals;
      case TAB_TYPES.REFUNDS:
        return wallet.loadMoreRefunds;
      default:
        return () => {};
    }
  };

  const getCurrentHasNextPage = () => {
    switch (activeTab) {
      case TAB_TYPES.TRANSACTIONS:
        return wallet.hasNextPageTransactions;
      case TAB_TYPES.WITHDRAWALS:
        return wallet.hasNextPageWithdrawals;
      case TAB_TYPES.REFUNDS:
        return wallet.hasNextPageRefunds;
      default:
        return false;
    }
  };

  const getCurrentIsFetching = () => {
    switch (activeTab) {
      case TAB_TYPES.TRANSACTIONS:
        return wallet.isFetchingNextPageTransactions;
      case TAB_TYPES.WITHDRAWALS:
        return wallet.isFetchingNextPageWithdrawals;
      case TAB_TYPES.REFUNDS:
        return wallet.isFetchingNextPageRefunds;
      default:
        return false;
    }
  };

  const handleItemPress = (item: any) => {
    if (activeTab === TAB_TYPES.TRANSACTIONS) {
      setSelectedTransaction(item);
      setShowTransactionDetail(true);
    }
    else if (activeTab === TAB_TYPES.WITHDRAWALS) {
      setSelectedWithdraw(item);
      setShowWithdrawDetail(true);
    }
    else if (activeTab === TAB_TYPES.REFUNDS) {
      setSelectedRefund(item);
      setShowRefundDetail(true);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    let type: "transaction" | "withdrawal" | "refund";
    if (activeTab === TAB_TYPES.WITHDRAWALS)
      type = "withdrawal";
    else if (activeTab === TAB_TYPES.REFUNDS)
      type = "refund";
    else type = "transaction";

    return (
      <TransactionItem
        type={type}
        item={item}
        onPress={() => handleItemPress(item)}
      />
    );
  };

  const renderEmptyState = () => {
    const _currentData = getCurrentData();
    const title = getCurrentTabTitle();

    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>
          Chưa có
          {title}
          {" "}
          nào
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!getCurrentIsFetching())
      return null;
    return (
      <View style={styles.loadingFooter}>
        <LoadingSpinner message="Đang tải thêm..." />
      </View>
    );
  };

  const currentData = getCurrentData();

  if (currentData.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
        {renderListHeader()}
        {renderEmptyState()}
        <QRModal
          visible={showQR}
          onClose={() => setShowQR(false)}
          userId={wallet.myWallet?.user_id || ""}
        />
        <TransactionDetailModal
          visible={showTransactionDetail}
          onClose={() => setShowTransactionDetail(false)}
          transaction={selectedTransaction}
        />
        <WithdrawDetailModal
          visible={showWithdrawDetail}
          onClose={() => setShowWithdrawDetail(false)}
          withdrawal={selectedWithdraw}
        />
        <RefundDetailModal
          visible={showRefundDetail}
          onClose={() => setShowRefundDetail(false)}
          refund={selectedRefund}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <FlatList
        data={currentData}
        renderItem={renderItem}
        keyExtractor={item => item._id}
        ListHeaderComponent={renderListHeader}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        onEndReached={() => {
          if (getCurrentHasNextPage() && !getCurrentIsFetching()) {
            getCurrentLoadMore()();
          }
        }}
        onEndReachedThreshold={0.3}
      />
      <QRModal
        visible={showQR}
        onClose={() => setShowQR(false)}
        userId={wallet.myWallet?.user_id || ""}
      />
      <TransactionDetailModal
        visible={showTransactionDetail}
        onClose={() => setShowTransactionDetail(false)}
        transaction={selectedTransaction}
      />
      <WithdrawDetailModal
        visible={showWithdrawDetail}
        onClose={() => setShowWithdrawDetail(false)}
        withdrawal={selectedWithdraw}
      />
      <RefundDetailModal
        visible={showRefundDetail}
        onClose={() => setShowRefundDetail(false)}
        refund={selectedRefund}
      />
    </View>
  );
}

export default MyWalletScreen;
