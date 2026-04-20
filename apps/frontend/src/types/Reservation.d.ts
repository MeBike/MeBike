export interface Reservation {
  id: string;
  userId: string;
  bikeId: string;
  stationId: string;
  reservationOption: ReservationOption;
  startTime: string;
  endTime: string;
  prepaid: number;
  status: ReservationStatus;
  createdAt: string;
  updatedAt: string;
}
export type ReservationOption = "ONE_TIME" | "FIXED_SLOT" | "SUBSCRIPTION" | "";
export type ReservationStatus = "PENDING" | "FULFILLED" | "CANCELLED" | "EXPIRED" | "";
export interface IUser {
  id: string;
  fullName: string;
  username: string;
  email: string;
  phoneNumber: string;
  avatar: string;
  role: string;
}
export interface IBike {
  id: string;
  status: string;
}
export interface IStation {
  id: string;
  name: string;
  address: string;
  latitute: number;
  longitude: number;
}
export interface DetailReservation {
  id: string;
  userId: string;
  bikeId: string;
  stationId: string;
  reservationOption: ReservationOption;
  startTime: string;
  endTime: string;
  prepaid: string;
  status: ReservationOption;
  createdAt: string;
  updatedAt: string;
  user: IUser;
  bike: IBike;
  station: IStation;
}
export interface IReservationList {
  Pending: number;
  Fulfilled: number;
  Cancelled: number;
  Expired: number;
}
export interface ReservationOverview {
  reservationList: IReservationList;
}
