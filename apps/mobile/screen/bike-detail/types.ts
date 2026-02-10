import type { Bike } from "@/types/BikeTypes";

export type BikeDetailRouteParams = {
  bike: Bike;
  station: {
    id: string;
    name: string;
    address: string;
  };
};

export type PaymentMode = "wallet" | "subscription";
