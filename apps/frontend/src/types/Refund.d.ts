export type RefundStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

export interface RefundRequest {
  _id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  rental_id: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  admin_note?: string;
  created_at: string;
  updated_at: string;
}
