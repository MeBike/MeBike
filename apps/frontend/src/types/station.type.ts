import { GraphQLMutationResponse } from "./GraphQL";
export interface Station {
  id: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  capacity: number;
  totalBike: number;
  availableBike: number;
  bookedBike: number;
  brokenBike: number;
  reservedBike: number;
  maintanedBike: number;
  unavailable: number;
  distance: number;
  createdAt: string;
  updatedAt: string;
  status : "Active" | "Inactive";
}
export type GetAllStationsResponse = GraphQLMutationResponse<"Stations",Station[]>;
export type GetDetailStationResponse = GraphQLMutationResponse<"Stations",Station>;
export type CreateStationResponse = GraphQLMutationResponse<"CreateStation">;
export type UpdateStationStatusResponse = GraphQLMutationResponse<"UpdateStationStatus">; 