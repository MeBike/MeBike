import type { RentalError } from "@services/rentals";
import type { QueryClient } from "@tanstack/react-query";

import { Alert } from "react-native";

import type { BikeDetailNavigationProp } from "@/types/navigation";

import {
  showInsufficientBalanceAlert,
  showSubscriptionRequiredAlert,
  showWalletRequiredAlert,
} from "./create-rental-alerts";
import { invalidateRentalRelatedQueries } from "./create-rental-helpers";

export function handleCreateRentalSuccess(args: {
  rentalId: string;
  navigation: BikeDetailNavigationProp;
  queryClient: QueryClient;
  refetchBikeDetail: () => Promise<unknown>;
  refreshWallet: () => Promise<unknown> | undefined;
}) {
  args.refetchBikeDetail();
  args.refreshWallet();
  invalidateRentalRelatedQueries(args.queryClient);
  args.navigation.navigate("BookingHistoryDetail", { bookingId: args.rentalId });
}

function navigateToBookingTab(navigation: BikeDetailNavigationProp) {
  (navigation as { navigate: (name: string, params?: unknown) => void }).navigate("Main", {
    screen: "Booking",
  });
}

export function handleCreateRentalError(args: {
  error: RentalError;
  navigation: BikeDetailNavigationProp;
  queryClient: QueryClient;
  refetchBikeDetail: () => Promise<unknown>;
}) {
  const { error, navigation, queryClient, refetchBikeDetail } = args;

  if (error._tag !== "ApiError") {
    Alert.alert("Lỗi", "Không thể thuê xe. Vui lòng thử lại.");
    return;
  }

  switch (error.code) {
    case "NOT_ENOUGH_BALANCE_TO_RENT": {
      showInsufficientBalanceAlert(navigation, error.message);
      return;
    }
    case "USER_NOT_HAVE_WALLET": {
      showWalletRequiredAlert(navigation, error.message);
      return;
    }
    case "SUBSCRIPTION_NOT_FOUND":
    case "SUBSCRIPTION_NOT_USABLE":
    case "SUBSCRIPTION_USAGE_EXCEEDED": {
      Alert.alert(
        "Gói tháng không khả dụng",
        error.message ?? "Gói tháng đã chọn hiện không thể dùng để thuê xe.",
        [
          { text: "Đóng", style: "cancel" },
          {
            text: "Xem gói tháng",
            onPress: () => navigation.navigate("Subscriptions"),
          },
        ],
      );
      invalidateRentalRelatedQueries(queryClient);
      return;
    }
    case "CARD_RENTAL_ACTIVE_EXISTS": {
      Alert.alert(
        "Đang có phiên thuê hoạt động",
        error.message ?? "Bạn đã có một phiên thuê đang hoạt động.",
        [
          { text: "Đóng", style: "cancel" },
          {
            text: "Xem lịch sử thuê",
            onPress: () => navigateToBookingTab(navigation),
          },
        ],
      );
      invalidateRentalRelatedQueries(queryClient);
      return;
    }
    case "BIKE_NOT_FOUND_IN_STATION":
    case "BIKE_IN_USE":
    case "BIKE_IS_RESERVED":
    case "BIKE_IS_BROKEN":
    case "BIKE_IS_MAINTAINED":
    case "UNAVAILABLE_BIKE":
    case "INVALID_BIKE_STATUS":
    case "BIKE_MISSING_STATION":
    case "BIKE_NOT_AVAILABLE_FOR_RENTAL":
    case "BIKE_NOT_FOUND": {
      Alert.alert(
        "Xe không còn khả dụng",
        error.message ?? "Trạng thái xe vừa thay đổi. Vui lòng kiểm tra lại.",
      );
      refetchBikeDetail();
      invalidateRentalRelatedQueries(queryClient);
      return;
    }
    case "SUBSCRIPTION_NOT_FOUND_FOR_USER":
    case "SUBSCRIPTION_REQUIRED": {
      showSubscriptionRequiredAlert(navigation);
      return;
    }
    default: {
      Alert.alert("Lỗi", error.message ?? "Không thể thuê xe. Vui lòng thử lại.");
    }
  }
}
