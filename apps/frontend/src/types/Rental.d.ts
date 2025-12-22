import { Bike } from "./Bike.type";
import { DetailUser } from "./Customer";
import { Station } from "./Station";

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
  status: "ĐANG THUÊ" | "HOÀN THÀNH" | "ĐÃ HỦY" | "ĐÃ ĐẶT TRƯỚC";
  created_at: string;
  updated_at: string;
  user: {
    fullname: string;
  }
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
  status: "ĐANG THUÊ" | "HOÀN THÀNH" | "ĐÃ HỦY" | "ĐÃ ĐẶT TRƯỚC";
  created_at: string;
  updated_at: string;
};
export type RentalStatus =
  | "pending"
  | "active"
  | "completed"
  | "cancelled"
  | "overdue"
  | "reserved"
  | "ĐANG THUÊ"
  | "HOÀN THÀNH"
  | "ĐÃ HỦY"
  | "ĐÃ ĐẶT TRƯỚC";
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
export interface StatwithRevenue {
  period: {
    from: string;
    to: string;
  };
  groupBy: string;
  data: Array<{
    totalRevenue: number;
    totalRentals: number;
    date: string;
  }>;
}
export interface DetailRentalReponse {
  _id : string;
  user : DetailUser;
  bike : Bike,
  start_station : Station;
  end_station : Station | null;
  start_time : string;
  end_time : string | null;
  duration:number,
  total_price:number,
  status : RentalStatus;
  created_at : string;
  updated_at : string;
}
interface RentalRecord {
  _id: string;
  user: {
    _id: string;
    fullname: string;
    email: string;
    email_verify_otp: string | null;
    email_verify_otp_expires: string | null;
    forgot_password_otp: string | null;
    forgot_password_otp_expires: string | null;
    verify: "UNVERIFIED" | "VERIFIED";
    location: string;
    username: string;
    phone_number: string;
    avatar: string;
    role: "USER" | "ADMIN" | "SUPPLIER";
    nfc_card_uid: string;
    created_at: string;
    updated_at: string;
    forgot_password_token: string;
  };
  bike: {
    _id: string;
    status: "CÓ SẴN" | "ĐANG THUÊ" | "BẢO TRÌ";
    supplier_id: string;
    created_at: string;
    updated_at: string;
    chip_id: string;
  };
  start_station: {
    _id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    capacity: number;
    created_at: string;
    updated_at: string;
    location_geo: {
      type: "Point";
      coordinates: [number, number];
    };
  };
  end_station: null | {
    _id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  };
  start_time: string;
  end_time: string | null;
  duration: number;
  total_price: number;
  status: "ĐANG THUÊ" | "ĐÃ HỦY" | "ĐÃ HOÀN THÀNH";
  created_at: string;
  updated_at: string;
}
