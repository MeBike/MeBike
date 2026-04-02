import type { ServerContracts } from "@mebike/shared";
import type { z } from "zod";

export type BikeSummary = ServerContracts.BikesContracts.BikeSummary;
export type StationReadSummary = ServerContracts.StationsContracts.StationReadSummary;
export type StationListResponse = ServerContracts.StationsContracts.StationListResponse;

export type ReservationDetail = ServerContracts.ReservationsContracts.ReservationDetail;
export type ReservationExpandedDetail = ServerContracts.ReservationsContracts.ReservationExpandedDetail;
export type CreateReservationPayload = ServerContracts.ReservationsContracts.CreateReservationRequest;
export type PaginatedReservations = ServerContracts.ReservationsContracts.ListMyReservationsResponse;
export type ReservationStatus = ReservationDetail["status"];
export type ReservationOption = ReservationDetail["reservationOption"];

export type RentalStatus = ServerContracts.RentalsContracts.RentalStatus;
export type Rental = ServerContracts.RentalsContracts.Rental;
export type RentalWithPrice = ServerContracts.RentalsContracts.RentalWithPrice;
export type RentalDetail = ServerContracts.RentalsContracts.RentalDetail;
export type RentalWithPricing = ServerContracts.RentalsContracts.RentalWithPricing;
export type RentalCounts = ServerContracts.RentalsContracts.RentalStatusCounts;
export type RentalCountsResponse = ServerContracts.RentalsContracts.RentalCountsResponse;
export type RentalListItem = ServerContracts.RentalsContracts.RentalListItem;
export type RentalListResponse = ServerContracts.RentalsContracts.RentalListResponse;
export type MyRentalListResponse = ServerContracts.RentalsContracts.MyRentalListResponse;
export type CreateRentalPayload = ServerContracts.RentalsContracts.CreateRentalRequest;
export type CreateReturnSlotPayload = ServerContracts.RentalsContracts.CreateReturnSlotRequest;
export type ReturnSlotReservation = ServerContracts.RentalsContracts.ReturnSlotReservation;
export type BikeSwapStatus = ServerContracts.RentalsContracts.BikeSwapStatus;
export type BikeSwapRequest = ServerContracts.RentalsContracts.BikeSwapRequest;
export type BikeSwapRequestDetail = ServerContracts.RentalsContracts.BikeSwapRequestDetail;
export type BikeSwapRequestListResponse = ServerContracts.RentalsContracts.BikeSwapRequestListResponse;
export type RequestBikeSwapPayload = z.output<
  typeof ServerContracts.RentalsContracts.RequestBikeSwapRequestSchema
>;
