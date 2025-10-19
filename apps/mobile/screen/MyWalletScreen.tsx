import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Modal,
  Image,
  Alert,
  Share,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWalletActions } from "@hooks/useWalletAction";

const MyWalletScreen = () => {
  const {
    getMyWallet,
    myWallet,
    isLoadingGetMyWallet,
    myTransactions: transactions,
    isLoadingGetMyTransaction,
  } = useWalletActions(true);
  const insets = useSafeAreaInsets();
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    getMyWallet();
  }, [getMyWallet]);

  const handleTopUp = () => {
    setShowQR(true);
  };

  const handleWithdraw = () => {
    Alert.alert("Rút tiền", "Nhập số tiền muốn rút", [
      { text: "Hủy", style: "cancel" },
      { text: "Tiếp tục", onPress: () => console.log("Withdraw") },
    ]);
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
        <Text style={{ marginTop: 12, color: "#333" }}>Đang tải giao dịch...</Text>
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
          style={[styles.header, { paddingTop: insets.top + 16 }]}
          colors={["#0066FF", "#00B4D8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Ví của tôi</Text>
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </View>

          <View style={styles.balanceCard}>
            <View style={styles.balanceContent}>
              <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
              <Text style={styles.balanceAmount}>
                {formatBalance(myWallet.balance?.$numberDecimal)} đ
              </Text>
              <View style={styles.statusBadge}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor:
                        myWallet.status === "ĐANG HOẠT ĐỘNG"
                          ? "#10B981"
                          : "#EF4444",
                    },
                  ]}
                />
                <Text style={styles.statusText}>{myWallet.status}</Text>
              </View>
            </View>
            <Ionicons
              name="wallet-outline"
              size={60}
              color="rgba(255, 255, 255, 0.2)"
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
          <TouchableOpacity style={styles.actionButton}>
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
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Lịch sử giao dịch</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {transactions.map((transaction) => (
            <View key={transaction._id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View
                  style={[
                    styles.transactionIcon,
                    {
                      backgroundColor:
                        getTransactionColor(transaction.type) + "20",
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
                    {transaction.created_at} • {transaction.status}
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
};

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
});

export default MyWalletScreen;
