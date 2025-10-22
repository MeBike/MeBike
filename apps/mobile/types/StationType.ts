export interface StationType {
  _id: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  capacity: string;
  created_at: string;
  updated_at: string;
  totalBikes: number;
  availableBikes: number;
  bookedBikes: number;
  brokenBikes: number;
  reservedBikes: number;
  maintainedBikes: number;
  emptySlots: number;
}
