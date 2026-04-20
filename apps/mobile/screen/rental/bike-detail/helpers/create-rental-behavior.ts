import type { RentalError } from "@services/rentals";
import type { QueryClient } from "@tanstack/react-query";

import { Alert } from "react-native";

import type { BikeDetailNavigationProp } from "@/types/navigation";

import { presentRentalError } from "@/presenters/rentals/rental-error-presenter";
import {
  showInsufficientBalanceAlert,
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
  const message = presentRentalError(error, "Không thể thuê xe. Vui lòng thử lại.");

  if (error._tag !== "ApiError") {
    Alert.alert("Lỗi", message);
    return;
  }

  switch (error.code) {
    case "NOT_ENOUGH_BALANCE_TO_RENT": {
      showInsufficientBalanceAlert(navigation, message);
      return;
    }
    case "USER_NOT_HAVE_WALLET": {
      showWalletRequiredAlert(navigation, message);
      return;
    }
    case "SUBSCRIPTION_NOT_FOUND":
    case "SUBSCRIPTION_NOT_USABLE":
    case "SUBSCRIPTION_USAGE_EXCEEDED": {
      Alert.alert(
        "Gói tháng không khả dụng",
        message,
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
        message,
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
    case "OVERNIGHT_OPERATIONS_CLOSED": {
      Alert.alert("Ngoài giờ phục vụ", message);
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
        message,
      );
      refetchBikeDetail();
      invalidateRentalRelatedQueries(queryClient);
      return;
    }
    default: {
      Alert.alert("Lỗi", message);
    }
  }
}
