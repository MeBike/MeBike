import type { SubscriptionError } from "@services/subscription.service";

const subscriptionErrorMessages = {
  activeSubscriptionExists: "Bạn đã có gói đang hoạt động.",
  insufficientWalletBalance: "Số dư ví không đủ để đăng ký gói tháng.",
  networkError: "Không thể kết nối tới máy chủ. Vui lòng thử lại.",
  subscriptionNotFound: "Không tìm thấy gói tháng này.",
  subscriptionNotPending: "Gói tháng này không còn ở trạng thái chờ kích hoạt.",
  subscriptionPendingOrActiveExists: "Bạn đã có gói đang chờ xử lý hoặc đang hoạt động.",
  unauthorized: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  unknownError: "Không thể xử lý yêu cầu gói tháng lúc này. Vui lòng thử lại.",
  walletNotFound: "Tài khoản của bạn chưa có ví để thực hiện giao dịch.",
} as const;

export function presentSubscriptionError(
  error: SubscriptionError,
  fallback: string = subscriptionErrorMessages.unknownError,
): string {
  if (error._tag === "ApiError") {
    switch (error.code) {
      case "ACTIVE_SUBSCRIPTION_EXISTS":
        return subscriptionErrorMessages.activeSubscriptionExists;
      case "INSUFFICIENT_WALLET_BALANCE":
        return subscriptionErrorMessages.insufficientWalletBalance;
      case "SUBSCRIPTION_NOT_FOUND":
        return subscriptionErrorMessages.subscriptionNotFound;
      case "SUBSCRIPTION_NOT_PENDING":
        return subscriptionErrorMessages.subscriptionNotPending;
      case "SUBSCRIPTION_PENDING_OR_ACTIVE_EXISTS":
        return subscriptionErrorMessages.subscriptionPendingOrActiveExists;
      case "UNAUTHORIZED":
        return subscriptionErrorMessages.unauthorized;
      case "WALLET_NOT_FOUND":
        return subscriptionErrorMessages.walletNotFound;
      default:
        return error.message ?? fallback;
    }
  }

  if (error._tag === "NetworkError") {
    return subscriptionErrorMessages.networkError;
  }

  return fallback;
}
