export interface TechnicianTeamRecord {
    id : string,
    name : string,
    station : {
        id : string,
        name : string,
    },
    availabilityStatus : TechnicianStatus,
    memberCount : number,
    createdAt : string,
    updatedAt : string,
}
export type TechnicianStatus  = 'AVAILABLE' | 'UNAVAILABLE' | "";
export interface StationInTechnicianTeam {
  id: string;
  name: string;
  address: string;
}

export interface Member {
  userId: string;
  fullName: string;
  role: 'USER' | 'ADMIN' | string;
}
export interface ApiResponseData {
  id: string;
  name: string;
  station: StationInTechnicianTeam;
  availabilityStatus: TechnicianStatus;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  members: Member[];
}
export interface TechnicianTeamDetailResponse {
  data: ApiResponseData;
}