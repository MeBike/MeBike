export type ReservationStatus =
  | "ĐANG CHỜ XỬ LÍ"
  | "ĐANG HOẠT ĐỘNG"
  | "ĐÃ HUỶ"
  | "ĐÃ HẾT HẠN";

export interface Reservation {
  _id: string;
  user_id: string;
  bike_id: string;
  station_id: string;
  station?: {
    _id: string;
    name: string;
    address: string;
  };
  start_time: string;
  end_time?: string | null;
  prepaid: number;
  status: ReservationStatus;
  created_at: string;
  updated_at: string;
}

export interface PaginatedReservations {
  data: Reservation[];
  pagination: {
    limit: number;
    currentPage: number;
    totalPages: number;
    totalRecords: number;
  };
}
