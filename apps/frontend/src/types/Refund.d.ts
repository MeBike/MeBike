export type RefundStatus = "ĐANG CHỜ XỬ LÝ" | "ĐÃ DUYỆT" | "TỪ CHỐI" | "ĐÃ HOÀN THÀNH" | "";
import { DetailUser } from "@/services/auth.service";
export interface RefundRequest {
  _id: string;
  transaction_id: string;
  user_id: string;
  amount: number;
  status: RefundStatus;
  created_at: string;
  updated_at: string;
}

export interface DetailRefundRequest {
  _id: string;
  transaction_id: string;
  user_id: string;
  amount: {
    $numberDecimal: string;
  };
  status: RefundStatus;
  created_at: string;
  updated_at: string;
  user_info: DetailUser;
}
export interface RefundOverview {
  totalCompletedRefundAmount: {
    $numberDecimal: string;
  };
  totalRefunds: number;
  totalCompleteRefund: number;
  totalApproveRefund: number;
  totalRejectRefund: number;
  totalPendingRefund: number;
}