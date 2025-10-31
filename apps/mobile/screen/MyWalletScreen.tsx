import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useWalletActions } from "@hooks/useWalletAction";
import { useWithdrawalAction } from "@hooks/useWithdrawalAction";
import { useRefundAction } from "@hooks/useRefundAction";

function MyWalletScreen() {
  const navigation = useNavigation();
  const limit = 5;
  const {
    getMyWallet,
    myWallet,
    isLoadingGetMyWallet,
    myTransactions: transactions,
    isLoadingGetMyTransaction,
    loadMoreTransactions,
    hasNextPageTransactions,
    isFetchingNextPageTransactions,
    totalTransactions,
  } = useWalletActions(true, limit);
  const {
    withdrawalRequests,
    isLoadingWithdrawals,
    createWithdrawal,
    isCreating,
    loadMore,
    hasNextPage,
    isFetchingNextPage,
    totalWithdrawals,
  } = useWithdrawalAction();
  const {
    refundRequests,
    isLoadingRefunds,
    createRefund,
    isCreating: isCreatingRefund,
    loadMore: loadMoreRefunds,
    hasNextPage: hasNextPageRefunds,
    isFetchingNextPage: isFetchingNextPageRefunds,
    totalRefunds,
  } = useRefundAction();
  const insets = useSafeAreaInsets();
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState<'transactions' | 'withdrawals' | 'refunds'>('transactions');

  useEffect(() => {
    getMyWallet();
  }, [getMyWallet]);

  useEffect(() => {
    if (myWallet) {
      console.log("Wallet Data (/wallets):", JSON.stringify(myWallet, null, 2));
    }
  }, [myWallet]);

  useEffect(() => {
    if (transactions) {
      console.log(
        "Wallet Transactions (/wallets/transaction):",
        JSON.stringify(transactions, null, 2)
      );
    }
  }, [transactions]);

  const handleTopUp = () => {
    setShowQR(true);
  };

  const handleWithdraw = () => {
    // First prompt for amount
    Alert.prompt(
      "Rút tiền",
      "Nhập số tiền muốn rút (tối thiểu 10,000 VND)",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Tiếp tục",
          onPress: (amount?: string) => {
            if (amount && !isNaN(Number(amount)) && Number(amount) >= 10000) {
              // Second prompt for bank name
              Alert.prompt(
                "Thông tin ngân hàng",
                "Nhập tên ngân hàng",
                [
                  { text: "Hủy", style: "cancel" },
                  {
                    text: "Tiếp tục",
                    onPress: (bank?: string) => {
                      if (bank && bank.length >= 5 && bank.length <= 30) {
                        // Third prompt for account number
                        Alert.prompt(
                          "Số tài khoản",
                          "Nhập số tài khoản ngân hàng",
                          [
                            { text: "Hủy", style: "cancel" },
                            {
                              text: "Tiếp tục",
                              onPress: (account?: string) => {
                                if (
                                  account &&
                                  account.length >= 5 &&
                                  account.length <= 30
                                ) {
                                  // Fourth prompt for account owner
                                  Alert.prompt(
                                    "Chủ tài khoản",
                                    "Nhập tên chủ tài khoản",
                                    [
                                      { text: "Hủy", style: "cancel" },
                                      {
                                        text: "Tiếp tục",
                                        onPress: (account_owner?: string) => {
                                          if (
                                            account_owner &&
                                            account_owner.length >= 5 &&
                                            account_owner.length <= 50
                                          ) {
                                            // Fifth prompt for note
                                            Alert.prompt(
                                              "Ghi chú",
                                              "Nhập ghi chú (tối thiểu 10 ký tự, tối đa 500 ký tự)",
                                              [
                                                {
                                                  text: "Hủy",
                                                  style: "cancel",
                                                },
                                                {
                                                  text: "Xác nhận",
                                                  onPress: (note?: string) => {
                                                    if (
                                                      !note ||
                                                      (note.length >= 10 &&
                                                        note.length <= 500)
                                                    ) {
                                                      createWithdrawal({
                                                        amount: Number(amount),
                                                        bank,
                                                        account,
                                                        account_owner,
                                                        note:
                                                          note ||
                                                          "Rút tiền từ ví",
                                                      });
                                                    } else {
                                                      Alert.alert(
                                                        "Lỗi",
                                                        "Ghi chú phải từ 10-500 ký tự"
                                                      );
                                                    }
                                                  },
                                                },
                                              ],
                                              "plain-text",
                                              "Rút tiền từ ví",
                                              "default"
                                            );
                                          } else {
                                            Alert.alert(
                                              "Lỗi",
                                              "Tên chủ tài khoản phải từ 5-50 ký tự"
                                            );
                                          }
                                        },
                                      },
                                    ],
                                    "plain-text",
                                    "",
                                    "default"
                                  );
                                } else {
                                  Alert.alert(
                                    "Lỗi",
                                    "Số tài khoản phải từ 5-30 ký tự"
                                  );
                                }
                              },
                            },
                          ],
                          "plain-text",
                          "",
                          "default"
                        );
                      } else {
                        Alert.alert("Lỗi", "Tên ngân hàng phải từ 5-30 ký tự");
                      }
                    },
                  },
                ],
                "plain-text",
                "",
                "default"
              );
            } else if (Number(amount) < 10000) {
              Alert.alert("Lỗi", "Số tiền rút tối thiểu là 10,000 VND");
            } else {
              Alert.alert("Lỗi", "Vui lòng nhập số tiền hợp lệ");
            }
          },
        },
      ],
      "plain-text",
      "",
      "numeric"
    );
  };

  const handleShareUserId = async () => {
    if (!myWallet?.user_id) return;
    try {
      await Share.share({
        message: `user_id của tôi: ${myWallet.user_id}`,
      });
    } catch (error) {
      Alert.alert("Lỗi", "Không thể chia sẻ user_id");
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "nạp":
        return "arrow-down-circle";
      case "rút":
        return "arrow-up-circle";
      case "thanh toán":
        return "card";
      default:
        return "wallet";
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "nạp":
        return "#10B981";
      case "rút":
        return "#F59E0B";
      case "thanh toán":
        return "#EF4444";
      default:
        return "#0066FF";
    }
  };

  const formatBalance = (balance: string) => {
    return Number.parseInt(balance).toLocaleString("vi-VN");
  };

  if (isLoadingGetMyWallet) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={{ marginTop: 12, color: "#333" }}>Đang tải ví...</Text>
      </View>
    );
  }
  if (isLoadingGetMyTransaction) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={{ marginTop: 12, color: "#333" }}>
          Đang tải giao dịch...
        </Text>
      </View>
    );
  }

  if (!myWallet) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#333" }}>Chưa có ví nào</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0066FF" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient
          style={{
            paddingTop: insets.top + 32,
            paddingBottom: 38,
            paddingHorizontal: 24,
            borderBottomLeftRadius: 32,
            borderBottomRightRadius: 32,
            marginBottom: 8,
            alignItems: "center",
            elevation: 8,
          }}
          colors={["#0066FF", "#00B4D8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity
            style={{
              position: "absolute",
              top: insets.top + 8,
              left: 10,
              zIndex: 12,
              padding: 5,
            }}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              position: "absolute",
              top: insets.top + 8,
              right: 10,
              zIndex: 12,
              padding: 5,
            }}
            onPress={() => Alert.alert("Cài đặt ví đang phát triển!")}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>

          <View
            style={{ width: "100%", alignItems: "flex-start", marginTop: 14 }}
          >
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: "#fff",
                marginBottom: 12,
                letterSpacing: 0.2,
              }}
            >
              Ví của tôi
            </Text>
          </View>

          <View
            style={{
              width: "100%",
              backgroundColor: "rgba(255,255,255,0.15)",
              borderRadius: 18,
              padding: 22,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  color: "#e0eaff",
                  marginBottom: 10,
                  fontWeight: "500",
                }}
              >
                Số dư hiện tại
              </Text>
              <Text
                style={{
                  fontSize: 32,
                  fontWeight: "800",
                  color: "#fff",
                  marginBottom: 12,
                }}
              >
                {formatBalance(myWallet.balance?.$numberDecimal)} đ
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 22,
                  alignSelf: "flex-start",
                }}
              >
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    marginRight: 6,
                    backgroundColor:
                      myWallet.status === "ĐANG HOẠT ĐỘNG"
                        ? "#10B981"
                        : "#EF4444",
                  }}
                />
                <Text
                  style={{ fontSize: 13, color: "#fff", fontWeight: "600" }}
                >
                  {myWallet.status}
                </Text>
              </View>
            </View>
            <Ionicons
              name="wallet-outline"
              size={56}
              color="rgba(255,255,255,0.16)"
              style={{ marginLeft: 4 }}
            />
          </View>
        </LinearGradient>

        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleTopUp}>
            <LinearGradient
              colors={["#10B981", "#059669"]}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="arrow-down" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Nạp tiền</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleWithdraw}
          >
            <LinearGradient
              colors={["#F59E0B", "#D97706"]}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="arrow-up" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Rút tiền</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => setActiveTab('refunds')}>
            <LinearGradient
              colors={["#8B5CF6", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionButtonGradient}
            >
              <Ionicons name="swap-horizontal" size={24} color="#fff" />
              <Text style={styles.actionButtonText}>Hoàn tiền</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'transactions' && styles.activeTab]}
              onPress={() => setActiveTab('transactions')}
            >
              <Text style={[styles.tabText, activeTab === 'transactions' && styles.activeTabText]}>
                Lịch sử giao dịch
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'withdrawals' && styles.activeTab]}
              onPress={() => setActiveTab('withdrawals')}
            >
              <Text style={[styles.tabText, activeTab === 'withdrawals' && styles.activeTabText]}>
                Yêu cầu rút tiền
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'refunds' && styles.activeTab]}
              onPress={() => setActiveTab('refunds')}
            >
              <Text style={[styles.tabText, activeTab === 'refunds' && styles.activeTabText]}>
                Yêu cầu hoàn tiền
              </Text>
            </TouchableOpacity>
          </View>

          {activeTab === 'transactions' && (
            <>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Lịch sử giao dịch</Text>
                {transactions.length < totalTransactions && (
                  <TouchableOpacity onPress={loadMoreTransactions} disabled={isFetchingNextPageTransactions}>
                    <Text style={styles.viewAllText}>
                      {isFetchingNextPageTransactions ? "Đang tải..." : "Tải thêm"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {transactions.map((transaction, index) => (
                <View key={`${transaction._id}-${index}`} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <View
                      style={[
                        styles.transactionIcon,
                        {
                          backgroundColor: `${getTransactionColor(transaction.type)}20`,
                        },
                      ]}
                    >
                      <Ionicons
                        name={getTransactionIcon(transaction.type) as any}
                        size={20}
                        color={getTransactionColor(transaction.type)}
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDescription}>
                        {transaction.description}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {transaction.created_at} •{transaction.status}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.transactionAmount,
                      {
                        color:
                          transaction.type === "NẠP TIỀN"
                            ? "#10B981"
                            : transaction.type === "RÚT TIỀN"
                              ? "#F59E0B"
                              : "#EF4444",
                      },
                    ]}
                  >
                    {formatBalance(transaction.amount.toString())} đ
                  </Text>
                </View>
              ))}
            </>
          )}

          {activeTab === 'withdrawals' && (
            <>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Yêu cầu rút tiền</Text>
                {withdrawalRequests.length < totalWithdrawals && (
                  <TouchableOpacity onPress={loadMore} disabled={isFetchingNextPage}>
                    <Text style={styles.viewAllText}>
                      {isFetchingNextPage ? "Đang tải..." : "Tải thêm"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {isLoadingWithdrawals ? (
                <View style={styles.center}>
                  <ActivityIndicator size="small" color="#0066FF" />
                  <Text style={{ marginTop: 8, color: "#333" }}>Đang tải...</Text>
                </View>
              ) : (
                <>
                  {withdrawalRequests.map((request) => (
                    <View key={request._id} style={styles.transactionItem}>
                      <View style={styles.transactionLeft}>
                        <View
                          style={[
                            styles.transactionIcon,
                            { backgroundColor: "#F59E0B20" },
                          ]}
                        >
                          <Ionicons
                            name="arrow-up-circle"
                            size={20}
                            color="#F59E0B"
                          />
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionDescription}>
                            Rút tiền về {request.bank_name}
                          </Text>
                          <Text style={styles.transactionDate}>
                            {request.created_at} • {request.status}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[styles.transactionAmount, { color: "#F59E0B" }]}
                      >
                        -{formatBalance(request.amount.toString())} đ
                      </Text>
                    </View>
                  ))}
                </>
              )}
            </>
          )}

          {activeTab === 'refunds' && (
            <>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Yêu cầu hoàn tiền</Text>
                {refundRequests.length < totalRefunds && (
                  <TouchableOpacity onPress={loadMoreRefunds} disabled={isFetchingNextPageRefunds}>
                    <Text style={styles.viewAllText}>
                      {isFetchingNextPageRefunds ? "Đang tải..." : "Tải thêm"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {isLoadingRefunds ? (
                <View style={styles.center}>
                  <ActivityIndicator size="small" color="#0066FF" />
                  <Text style={{ marginTop: 8, color: "#333" }}>Đang tải...</Text>
                </View>
              ) : (
                <>
                  {refundRequests.map((request) => (
                    <View key={request._id} style={styles.transactionItem}>
                      <View style={styles.transactionLeft}>
                        <View
                          style={[
                            styles.transactionIcon,
                            { backgroundColor: "#8B5CF620" },
                          ]}
                        >
                          <Ionicons
                            name="swap-horizontal"
                            size={20}
                            color="#8B5CF6"
                          />
                        </View>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionDescription}>
                            Hoàn tiền cho giao dịch {request.transaction_id}
                          </Text>
                          <Text style={styles.transactionDate}>
                            {request.created_at} • {request.status}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[styles.transactionAmount, { color: "#8B5CF6" }]}
                      >
                        +{formatBalance(request.amount.toString())} đ
                      </Text>
                    </View>
                  ))}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showQR}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQR(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Quét mã QR để nạp tiền</Text>
            <Image
              source={require("../assets/qr.png")}
              style={{ width: 200, height: 200, marginVertical: 16 }}
              resizeMode="contain"
            />
            <Text>VUI LÒNG COPY ID VÀO TIN NHẮN CHUYỂN KHOẢN</Text>
            <Text selectable style={styles.userId}>
              user_id: {myWallet.user_id}
            </Text>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShareUserId}
            >
              <Text style={styles.shareText}>Copy user_id</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setShowQR(false)}
            >
              <Text style={styles.closeText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { paddingVertical: 20, paddingHorizontal: 16, paddingTop: 16 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#fff" },
  balanceCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  balanceContent: { flex: 1 },
  balanceLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, color: "#fff", fontWeight: "600" },
  actionContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 4,
  },
  actionButtonGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  content: { paddingHorizontal: 16, paddingBottom: 20 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#0066FF",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#fff",
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historyTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
  viewAllText: { fontSize: 13, color: "#0066FF", fontWeight: "600" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  userId: { marginTop: 12, fontSize: 14, color: "#333" },
  shareBtn: {
    marginTop: 16,
    backgroundColor: "#0066FF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  shareText: { color: "#fff", fontWeight: "600" },
  closeBtn: { marginTop: 12 },
  closeText: { color: "#666" },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: "#999",
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "700",
  },
  loadMoreButton: {
    backgroundColor: "#0066FF",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: "center",
    marginTop: 16,
  },
  loadMoreText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default MyWalletScreen;
