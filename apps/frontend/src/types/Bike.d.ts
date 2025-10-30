
export interface Bike {
  _id: string;
  station_id: string;
  status: BikeStatus;
  supplier_id: string | null;
  created_at: string;
  updated_at: string;
  chip_id: string;
}
export type BikeStatus =
  | "CÓ SẴN"
  | "ĐANG ĐƯỢC THUÊ"
  | "BỊ HỎNG"
  | "ĐÃ ĐẶT TRƯỚC"
  | "ĐANG BẢO TRÌ"
  | "KHÔNG CÓ SẴN"
  | "";
export interface BikeActivityStats {
  bike_id: string;
  total_minutes_active: number;
  total_reports: number;
  uptime_percentage: number;
  monthly_stats: [
    {
      year: number;
      month: number;
      rentals_count: number;
      minutes_active: number;
      revenue: number;
    },
  ];
}