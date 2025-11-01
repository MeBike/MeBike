export function formatBalance(balance: string | number): string {
  const numBalance = typeof balance === "string" ? Number.parseInt(balance) : balance;
  return numBalance.toLocaleString("vi-VN");
}

export function formatCurrency(amount: string | number): string {
  const numAmount = typeof amount === "string" ? Number(amount) : amount;
  return `${numAmount.toLocaleString("vi-VN")} đ`;
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
    default:
      return "#0066FF";
  }
}
