export type WithdrawStatus =
  | "ĐANG CHỜ XỬ LÝ"
  | "ĐÃ DUYỆT"
  | "TỪ CHỐI"
  | "ĐÃ HOÀN THÀNH"
  | "";
import { DetailUser } from "@/services/auth.service";
export interface WithdrawRequest {
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
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface DetailWithdrawRequest {
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
  status: RefundStatus;
  created_at: string;
  updated_at: string;
  user_info: DetailUser;
}
