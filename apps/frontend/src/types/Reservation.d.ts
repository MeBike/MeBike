export interface Reservation {
  id: string;
  userId: string;
  bikeId: string;
  stationId: string;
  reservationOption : ReservationOption;
  startTime: string;
  endTime: string;
  prepaid: number;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}
export type ReservationOption = "ONE_TIME" | "FIXED_SLOT" | "SUBSCRIPTION"
export type ReservationStatus = "PENDING" | "ACTIVE" | "CANCELLED" | "EXPIRED"
export interface IUser {
  _id: string;
  fullname: string;
  email: string;
  username: string;
  phone_number: string;
  avatar: string;
  role: string; 
}

export interface IBike {
  _id: string;
  status: string; 
  chip_id: string;
}

export interface IStation {
  _id: string;
  name: string; 
  address: string; 
  latitude: number;
  longitude: number;
}

export interface IRentalOrder {
  _id: string;
  start_time: string; 
  end_time: string; 
  status: string; 
  created_at: string; 
  updated_at: string; 
  user: IUser;
  bike: IBike;
  station: IStation;
  prepaid: number; 
}

export interface ReservationStats {
  month_year: string;
  total_reservations: number;
  successed_count: number;
  cancelled_count: number;
  total_prepaid_revenue: number;
  success_rate: string;
  cancel_rate: string;
}
export interface ReservationStatsStation {
  station: {
    id: string;
    name: string;
  };
  total_count: number;
  status_counts: {
    Expired: number;
    Cancelled: number;
    Pending; number;
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