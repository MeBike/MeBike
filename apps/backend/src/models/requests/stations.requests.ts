export type CreateStationReqBody = {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  capacity: string;
};

export type UpdateStationReqBody = {
  name?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  capacity?: string;
};

export type GetStationsReqQuery = {
  limit?: string;
  page?: string;
};