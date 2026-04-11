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
export interface AgencyStats { 
  agency : Agency;
  createdAt : string;
  updatedAt : string;
  period : {
    from : string;
    to : string;
  },
  operators : {
    totalOperators : number;
    activeOperators : number;
  },
  currentStation : {
    totalCapacity: number,
    pickupSlotLimit: number,
    returnSlotLimit: number,
    totalBikes: number,
    availableBikes: number,
    bookedBikes: number,
    brokenBikes: number,
    reservedBikes: number,
    maintainedBikes: number,
    unavailableBikes: number,
    emptySlots: number,
    occupancyRate: number,
  },
  pickups: {
    totalRentals: number,
    activeRentals: number,
    completedRentals: number,
    cancelledRentals: number,
    totalRevenue: number,
    avgDurationMinutes: number
  },
  returns: {
    totalReturns: number,
    agencyConfirmedReturns: number,
  },
  incidents: {
    totalIncidentsInPeriod: number,
    openIncidents: number,
    resolvedIncidentsInPeriod: number,
    criticalOpenIncidents: number
  },

}