export function formatBalance(balance: string | number): string {
  const numBalance = typeof balance === "string" ? Number.parseInt(balance) : balance;
  return numBalance.toLocaleString("vi-VN");
}

export function formatCurrency(amount: string | number): string {
  const numAmount = typeof amount === "string" ? Number(amount) : amount;
  return `${numAmount.toLocaleString("vi-VN")} đ`;
}

export function formatDate(dateString: string): string {
  try {
    //  2025-10-31T15:59:59 ( UTC+7)
    const [datePart, timePart] = dateString.split("T");
    const [year, month, day] = datePart.split("-").map(Number);
    const [hours, minutes] = timePart.split(":").map(Number);

    return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year} ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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
    case "nạp":
    case "NẠP TIỀN":
      return "arrow-down-circle";
    case "rút":
    case "RÚT TIỀN":
      return "arrow-up-circle";
    case "thanh toán":
    case "THANH TOÁN":
      return "card";
    case "đặt trước":
    case "ĐẶT TRUỚC":
      return "card";
    case "hoàn tiền":
    case "HOÀN TIỀN":
      return "refresh";
    default:
      return "wallet";
  }
}

export function getTransactionColor(type: string): string {
  switch (type) {
    case "nạp":
    case "NẠP TIỀN":
      return "#10B981";
    case "rút":
    case "RÚT TIỀN":
      return "#F59E0B";
    case "thanh toán":
    case "THANH TOÁN":
      return "#EF4444";
    case "đặt trước":
    case "ĐẶT TRUỚC":
      return "#EF4444";
    case "hoàn tiền":
    case "HOÀN TIỀN":
      return "#10B981";
    default:
      return "#0066FF";
  }
}
