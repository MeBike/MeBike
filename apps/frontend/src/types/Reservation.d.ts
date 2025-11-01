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
