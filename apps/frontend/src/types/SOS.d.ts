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
