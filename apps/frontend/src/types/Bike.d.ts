export type BikeStatus = "available" | "rented" | "maintenance" | "retired";
export type BikeType = "mountain" | "road" | "city" | "electric" | "hybrid";

export interface Bike {
  _id: string;
  name: string;
  type: BikeType;
  brand: string;
  model: string;
  status: BikeStatus;
  price_per_hour: number;
  price_per_day: number;
  image: string;
  description: string;
  features: string[];
  location: string;
  total_rentals: number;
  rating: number;
  created_at: string;
  updated_at: string;
}
