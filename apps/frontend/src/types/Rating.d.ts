export interface RatingReason {
  _id: string;
  type: "positive" | "negative";
  applies_to: string;
  messages: {
    en: string;
    vi: string;
  };
}

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
    _id?: string;
    fullname: string;
    email: string;
    phone_number?: string;
    avatar?: string;
  };
  rental?: {
    _id: string;
    bike_id: string;
    start_time?: string;
    end_time?: string;
    total_price?: number | { $numberDecimal: string };
    status?: string;
    bike?: {
      _id: string;
      name: string;
      qr_code?: string;
      model?: string;
    };
    start_station?: {
      _id: string;
      name: string;
      address?: string;
    };
    end_station?: {
      _id: string;
      name: string;
      address?: string;
    };
  };
  reason_details?: RatingReason[];
}