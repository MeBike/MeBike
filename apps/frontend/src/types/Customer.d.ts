export type UserRole = "ADMIN" | "STAFF" | "USER" | "SOS";
export type VerifyStatus = "VERIFIED" | "UNVERIFIED" | "";
export type AccountStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED" | "";
export interface OrgAssigment {
  station : {
    id : string;
    name : string;
  }
  agency : {
    id : string;
    name : string;
  }
  technicianTeam : {
    id : string;
    name : string;
  }
}
export interface DetailUser {
  id: string;
  fullName: string;
  email: string;
  verify: VerifyStatus;
  accountStatus?: AccountStatus;
  location: string | null;
  username: string | null;
  phoneNumber: string | null;
  avatar: string | null;
  role: UserRole;
  nfcCardUid: string | null;
  orgAssignment : OrgAssigment;
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
    fullName: string;
    totalDuration: number;
  } | null;
  averageSpending : number;
  totalRevenue: number;
}
export interface GetTopRentersResponse {
  totalRentals: number;
  user: {
    id: string;
    fullName: string;
    email: string;
    avatar: string | null;
    phoneNumber: string | null;
    location: string | null;
  };
}
