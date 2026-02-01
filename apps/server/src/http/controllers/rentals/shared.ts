import { RentalsContracts } from "@mebike/shared";

export type RentalsRoutes = typeof import("@mebike/shared")["serverRoutes"]["rentals"];

export const {
  RentalErrorCodeSchema,
  rentalErrorMessages,
} = RentalsContracts;
