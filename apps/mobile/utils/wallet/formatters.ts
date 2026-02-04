export function formatBalance(balance: string | number): string {
  const numBalance = typeof balance === "string" ? Number.parseInt(balance) : balance;
  return numBalance.toLocaleString("vi-VN");
}

export function formatCurrency(amount: string | number): string {
  const numAmount = typeof amount === "string" ? Number(amount) : amount;
  return `${numAmount.toLocaleString("vi-VN")} đ`;
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
      return "NẠP TIỀN";
    case "DEBIT":
      return "THANH TOÁN";
    case "REFUND":
      return "HOÀN TIỀN";
    case "ADJUSTMENT":
      return "ĐIỀU CHỈNH";
    default:
      return type;
  }
}

export function formatTransactionStatus(status: string): string {
  switch (status) {
    case "SUCCESS":
      return "THÀNH CÔNG";
    case "PENDING":
      return "ĐANG XỬ LÝ";
    case "FAILED":
      return "THẤT BẠI";
    default:
      return status;
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
