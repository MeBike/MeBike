export type WithdrawStatus
  = | "ĐANG CHỜ XỬ LÝ"
    | "ĐÃ DUYỆT"
    | "TỪ CHỐI"
    | "ĐÃ HOÀN THÀNH"
    | "";

export type WithdrawalUserInfo = {
  id?: string;
  _id?: string;
  fullname?: string;
  email?: string;
  phoneNumber?: string | null;
  phone_number?: string;
  avatar?: string | null;
  role?: string;
  verify?: string;
  username?: string | null;
  location?: string | null;
};
export type WithdrawRequest = {
  _id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  reason: string;
  amount: number;
  bank_account: string;
  bank_name: string;
  account_holder: string;
  status: WithdrawStatus;
  created_at: string;
  updated_at: string;
};

export type DetailWithdrawRequest = {
  _id: string;
  user_id: string;
  reason: string;
  note: string;
  amount: {
    $numberDecimal: string;
  };
  bank: string;
  account_owner: string;
  account: string;
  status: WithdrawStatus;
  created_at: string;
  updated_at: string;
  user_info: WithdrawalUserInfo;
};
