export type RentalStatus =
  | "pending"
  | "active"
  | "completed"
  | "cancelled"
  | "overdue";
export type PaymentStatus = "pending" | "paid" | "refunded";
export type PaymentMethod = "cash" | "card" | "transfer" | "momo" | "zalopay";

export interface Rental {
  _id: string;
  rental_code: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  bike_id: string;
  bike_name: string;
  bike_type: string;
  start_date: string;
  end_date: string;
  actual_return_date?: string;
  rental_hours: number;
  rental_days: number;
  price_per_hour: number;
  price_per_day: number;
  total_amount: number;
  deposit_amount: number;
  payment_status: PaymentStatus;
  payment_method: PaymentMethod;
  status: RentalStatus;
  notes?: string;
  staff_id: string;
  staff_name: string;
  created_at: string;
  updated_at: string;
}
