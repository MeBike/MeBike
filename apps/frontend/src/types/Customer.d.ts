export type UserRole = "ADMIN" | "STAFF" | "USER" | "SOS";
export type VerifyStatus = "VERIFIED" | "UNVERIFIED" | "BANNED" | "";

export interface DetailUser {
  id: string;
  fullName: string;
  email: string;
  verify: VerifyStatus;
  location: string;
  username: string;
  phoneNumber: string;
  avatar: string;
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
export interface GetActiveUserStatisticsResponse {
  date: string;
  activeUsersCount: number;
}
export interface GetNewRegistrationStats {
  newUsersThisMonth: number;
  newUsersLastMonth: number;
  percentageChange: number;
}
export interface GetUserStatisticsResponse {
  totalUsers: number;
  totalVerified: number;
  totalUnverified: number;
  totalBanned: number;
}
export interface GetUserDashboardStatsResponse {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  vipCustomer: {
    userId: string;
    fullname: string;
    totalDuration: number;
  };
  totalRevenue: number;
}
export interface GetTopRentersResponse {
  totalRentals: number;
  user: {
    id: string;
    fullname: string;
    email: string;
    avatar: string;
    phoneNumber: string;
    location: string;
  };
}

