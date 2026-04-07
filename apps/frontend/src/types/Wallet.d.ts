export interface WalletTransaction {
  id: string;
  type: "DEPOSIT" | "DEBIT" | "REFUND" | "ADJUSTMENT";
  status: "SUCCESS" | "PENDING" | "FAILED";
  walletId : string;
  description : string;
  amount : string;
  createdAt : string;
  fee : string;
}
export interface WallerInfor {
  id : string;
  name : string;
}
export interface Transaction {
  user : WallerInfor;
  items : WalletTransaction[];
}
export interface UserWallet {
  id: string;
  userId: string;
  balance : string;
  status : "ACTIVE" | "INACTIVE";
  createdAt : string;
  updatedAt : string;
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
export interface DetailWallet {
  _id: string;
  wallet_id: string;
  amount: number;
  fee: number;
  description: string;
  transaction_hash: string;
  type: "NẠP TIỀN" | "TRỪ TIỀN";
  status: "THÀNH CÔNG" | "THẤT BẠI" | "ĐANG XỬ LÝ";
  created_at: string;
}