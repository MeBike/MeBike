
export interface IUserRating{
  id : string;
  fullName : string;
  phoneNumber : string;
}
export interface IBikeRating {
  id : string;
  chipId : string;
}
export interface IStationRating { 
  id : string;
  name : string;
  address : string;
}
export interface IReasonRating {
  id : string;
  type : "ISSUE" | "COMPLIMENT";
  appliesTo : "bike" | "station";
  message : string;
}
export interface Rating {
  id: string;
  rentalId : string;
  user : IUserRating;
  bike : IBikeRating;
  station : IStationRating;
  bikeScore : number;
  stationScore : number;
  comment : string | null;
  reasons : IReasonRating;
  createdAt : string;
  updatedAt : string;
  editedAt : string | null;
}