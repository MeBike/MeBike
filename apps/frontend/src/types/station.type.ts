import { GraphQLMutationResponse } from "./GraphQL";
import { Bike } from "./Bike";
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
  bikes : Bike[];
}
export type GetAllStationsResponse = GraphQLMutationResponse<"Stations",Station[]>;
export type GetDetailStationResponse = GraphQLMutationResponse<"Station",Station>;
export type CreateStationResponse = GraphQLMutationResponse<"CreateStation">;
export type UpdateStationStatusResponse = GraphQLMutationResponse<"UpdateStationStatus">; 
export type UpdateStationResponse = GraphQLMutationResponse<"UpdateStation">;