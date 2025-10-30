export type RentingHistory = {
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
};
export type RentalDetail = {
  _id: string;
  user: {
    _id: string;
    fullname: string;
    email: string;
    verify: string;
    location: string;
    username: string;
    phone_number: string;
    avatar: string;
    role: string;
    created_at: string;
    updated_at: string;
  };
  bike: {
    _id: string;
    status: string;
    supplier_id: string | null;
    created_at: string;
    updated_at: string;
    chip_id: string;
  };
  start_station: {
    _id: string;
    name: string;
    address: string;
    latitude: string;
    longitude: string;
  };
  end_station: {
    _id: string;
    name: string;
    address: string;
    latitude: string;
    longitude: string;
  } | null;
  start_time: string;
  end_time: string | null;
  duration: number;
  total_price: {
    $numberDecimal: string;
  };
  status: "ĐANG THUÊ" | "HOÀN THÀNH" | "ĐÃ HỦY";
  created_at: string;
  updated_at: string;
};
