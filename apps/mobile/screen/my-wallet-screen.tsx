import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { FlatList, RefreshControl, StatusBar, Text, View } from "react-native";

import type { TabType } from "../utils/wallet/constants";

import { LoadingSpinner } from "../components/wallet/loading-spinner";
import { QRModal } from "../components/wallet/qr-modal";
import { TransactionDetailModal } from "../components/wallet/transaction-detail-modal";
import { TransactionItem } from "../components/wallet/transaction-item";
import { WalletActions } from "../components/wallet/wallet-actions";
import { WalletBalance } from "../components/wallet/wallet-balance";
import { WalletHeader } from "../components/wallet/wallet-header";
import { WalletTabs } from "../components/wallet/wallet-tabs";
import { useWallet } from "../hooks/wallet/use-wallet";
import { myWalletScreenStyles as styles } from "../styles/wallet/my-wallet-screen";
import { TAB_TYPES } from "../utils/wallet/constants";

function MyWalletScreen() {
  const [showQR, setShowQR] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(TAB_TYPES.TRANSACTIONS);
  const [showTransactionDetail, setShowTransactionDetail] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const wallet = useWallet();

  useEffect(() => {
    wallet.getMyWallet();
    wallet.getMyTransaction();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await wallet.getMyWallet();
    await wallet.getMyTransaction();
    setRefreshing(false);
  };

  const handleTopUp = () => {
    setShowQR(true);
  };

  if (wallet.isLoadingWallet || wallet.isLoadingTransactions) {
    return <LoadingSpinner message={wallet.isLoadingWallet ? "Đang tải ví..." : "Đang tải giao dịch..."} />;
  }

  if (!wallet.myWallet) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
        <Text style={styles.emptyStateText}>Chưa có ví nào</Text>
      </View>
    );
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
        <WalletBalance
          balance={wallet.myWallet?.balance || "0"}
          status={wallet.myWallet?.status || ""}
        />
      </LinearGradient>

      <WalletActions
        onTopUp={handleTopUp}
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
    return wallet.transactions || [];
  };

  const getCurrentTabTitle = () => {
    return "giao dịch";
  };

  const getCurrentLoadMore = () => {
    return wallet.loadMoreTransactions;
  };

  const getCurrentHasNextPage = () => {
    return wallet.hasNextPageTransactions;
  };

  const getCurrentIsFetching = () => {
    return wallet.isFetchingNextPageTransactions;
  };

  const handleItemPress = (item: any) => {
    setSelectedTransaction(item);
    setShowTransactionDetail(true);
  };

  const renderItem = ({ item }: { item: any }) => {
    const type: "transaction" = "transaction";

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
          userId={wallet.myWallet?.userId || ""}
        />
        <TransactionDetailModal
          visible={showTransactionDetail}
          onClose={() => setShowTransactionDetail(false)}
          transaction={selectedTransaction}
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
        keyExtractor={item => item.id}
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
        refreshControl={(
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#0066FF"]}
            tintColor="#0066FF"
          />
        )}
      />
      <QRModal
        visible={showQR}
        onClose={() => setShowQR(false)}
        userId={wallet.myWallet?.userId || ""}
      />
      <TransactionDetailModal
        visible={showTransactionDetail}
        onClose={() => setShowTransactionDetail(false)}
        transaction={selectedTransaction}
      />
    </View>
  );
}

export default MyWalletScreen;
