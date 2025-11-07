export interface SOS {
  _id: string;
  requester_id: string;
  bike_id: string;
  photo: Array<string>;
  issue: string;
  location: LocationGEO;
  status: "ĐANG CHỜ XỬ LÍ" | "ĐÃ XỬ LÍ" | "KHÔNG XỬ LÍ ĐƯỢC" | "ĐÃ TỪ CHỐI";
  sos_agent_id: string;
  staff_id: string | null;
  resolved_at: string;
  created_at: string;
  updated_at: string;
  agent_notes: string;
}

export interface SOSDetail {
  _id: string;
  photos: string[] | null;
  issue: string;
  location: LocationGEO;
  status: "ĐANG CHỜ XỬ LÍ" | "ĐÃ XỬ LÍ" | "KHÔNG XỬ LÍ ĐƯỢC" | "ĐÃ TỪ CHỐI";
  sos_agent_id: string;
  staff_id: string | null;
  resolved_at: string;
  created_at: string;
  updated_at: string;
  agent_notes: string;
  requester: IUser;
  bike: IBike;
  sos_agent: IUser;
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
export interface IUser {
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

export interface IBike {
  _id: string;
  station_id: string;
  status: string;
  supplier_id: string;
  created_at: string;
  updated_at: string;
  chip_id: string;
}

export interface IRental {
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

export interface ILocation {
  type: string; // e.g. "Point"
  coordinates: [number, number]; // [longitude, latitude]
}

export interface IBikeIssueReport {
  _id: string;
  photos: string[] | null;
  issue: string;
  location: ILocation;
  status: string; // e.g. "ĐÃ XỬ LÍ"
  sos_agent_id: string;
  staff_id: string | null;
  resolved_at: string;
  created_at: string;
  updated_at: string;
  agent_notes: string;
  rental: IRental;
  bike: IBike;
  requester: IUser;
  sos_agent: IUser;
}
