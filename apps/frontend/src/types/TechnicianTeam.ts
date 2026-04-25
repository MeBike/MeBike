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
export type TechnicianStatus  = 'AVAILABLE' | 'UNAVAILABLE';