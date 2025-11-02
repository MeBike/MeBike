export interface WalletTransaction {
  _id: string;
  userId: string;
  type: "deposit" | "withdraw" | "rental_charge" | "refund";
  amount: number;
  fee?: number;
  description: string;
  transaction_hash?: string;
  balance_before: number;
  balance_after: number;
  created_at: string;
  admin_id?: string;
}

export interface UserWallet {
  _id: string;
  userId: string;
  fullName: string;
  email: string;
  avatar: string;
  current_balance: number;
  total_spent: number;
  total_deposited: number;
  last_transaction: string;
}
export interface WalletOverview {
  totalBalance: {
    $numberDecimal: string;
  };
  totalTransactions: string;
  totalDeposit: {
    $numberDecimal: string;
  };
  totalDecrease: {
    $numberDecimal: string;
  };
}
