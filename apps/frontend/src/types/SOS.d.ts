export type SOS = {
  _id: string;
  rental_id: string;
  requester_id: string;
  replaced_bike_id: string;
  photos: Array<string>;
  issue: string;
  location: LocationGEO;
  status: "ĐANG CHỜ XỬ LÍ" | "ĐÃ XỬ LÍ" | "KHÔNG XỬ LÍ ĐƯỢC" | "ĐÃ TỪ CHỐI";
  agent_notes: string;
  reason: string;
  sos_agent_id: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SOSDetail {
  _id: string;
  replaced_bike_id: string;
  photos: string[];
  issue: string;
  location: ILocationSOS;
  status: "ĐANG CHỜ XỬ LÍ" | "ĐÃ XỬ LÍ" | "KHÔNG XỬ LÍ ĐƯỢC" | "ĐÃ TỪ CHỐI";
  agent_notes: string;
  reason: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  rental: IRentalSOS;
  bike: IBikeSOS;
  requester: IUserSOS;
  sos_agent: IUserSOS;
}
export interface LocationGEO {
  type: string;
  coordinates: Array<string>;
}
// export enum SosAlertStatus {
//   PENDING   = 'ĐANG CHỜ XỬ LÍ',
//   RESOLVED = 'ĐÃ XỬ LÍ',
//   UNSOLVABLE = 'KHÔNG XỬ LÍ ĐƯỢC',
//   REJECTED = 'ĐÃ TỪ CHỐI',
// }
export interface IUserSOS {
  _id: string;
  fullname: string;
  email: string;
  verify: string; // e.g. "VERIFIED"
  location: string;
  username: string;
  phone_number: string;
  avatar: string;
  role: string; // e.g. "USER", "SOS"
  nfc_card_uid: string;
  created_at: string;
  updated_at: string;
}

export interface IBikeSOS {
  _id: string;
  station_id: string;
  status: string;
  supplier_id: string;
  created_at: string;
  updated_at: string;
  chip_id: string;
}

export interface IRentalSOS {
  _id: string;
  start_station: string;
  end_station: string | null;
  start_time: string; // ISO8601
  end_time: string | null; // ISO8601 or null
  duration: number;
  total_price: {
    $numberDecimal: string; // e.g. "0"
  };
  status: string; // e.g. "ĐANG THUÊ"
  created_at: string;
  updated_at: string;
}

export interface ILocationSOS {
  type: string; // e.g. "Point"
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IBikeIssueReport {
  _id: string;
  photos: string[] | null;
  issue: string;
  location: ILocationSOS;
  status: string; // e.g. "ĐÃ XỬ LÍ"
  sos_agent_id: string;
  staff_id: string | null;
  resolved_at: string;
  created_at: string;
  updated_at: string;
  agent_notes: string;
  rental: IRentalSOS;
  bike: IBikeSOS;
  requester: IUserSOS;
  sos_agent: IUserSOS;
}
