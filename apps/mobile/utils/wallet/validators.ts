export const REFUND_VALIDATION = {
  MIN_AMOUNT: 1,
};

export function validateRefundAmount(amount: string): { isValid: boolean; message?: string } {
  const numAmount = Number(amount);
  if (!amount || Number.isNaN(numAmount) || numAmount <= 0) {
    return { isValid: false, message: "Vui lòng nhập số tiền hợp lệ và lớn hơn 0" };
  }
  return { isValid: true };
}

export function validateTransactionId(transaction_id: string): { isValid: boolean; message?: string } {
  if (!transaction_id || transaction_id.length === 0) {
    return { isValid: false, message: "Vui lòng nhập ID giao dịch" };
  }
  return { isValid: true };
}
