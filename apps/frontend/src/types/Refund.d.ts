export type RefundStatus = "ĐANG CHỜ XỬ LÝ" | "ĐÃ DUYỆT" | "TỪ CHỐI" | "ĐÃ HOÀN TIỀN" | "";

export interface RefundRequest {
  _id: string;
  transaction_id: string;
  user_id: string;
  amount: number;
  status: RefundStatus;
  created_at: string;
  updated_at: string;
}
