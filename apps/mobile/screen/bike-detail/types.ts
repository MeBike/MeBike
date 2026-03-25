import type { BikeSummary } from "@/contracts/server";

export type BikeDetailRouteParams = {
  bike: BikeSummary;
  station: {
    id: string;
    name: string;
    address: string;
  };
};

export type PaymentMode = "wallet" | "subscription";
