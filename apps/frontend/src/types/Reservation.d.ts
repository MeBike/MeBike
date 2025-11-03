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
export enum StatusType {
  DA_HET_HAN = 'ĐÃ HẾT HẠN',
  DA_HUY = 'ĐÃ HỦY',
  DANG_CHO_XU_LY = 'ĐANG CHỜ XỬ LÝ'
}

export interface ReservationStatsStation {
  station: {
    id: string;
    name: string;
  };
  total_count: number;
  status_counts: {
    [key in StatusType]: number;
  };
  reserving_bikes: Array<{
    _id: string;
    station_id: string;
    status:
      | "ĐANG CHỜ XỬ LÝ"
      | "ĐANG HOẠT ĐỘNG"
      | "ĐÃ HỦY"
      | "ĐÃ HẾT HẠN"
      | "ĐANG ĐƯỢC THUÊ"
      | "CÓ SẴN"
      | "ĐÃ ĐẶT TRƯỚC";
    supplier_id: string;
    created_at: string;
    updated_at: string;
    chip_id: string;
  }>;
}