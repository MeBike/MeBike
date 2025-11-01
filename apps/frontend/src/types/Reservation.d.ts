export interface Reservation {
  _id: string;
  user_id: string;
  bike_id: string;
  station_id: string;
  start_time: string;
  end_time: string;
  prepaid: number;
  status: "ĐÃ HẾT HẠN" | "ĐÃ HỦY" | "ĐANG CHỜ XỬ LÝ" | "ĐANG HOẠT ĐỘNG";
  created_at: string;
  updated_at: string;
}
export interface ReservationStats {
  month_year: string;
  total_reservations: number;
  success_count: number;
  cancelled_count: number;
  total_prepaid_revenue: number;
  success_rate: string;
  cancel_rate:string;
}
