export type CustomerType = "individual" | "corporate";
export type CustomerStatus = "active" | "inactive" | "blocked";

export interface Customer {
  _id: string;
  customer_code: string;
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  city: string;
  id_number: string;
  customer_type: CustomerType;
  status: CustomerStatus;
  avatar?: string;
  total_rentals: number;
  total_spent: number;
  current_rentals: number;
  rating: number;
  notes?: string;
  registered_date: string;
  last_rental_date?: string;
  created_at: string;
  updated_at: string;
}
