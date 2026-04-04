export interface RatingReason {
  _id: string;
  type: "positive" | "negative";
  applies_to: string;
  messages: {
    en: string;
    vi: string;
  };
}
export interface IUser{
  id : string;
  fullName : string;
  phoneNumber : string;
}
export interface IBike {
  id : string;
  chipId : string;
}
export interface IStation { 
  id : string;
  name : string;
  address : string;
}
export interface IReason {
  id : string;
  type : "ISSUE" | "COMPLIMENT";
  appliesTo : "bike" | "station";
  message : string;
}
export interface Rating {
  id: string;
  rentalId : string;
  user : IUser;
  bike : IBike;
  station : IStation;
  bikeScore : number;
  stationScore : number;
  comment : string | null;
  reasons : IReason;
  createdAt : string;
  updatedAt : string;
  editedAt : string | null;
}