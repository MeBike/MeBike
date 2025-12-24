import type {
  GraphQLMutationResponse,
} from "@/types/GraphQL";
import type { Station } from "./Station";
import type { Supplier } from "./Supplier";
export interface BikeActivityStats {
  bike_id: string;
  total_minutes_active: number;
  total_reports: number;
  uptime_percentage: number;
  monthly_stats: Array<{
    year: number;
    month: number;
    rentals_count: number;
    minutes_active: number;
    revenue: number;
  }>;
}
export interface BikeStats {
  _id: string;
  total_rentals: number;
  total_revenue: number;
  total_duration_minutes: number;
  total_reports: number;
}
export interface BikeRentalHistory {
  _id: string;
  start_station: {
    _id: string;
    name: string;
  };
  end_station: {
    _id: string;
    name: string;
  };
  start_time: string;
  end_time: string;
  duration: number;
  total_price: {
    $numberDecimal: string;
  };
  user: {
    _id: string;
    fullname: string;
  };
}

export type BikeStatus =
  | "Available"
  | "Booked"
  | "Broken"
  | "Reserved"
  | "Maintained"
  | "Unavailable";

export interface Bike {
  id: string;
  chipId: string;
  status: BikeStatus;
  station: {
    id: string;
    name: string;
  };
  supplier: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}
export type DetailBike = {
  id: string;
  chipId: string;
  status: BikeStatus;
  createdAt: string;
  updatedAt: string;
  station: Station;
  supplier: Supplier;
};
export type GetBikesResponse = GraphQLMutationResponse<"Bikes", Bike[]>;
export type GetDetailBikeResponse = GraphQLMutationResponse<"Bike", DetailBike>;
export type CreateBikeResponse = GraphQLMutationResponse<"CreateBike", Bike>;
export type UpdateBikeResponse = GraphQLMutationResponse<"UpdateBike">;