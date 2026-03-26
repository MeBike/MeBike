import { Alert } from "react-native";

import type { BikeDetailNavigationProp } from "@/types/navigation";

export function showSubscriptionRequiredAlert(navigation: BikeDetailNavigationProp) {
  Alert.alert(
    "Chưa có gói tháng",
    "Bạn cần đăng ký gói tháng trước khi sử dụng hình thức này.",
    [
      { text: "Để sau", style: "cancel" },
      {
        text: "Xem gói tháng",
        onPress: () => navigation.navigate("Subscriptions"),
      },
    ],
  );
}

export function showWalletRequiredAlert(
  navigation: BikeDetailNavigationProp,
  message?: string,
) {
  Alert.alert(
    "Cần ví MeBike",
    message ?? "Bạn cần có ví MeBike để bắt đầu phiên thuê.",
    [
      { text: "Để sau", style: "cancel" },
      {
        text: "Mở ví",
        onPress: () => navigation.navigate("MyWallet"),
      },
    ],
  );
}

export function showInsufficientBalanceAlert(
  navigation: BikeDetailNavigationProp,
  message?: string,
) {
  Alert.alert(
    "Không đủ tiền",
    message ?? "Số dư không đủ để bắt đầu phiên thuê.",
    [
      { text: "Hủy", style: "cancel" },
      {
        text: "Nạp tiền ngay",
        onPress: () => navigation.navigate("MyWallet"),
      },
    ],
  );
}
