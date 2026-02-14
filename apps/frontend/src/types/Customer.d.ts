export type UserRole = "ADMIN" | "STAFF" | "USER" | "SOS";
export type VerifyStatus = "VERIFIED" | "UNVERIFIED" | "BANNED" | "";

export interface DetailUser {
  _id: string;
  fullname: string;
  email: string;
  verify: VerifyStatus;
  location: string;
  username: string;
  phone_number: string;
  avatar: string;
  role: UserRole;
  nfc_card_uid: string;
  email_verify_otp_expires: string;
  forgot_password_otp_expires: string;
  created_at: string;
  updated_at: string;
}

// Keep Customer type for backward compatibility
export type CustomerStatus = VerifyStatus;
export type CustomerType = "individual" | "corporate";

export interface Customer extends DetailUser {
  customer_code?: string;
  address?: string;
  city?: string;
  id_number?: string;
  customer_type?: CustomerType;
  status?: CustomerStatus;
  total_rentals?: number;
  total_spent?: number;
  current_rentals?: number;
  rating?: number;
  notes?: string;
  registered_date?: string;
  last_rental_date?: string;
}
export interface ProfileUserResponse {
  message: string;
  data: DetailUser;
}
