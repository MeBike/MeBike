export interface Rating {
  _id: string;
  user_id: string;
  rental_id: string;
  rating: number;
  reason_ids: string[];
  comment?: string;
  created_at: string;
  updated_at: string;
  user?: {
    fullname: string;
    email: string;
  };
  rental?: {
    _id: string;
    bike_id: string;
  };
}