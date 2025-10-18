export interface RentingHistory {
  _id: string;
  user_id: string;
  bike_id: string;
  start_station: string;
  end_station: string | null;
  start_time: string;
  end_time: string | null;
  duration: number;
  total_price: number;
  status: "ĐANG THUÊ" | "HOÀN THÀNH" | "ĐÃ HỦY";
  created_at: string;
  updated_at: string;
}
