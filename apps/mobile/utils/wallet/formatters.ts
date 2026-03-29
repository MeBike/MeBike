export function formatBalance(balance: string | number): string {
  const numBalance = typeof balance === "string" ? Number.parseInt(balance) : balance;
  return numBalance.toLocaleString("vi-VN");
}

export function formatCurrency(amount: string | number): string {
  const numAmount = typeof amount === "string" ? Number(amount) : amount;
  return `${numAmount.toLocaleString("vi-VN")} đ`;
}

export function formatAbsoluteCurrency(amount: string | number): string {
  const numAmount = typeof amount === "string" ? Number(amount) : amount;
  return `${Math.abs(numAmount).toLocaleString("vi-VN")} đ`;
}

export function formatWalletStatus(status: string): string {
  if (status === "ACTIVE") {
    return "ĐANG HOẠT ĐỘNG";
  }
  if (status === "FROZEN") {
    return "TẠM KHÓA";
  }
  return status;
}

export function formatTransactionType(type: string): string {
  switch (type) {
    case "DEPOSIT":
      return "Nạp tiền";
    case "DEBIT":
      return "Thanh toán";
    case "REFUND":
      return "Hoàn tiền";
    case "ADJUSTMENT":
      return "Điều chỉnh";
    default:
      return type;
  }
}

export function formatTransactionStatus(status: string): string {
  switch (status) {
    case "SUCCESS":
      return "Thành công";
    case "PENDING":
      return "Đang xử lý";
    case "FAILED":
      return "Thất bại";
    default:
      return status;
  }
}

const generatedDescriptionPatterns = [
  /^rental\s/i,
  /^transaction\s/i,
  /^payment\s/i,
  /^[0-9a-f]{8,}/i,
] as const;

export function formatTransactionTitle(type: string, description?: string | null): string {
  const trimmedDescription = description?.trim();

  if (trimmedDescription) {
    const normalizedDescription = trimmedDescription.toLowerCase();

    if (normalizedDescription.includes("reservation prepaid") || normalizedDescription.includes("reservation")) {
      return "Thanh toán đặt trước";
    }

    if (normalizedDescription.includes("rental") || normalizedDescription.includes("trip payment")) {
      return "Thanh toán chuyến đi";
    }

    if (normalizedDescription.includes("deposit") || normalizedDescription.includes("top up") || normalizedDescription.includes("topup")) {
      return "Nạp tiền vào ví";
    }

    if (normalizedDescription.includes("refund")) {
      return "Hoàn tiền về ví";
    }

    if (normalizedDescription.includes("adjust")) {
      return "Điều chỉnh số dư";
    }
  }

  if (trimmedDescription && !generatedDescriptionPatterns.some(pattern => pattern.test(trimmedDescription))) {
    return trimmedDescription;
  }

  switch (type) {
    case "DEPOSIT":
      return "Nạp tiền vào ví";
    case "REFUND":
      return "Hoàn tiền về ví";
    case "ADJUSTMENT":
      return "Điều chỉnh số dư";
    case "DEBIT":
    default:
      return "Thanh toán chuyến đi";
  }
}

export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return dateString;
    }
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
  catch {
    return dateString;
  }
}

export function truncateId(id: string): string {
  if (!id)
    return "";
  if (id.length <= 12)
    return id;
  return `${id.substring(0, 6)}...${id.substring(id.length - 6)}`;
}

export function getTransactionIcon(type: string): string {
  switch (type) {
    case "DEPOSIT":
    case "nạp":
    case "NẠP TIỀN":
      return "arrow-down-circle";
    case "DEBIT":
    case "rút":
    case "RÚT TIỀN":
      return "arrow-up-circle";
    case "ADJUSTMENT":
    case "thanh toán":
    case "THANH TOÁN":
      return "card";
    case "đặt trước":
    case "ĐẶT TRUỚC":
      return "card";
    case "REFUND":
    case "hoàn tiền":
    case "HOÀN TIỀN":
      return "refresh";
    default:
      return "wallet";
  }
}

export function getTransactionColor(type: string): string {
  switch (type) {
    case "DEPOSIT":
    case "nạp":
    case "NẠP TIỀN":
      return "#10B981";
    case "DEBIT":
    case "rút":
    case "RÚT TIỀN":
      return "#F59E0B";
    case "ADJUSTMENT":
    case "thanh toán":
    case "THANH TOÁN":
      return "#EF4444";
    case "đặt trước":
    case "ĐẶT TRUỚC":
      return "#EF4444";
    case "REFUND":
    case "hoàn tiền":
    case "HOÀN TIỀN":
      return "#10B981";
    default:
      return "#0066FF";
  }
}
