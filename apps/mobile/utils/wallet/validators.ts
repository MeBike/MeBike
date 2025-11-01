export const WITHDRAWAL_VALIDATION = {
  MIN_AMOUNT: 10000,
  MIN_BANK_NAME_LENGTH: 5,
  MAX_BANK_NAME_LENGTH: 30,
  MIN_ACCOUNT_LENGTH: 5,
  MAX_ACCOUNT_LENGTH: 30,
  MIN_ACCOUNT_OWNER_LENGTH: 5,
  MAX_ACCOUNT_OWNER_LENGTH: 50,
  MIN_NOTE_LENGTH: 10,
  MAX_NOTE_LENGTH: 500,
};

export const REFUND_VALIDATION = {
  MIN_AMOUNT: 1,
};

export function validateWithdrawalAmount(amount: string): { isValid: boolean; message?: string } {
  const numAmount = Number(amount);
  if (!amount || Number.isNaN(numAmount)) {
    return { isValid: false, message: "Vui lòng nhập số tiền hợp lệ" };
  }
  if (numAmount < WITHDRAWAL_VALIDATION.MIN_AMOUNT) {
    return { isValid: false, message: `Số tiền rút tối thiểu là ${WITHDRAWAL_VALIDATION.MIN_AMOUNT.toLocaleString("vi-VN")} VND` };
  }
  return { isValid: true };
}

export function validateBankName(bank: string): { isValid: boolean; message?: string } {
  if (!bank || bank.length < WITHDRAWAL_VALIDATION.MIN_BANK_NAME_LENGTH || bank.length > WITHDRAWAL_VALIDATION.MAX_BANK_NAME_LENGTH) {
    return { isValid: false, message: `Tên ngân hàng phải từ ${WITHDRAWAL_VALIDATION.MIN_BANK_NAME_LENGTH}-${WITHDRAWAL_VALIDATION.MAX_BANK_NAME_LENGTH} ký tự` };
  }
  return { isValid: true };
}

export function validateAccountNumber(account: string): { isValid: boolean; message?: string } {
  if (!account || account.length < WITHDRAWAL_VALIDATION.MIN_ACCOUNT_LENGTH || account.length > WITHDRAWAL_VALIDATION.MAX_ACCOUNT_LENGTH) {
    return { isValid: false, message: `Số tài khoản phải từ ${WITHDRAWAL_VALIDATION.MIN_ACCOUNT_LENGTH}-${WITHDRAWAL_VALIDATION.MAX_ACCOUNT_LENGTH} ký tự` };
  }
  return { isValid: true };
}

export function validateAccountOwner(account_owner: string): { isValid: boolean; message?: string } {
  if (!account_owner || account_owner.length < WITHDRAWAL_VALIDATION.MIN_ACCOUNT_OWNER_LENGTH || account_owner.length > WITHDRAWAL_VALIDATION.MAX_ACCOUNT_OWNER_LENGTH) {
    return { isValid: false, message: `Tên chủ tài khoản phải từ ${WITHDRAWAL_VALIDATION.MIN_ACCOUNT_OWNER_LENGTH}-${WITHDRAWAL_VALIDATION.MAX_ACCOUNT_OWNER_LENGTH} ký tự` };
  }
  return { isValid: true };
}

export function validateNote(note: string): { isValid: boolean; message?: string } {
  if (note && (note.length < WITHDRAWAL_VALIDATION.MIN_NOTE_LENGTH || note.length > WITHDRAWAL_VALIDATION.MAX_NOTE_LENGTH)) {
    return { isValid: false, message: `Ghi chú phải từ ${WITHDRAWAL_VALIDATION.MIN_NOTE_LENGTH}-${WITHDRAWAL_VALIDATION.MAX_NOTE_LENGTH} ký tự` };
  }
  return { isValid: true };
}

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
