export type ReservationStatus
  = | "ĐANG CHỜ XỬ LÍ"
    | "ĐANG HOẠT ĐỘNG"
    | "ĐÃ HUỶ"
    | "ĐÃ HẾT HẠN";

export type Reservation = {
  id: string;
  userId: string;
  bikeId: string;
  stationId: string;
  station?: {
    id: string;
    name: string;
    address: string;
  };
  startTime: string;
  endTime?: string | null;
  prepaid: number;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedReservations = {
  data: Reservation[];
  pagination: {
    pageSize: number;
    page: number;
    totalPages: number;
    total: number;
  };
};
