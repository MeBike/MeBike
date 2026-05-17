export type BikeStatusUpdate = {
  userId?: string;
  bikeId: string;
  status: string;
};

export type ReturnSlotExpiredUpdate = {
  userId: string;
  rentalId: string;
  returnSlotId: string;
  stationId: string;
  reservedFrom: string;
  expiredAt: string;
  at: string;
};

export type NfcCardSwipeFailedReason
  = | "ACTIVE_RENTAL_EXISTS"
    | "ACTIVE_RESERVATION_EXISTS"
    | "BIKE_RESERVED"
    | "INSUFFICIENT_FUNDS"
    | "OVERNIGHT_OPERATIONS_CLOSED";

export type NfcCardSwipeFailedUpdate = {
  userId: string;
  requestId: string;
  bikeId: string;
  reason: NfcCardSwipeFailedReason;
  at: string;
};
