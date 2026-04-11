export interface Agency {
  id: string;
  name: string;
  contactPhone: string;
  station : IStationPropInAgency;
  status: AgencyStatus;
  createdAt: string;
  updatedAt: string;
}
export type AgencyStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "BANNED";
export interface IStationPropInAgency {
  id : string;
  name : string;
  address : string;
  latitude : number;
  longitude : number;
  stationType : string;
}