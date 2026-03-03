export type UserRole = "ADMIN" | "STAFF" | "USER" | "SOS";
export type VerifyStatus = "VERIFIED" | "UNVERIFIED" | "BANNED" | "";

export interface DetailUser {
  id: string;
  fullName: string;
  email: string;
  verify: VerifyStatus;
  location: string | null;
  username: string | null;
  phoneNumber: string;
  avatar: string | null;
  role: UserRole;
  nfcCardUid: string;
  createdAt: string;
  updatedAt: string;
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
