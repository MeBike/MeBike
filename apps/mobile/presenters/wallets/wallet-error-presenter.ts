import type { WalletError } from "@services/wallets/wallet-error";

const walletErrorMessages = {
  insufficientBalance: "Số dư ví không đủ để thực hiện giao dịch.",
  networkError: "Không thể kết nối tới máy chủ.",
  topupInternalError: "Hệ thống nạp tiền đang gặp sự cố. Vui lòng thử lại sau.",
  topupInvalidRequest: "Yêu cầu nạp tiền không hợp lệ.",
  topupProviderError: "Nhà cung cấp thanh toán đang gặp sự cố. Vui lòng thử lại sau.",
  unauthorized: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  unknownError: "Đã có lỗi xảy ra. Vui lòng thử lại.",
  walletNotFound: "Không tìm thấy ví của bạn.",
  withdrawalDuplicate: "Yêu cầu rút tiền này đã được gửi trước đó.",
  withdrawalInternalError: "Không thể xử lý yêu cầu rút tiền lúc này. Vui lòng thử lại sau.",
  withdrawalInvalidRequest: "Yêu cầu rút tiền không hợp lệ.",
  withdrawalNotEnabled: "Tính năng rút tiền hiện chưa khả dụng.",
} as const;

export function presentWalletError(
  error: WalletError,
  fallback: string = walletErrorMessages.unknownError,
): string {
  if (error._tag === "ApiError") {
    switch (error.code) {
      case "INSUFFICIENT_BALANCE":
        return walletErrorMessages.insufficientBalance;
      case "TOPUP_INTERNAL_ERROR":
        return walletErrorMessages.topupInternalError;
      case "TOPUP_INVALID_REQUEST":
        return walletErrorMessages.topupInvalidRequest;
      case "TOPUP_PROVIDER_ERROR":
        return walletErrorMessages.topupProviderError;
      case "UNAUTHORIZED":
        return walletErrorMessages.unauthorized;
      case "WALLET_NOT_FOUND":
        return walletErrorMessages.walletNotFound;
      case "WITHDRAWAL_DUPLICATE":
        return walletErrorMessages.withdrawalDuplicate;
      case "WITHDRAWAL_INTERNAL_ERROR":
        return walletErrorMessages.withdrawalInternalError;
      case "WITHDRAWAL_INVALID_REQUEST":
        return walletErrorMessages.withdrawalInvalidRequest;
      case "WITHDRAWAL_NOT_ENABLED":
        return walletErrorMessages.withdrawalNotEnabled;
      default:
        return error.message ?? fallback;
    }
  }

  if (error._tag === "NetworkError") {
    return walletErrorMessages.networkError;
  }

  return fallback;
}
