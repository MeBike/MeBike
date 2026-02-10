export type RefundStatus
  = | "ĐANG CHỜ XỬ LÝ"
    | "ĐÃ DUYỆT"
    | "TỪ CHỐI"
    | "ĐÃ HOÀN THÀNH"
    | "";

export type RefundUserInfo = {
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
export type RefundRequest = {
  _id: string;
  transaction_id: string;
  user_id: string;
  amount: number;
  status: RefundStatus;
  created_at: string;
  updated_at: string;
};

export type DetailRefundRequest = {
  _id: string;
  transaction_id: string;
  user_id: string;
  amount: {
    $numberDecimal: string;
  };
  status: RefundStatus;
  created_at: string;
  updated_at: string;
  user_info: RefundUserInfo;
};
