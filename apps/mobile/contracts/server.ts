import type { ServerContracts, serverRoutes } from "@mebike/shared";
import type { z } from "zod";

export type BikeSummary = ServerContracts.BikesContracts.BikeSummary;
export type StationReadSummary = ServerContracts.StationsContracts.StationReadSummary;
export type StationListResponse = ServerContracts.StationsContracts.StationListResponse;
export type ActiveCouponRule = ServerContracts.CouponsContracts.ActiveCouponRule;
export type ActiveCouponRulesResponse = ServerContracts.CouponsContracts.ActiveCouponRulesResponse;

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
export type RentalBillingPreview = ServerContracts.RentalsContracts.RentalBillingPreview;
export type RentalBillingDetail = ServerContracts.RentalsContracts.RentalBillingDetail;
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

export type IncidentStatus = ServerContracts.IncidentsContracts.IncidentStatus;
export type IncidentSeverity = ServerContracts.IncidentsContracts.IncidentSeverity;
export type IncidentSource = ServerContracts.IncidentsContracts.IncidentSource;
export type AssignmentStatus = ServerContracts.IncidentsContracts.AssignmentStatus;
export type IncidentSummary = ServerContracts.IncidentsContracts.IncidentSummary;
export type IncidentDetail = ServerContracts.IncidentsContracts.IncidentDetail;
export type IncidentListResponse = ServerContracts.IncidentsContracts.IncidentListResponse;
export type TechnicianAssignmentSummary = ServerContracts.IncidentsContracts.TechnicianAssignmentSummary;
export type CreateIncidentPayload = z.output<
  typeof serverRoutes.incidents.createIncident.request.body.content["application/json"]["schema"]
>;
export type UpdateIncidentPayload = z.output<
  typeof serverRoutes.incidents.updateIncident.request.body.content["application/json"]["schema"]
>;

export type FixedSlotTemplate = ServerContracts.FixedSlotTemplatesContracts.FixedSlotTemplate;
export type FixedSlotStatus = FixedSlotTemplate["status"];
export type FixedSlotTemplateListResponse = ServerContracts.FixedSlotTemplatesContracts.ListFixedSlotTemplatesResponse;
export type FixedSlotTemplateListParams = z.output<
  typeof serverRoutes.fixedSlotTemplates.listFixedSlotTemplates.request.query
>;
export type CreateFixedSlotTemplatePayload = z.output<
  typeof serverRoutes.fixedSlotTemplates.createFixedSlotTemplate.request.body.content["application/json"]["schema"]
>;
export type UpdateFixedSlotTemplatePayload = z.output<
  typeof serverRoutes.fixedSlotTemplates.updateFixedSlotTemplate.request.body.content["application/json"]["schema"]
>;

export type EnvironmentSummary = ServerContracts.EnvironmentContracts.EnvironmentSummary;
export type EnvironmentImpactHistoryItem = ServerContracts.EnvironmentContracts.EnvironmentImpactHistoryItem;
export type EnvironmentImpactHistoryResponse = ServerContracts.EnvironmentContracts.EnvironmentImpactHistoryResponse;
export type EnvironmentImpactDetail = ServerContracts.EnvironmentContracts.EnvironmentImpactDetail;
export type EnvironmentImpactHistoryQuery = z.output<
  typeof serverRoutes.environment.getMyEnvironmentImpactHistory.request.query
>;
