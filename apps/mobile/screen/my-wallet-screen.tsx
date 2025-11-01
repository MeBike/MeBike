import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { ScrollView, StatusBar, View } from "react-native";

import { LoadingSpinner } from "../components/wallet/loading-spinner";
import { QRModal } from "../components/wallet/qr-modal";
import { RefundsTab } from "../components/wallet/refunds-tab";
import { TransactionsTab } from "../components/wallet/transactions-tab";
import { WalletActions } from "../components/wallet/wallet-actions";
import { WalletBalance } from "../components/wallet/wallet-balance";
import { WalletHeader, WalletSettings } from "../components/wallet/wallet-header";
import { WalletTabs } from "../components/wallet/wallet-tabs";
import { WithdrawalsTab } from "../components/wallet/withdrawals-tab";
import { useWithdraw } from "../hooks/wallet/use-withdraw";
import { useWallet } from "../hooks/wallet/useWallet";
import { myWalletScreenStyles as styles } from "../styles/wallet/myWalletScreen";
import { TAB_TYPES } from "../utils/wallet/constants";

function MyWalletScreen() {
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState<"transactions" | "withdrawals" | "refunds">("transactions");

  const wallet = useWallet();
  const withdraw = useWithdraw();

  useEffect(() => {
    wallet.getMyWallet();
  }, [wallet.getMyWallet]);

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

  const renderTabContent = () => {
    switch (activeTab) {
      case TAB_TYPES.TRANSACTIONS:
        return (
          <TransactionsTab
            transactions={wallet.transactions}
            isLoading={wallet.isLoadingTransactions}
            hasNextPage={wallet.hasNextPageTransactions}
            isFetchingNextPage={wallet.isFetchingNextPageTransactions}
            totalTransactions={wallet.totalTransactions}
            onLoadMore={wallet.loadMoreTransactions}
          />
        );
      case TAB_TYPES.WITHDRAWALS:
        return (
          <WithdrawalsTab
            withdrawalRequests={wallet.withdrawalRequests}
            isLoading={wallet.isLoadingWithdrawals}
            hasNextPage={wallet.hasNextPageWithdrawals}
            isFetchingNextPage={wallet.isFetchingNextPageWithdrawals}
            totalWithdrawals={wallet.totalWithdrawals}
            onLoadMore={wallet.loadMoreWithdrawals}
          />
        );
      case TAB_TYPES.REFUNDS:
        return (
          <RefundsTab
            refundRequests={wallet.refundRequests}
            isLoading={wallet.isLoadingRefunds}
            hasNextPage={wallet.hasNextPageRefunds}
            isFetchingNextPage={wallet.isFetchingNextPageRefunds}
            totalRefunds={wallet.totalRefunds}
            onLoadMore={wallet.loadMoreRefunds}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          style={styles.gradient}
          colors={["#0066FF", "#00B4D8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <WalletHeader />
          <WalletSettings />

          <WalletBalance
            balance={wallet.myWallet.balance?.$numberDecimal}
            status={wallet.myWallet.status}
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

          {renderTabContent()}
        </View>
      </ScrollView>

      <QRModal
        visible={showQR}
        onClose={() => setShowQR(false)}
        userId={wallet.myWallet.user_id}
      />
    </View>
  );
}

export default MyWalletScreen;
